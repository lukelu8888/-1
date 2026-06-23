import { supabase } from '../supabase'
import { deriveArchiveInfo, deriveExternalParticipants } from './businessFieldNormalization'

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

function toIsoDate(value: any): string | null {
  if (!value) return null
  const text = String(value)
  return text.includes('T') ? text.slice(0, 10) : text
}

function fromExportRequirementCheckRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    checkNo: r.check_no,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    shipmentNo: r.shipment_no,
    loadPlanId: r.load_plan_id,
    destinationCountry: r.destination_country,
    tradeTerm: r.trade_term,
    customerId: r.customer_id,
    requiresCustomsDeclaration: r.requires_customs_declaration ?? true,
    requiresInspection: r.requires_inspection ?? false,
    requiresCo: r.requires_co ?? false,
    requiresFumigation: r.requires_fumigation ?? false,
    requiresLoadingInspectionReport: r.requires_loading_inspection_report ?? false,
    requiresHealthCertificate: r.requires_health_certificate ?? false,
    requiresOtherDocs: r.requires_other_docs ?? false,
    otherDocNotes: r.other_doc_notes,
    checkedBy: r.checked_by,
    checkedAt: r.checked_at,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toExportRequirementCheckRow(check: any) {
  const id = toUUIDOrNull(check.id)
  const purchaseOrderId = toUUIDOrNull(check.purchaseOrderId || check.purchase_order_id)
  const loadPlanId = toUUIDOrNull(check.loadPlanId || check.load_plan_id)
  const salesContractId = toUUIDOrNull(check.salesContractId || check.sales_contract_id)
  return {
    ...(id ? { id } : {}),
    check_no: check.checkNo || check.check_no,
    ...(salesContractId ? { sales_contract_id: salesContractId } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    shipment_no: check.shipmentNo || check.shipment_no || null,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    destination_country: check.destinationCountry || check.destination_country || null,
    trade_term: check.tradeTerm || check.trade_term || null,
    customer_id: check.customerId || check.customer_id || null,
    requires_customs_declaration: Boolean(check.requiresCustomsDeclaration ?? check.requires_customs_declaration ?? true),
    requires_inspection: Boolean(check.requiresInspection || check.requires_inspection || false),
    requires_co: Boolean(check.requiresCo || check.requires_co || false),
    requires_fumigation: Boolean(check.requiresFumigation || check.requires_fumigation || false),
    requires_loading_inspection_report: Boolean(check.requiresLoadingInspectionReport || check.requires_loading_inspection_report || false),
    requires_health_certificate: Boolean(check.requiresHealthCertificate || check.requires_health_certificate || false),
    requires_other_docs: Boolean(check.requiresOtherDocs || check.requires_other_docs || false),
    other_doc_notes: check.otherDocNotes || check.other_doc_notes || null,
    checked_by: check.checkedBy || check.checked_by || null,
    checked_at: check.checkedAt || check.checked_at || null,
    status: check.status || 'draft',
  }
}

function fromShipmentDocumentSetRow(r: any) {
  if (!r) return null
  const archiveInfo = deriveArchiveInfo(r)
  return {
    id: r.id,
    documentSetNo: r.document_set_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    commercialInvoiceNo: r.commercial_invoice_no,
    packingListNo: r.packing_list_no,
    ciStatus: r.ci_status,
    plStatus: r.pl_status,
    invoiceNo: archiveInfo.invoiceNo,
    invoiceStatus: archiveInfo.invoiceStatus,
    docsReadyAt: r.docs_ready_at,
    preparedBy: r.prepared_by,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toShipmentDocumentSetRow(docSet: any) {
  const id = toUUIDOrNull(docSet.id)
  const purchaseOrderId = toUUIDOrNull(docSet.purchaseOrderId || docSet.purchase_order_id)
  const loadPlanId = toUUIDOrNull(docSet.loadPlanId || docSet.load_plan_id)
  return {
    ...(id ? { id } : {}),
    document_set_no: docSet.documentSetNo || docSet.document_set_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    commercial_invoice_no: docSet.commercialInvoiceNo || docSet.commercial_invoice_no || null,
    packing_list_no: docSet.packingListNo || docSet.packing_list_no || null,
    ci_status: docSet.ciStatus || docSet.ci_status || 'draft',
    pl_status: docSet.plStatus || docSet.pl_status || 'draft',
    docs_ready_at: docSet.docsReadyAt || docSet.docs_ready_at || null,
    prepared_by: docSet.preparedBy || docSet.prepared_by || null,
    remarks: docSet.remarks || null,
  }
}

function fromCustomsDeclarationRow(r: any) {
  if (!r) return null
  const participants = deriveExternalParticipants(r)
  return {
    id: r.id,
    customsDeclNo: r.customs_decl_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    brokerName: r.broker_name,
    externalParticipants: participants,
    declarationDate: r.declaration_date,
    declarationStatus: r.declaration_status,
    releasedAt: r.released_at,
    declarationFiles: r.declaration_files || [],
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toCustomsDeclarationRow(decl: any) {
  const id = toUUIDOrNull(decl.id)
  const purchaseOrderId = toUUIDOrNull(decl.purchaseOrderId || decl.purchase_order_id)
  const loadPlanId = toUUIDOrNull(decl.loadPlanId || decl.load_plan_id)
  return {
    ...(id ? { id } : {}),
    customs_decl_no: decl.customsDeclNo || decl.customs_decl_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    broker_name: decl.brokerName || decl.broker_name || null,
    declaration_date: toIsoDate(decl.declarationDate || decl.declaration_date),
    declaration_status: decl.declarationStatus || decl.declaration_status || 'draft',
    released_at: decl.releasedAt || decl.released_at || null,
    declaration_files: decl.declarationFiles || decl.declaration_files || [],
    remarks: decl.remarks || null,
    created_by: decl.createdBy || decl.created_by || null,
  }
}

export const exportRequirementCheckService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('export_requirement_checks')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId export_requirement_checks', error)
    return (data || []).map(fromExportRequirementCheckRow)
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    const latest = existing[0] || null
    const row = toExportRequirementCheckRow({
      ...payload,
      id: latest?.id || payload.id,
      purchaseOrderId,
    })

    const query = latest?.id
      ? supabase.from('export_requirement_checks').update(row).eq('id', latest.id).select().single()
      : supabase.from('export_requirement_checks').insert(row).select().single()

    const { data, error } = await query
    if (error) throwServiceError('upsertByPurchaseOrderId export_requirement_checks', error)
    return fromExportRequirementCheckRow(data)
  },
}

export const shipmentDocumentSetService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('shipment_document_sets')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('get shipment_document_sets by purchase_order_id', error)
    return fromShipmentDocumentSetRow(data?.[0] || null)
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const { data: existing, error: existingError } = await supabase
      .from('shipment_document_sets')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) throwServiceError('get shipment_document_sets by purchase_order_id', existingError)
    const latest = existing?.[0] || null
    const row = toShipmentDocumentSetRow({
      ...payload,
      id: latest?.id || payload.id,
      purchaseOrderId,
    })
    const query = latest?.id
      ? supabase.from('shipment_document_sets').update(row).eq('id', latest.id).select().single()
      : supabase.from('shipment_document_sets').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsert shipment_document_set', error)
    return fromShipmentDocumentSetRow(data)
  },
}

export const customsDeclarationService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('customs_declarations')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throwServiceError('get customs_declarations by purchase_order_id', error)
    return fromCustomsDeclarationRow(data?.[0] || null)
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const { data: existing, error: existingError } = await supabase
      .from('customs_declarations')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
      .limit(1)
    if (existingError) throwServiceError('get customs_declarations by purchase_order_id', existingError)
    const latest = existing?.[0] || null
    const row = toCustomsDeclarationRow({
      ...payload,
      id: latest?.id || payload.id,
      purchaseOrderId,
    })
    const query = latest?.id
      ? supabase.from('customs_declarations').update(row).eq('id', latest.id).select().single()
      : supabase.from('customs_declarations').insert(row).select().single()
    const { data, error } = await query
    if (error) throwServiceError('upsert customs_declaration', error)
    return fromCustomsDeclarationRow(data)
  },
}
