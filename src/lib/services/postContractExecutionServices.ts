import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import {
  deriveArchiveInfo,
  deriveDeliveryExceptionSummary,
  deriveExternalParticipants,
  deriveShipmentReadiness,
} from './businessFieldNormalization'
import {
  getCollectionControlRuleSummary,
  getReceivableReleaseRiskSummary,
  parseExecutionRemarksMeta,
  type ReceivableReleaseRiskSummary,
} from './shipmentWorkflowRiskService'
import { buildShipmentWorkflowSummary } from './shipmentWorkflowSummaryBuilderService'
import { purchaseOrderExecutionStatusService } from './purchaseOrderExecutionStatusService'
export { purchaseOrderExecutionStatusService } from './purchaseOrderExecutionStatusService'
import { customerShipmentTrackingService } from './customerShipmentTrackingService'
export { customerShipmentTrackingService } from './customerShipmentTrackingService'
import {
  attachCurrentFilesToPackets,
  buildFinancePacketStatus,
  fromFinanceCompliancePacketRow,
  fromFinancePacketSlotRow,
} from './financeCompliancePacketSupportService'
import {
  arrivalNoticeService,
  deliveryConfirmationService,
  deliveryExceptionService,
  fromArrivalNoticeRow,
  fromDeliveryConfirmationRow,
  fromDeliveryExceptionRow,
  fromImportClearanceRow,
  fromPostOrderFeedbackRow,
  fromVoyageTrackingRow,
  importClearanceCoordinationService,
  postOrderFeedbackService,
  voyageTrackingService,
} from './shipmentProgressServices'
export {
  arrivalNoticeService,
  deliveryConfirmationService,
  deliveryExceptionService,
  importClearanceCoordinationService,
  postOrderFeedbackService,
  voyageTrackingService,
} from './shipmentProgressServices'
import { bookingQuoteRequestService, shippingOrderService } from './bookingAndShippingServices'
export { bookingQuoteRequestService, shippingOrderService } from './bookingAndShippingServices'
import { containerLoadPlanService, loadingTaskItemService, loadingTaskService } from './loadingExecutionServices'
export { containerLoadPlanService, loadingTaskItemService, loadingTaskService } from './loadingExecutionServices'
import {
  customsDeclarationService,
  exportRequirementCheckService,
  shipmentDocumentSetService,
} from './exportDocumentationServices'
export {
  customsDeclarationService,
  exportRequirementCheckService,
  shipmentDocumentSetService,
} from './exportDocumentationServices'
import {
  cargoReceiptService,
  consolidationPlanService,
  domesticTransferOrderService,
  thirdPartyWarehouseService,
} from './warehouseConsolidationServices'
export {
  cargoReceiptService,
  consolidationPlanService,
  domesticTransferOrderService,
  thirdPartyWarehouseService,
} from './warehouseConsolidationServices'

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

function toDisplayTime(value: any): string {
  if (!value) return '-'
  return String(value).includes('T') ? String(value).slice(0, 16) : String(value)
}

export const shipmentWorkflowSummaryService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const [execution, voyage, arrivalNotice, importClearance, deliveryConfirmation, feedbackRows, financePacket, receivableRisk] = await Promise.all([
      purchaseOrderExecutionStatusService.getByPurchaseOrderId(purchaseOrderId),
      voyageTrackingService.getByPurchaseOrderId(purchaseOrderId),
      arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId),
      importClearanceCoordinationService.getByPurchaseOrderId(purchaseOrderId),
      deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId),
      postOrderFeedbackService.getByPurchaseOrderId(purchaseOrderId),
      financeCompliancePacketService.getByPurchaseOrderId(purchaseOrderId),
      getReceivableReleaseRiskSummary(purchaseOrderId),
    ])

    const latestFeedback = Array.isArray(feedbackRows) ? feedbackRows[0] || null : null
    return buildShipmentWorkflowSummary({
      execution,
      receivableRisk,
      voyage,
      arrivalNotice,
      importClearance,
      deliveryConfirmation,
      latestFeedback,
      financePacket,
    })
  },
}

function inferIntlFreightResponsibility(tradeTerm?: string | null) {
  const value = String(tradeTerm || '').trim().toUpperCase()
  if (!value) return 'unknown'
  if (['FOB', 'EXW', 'FCA'].includes(value)) return 'customer'
  if (['CIF', 'CFR', 'CNF', 'C&F', 'CPT', 'CIP'].includes(value)) return 'our_company'
  return 'unknown'
}

export const financeCompliancePacketService = {
  async listPackets() {
    const { data, error } = await supabase
      .from('finance_compliance_packets')
      .select('*, finance_packet_document_slots(*)')
      .order('updated_at', { ascending: false })
    if (error) throwServiceError('list finance compliance packets', error)
    const packets = (data || []).map((row: any) => ({
      ...fromFinanceCompliancePacketRow(row),
      slots: (row.finance_packet_document_slots || []).map(fromFinancePacketSlotRow),
    }))
    return attachCurrentFilesToPackets(packets)
  },
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('finance_compliance_packets')
      .select('*, finance_packet_document_slots(*)')
      .eq('purchase_order_id', purchaseOrderId)
      .maybeSingle()
    if (error) throwServiceError('get finance compliance packet by purchase order', error)
    if (!data) return null
    const packet = {
      ...fromFinanceCompliancePacketRow(data),
      slots: (data.finance_packet_document_slots || []).map(fromFinancePacketSlotRow),
    }
    const [attached] = await attachCurrentFilesToPackets([packet])
    return attached
  },
  async ensureByPurchaseOrderId(purchaseOrderId: string) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (existing) return existing

    const [po, exportChecks, customs] = await Promise.all([
      supabase.from('purchase_orders').select('*').eq('id', purchaseOrderId).maybeSingle(),
      exportRequirementCheckService.getByPurchaseOrderId(purchaseOrderId),
      customsDeclarationService.getByPurchaseOrderId(purchaseOrderId),
    ])

    if (po.error) throwServiceError('load purchase order for finance packet', po.error)

    const latestCheck = Array.isArray(exportChecks) ? exportChecks[0] || null : null
    const row = {
      packet_no: `FCP-${Date.now()}-${String(purchaseOrderId).slice(0, 8)}`,
      export_case_no: `CASE-${String(purchaseOrderId).slice(0, 8)}`,
      purchase_order_id: purchaseOrderId,
      export_check_id: latestCheck?.id || null,
      cg_no: po.data?.po_number || null,
      shipment_no: latestCheck?.shipmentNo || latestCheck?.shipment_no || null,
      load_plan_id: latestCheck?.loadPlanId || latestCheck?.load_plan_id || null,
      load_plan_no: latestCheck?.loadPlanNo || latestCheck?.load_plan_no || null,
      customs_decl_no: customs?.customsDeclNo || customs?.customs_decl_no || null,
      customer_id: latestCheck?.customerId || latestCheck?.customer_id || null,
      customer_name: '',
      region: po.data?.region_code || null,
      currency: po.data?.currency || 'USD',
      trade_term: latestCheck?.tradeTerm || latestCheck?.trade_term || null,
      destination_country: latestCheck?.destinationCountry || latestCheck?.destination_country || null,
      status: 'draft',
      created_by: 'system',
    }

    const { error } = await supabase
      .from('finance_compliance_packets')
      .insert(row)
    if (error) throwServiceError('create finance compliance packet', error)
    return this.getByPurchaseOrderId(purchaseOrderId)
  },
  async upsertPacketFile(slot: any, payload: {
    fileName: string
    originMode: string
    fileType?: string | null
    storageBucket?: string | null
    storagePath?: string | null
    fileUrl?: string | null
    originRefType?: string | null
    originRefId?: string | null
    remarks?: string | null
    uploadedByPartyType?: string | null
    uploadedByPartyId?: string | null
    verifiedByFinance?: string | null
    verifiedAt?: string | null
    uploadedFromPortal?: string | null
  }) {
    const { data: currentFiles, error: currentError } = await supabase
      .from('finance_packet_files')
      .select('id, version_no')
      .eq('slot_id', slot.id)
      .order('version_no', { ascending: false })
    if (currentError) throwServiceError('load finance packet slot files', currentError)

    const nextVersion = ((currentFiles || [])[0]?.version_no || 0) + 1
    const { data: fileRow, error: insertError } = await supabase
      .from('finance_packet_files')
      .insert({
        packet_id: slot.packetId,
        slot_id: slot.id,
        version_no: nextVersion,
        file_name: payload.fileName,
        file_type: payload.fileType || 'application/pdf',
        storage_bucket: payload.storageBucket || null,
        storage_path: payload.storagePath || null,
        file_url: payload.fileUrl || null,
        origin_mode: payload.originMode,
        origin_ref_type: payload.originRefType || null,
        origin_ref_id: payload.originRefId || null,
        uploaded_from_portal: payload.uploadedFromPortal || (payload.originMode === 'finance_upload' ? 'finance' : 'admin'),
        uploaded_by_party_type: payload.uploadedByPartyType || null,
        uploaded_by_party_id: payload.uploadedByPartyId || null,
        is_primary_source: true,
        verified_by_finance: payload.verifiedByFinance || null,
        verified_at: payload.verifiedAt || null,
        is_current: true,
        remarks: payload.remarks || null,
      })
      .select('*')
      .single()
    if (insertError) throwServiceError('insert finance packet file', insertError)

    if ((currentFiles || []).length > 0) {
      const currentIds = currentFiles.map((row: any) => row.id)
      const { error: markOldError } = await supabase
        .from('finance_packet_files')
        .update({ is_current: false })
        .in('id', currentIds)
      if (markOldError) throwServiceError('mark previous finance packet files non-current', markOldError)
    }

    const { error: slotError } = await supabase
      .from('finance_packet_document_slots')
      .update({
        current_file_id: fileRow.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', slot.id)
    if (slotError) throwServiceError('attach current file to packet slot', slotError)
    return fileRow
  },
  async ensureGeneratedFileByDocCode(purchaseOrderId: string, docCode: 'D01' | 'D10' | 'D13', payload?: { operator?: string; remarks?: string }) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === docCode)
    if (!slot) throw new Error(`未找到 ${docCode} 槽位`)
    if (slot.currentFile) return slot.currentFile

    const fileName =
      docCode === 'D01'
        ? `${packet.packetNo || 'packet'}_D01_退税申报表.pdf`
        : docCode === 'D10'
          ? `${packet.packetNo || 'packet'}_D10_国际运费免责说明.pdf`
          : `${packet.packetNo || 'packet'}_D13_收汇凭证情况表.pdf`

    await this.upsertPacketFile(slot, {
      fileName,
      originMode: 'auto_generated',
      fileType: 'application/pdf',
      remarks: payload?.remarks || `${docCode} 已由系统自动生成`,
      uploadedByPartyType: 'system',
      uploadedByPartyId: payload?.operator || 'system',
      uploadedFromPortal: 'admin',
      verifiedByFinance: payload?.operator || null,
      verifiedAt: payload?.operator ? new Date().toISOString() : null,
    })

    return this.getByPurchaseOrderId(purchaseOrderId)
  },
  async ensureLinkedFileByDocCode(purchaseOrderId: string, docCode: 'D05', payload?: { operator?: string; remarks?: string; sourceRef?: string | null }) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === docCode)
    if (!slot) throw new Error(`未找到 ${docCode} 槽位`)
    if (slot.currentFile) return slot.currentFile

    const fileName = `${packet.packetNo || 'packet'}_${docCode}_报关提运资料索引.pdf`
    await this.upsertPacketFile(slot, {
      fileName,
      originMode: 'auto_linked',
      fileType: 'application/pdf',
      originRefType: 'shipment_document_bundle',
      originRefId: packet.purchaseOrderId || null,
      remarks: payload?.remarks || `${docCode} 已关联报关/装箱/提运资料索引`,
      uploadedByPartyType: 'system',
      uploadedByPartyId: payload?.operator || 'system',
      uploadedFromPortal: 'admin',
    })

    if (payload?.sourceRef) {
      await this.updateSlotStatusByDocCode(purchaseOrderId, docCode, {
        sourceType: 'linked_business_doc',
        sourceRef: payload.sourceRef,
      })
    }

    return this.getByPurchaseOrderId(purchaseOrderId)
  },
  async updateSlotStatusByDocCode(purchaseOrderId: string, docCode: string, patch: Record<string, any>) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === docCode)
    if (!slot) throw new Error(`未找到 ${docCode} 槽位`)

    const dbPatch: Record<string, any> = {}
    if ('status' in patch) dbPatch.status = patch.status
    if ('sourceType' in patch) dbPatch.source_type = patch.sourceType
    if ('sourceRef' in patch) dbPatch.source_ref = patch.sourceRef
    if ('missingReason' in patch) dbPatch.missing_reason = patch.missingReason
    if ('notes' in patch) dbPatch.notes = patch.notes
    if ('confirmedAt' in patch) dbPatch.confirmed_at = patch.confirmedAt
    if ('confirmedBy' in patch) dbPatch.confirmed_by = patch.confirmedBy
    if ('generatedAt' in patch) dbPatch.generated_at = patch.generatedAt
    dbPatch.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('finance_packet_document_slots')
      .update(dbPatch)
      .eq('id', slot.id)
    if (error) throwServiceError(`update ${docCode} slot status`, error)

    return this.syncByPurchaseOrderId(purchaseOrderId)
  },
  async markFxReceiptUploadedByPurchaseOrderId(purchaseOrderId: string, payload?: { fileName?: string; operator?: string; remarks?: string; fileType?: string; storageBucket?: string; storagePath?: string; fileUrl?: string }) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === 'D11')
    if (!slot) throw new Error('未找到 D11 槽位')
    await this.upsertPacketFile(slot, {
      fileName: payload?.fileName || `D11_FX_Receipt_${String(purchaseOrderId).slice(0, 8)}.pdf`,
      originMode: 'finance_upload',
      fileType: payload?.fileType || 'application/pdf',
      storageBucket: payload?.storageBucket || null,
      storagePath: payload?.storagePath || null,
      fileUrl: payload?.fileUrl || null,
      remarks: payload?.remarks || '财务上传收汇水单',
      uploadedByPartyType: 'finance',
      uploadedByPartyId: payload?.operator || 'finance',
      verifiedByFinance: payload?.operator || 'finance',
      verifiedAt: new Date().toISOString(),
    })
    return this.updateSlotStatusByDocCode(purchaseOrderId, 'D11', {
      status: 'verified',
      sourceType: 'uploaded_external',
      notes: payload?.remarks || '收汇水单已上传并确认',
      confirmedAt: new Date().toISOString(),
      confirmedBy: payload?.operator || 'finance',
    })
  },
  async markFxSettlementUploadedByPurchaseOrderId(purchaseOrderId: string, payload?: { fileName?: string; operator?: string; remarks?: string; fileType?: string; storageBucket?: string; storagePath?: string; fileUrl?: string }) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === 'D12')
    if (!slot) throw new Error('未找到 D12 槽位')
    await this.upsertPacketFile(slot, {
      fileName: payload?.fileName || `D12_FX_Settlement_${String(purchaseOrderId).slice(0, 8)}.pdf`,
      originMode: 'finance_upload',
      fileType: payload?.fileType || 'application/pdf',
      storageBucket: payload?.storageBucket || null,
      storagePath: payload?.storagePath || null,
      fileUrl: payload?.fileUrl || null,
      remarks: payload?.remarks || '财务上传结汇水单',
      uploadedByPartyType: 'finance',
      uploadedByPartyId: payload?.operator || 'finance',
      verifiedByFinance: payload?.operator || 'finance',
      verifiedAt: new Date().toISOString(),
    })
    return this.updateSlotStatusByDocCode(purchaseOrderId, 'D12', {
      status: 'verified',
      sourceType: 'uploaded_external',
      notes: payload?.remarks || '结汇水单已上传并确认',
      confirmedAt: new Date().toISOString(),
      confirmedBy: payload?.operator || 'finance',
    })
  },
  async markIntlFreightUploadedByPurchaseOrderId(purchaseOrderId: string, payload?: { fileName?: string; operator?: string; remarks?: string; fileType?: string; storageBucket?: string; storagePath?: string; fileUrl?: string; originMode?: string; uploadedByPartyType?: string; uploadedByPartyId?: string; uploadedFromPortal?: string }) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('未找到合规文件包')
    const slot = (packet.slots || []).find((item: any) => item.docCode === 'D09')
    if (!slot) throw new Error('未找到 D09 槽位')
    await this.upsertPacketFile(slot, {
      fileName: payload?.fileName || `D09_Intl_Freight_${String(purchaseOrderId).slice(0, 8)}.pdf`,
      originMode: payload?.originMode || 'finance_upload',
      fileType: payload?.fileType || 'application/pdf',
      storageBucket: payload?.storageBucket || null,
      storagePath: payload?.storagePath || null,
      fileUrl: payload?.fileUrl || null,
      remarks: payload?.remarks || '已上传国际运费发票/付款凭证',
      uploadedByPartyType: payload?.uploadedByPartyType || 'finance',
      uploadedByPartyId: payload?.uploadedByPartyId || payload?.operator || 'finance',
      uploadedFromPortal: payload?.uploadedFromPortal || 'finance',
      verifiedByFinance: payload?.operator || 'finance',
      verifiedAt: new Date().toISOString(),
    })
    return this.updateSlotStatusByDocCode(purchaseOrderId, 'D09', {
      status: 'verified',
      sourceType: 'uploaded_external',
      notes: payload?.remarks || '国际运费发票及付款凭证已上传并确认',
      confirmedAt: new Date().toISOString(),
      confirmedBy: payload?.operator || 'finance',
    })
  },
  async syncByPurchaseOrderId(purchaseOrderId: string) {
    const packet = await this.ensureByPurchaseOrderId(purchaseOrderId)
    if (!packet) throw new Error('无法创建财务合规文件包')

    const [exportChecks, docSet, customs, voyage, arrivalNotice, delivery, execution, receivableRisk] = await Promise.all([
      exportRequirementCheckService.getByPurchaseOrderId(purchaseOrderId),
      shipmentDocumentSetService.getByPurchaseOrderId(purchaseOrderId),
      customsDeclarationService.getByPurchaseOrderId(purchaseOrderId),
      voyageTrackingService.getByPurchaseOrderId(purchaseOrderId),
      arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId),
      deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId),
      purchaseOrderExecutionStatusService.getByPurchaseOrderId(purchaseOrderId),
      getReceivableReleaseRiskSummary(purchaseOrderId),
    ])

    const latestCheck = Array.isArray(exportChecks) ? exportChecks[0] || null : null
    const slots = packet.slots || []
    const slotByCode = Object.fromEntries(slots.map((slot: any) => [slot.docCode, slot]))
    const tradeTerm = packet.tradeTerm || latestCheck?.tradeTerm || latestCheck?.trade_term || null
    const freightResponsibility = inferIntlFreightResponsibility(tradeTerm)

    const slotUpdates: Array<Record<string, any>> = []
    const pushSlot = (docCode: string, patch: Record<string, any>) => {
      const target = slotByCode[docCode]
      if (!target) return
      slotUpdates.push({
        id: target.id,
        ...patch,
      })
    }

    const collectionRule = getCollectionControlRuleSummary(execution, receivableRisk)
    const executionMeta = parseExecutionRemarksMeta(execution?.remarks)
    const lcDiscrepancy = executionMeta.lcDiscrepancy
    const d05Ready = Boolean(
      customs?.customsDeclNo || customs?.customs_decl_no ||
      docSet?.commercialInvoiceNo || docSet?.packingListNo ||
      voyage?.blNo
    )
    pushSlot('D05', {
      source_type: d05Ready ? 'linked_business_doc' : slotByCode.D05?.sourceType || null,
      source_ref: d05Ready ? JSON.stringify({
        customsDeclNo: customs?.customsDeclNo || customs?.customs_decl_no || null,
        ciNo: docSet?.commercialInvoiceNo || null,
        plNo: docSet?.packingListNo || null,
        blNo: voyage?.blNo || null,
        collectionControlMode: execution?.collection_control_mode || null,
        documentReleaseMode: execution?.document_release_mode || null,
        customerBalanceGateStatus: execution?.customer_balance_gate_status || null,
        collectionRuleLabel: collectionRule.label,
        lcType: execution?.lc_type || null,
        lcOpenedAt: execution?.lc_opened_at || null,
        releaseBlockedReason: collectionRule.blockedReason || null,
        bankSubmissionStatus: execution?.bank_submission_status || null,
        bankSubmittedAt: execution?.bank_submitted_at || null,
        bankSubmittedBy: execution?.bank_submitted_by || null,
        documentReleaseStatus: execution?.document_release_status || null,
        documentReleasedAt: execution?.document_released_at || null,
        documentReleasedBy: execution?.document_released_by || null,
        lcDiscrepancyStatus: execution?.lc_discrepancy_status || lcDiscrepancy?.status || null,
        lcDiscrepancyApprovalStatus: execution?.lc_discrepancy_approval_status || null,
        lcDiscrepancyNotes: execution?.lc_discrepancy_notes || lcDiscrepancy?.notes || null,
        lcDiscrepancyUpdatedAt: lcDiscrepancy?.updatedAt || null,
        lcDiscrepancyUpdatedBy: lcDiscrepancy?.updatedBy || null,
        lcDiscrepancyResolvedAt: lcDiscrepancy?.resolvedAt || null,
        sealStatus: execution?.seal_status || null,
        sealedSampleRef: execution?.sealed_sample_ref || null,
        lcMaturityDate: execution?.lc_maturity_date || null,
        receivableRisk: receivableRisk || null,
      }) : slotByCode.D05?.sourceRef || null,
      status: d05Ready ? 'linked' : 'pending',
      notes: [
        voyage?.blNo ? `BL ${voyage.blNo}` : null,
        collectionRule.label ? `收款 ${collectionRule.label}` : null,
        execution?.lc_type ? `L/C类型 ${execution.lc_type}` : null,
        execution?.bank_submission_status ? `交单 ${execution.bank_submission_status}` : null,
        lcDiscrepancy?.status ? `不符点 ${lcDiscrepancy.status}` : null,
        execution?.lc_discrepancy_approval_status ? `不符点审批 ${execution.lc_discrepancy_approval_status}` : null,
        execution?.seal_status ? `封样 ${execution.seal_status}` : null,
        execution?.document_release_status ? `放单 ${execution.document_release_status}` : null,
        collectionRule.blockedReason ? `阻断 ${collectionRule.blockedReason}` : null,
        receivableRisk?.hasOverdueReceivable ? '应收逾期未清' : null,
        receivableRisk?.exceedsCreditLimit ? '信用额度超限' : null,
        arrivalNotice?.arrivalNoticeNo ? `到港通知 ${arrivalNotice.arrivalNoticeNo}` : null,
      ].filter(Boolean).join(' · ') || slotByCode.D05?.notes || null,
    })

    if (freightResponsibility === 'customer') {
      pushSlot('D09', {
        status: 'not_required',
        notes: '根据贸易条款，本方不承担国际运费',
      })
      pushSlot('D10', {
        status: 'generated',
        source_type: 'auto_generated',
        generated_at: new Date().toISOString(),
        notes: `根据贸易条款 ${tradeTerm || '-'} 自动生成国际运费免责说明`,
      })
    } else if (freightResponsibility === 'our_company') {
      const d09CurrentStatus = String(slotByCode.D09?.status || '')
      const d09Done = ['uploaded', 'verified', 'generated', 'linked'].includes(d09CurrentStatus)
      pushSlot('D09', {
        status: d09Done ? d09CurrentStatus : (voyage?.blNo ? 'awaiting_upload' : 'pending'),
        notes: d09Done
          ? (slotByCode.D09?.notes || '国际运费资料已上传')
          : (voyage?.blNo ? '已开船，等待上传国际运费发票及付款凭证' : '等待开船后补齐国际运费资料'),
      })
      pushSlot('D10', {
        status: 'not_required',
        notes: `根据贸易条款 ${tradeTerm || '-'}，本方承担国际运费`,
      })
    }

    pushSlot('D11', {
      status: slotByCode.D11?.status === 'verified' ? 'verified' : 'awaiting_upload',
      notes: delivery?.status ? `货物交付状态：${delivery.status}，等待财务上传收汇水单` : '等待财务上传收汇水单',
    })
    pushSlot('D12', {
      status: slotByCode.D12?.status === 'verified' ? 'verified' : 'awaiting_upload',
      notes: '等待财务上传结汇水单',
    })
    pushSlot('D13', {
      status: ['uploaded', 'verified', 'generated', 'linked'].includes(String(slotByCode.D12?.status || ''))
        ? 'generated'
        : 'awaiting_generation',
      source_type: ['uploaded', 'verified', 'generated', 'linked'].includes(String(slotByCode.D12?.status || ''))
        ? 'auto_generated'
        : slotByCode.D13?.sourceType || null,
      generated_at: ['uploaded', 'verified', 'generated', 'linked'].includes(String(slotByCode.D12?.status || ''))
        ? (slotByCode.D13?.generatedAt || new Date().toISOString())
        : null,
      notes: ['uploaded', 'verified', 'generated', 'linked'].includes(String(slotByCode.D12?.status || ''))
        ? '结汇资料已到位，系统可生成出口退（免）税收汇凭证情况表'
        : '等待D12结汇水单后自动生成',
    })

    const d05SlotReady = d05Ready || ['linked', 'uploaded', 'generated', 'verified'].includes(String(slotByCode.D05?.status || ''))
    const d11SlotReady = ['uploaded', 'generated', 'verified', 'linked'].includes(String(slotByCode.D11?.status || ''))
    const d12SlotReady = ['uploaded', 'generated', 'verified', 'linked'].includes(String(slotByCode.D12?.status || ''))
    const nextD13Ready = d12SlotReady || ['uploaded', 'verified', 'generated', 'linked'].includes(String(slotByCode.D13?.status || ''))
    pushSlot('D01', {
      status: d05SlotReady && d11SlotReady && d12SlotReady && nextD13Ready ? 'generated' : 'awaiting_generation',
      source_type: d05SlotReady && d11SlotReady && d12SlotReady && nextD13Ready ? 'auto_generated' : slotByCode.D01?.sourceType || null,
      generated_at: d05SlotReady && d11SlotReady && d12SlotReady && nextD13Ready ? (slotByCode.D01?.generatedAt || new Date().toISOString()) : null,
      notes: d05SlotReady && d11SlotReady && d12SlotReady && nextD13Ready
        ? 'D05 + D11 + D12 + D13 已齐套，系统可生成出口退税申报表'
        : '等待 D05 + D11 + D12 + D13 齐套后自动生成',
    })

    if (slotUpdates.length > 0) {
      const { error: slotError } = await supabase
        .from('finance_packet_document_slots')
        .upsert(slotUpdates)
      if (slotError) throwServiceError('sync finance packet slots', slotError)
    }

    let refreshed = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!refreshed) throw new Error('刷新财务合规文件包失败')

    const refreshedSlotByCode = Object.fromEntries((refreshed.slots || []).map((slot: any) => [slot.docCode, slot]))
    if (refreshedSlotByCode.D05?.status === 'linked' && !refreshedSlotByCode.D05?.currentFile) {
      await this.ensureLinkedFileByDocCode(purchaseOrderId, 'D05', {
        remarks: '系统已生成 D05 关联资料索引文件',
        sourceRef: refreshedSlotByCode.D05?.sourceRef || null,
      })
      refreshed = await this.getByPurchaseOrderId(purchaseOrderId)
      if (!refreshed) throw new Error('刷新财务合规文件包失败')
    }
    if (refreshedSlotByCode.D10?.status === 'generated' && !refreshedSlotByCode.D10?.currentFile) {
      await this.ensureGeneratedFileByDocCode(purchaseOrderId, 'D10', { remarks: '系统根据贸易条款自动生成 D10' })
      refreshed = await this.getByPurchaseOrderId(purchaseOrderId)
      if (!refreshed) throw new Error('刷新财务合规文件包失败')
    }
    const refreshedSlotByCode2 = Object.fromEntries((refreshed.slots || []).map((slot: any) => [slot.docCode, slot]))
    if (refreshedSlotByCode2.D13?.status === 'generated' && !refreshedSlotByCode2.D13?.currentFile) {
      await this.ensureGeneratedFileByDocCode(purchaseOrderId, 'D13', { remarks: '系统根据 D12 自动生成 D13' })
      refreshed = await this.getByPurchaseOrderId(purchaseOrderId)
      if (!refreshed) throw new Error('刷新财务合规文件包失败')
    }
    const nextSlotByCode = Object.fromEntries((refreshed.slots || []).map((slot: any) => [slot.docCode, slot]))
    if (nextSlotByCode.D01?.status === 'generated' && !nextSlotByCode.D01?.currentFile) {
      await this.ensureGeneratedFileByDocCode(purchaseOrderId, 'D01', { remarks: '系统根据 D05 + D11 + D12 + D13 自动生成 D01' })
      refreshed = await this.getByPurchaseOrderId(purchaseOrderId)
      if (!refreshed) throw new Error('刷新财务合规文件包失败')
    }

    const nextPacketState = buildFinancePacketStatus(refreshed.slots || [])

    const { error: packetError } = await supabase
      .from('finance_compliance_packets')
      .update({
        export_check_id: latestCheck?.id || refreshed.exportCheckId || null,
        shipment_no: latestCheck?.shipmentNo || latestCheck?.shipment_no || refreshed.shipmentNo || null,
        load_plan_id: latestCheck?.loadPlanId || latestCheck?.load_plan_id || refreshed.loadPlanId || null,
        customs_decl_no: customs?.customsDeclNo || customs?.customs_decl_no || refreshed.customsDeclNo || null,
        trade_term: tradeTerm,
        destination_country: latestCheck?.destinationCountry || latestCheck?.destination_country || refreshed.destinationCountry || null,
        status: nextPacketState.status,
        doc_ready_percent: nextPacketState.docReadyPercent,
        tax_refund_ready: nextPacketState.taxRefundReady,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refreshed.id)
    if (packetError) throwServiceError('update finance compliance packet', packetError)

    return this.getByPurchaseOrderId(purchaseOrderId)
  },
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/')
    return `${y}-${m}-${d}`
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0]
  return String(v)
}
