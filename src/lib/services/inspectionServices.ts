import { supabase } from '../supabase'

function buildSupabaseError(context: string, error: any): Error {
  const rawMessage = String(error?.message || error || 'Unknown Supabase error').trim()
  return new Error(`${context} failed${rawMessage ? `: ${rawMessage}` : ''}`)
}

function throwSupabaseError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : buildSupabaseError(context, error))
}

function toUUID(id: string | null | undefined): string {
  const s = String(id || '').trim()
  if (s === '') return crypto.randomUUID()
  return s
}

function toUUIDOrNull(id: string | null | undefined): string | null {
  const s = String(id || '').trim()
  if (s === '') return null
  return s
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function fromSupplierInspectionRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    purchaseOrderId: r.purchase_order_id,
    reportNo: r.report_no,
    supplierId: r.supplier_id,
    inspectionDate: r.inspection_date,
    result: r.result,
    summary: r.summary,
    defectNotes: r.defect_notes,
    attachments: r.attachments || [],
    submittedBy: r.submitted_by,
    submittedFromPortal: r.submitted_from_portal,
    verifiedByQc: r.verified_by_qc,
    verifiedAt: r.verified_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toSupplierInspectionRow(report: any) {
  return {
    id: toUUID(report.id),
    purchase_order_id: toUUID(report.purchaseOrderId || report.purchase_order_id),
    report_no: report.reportNo || report.report_no,
    supplier_id: report.supplierId || report.supplier_id || null,
    inspection_date: toIsoDate(report.inspectionDate || report.inspection_date),
    result: report.result || 'pass',
    summary: report.summary || null,
    defect_notes: report.defectNotes || report.defect_notes || null,
    attachments: report.attachments || [],
    submitted_by: report.submittedBy || report.submitted_by || null,
    submitted_from_portal: report.submittedFromPortal || report.submitted_from_portal || 'supplier_portal',
    verified_by_qc: report.verifiedByQc || report.verified_by_qc || null,
    verified_at: report.verifiedAt || report.verified_at || null,
  }
}

export const supplierInspectionReportService = {
  async listAll() {
    const { data, error } = await supabase
      .from('supplier_inspection_reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('listAll supplier_inspection_reports', error)
    return (data || []).map(fromSupplierInspectionRow)
  },
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('supplier_inspection_reports')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByPurchaseOrderId supplier_inspection_reports', error)
    return (data || []).map(fromSupplierInspectionRow)
  },
  async create(report: any) {
    const row = toSupplierInspectionRow(report)
    const { data, error } = await supabase
      .from('supplier_inspection_reports')
      .insert(row)
      .select()
      .single()
    if (error) throwSupabaseError('create supplier_inspection_report', error)
    await supabase
      .from('purchase_order_execution')
      .upsert({
        purchase_order_id: row.purchase_order_id,
        execution_status: 'supplier_self_inspection_submitted',
        supplier_self_inspection_status: 'submitted',
      }, { onConflict: 'purchase_order_id' })
    return fromSupplierInspectionRow(data)
  },
}

function fromQcInspectionOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    purchaseOrderId: r.purchase_order_id,
    inspectionNo: r.inspection_no,
    inspectionType: r.inspection_type,
    scheduledDate: r.scheduled_date,
    inspectorId: r.inspector_id,
    inspectorName: r.inspector_name,
    status: r.status,
    result: r.result,
    factoryName: r.factory_name,
    inspectionLocation: r.inspection_location,
    reportFiles: r.report_files || [],
    photos: r.photos || [],
    thirdPartyAgencyId: r.third_party_agency_id,
    thirdPartyAgencyName: r.third_party_agency_name,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toQcInspectionOrderRow(order: any) {
  const id = toUUIDOrNull(order.id)
  const purchaseOrderId = toUUIDOrNull(order.purchaseOrderId || order.purchase_order_id)
  return {
    ...(id ? { id } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    inspection_no: order.inspectionNo || order.inspection_no,
    inspection_type: order.inspectionType || order.inspection_type || 'pre_shipment',
    scheduled_date: toIsoDate(order.scheduledDate || order.scheduled_date),
    inspector_id: order.inspectorId || order.inspector_id || null,
    inspector_name: order.inspectorName || order.inspector_name || null,
    status: order.status || 'pending',
    result: order.result || 'pending',
    factory_name: order.factoryName || order.factory_name || null,
    inspection_location: order.inspectionLocation || order.inspection_location || null,
    report_files: order.reportFiles || order.report_files || [],
    photos: order.photos || order.photos || [],
    third_party_agency_id: order.thirdPartyAgencyId || order.third_party_agency_id || null,
    third_party_agency_name: order.thirdPartyAgencyName || order.third_party_agency_name || null,
    remarks: order.remarks || null,
  }
}

function buildExecutionUpdateFromQcInspection(row: any) {
  const result = String(row?.result || 'pending')
  const status = String(row?.status || 'pending')

  if (result === 'fail') {
    return {
      execution_status: 'qc_failed',
      qc_inspection_status: 'failed',
    }
  }

  if (result === 'pass' || result === 'pass_with_remark') {
    return {
      execution_status: 'qc_passed',
      qc_inspection_status: 'passed',
    }
  }

  return {
    execution_status: 'qc_pending',
    qc_inspection_status: status,
  }
}

export const qcInspectionOrderService = {
  async listAll() {
    const { data, error } = await supabase
      .from('qc_inspection_orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('listAll qc_inspection_orders', error)
    return (data || []).map(fromQcInspectionOrderRow)
  },
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('qc_inspection_orders')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByPurchaseOrderId qc_inspection_orders', error)
    return (data || []).map(fromQcInspectionOrderRow)
  },
  async create(order: any) {
    const row = toQcInspectionOrderRow(order)
    const { data, error } = await supabase
      .from('qc_inspection_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwSupabaseError('create qc_inspection_order', error)

    await supabase
      .from('purchase_order_execution')
      .upsert({
        purchase_order_id: row.purchase_order_id,
        ...buildExecutionUpdateFromQcInspection(row),
      }, { onConflict: 'purchase_order_id' })

    return fromQcInspectionOrderRow(data)
  },
  async update(id: string, updates: any) {
    const row = toQcInspectionOrderRow(updates)
    const { data, error } = await supabase
      .from('qc_inspection_orders')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) throwSupabaseError('update qc_inspection_order', error)

    await supabase
      .from('purchase_order_execution')
      .upsert({
        purchase_order_id: data.purchase_order_id,
        ...buildExecutionUpdateFromQcInspection(data),
      }, { onConflict: 'purchase_order_id' })

    return fromQcInspectionOrderRow(data)
  },
}

function fromLoadingInspectionOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    inspectionOrderNo: r.inspection_order_no,
    loadPlanId: r.load_plan_id,
    loadingTaskId: r.loading_task_id,
    agencyName: r.agency_name,
    agencyType: r.agency_type,
    inspectorName: r.inspector_name,
    inspectorPhone: r.inspector_phone,
    scheduledAt: r.scheduled_at,
    arrivedAt: r.arrived_at,
    completedAt: r.completed_at,
    inspectionStatus: r.inspection_status,
    inspectionResult: r.inspection_result,
    witnessContainerNo: r.witness_container_no,
    witnessSealNo: r.witness_seal_no,
    reportNo: r.report_no,
    reportFiles: r.report_files || [],
    photos: r.photos || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toLoadingInspectionOrderRow(order: any) {
  return {
    id: toUUIDOrNull(order.id) || undefined,
    inspection_order_no: order.inspectionOrderNo || order.inspection_order_no,
    load_plan_id: toUUIDOrNull(order.loadPlanId || order.load_plan_id) || null,
    loading_task_id: toUUIDOrNull(order.loadingTaskId || order.loading_task_id) || null,
    agency_name: order.agencyName || order.agency_name || null,
    agency_type: order.agencyType || order.agency_type || null,
    inspector_name: order.inspectorName || order.inspector_name || null,
    inspector_phone: order.inspectorPhone || order.inspector_phone || null,
    scheduled_at: order.scheduledAt || order.scheduled_at || null,
    arrived_at: order.arrivedAt || order.arrived_at || null,
    completed_at: order.completedAt || order.completed_at || null,
    inspection_status: order.inspectionStatus || order.inspection_status || 'draft',
    inspection_result: order.inspectionResult || order.inspection_result || 'pending',
    witness_container_no: order.witnessContainerNo || order.witness_container_no || null,
    witness_seal_no: order.witnessSealNo || order.witness_seal_no || null,
    report_no: order.reportNo || order.report_no || null,
    report_files: order.reportFiles || order.report_files || [],
    photos: order.photos || order.photos || [],
    remarks: order.remarks || null,
  }
}

export const loadingInspectionOrderService = {
  async getByLoadingTaskId(loadingTaskId: string) {
    const { data, error } = await supabase
      .from('loading_inspection_orders')
      .select('*')
      .eq('loading_task_id', loadingTaskId)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByLoadingTaskId loading_inspection_orders', error)
    return (data || []).map(fromLoadingInspectionOrderRow)
  },
  async create(order: any) {
    const row = toLoadingInspectionOrderRow(order)
    const { data, error } = await supabase
      .from('loading_inspection_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwSupabaseError('create loading_inspection_order', error)
    return fromLoadingInspectionOrderRow(data)
  },
}
