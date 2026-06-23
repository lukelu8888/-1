import { supabase } from '../supabase'
import { deriveArchiveInfo } from './businessFieldNormalization'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

export function fromFinanceCompliancePacketRow(r: any) {
  if (!r) return null
  const archiveInfo = deriveArchiveInfo(r)
  return {
    id: r.id,
    packetNo: r.packet_no,
    exportCaseNo: r.export_case_no,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    exportCheckId: r.export_check_id,
    scNo: r.sc_no,
    cgNo: r.cg_no,
    shipmentNo: r.shipment_no,
    loadPlanNo: r.load_plan_no,
    customsDeclNo: r.customs_decl_no,
    customerId: r.customer_id,
    customerName: r.customer_name,
    region: r.region,
    currency: r.currency,
    tradeTerm: r.trade_term,
    destinationCountry: r.destination_country,
    status: r.status,
    docReadyPercent: Number(r.doc_ready_percent || 0),
    taxRefundReady: Boolean(r.tax_refund_ready),
    archivedAt: archiveInfo.archivedAt,
    archiveStatus: archiveInfo.archiveStatus,
    archiveNo: archiveInfo.archiveNo,
    invoiceNo: archiveInfo.invoiceNo,
    invoiceStatus: archiveInfo.invoiceStatus,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function fromFinancePacketSlotRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    packetId: r.packet_id,
    docCode: r.doc_code,
    docName: r.doc_name,
    docCategory: r.doc_category,
    isRequired: Boolean(r.is_required),
    requirementRule: r.requirement_rule,
    sourceType: r.source_type,
    sourceRef: r.source_ref,
    status: r.status,
    currentFileId: r.current_file_id,
    missingReason: r.missing_reason,
    generatedAt: r.generated_at,
    confirmedAt: r.confirmed_at,
    confirmedBy: r.confirmed_by,
    notes: r.notes,
    currentFile: r.current_file ? fromFinancePacketFileRow(r.current_file) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function fromFinancePacketFileRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    packetId: r.packet_id,
    slotId: r.slot_id,
    versionNo: r.version_no,
    fileName: r.file_name,
    fileType: r.file_type,
    storageBucket: r.storage_bucket,
    storagePath: r.storage_path,
    fileUrl: r.file_url,
    originMode: r.origin_mode,
    originRefType: r.origin_ref_type,
    originRefId: r.origin_ref_id,
    uploadedFromPortal: r.uploaded_from_portal,
    uploadedByPartyType: r.uploaded_by_party_type,
    uploadedByPartyId: r.uploaded_by_party_id,
    isPrimarySource: Boolean(r.is_primary_source),
    verifiedByFinance: r.verified_by_finance,
    verifiedAt: r.verified_at,
    uploadedAt: r.uploaded_at,
    isCurrent: Boolean(r.is_current),
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function attachCurrentFilesToPackets(packets: any[]) {
  const packetIds = (packets || []).map((packet: any) => packet.id).filter(Boolean)
  if (packetIds.length === 0) return packets

  const { data: fileRows, error } = await supabase
    .from('finance_packet_files')
    .select('*')
    .in('packet_id', packetIds)
    .eq('is_current', true)

  if (error) throwServiceError('load finance packet current files', error)

  const fileBySlotId = new Map((fileRows || []).map((row: any) => [row.slot_id, fromFinancePacketFileRow(row)]))
  return (packets || []).map((packet: any) => ({
    ...packet,
    slots: (packet.slots || []).map((slot: any) => ({
      ...slot,
      currentFile: fileBySlotId.get(slot.id) || null,
    })),
  }))
}

export function buildFinancePacketStatus(slots: any[]) {
  const actionable = (slots || []).filter((slot) => slot.status !== 'not_required')
  const doneCount = actionable.filter((slot) => ['linked', 'uploaded', 'generated', 'verified'].includes(String(slot.status || ''))).length
  const docReadyPercent = actionable.length > 0 ? Math.round((doneCount / actionable.length) * 100) : 0

  const byCode = Object.fromEntries((slots || []).map((slot) => [slot.docCode || slot.doc_code, slot]))
  const d05Ready = ['linked', 'uploaded', 'generated', 'verified'].includes(String(byCode.D05?.status || ''))
  const d11Ready = ['uploaded', 'generated', 'verified', 'linked'].includes(String(byCode.D11?.status || ''))
  const d12Ready = ['uploaded', 'generated', 'verified', 'linked'].includes(String(byCode.D12?.status || ''))
  const d13Ready = ['generated', 'verified', 'uploaded', 'linked'].includes(String(byCode.D13?.status || ''))
  const d01Ready = ['generated', 'verified', 'uploaded', 'linked'].includes(String(byCode.D01?.status || ''))

  let status = 'collecting'
  if (d05Ready && !d11Ready) {
    status = 'ready_for_fx_docs'
  } else if (d05Ready && d11Ready && d12Ready && d13Ready) {
    status = 'ready_for_tax_refund'
  } else if (docReadyPercent > 0) {
    status = 'partially_ready'
  }

  return {
    status,
    docReadyPercent,
    taxRefundReady: Boolean(d05Ready && d11Ready && d12Ready && d13Ready && d01Ready),
  }
}
