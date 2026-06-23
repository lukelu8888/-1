import { supabase } from '../supabase'
import {
  deriveDeliveryExceptionSummary,
  deriveExternalParticipants,
  deriveShipmentReadiness,
} from './businessFieldNormalization'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

function toUUIDOrNull(id: string | null | undefined): string | null {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return null
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  return String(v)
}

export function fromVoyageTrackingRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    trackingNo: r.tracking_no,
    shipmentNo: r.shipment_no,
    loadPlanId: r.load_plan_id,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    blNo: r.bl_no,
    containerNo: r.container_no,
    carrierName: r.carrier_name,
    vesselName: r.vessel_name,
    voyageNo: r.voyage_no,
    etd: r.etd,
    eta: r.eta,
    ata: r.ata,
    currentStatus: r.current_status,
    currentLocation: r.current_location,
    lastEventAt: r.last_event_at,
    trackingSource: r.tracking_source,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toVoyageTrackingRow(v: any) {
  const id = toUUIDOrNull(v.id)
  const purchaseOrderId = toUUIDOrNull(v.purchaseOrderId || v.purchase_order_id)
  const loadPlanId = toUUIDOrNull(v.loadPlanId || v.load_plan_id)
  const salesContractId = toUUIDOrNull(v.salesContractId || v.sales_contract_id)
  return {
    ...(id ? { id } : {}),
    tracking_no: v.trackingNo || v.tracking_no,
    shipment_no: v.shipmentNo || v.shipment_no || null,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    ...(salesContractId ? { sales_contract_id: salesContractId } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    bl_no: v.blNo || v.bl_no || null,
    container_no: v.containerNo || v.container_no || null,
    carrier_name: v.carrierName || v.carrier_name || null,
    vessel_name: v.vesselName || v.vessel_name || null,
    voyage_no: v.voyageNo || v.voyage_no || null,
    etd: toIsoDate(v.etd),
    eta: toIsoDate(v.eta),
    ata: toIsoDate(v.ata),
    current_status: v.currentStatus || v.current_status || 'departed',
    current_location: v.currentLocation || v.current_location || null,
    last_event_at: v.lastEventAt || v.last_event_at || null,
    tracking_source: v.trackingSource || v.tracking_source || null,
    remarks: v.remarks || null,
  }
}

export const voyageTrackingService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('voyage_tracking')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('getByPurchaseOrderId voyage_tracking', error)
    return fromVoyageTrackingRow(data?.[0] || null)
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    const row = toVoyageTrackingRow({
      ...payload,
      id: existing?.id || payload.id,
      purchaseOrderId,
    })
    const query = existing?.id
      ? supabase.from('voyage_tracking').update(row).eq('id', existing.id).select().single()
      : supabase.from('voyage_tracking').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsertByPurchaseOrderId voyage_tracking', error)
    return fromVoyageTrackingRow(data)
  },
}

export function fromArrivalNoticeRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    arrivalNoticeNo: r.arrival_notice_no,
    shipmentNo: r.shipment_no,
    voyageId: r.voyage_id,
    loadPlanId: r.load_plan_id,
    blNo: r.bl_no,
    arrivalPort: r.arrival_port,
    arrivalAt: r.arrival_at,
    freeDays: r.free_days,
    demurrageRule: r.demurrage_rule,
    sentToCustomerAt: r.sent_to_customer_at,
    sentToAgentAt: r.sent_to_agent_at,
    status: r.status,
    files: r.files || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toArrivalNoticeRow(notice: any) {
  const id = toUUIDOrNull(notice.id)
  const voyageId = toUUIDOrNull(notice.voyageId || notice.voyage_id)
  const loadPlanId = toUUIDOrNull(notice.loadPlanId || notice.load_plan_id)
  return {
    ...(id ? { id } : {}),
    arrival_notice_no: notice.arrivalNoticeNo || notice.arrival_notice_no,
    shipment_no: notice.shipmentNo || notice.shipment_no || null,
    ...(voyageId ? { voyage_id: voyageId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    bl_no: notice.blNo || notice.bl_no || null,
    arrival_port: notice.arrivalPort || notice.arrival_port || null,
    arrival_at: notice.arrivalAt || notice.arrival_at || null,
    free_days: notice.freeDays ?? notice.free_days ?? null,
    demurrage_rule: notice.demurrageRule || notice.demurrage_rule || null,
    sent_to_customer_at: notice.sentToCustomerAt || notice.sent_to_customer_at || null,
    sent_to_agent_at: notice.sentToAgentAt || notice.sent_to_agent_at || null,
    status: notice.status || 'draft',
    files: notice.files || [],
    remarks: notice.remarks || null,
  }
}

export const arrivalNoticeService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) return null
    const { data, error } = await supabase
      .from('arrival_notices')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('getByPurchaseOrderId arrival_notices', error)
    return fromArrivalNoticeRow(data?.[0] || null)
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) {
      throw new Error('请先维护开船/提单信息，再创建到港通知')
    }
    const { data: existing, error: existingError } = await supabase
      .from('arrival_notices')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) throwServiceError('get arrival_notices by voyage_id', existingError)
    const latest = existing?.[0] || null
    const row = toArrivalNoticeRow({
      ...payload,
      id: latest?.id || payload.id,
      voyageId: voyage.id,
      shipmentNo: payload.shipmentNo || payload.shipment_no || voyage.shipmentNo || null,
      loadPlanId: payload.loadPlanId || payload.load_plan_id || voyage.loadPlanId || null,
      blNo: payload.blNo || payload.bl_no || voyage.blNo || null,
    })
    const query = latest?.id
      ? supabase.from('arrival_notices').update(row).eq('id', latest.id).select().single()
      : supabase.from('arrival_notices').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsert arrival_notice', error)
    return fromArrivalNoticeRow(data)
  },
  async acknowledgeByPurchaseOrderId(purchaseOrderId: string, payload?: { remarks?: string; acknowledgedAt?: string }) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing?.id) {
      throw new Error('当前采购单尚未生成到港通知')
    }
    const { data, error } = await supabase
      .from('arrival_notices')
      .update({
        status: 'acknowledged',
        remarks: payload?.remarks || existing.remarks || null,
        sent_to_customer_at: payload?.acknowledgedAt || existing.sentToCustomerAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throwServiceError('acknowledge arrival_notice', error)
    return fromArrivalNoticeRow(data)
  },
}

export function fromImportClearanceRow(r: any) {
  if (!r) return null
  const participants = deriveExternalParticipants(r)
  return {
    id: r.id,
    clearanceNo: r.clearance_no,
    shipmentNo: r.shipment_no,
    voyageId: r.voyage_id,
    arrivalNoticeId: r.arrival_notice_id,
    customerId: r.customer_id,
    destinationCountry: r.destination_country,
    destinationPort: r.destination_port,
    importBrokerName: r.import_broker_name,
    importBrokerContact: r.import_broker_contact,
    importClearanceResponsibility: r.import_clearance_responsibility,
    destinationDeliveryResponsibility: r.destination_delivery_responsibility,
    clearanceStatus: r.clearance_status,
    docStatus: r.doc_status,
    customsReleaseAt: r.customs_release_at,
    dutyPaidFlag: r.duty_paid_flag,
    deliveryOrderReceived: r.delivery_order_received,
    shipmentReadinessStatus: deriveShipmentReadiness(r),
    externalParticipants: participants,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toImportClearanceRow(clearance: any) {
  const id = toUUIDOrNull(clearance.id)
  const voyageId = toUUIDOrNull(clearance.voyageId || clearance.voyage_id)
  const arrivalNoticeId = toUUIDOrNull(clearance.arrivalNoticeId || clearance.arrival_notice_id)
  return {
    ...(id ? { id } : {}),
    clearance_no: clearance.clearanceNo || clearance.clearance_no,
    shipment_no: clearance.shipmentNo || clearance.shipment_no || null,
    ...(voyageId ? { voyage_id: voyageId } : {}),
    ...(arrivalNoticeId ? { arrival_notice_id: arrivalNoticeId } : {}),
    customer_id: clearance.customerId || clearance.customer_id || null,
    destination_country: clearance.destinationCountry || clearance.destination_country || null,
    destination_port: clearance.destinationPort || clearance.destination_port || null,
    import_broker_name: clearance.importBrokerName || clearance.import_broker_name || null,
    import_broker_contact: clearance.importBrokerContact || clearance.import_broker_contact || null,
    import_clearance_responsibility: clearance.importClearanceResponsibility || clearance.import_clearance_responsibility || null,
    destination_delivery_responsibility: clearance.destinationDeliveryResponsibility || clearance.destination_delivery_responsibility || null,
    clearance_status: clearance.clearanceStatus || clearance.clearance_status || 'not_started',
    doc_status: clearance.docStatus || clearance.doc_status || 'pending',
    customs_release_at: clearance.customsReleaseAt || clearance.customs_release_at || null,
    duty_paid_flag: Boolean(clearance.dutyPaidFlag ?? clearance.duty_paid_flag ?? false),
    delivery_order_received: Boolean(clearance.deliveryOrderReceived ?? clearance.delivery_order_received ?? false),
    remarks: clearance.remarks || null,
  }
}

export const importClearanceCoordinationService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) return null
    const arrivalNotice = await arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId)
    const { data, error } = await supabase
      .from('import_clearance_coordination')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('getByPurchaseOrderId import_clearance_coordination', error)
    const row = data?.[0] || null
    if (!row) return null
    const normalized = fromImportClearanceRow(row)
    if (!normalized?.arrivalNoticeId && arrivalNotice?.id) {
      normalized.arrivalNoticeId = arrivalNotice.id
    }
    return normalized
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) throw new Error('请先维护开船/到港信息，再更新清关协同')
    const arrivalNotice = await arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId)
    const { data: existing, error: existingError } = await supabase
      .from('import_clearance_coordination')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) throwServiceError('get import_clearance_coordination by voyage_id', existingError)
    const latest = existing?.[0] || null
    const row = toImportClearanceRow({
      ...payload,
      id: latest?.id || payload.id,
      voyageId: voyage.id,
      arrivalNoticeId: payload.arrivalNoticeId || payload.arrival_notice_id || arrivalNotice?.id || null,
      shipmentNo: payload.shipmentNo || payload.shipment_no || voyage.shipmentNo || null,
    })
    const query = latest?.id
      ? supabase.from('import_clearance_coordination').update(row).eq('id', latest.id).select().single()
      : supabase.from('import_clearance_coordination').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsert import_clearance_coordination', error)
    return fromImportClearanceRow(data)
  },
  async confirmDocumentsReceivedByPurchaseOrderId(
    purchaseOrderId: string,
    payload?: { remarks?: string; docStatus?: string },
  ) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing?.id) {
      throw new Error('当前采购单尚未生成清关协同记录')
    }
    const { data, error } = await supabase
      .from('import_clearance_coordination')
      .update({
        delivery_order_received: true,
        doc_status: payload?.docStatus || 'customer_acknowledged',
        remarks: payload?.remarks || existing.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throwServiceError('confirm import_clearance documents received', error)
    return fromImportClearanceRow(data)
  },
}

export function fromDeliveryConfirmationRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    deliveryConfirmNo: r.delivery_confirm_no,
    shipmentNo: r.shipment_no,
    voyageId: r.voyage_id,
    clearanceId: r.clearance_id,
    customerId: r.customer_id,
    deliveredAt: r.delivered_at,
    receivedBy: r.received_by,
    receivedQuantity: r.received_quantity,
    damageFlag: r.damage_flag,
    shortageFlag: r.shortage_flag,
    claimFlag: r.claim_flag,
    podFiles: r.pod_files || [],
    photos: r.photos || [],
    remarks: r.remarks,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDeliveryConfirmationRow(delivery: any) {
  const id = toUUIDOrNull(delivery.id)
  const voyageId = toUUIDOrNull(delivery.voyageId || delivery.voyage_id)
  const clearanceId = toUUIDOrNull(delivery.clearanceId || delivery.clearance_id)
  return {
    ...(id ? { id } : {}),
    delivery_confirm_no: delivery.deliveryConfirmNo || delivery.delivery_confirm_no,
    shipment_no: delivery.shipmentNo || delivery.shipment_no || null,
    ...(voyageId ? { voyage_id: voyageId } : {}),
    ...(clearanceId ? { clearance_id: clearanceId } : {}),
    customer_id: delivery.customerId || delivery.customer_id || null,
    delivered_at: delivery.deliveredAt || delivery.delivered_at || null,
    received_by: delivery.receivedBy || delivery.received_by || null,
    received_quantity: Number(delivery.receivedQuantity || delivery.received_quantity || 0),
    damage_flag: Boolean(delivery.damageFlag ?? delivery.damage_flag ?? false),
    shortage_flag: Boolean(delivery.shortageFlag ?? delivery.shortage_flag ?? false),
    claim_flag: Boolean(delivery.claimFlag ?? delivery.claim_flag ?? false),
    pod_files: delivery.podFiles || delivery.pod_files || [],
    photos: delivery.photos || delivery.photos || [],
    remarks: delivery.remarks || null,
    status: delivery.status || 'pending',
  }
}

export const deliveryConfirmationService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) return null
    const clearance = await importClearanceCoordinationService.getByPurchaseOrderId(purchaseOrderId)
    const { data, error } = await supabase
      .from('delivery_confirmations')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('getByPurchaseOrderId delivery_confirmations', error)
    const row = data?.[0] || null
    if (!row) return null
    const normalized = fromDeliveryConfirmationRow(row)
    if (!normalized?.clearanceId && clearance?.id) {
      normalized.clearanceId = clearance.id
    }
    return normalized
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) throw new Error('请先维护开船/在途信息，再更新收货确认')
    const clearance = await importClearanceCoordinationService.getByPurchaseOrderId(purchaseOrderId)
    const { data: existing, error: existingError } = await supabase
      .from('delivery_confirmations')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) throwServiceError('get delivery_confirmations by voyage_id', existingError)
    const latest = existing?.[0] || null
    const row = toDeliveryConfirmationRow({
      ...payload,
      id: latest?.id || payload.id,
      voyageId: voyage.id,
      clearanceId: payload.clearanceId || payload.clearance_id || clearance?.id || null,
      shipmentNo: payload.shipmentNo || payload.shipment_no || voyage.shipmentNo || null,
    })
    const query = latest?.id
      ? supabase.from('delivery_confirmations').update(row).eq('id', latest.id).select().single()
      : supabase.from('delivery_confirmations').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsert delivery_confirmation', error)
    return fromDeliveryConfirmationRow(data)
  },
  async confirmReceivedByPurchaseOrderId(
    purchaseOrderId: string,
    payload?: { receivedBy?: string; remarks?: string; receivedQuantity?: number | null },
  ) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing?.id) {
      throw new Error('当前采购单尚未生成收货确认记录')
    }
    const row = {
      status: existing.status && existing.status !== 'pending' ? existing.status : 'received_ok',
      received_by: payload?.receivedBy || existing.receivedBy || null,
      delivered_at: existing.deliveredAt || new Date().toISOString(),
      received_quantity: payload?.receivedQuantity ?? existing.receivedQuantity ?? 0,
      remarks: payload?.remarks || existing.remarks || null,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('delivery_confirmations')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throwServiceError('confirm delivery_confirmation received', error)
    return fromDeliveryConfirmationRow(data)
  },
}

export function fromDeliveryExceptionRow(r: any) {
  if (!r) return null
  const summary = deriveDeliveryExceptionSummary(r)
  return {
    id: r.id,
    exceptionNo: r.exception_no,
    shipmentNo: r.shipment_no,
    voyageId: r.voyage_id,
    deliveryConfirmId: r.delivery_confirm_id,
    exceptionType: r.exception_type,
    reportedBy: r.reported_by,
    reportedAt: r.reported_at,
    responsibleParty: r.responsible_party,
    financialImpact: r.financial_impact,
    status: r.status,
    exceptionSeverity: summary.exceptionSeverity,
    evidenceFiles: r.evidence_files || [],
    resolutionNotes: r.resolution_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDeliveryExceptionRow(exception: any) {
  const id = toUUIDOrNull(exception.id)
  const voyageId = toUUIDOrNull(exception.voyageId || exception.voyage_id)
  const deliveryConfirmId = toUUIDOrNull(exception.deliveryConfirmId || exception.delivery_confirm_id)
  return {
    ...(id ? { id } : {}),
    exception_no: exception.exceptionNo || exception.exception_no,
    shipment_no: exception.shipmentNo || exception.shipment_no || null,
    ...(voyageId ? { voyage_id: voyageId } : {}),
    ...(deliveryConfirmId ? { delivery_confirm_id: deliveryConfirmId } : {}),
    exception_type: exception.exceptionType || exception.exception_type || 'damage',
    reported_by: exception.reportedBy || exception.reported_by || null,
    reported_at: exception.reportedAt || exception.reported_at || null,
    responsible_party: exception.responsibleParty || exception.responsible_party || null,
    financial_impact: exception.financialImpact ?? exception.financial_impact ?? null,
    status: exception.status || 'open',
    evidence_files: exception.evidenceFiles || exception.evidence_files || [],
    resolution_notes: exception.resolutionNotes || exception.resolution_notes || null,
  }
}

export const deliveryExceptionService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) return []
    const { data, error } = await supabase
      .from('delivery_exceptions')
      .select('*')
      .eq('voyage_id', voyage.id)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId delivery_exceptions', error)
    return (data || []).map(fromDeliveryExceptionRow)
  },
  async createByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    if (!voyage?.id) throw new Error('请先维护出运跟踪信息，再登记交付异常')
    const delivery = await deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId)
    const row = toDeliveryExceptionRow({
      ...payload,
      shipmentNo: payload.shipmentNo || payload.shipment_no || voyage.shipmentNo || null,
      voyageId: voyage.id,
      deliveryConfirmId: payload.deliveryConfirmId || payload.delivery_confirm_id || delivery?.id || null,
    })
    const { data, error } = await supabase
      .from('delivery_exceptions')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create delivery_exception', error)
    return fromDeliveryExceptionRow(data)
  },
}

export function fromPostOrderFeedbackRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    feedbackNo: r.feedback_no,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    shipmentNo: r.shipment_no,
    voyageId: r.voyage_id,
    deliveryConfirmationId: r.delivery_confirmation_id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    feedbackChannel: r.feedback_channel,
    feedbackStatus: r.feedback_status,
    productRating: r.product_rating,
    packagingRating: r.packaging_rating,
    deliveryRating: r.delivery_rating,
    serviceRating: r.service_rating,
    overallRating: r.overall_rating,
    qualityIssueFlag: r.quality_issue_flag,
    packagingIssueFlag: r.packaging_issue_flag,
    deliveryIssueFlag: r.delivery_issue_flag,
    reorderIntent: r.reorder_intent,
    recommendIntent: r.recommend_intent,
    feedbackText: r.feedback_text,
    attachments: r.attachments || [],
    submittedAt: r.submitted_at,
    submittedBy: r.submitted_by,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    internalSummary: r.internal_summary,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toPostOrderFeedbackRow(feedback: any) {
  const id = toUUIDOrNull(feedback.id)
  const purchaseOrderId = toUUIDOrNull(feedback.purchaseOrderId || feedback.purchase_order_id)
  const voyageId = toUUIDOrNull(feedback.voyageId || feedback.voyage_id)
  const deliveryConfirmationId = toUUIDOrNull(feedback.deliveryConfirmationId || feedback.delivery_confirmation_id)
  return {
    ...(id ? { id } : {}),
    feedback_no: feedback.feedbackNo || feedback.feedback_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(voyageId ? { voyage_id: voyageId } : {}),
    ...(deliveryConfirmationId ? { delivery_confirmation_id: deliveryConfirmationId } : {}),
    sales_contract_id: toUUIDOrNull(feedback.salesContractId || feedback.sales_contract_id),
    shipment_no: feedback.shipmentNo || feedback.shipment_no || null,
    customer_id: feedback.customerId || feedback.customer_id || null,
    customer_name: feedback.customerName || feedback.customer_name || '',
    feedback_channel: feedback.feedbackChannel || feedback.feedback_channel || 'customer_portal',
    feedback_status: feedback.feedbackStatus || feedback.feedback_status || 'submitted',
    product_rating: feedback.productRating ?? feedback.product_rating ?? null,
    packaging_rating: feedback.packagingRating ?? feedback.packaging_rating ?? null,
    delivery_rating: feedback.deliveryRating ?? feedback.delivery_rating ?? null,
    service_rating: feedback.serviceRating ?? feedback.service_rating ?? null,
    overall_rating: feedback.overallRating ?? feedback.overall_rating ?? null,
    quality_issue_flag: Boolean(feedback.qualityIssueFlag ?? feedback.quality_issue_flag ?? false),
    packaging_issue_flag: Boolean(feedback.packagingIssueFlag ?? feedback.packaging_issue_flag ?? false),
    delivery_issue_flag: Boolean(feedback.deliveryIssueFlag ?? feedback.delivery_issue_flag ?? false),
    reorder_intent: feedback.reorderIntent || feedback.reorder_intent || null,
    recommend_intent: feedback.recommendIntent || feedback.recommend_intent || null,
    feedback_text: feedback.feedbackText || feedback.feedback_text || null,
    attachments: feedback.attachments || [],
    submitted_at: feedback.submittedAt || feedback.submitted_at || new Date().toISOString(),
    submitted_by: feedback.submittedBy || feedback.submitted_by || null,
    reviewed_by: feedback.reviewedBy || feedback.reviewed_by || null,
    reviewed_at: feedback.reviewedAt || feedback.reviewed_at || null,
    internal_summary: feedback.internalSummary || feedback.internal_summary || null,
  }
}

export const postOrderFeedbackService = {
  async listAll() {
    const { data, error } = await supabase
      .from('post_order_feedback')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwServiceError('listAll post_order_feedback', error)
    return (data || []).map(fromPostOrderFeedbackRow)
  },
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('post_order_feedback')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId post_order_feedback', error)
    return (data || []).map(fromPostOrderFeedbackRow)
  },
  async createByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const voyage = await voyageTrackingService.getByPurchaseOrderId(purchaseOrderId)
    const delivery = await deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId)
    const row = toPostOrderFeedbackRow({
      ...payload,
      purchaseOrderId,
      voyageId: payload.voyageId || payload.voyage_id || voyage?.id || null,
      deliveryConfirmationId: payload.deliveryConfirmationId || payload.delivery_confirmation_id || delivery?.id || null,
      shipmentNo: payload.shipmentNo || payload.shipment_no || voyage?.shipmentNo || null,
    })
    const { data, error } = await supabase
      .from('post_order_feedback')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create post_order_feedback', error)
    return fromPostOrderFeedbackRow(data)
  },
}
