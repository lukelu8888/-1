import { supabase } from '../supabase'

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

function getCollectionControlRuleSummary(execution: any) {
  const mode = String(execution?.collection_control_mode || '')
  const customerBalanceStatus = String(execution?.customer_balance_status || 'pending')
  const bankSubmissionStatus = String(execution?.bank_submission_status || 'not_required')
  const documentReleaseStatus = String(execution?.document_release_status || 'pending')

  switch (mode) {
    case 'prepaid_before_booking':
      return {
        label: '前T/T',
        paymentRequired: true,
        bankRequired: false,
        gateTitle: '订舱前收齐余款',
        releaseTitle: '全款后放单',
        blockedReason: ['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
          ? null
          : '前T/T模式下，订舱与放单前需财务确认客户余款到账',
      }
    case 'post_tt_before_obl_release':
      return {
        label: '后T/T',
        paymentRequired: true,
        bankRequired: false,
        gateTitle: '允许出运，放正本前收余款',
        releaseTitle: '余款到账后放正本提单',
        blockedReason: ['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
          ? null
          : '后T/T模式下，可先出运，但放正本提单前必须财务确认余款到账',
      }
    case 'lc_bank_negotiation':
      return {
        label: 'L/C',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后银行交单议付',
        releaseTitle: '银行议付/收汇后放单',
        blockedReason: ['negotiated', 'collected'].includes(bankSubmissionStatus) || documentReleaseStatus === 'released'
          ? null
          : 'L/C模式下，需完成银行交单/议付或收汇后才能放单',
      }
    case 'dp_or_other_collection':
      return {
        label: 'D/P或其它',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后按托收结果控制',
        releaseTitle: '托收/承兑后放单',
        blockedReason: ['collected'].includes(bankSubmissionStatus) || documentReleaseStatus === 'released'
          ? null
          : 'D/P或其它托收模式下，需按托收/承兑结果满足后才能放单',
      }
    default:
      return {
        label: mode || '未设置',
        paymentRequired: false,
        bankRequired: false,
        gateTitle: '待确认',
        releaseTitle: '待确认',
        blockedReason: documentReleaseStatus === 'blocked' ? '当前放单仍被阻塞，需确认收款与交单条件' : null,
      }
  }
}

function parseJsonObject(value: any) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function buildShipmentWorkflowSummary(payload: {
  execution?: any
  voyage?: any
  arrivalNotice?: any
  importClearance?: any
  deliveryConfirmation?: any
  latestFeedback?: any
  financePacket?: any
}) {
  const execution = payload.execution || null
  const voyage = payload.voyage || null
  const arrivalNotice = payload.arrivalNotice || null
  const importClearance = payload.importClearance || null
  const deliveryConfirmation = payload.deliveryConfirmation || null
  const latestFeedback = payload.latestFeedback || null
  const financePacket = payload.financePacket || null

  const timeline: Array<{ key: string; title: string; time: string; note: string }> = []
  const pendingReplies: Array<{ key: string; title: string; status: string }> = []
  const replySummary: Record<string, any> = {
    customerThirdPartyInspection: null,
    loadingThirdPartySupervision: null,
    customerPaymentControl: null,
    bankSubmission: null,
    documentRelease: null,
    arrivalNotice: null,
    clearanceDocs: null,
    deliveryReceipt: null,
    feedback: null,
    financeCompliance: null,
  }

  if (execution?.inspection_execution_mode === 'customer_third_party') {
    replySummary.customerThirdPartyInspection = {
      requested: Boolean(execution?.goods_ready_notified_to_customer_at || execution?.inspection_method_notified_at),
      status: execution?.customer_designated_inspection_status || 'pending',
      agencyName: execution?.customer_designated_inspection_agency || null,
    }
    timeline.push({
      key: 'customer_inspection',
      title: '客户第三方验货',
      time: toDisplayTime(execution?.inspection_method_notified_at || execution?.goods_ready_notified_to_customer_at),
      note: [execution?.customer_designated_inspection_agency || '客户指定机构', execution?.customer_designated_inspection_status || 'pending'].filter(Boolean).join(' · '),
    })
    if (!['scheduled', 'reported', 'completed'].includes(String(execution?.customer_designated_inspection_status || '').toLowerCase())) {
      pendingReplies.push({
        key: 'customer_third_party_inspection_requested',
        title: '待客户回执第三方验货安排',
        status: execution?.customer_designated_inspection_status || 'pending',
      })
    }
  } else if (execution?.inspection_execution_mode === 'our_qc') {
    timeline.push({
      key: 'our_qc_shared',
      title: '我方验货/报告共享',
      time: toDisplayTime(execution?.qc_report_shared_to_customer_at || execution?.inspection_method_notified_at),
      note: execution?.qc_report_shared_to_customer_at ? '我方QC报告已共享给客户' : '我方QC已执行',
    })
  }

  if (execution?.loading_supervision_mode === 'third_party_witness') {
    replySummary.loadingThirdPartySupervision = {
      required: Boolean(execution?.loading_supervision_required),
      status: execution?.loading_supervision_feedback_status || 'pending',
      agencyName: execution?.loading_supervision_agency_name || null,
    }
    timeline.push({
      key: 'loading_supervision',
      title: '第三方监装',
      time: toDisplayTime(voyage?.etd || execution?.updated_at),
      note: [execution?.loading_supervision_agency_name || '第三方监装机构', execution?.loading_supervision_feedback_status || 'pending'].filter(Boolean).join(' · '),
    })
    if (!['confirmed', 'reported'].includes(String(execution?.loading_supervision_feedback_status || '').toLowerCase())) {
      pendingReplies.push({
        key: 'loading_third_party_supervision_requested',
        title: '待客户回执第三方监装安排',
        status: execution?.loading_supervision_feedback_status || 'pending',
      })
    }
  }

  if (execution?.collection_control_mode || execution?.customer_balance_status || execution?.customer_balance_gate_status) {
    const collectionRule = getCollectionControlRuleSummary(execution)
    const paymentStatus = execution?.customer_balance_status || 'pending'
    replySummary.customerPaymentControl = {
      label: collectionRule.label,
      mode: execution?.collection_control_mode || null,
      gateStatus: execution?.customer_balance_gate_status || null,
      status: paymentStatus,
      confirmedAt: execution?.customer_balance_confirmed_at || null,
      blockedReason: collectionRule.blockedReason,
    }
    timeline.push({
      key: 'customer_payment_control',
      title: '客户付款控制',
      time: toDisplayTime(execution?.customer_balance_confirmed_at || execution?.updated_at),
      note: [collectionRule.label, paymentStatus, execution?.customer_balance_gate_status || null].filter(Boolean).join(' · '),
    })

    const normalizedMode = String(execution?.collection_control_mode || '').toLowerCase()
    const normalizedStatus = String(paymentStatus || '').toLowerCase()
    if (
      ['prepaid_before_booking', 'post_tt_before_obl_release'].includes(normalizedMode) &&
      !['finance_confirmed', 'paid', 'balance_paid'].includes(normalizedStatus)
    ) {
      pendingReplies.push({
        key: 'customer_balance_payment',
        title: normalizedMode === 'prepaid_before_booking' ? '待客户完成尾款确认（订舱前）' : '待客户完成尾款确认（放单前）',
        status: paymentStatus,
      })
    }
  }

  if (execution?.bank_submission_status) {
    const collectionRule = getCollectionControlRuleSummary(execution)
    replySummary.bankSubmission = {
      label: collectionRule.label,
      status: execution?.bank_submission_status,
      mode: execution?.document_release_mode || null,
      submittedAt: execution?.bank_submitted_at || null,
      submittedBy: execution?.bank_submitted_by || null,
      blockedReason: collectionRule.bankRequired && !['negotiated', 'collected'].includes(String(execution?.bank_submission_status || '').toLowerCase())
        ? collectionRule.blockedReason
        : null,
    }
    timeline.push({
      key: 'bank_submission',
      title: '银行交单',
      time: toDisplayTime(execution?.bank_submitted_at || voyage?.etd || execution?.updated_at),
      note: [collectionRule.label, execution?.bank_submission_status || null, execution?.bank_submitted_by || null, execution?.document_release_mode || null].filter(Boolean).join(' · '),
    })

  }

  if (execution?.document_release_status || execution?.document_release_mode) {
    const collectionRule = getCollectionControlRuleSummary(execution)
    const releaseStatus = execution?.document_release_status || 'pending'
    replySummary.documentRelease = {
      label: collectionRule.label,
      status: releaseStatus,
      mode: execution?.document_release_mode || null,
      releasedAt: execution?.document_released_at || null,
      releasedBy: execution?.document_released_by || null,
      blockedReason: releaseStatus === 'blocked' ? collectionRule.blockedReason : null,
      releaseTitle: collectionRule.releaseTitle,
    }
    timeline.push({
      key: 'document_release',
      title: '单证 / 正本放行',
      time: toDisplayTime(execution?.document_released_at || execution?.customer_balance_confirmed_at || voyage?.eta || execution?.updated_at),
      note: [collectionRule.label, releaseStatus, execution?.document_released_by || null, execution?.document_release_mode || null].filter(Boolean).join(' · '),
    })

  }

  if (voyage?.blNo || voyage?.etd) {
    timeline.push({
      key: 'departed',
      title: '已开船 / BL已生成',
      time: toDisplayTime(voyage?.etd),
      note: [voyage?.blNo ? `BL: ${voyage.blNo}` : null, voyage?.vesselName ? `${voyage.vesselName} ${voyage?.voyageNo || ''}`.trim() : null].filter(Boolean).join(' · '),
    })
  }

  if (voyage?.currentStatus || voyage?.currentLocation) {
    timeline.push({
      key: 'in_transit',
      title: '在途跟踪',
      time: toDisplayTime(voyage?.eta),
      note: [voyage?.currentStatus || null, voyage?.currentLocation || null].filter(Boolean).join(' · '),
    })
  }

  if (arrivalNotice?.status) {
    replySummary.arrivalNotice = {
      sent: ['sent', 'acknowledged'].includes(String(arrivalNotice.status || '').toLowerCase()),
      status: arrivalNotice.status,
      arrivalNoticeNo: arrivalNotice.arrivalNoticeNo || null,
    }
    timeline.push({
      key: 'arrival_notice',
      title: '到港通知',
      time: toDisplayTime(arrivalNotice?.sentToCustomerAt || arrivalNotice?.arrivalAt),
      note: [arrivalNotice?.status || null, arrivalNotice?.arrivalNoticeNo || null].filter(Boolean).join(' · '),
    })
    if (String(arrivalNotice?.status || '').toLowerCase() !== 'acknowledged') {
      pendingReplies.push({
        key: 'shipment_arrival_notice',
        title: '待客户确认收到到港通知',
        status: arrivalNotice?.status || 'sent',
      })
    }
  }

  if (importClearance?.clearanceStatus) {
    replySummary.clearanceDocs = {
      status: importClearance.clearanceStatus,
      received: Boolean(importClearance.deliveryOrderReceived),
    }
    timeline.push({
      key: 'clearance',
      title: '清关协同',
      time: toDisplayTime(importClearance?.customsReleaseAt),
      note: [importClearance?.clearanceStatus || null, importClearance?.importBrokerName || null].filter(Boolean).join(' · '),
    })
    if (importClearance?.clearanceStatus && !importClearance?.deliveryOrderReceived) {
      pendingReplies.push({
        key: 'clearance_docs',
        title: '待客户确认收到清关资料 / DO',
        status: importClearance?.clearanceStatus,
      })
    }
  }

  if (deliveryConfirmation?.status) {
    replySummary.deliveryReceipt = {
      status: deliveryConfirmation.status,
      receivedBy: deliveryConfirmation.receivedBy || null,
    }
    timeline.push({
      key: 'delivery',
      title: '收货确认',
      time: toDisplayTime(deliveryConfirmation?.deliveredAt),
      note: [deliveryConfirmation?.status || null, deliveryConfirmation?.receivedBy ? `Received by ${deliveryConfirmation.receivedBy}` : null].filter(Boolean).join(' · '),
    })
    if (String(deliveryConfirmation?.status || '').toLowerCase() === 'pending') {
      pendingReplies.push({
        key: 'delivery_receipt',
        title: '待客户确认已收货',
        status: deliveryConfirmation?.status,
      })
    }
  }

  if (execution?.case_close_status) {
    timeline.push({
      key: 'case_close',
      title: '结案',
      time: toDisplayTime(execution?.case_closed_at),
      note: [execution?.case_close_status || null, execution?.case_closed_by || null].filter(Boolean).join(' · '),
    })
  }

  if (execution?.archive_status) {
    timeline.push({
      key: 'archive',
      title: '业务归档',
      time: toDisplayTime(execution?.archived_at),
      note: [execution?.archive_status || null, execution?.archived_by || null].filter(Boolean).join(' · '),
    })
  }

  if (latestFeedback) {
    replySummary.feedback = {
      submitted: true,
      status: latestFeedback.feedbackStatus || 'submitted',
      overallRating: latestFeedback.overallRating || null,
    }
    timeline.push({
      key: 'feedback',
      title: '客户反馈已提交',
      time: toDisplayTime(latestFeedback?.submittedAt),
      note: latestFeedback?.feedbackText || `Overall ${latestFeedback?.overallRating || '-'}/5`,
    })
  } else {
    replySummary.feedback = {
      submitted: false,
      status: 'pending',
      overallRating: null,
    }
    if (deliveryConfirmation?.status && String(deliveryConfirmation.status).toLowerCase() !== 'pending') {
    }
  }

  if (financePacket) {
    const slots = financePacket.slots || []
    const actionable = slots.filter((slot: any) => slot.status !== 'not_required')
    const pendingSlots = actionable.filter((slot: any) => !['linked', 'uploaded', 'generated', 'verified'].includes(String(slot.status || '')))
    const d05Slot = slots.find((slot: any) => slot.docCode === 'D05')
    const d05Source = parseJsonObject(d05Slot?.sourceRef)
    const d05Milestone = [
      d05Source?.bankSubmissionStatus ? `交单 ${d05Source.bankSubmissionStatus}` : null,
      d05Source?.documentReleaseStatus ? `放单 ${d05Source.documentReleaseStatus}` : null,
    ].filter(Boolean).join(' · ')

    replySummary.financeCompliance = {
      packetNo: financePacket.packetNo || null,
      status: financePacket.status || 'draft',
      docReadyPercent: Number(financePacket.docReadyPercent || 0),
      pendingCount: pendingSlots.length,
      d05Milestone: d05Milestone || null,
    }

    timeline.push({
      key: 'finance_packet',
      title: '财务合规文件包',
      time: toDisplayTime(financePacket.updatedAt || financePacket.createdAt),
      note: [financePacket.status || 'draft', `${Number(financePacket.docReadyPercent || 0)}%`, d05Milestone || null].filter(Boolean).join(' · '),
    })

  }

  return { timeline, pendingReplies, replySummary }
}

export const purchaseOrderExecutionStatusService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('purchase_order_execution')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .maybeSingle()
    if (error) throwServiceError('get purchase_order_execution status', error)
    return data || null
  },
  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const row: Record<string, any> = {
      purchase_order_id: purchaseOrderId,
      updated_at: new Date().toISOString(),
    }
    if (payload.executionStatus || payload.execution_status) {
      row.execution_status = payload.executionStatus || payload.execution_status
    }
    if (payload.shipmentReadinessStatus || payload.shipment_readiness_status) {
      row.shipment_readiness_status = payload.shipmentReadinessStatus || payload.shipment_readiness_status
    }
    if (payload.remarks || payload.executionRemarks || payload.execution_remarks) {
      row.remarks = payload.remarks || payload.executionRemarks || payload.execution_remarks
    }
    if (payload.collectionControlMode || payload.collection_control_mode) {
      row.collection_control_mode = payload.collectionControlMode || payload.collection_control_mode
    }
    if (payload.documentReleaseMode || payload.document_release_mode) {
      row.document_release_mode = payload.documentReleaseMode || payload.document_release_mode
    }
    if (payload.customerBalanceGateStatus || payload.customer_balance_gate_status) {
      row.customer_balance_gate_status = payload.customerBalanceGateStatus || payload.customer_balance_gate_status
    }
    if (payload.customerBalanceStatus || payload.customer_balance_status) {
      row.customer_balance_status = payload.customerBalanceStatus || payload.customer_balance_status
    }
    if (payload.supplierBalanceStatus || payload.supplier_balance_status) {
      row.supplier_balance_status = payload.supplierBalanceStatus || payload.supplier_balance_status
    }
    if (payload.customerBalanceConfirmedAt || payload.customer_balance_confirmed_at) {
      row.customer_balance_confirmed_at = payload.customerBalanceConfirmedAt || payload.customer_balance_confirmed_at
    }
    if (payload.supplierBalanceConfirmedAt || payload.supplier_balance_confirmed_at) {
      row.supplier_balance_confirmed_at = payload.supplierBalanceConfirmedAt || payload.supplier_balance_confirmed_at
    }
    if (payload.supplierBalanceConfirmedBy || payload.supplier_balance_confirmed_by) {
      row.supplier_balance_confirmed_by = payload.supplierBalanceConfirmedBy || payload.supplier_balance_confirmed_by
    }
    if (payload.bankSubmissionStatus || payload.bank_submission_status) {
      row.bank_submission_status = payload.bankSubmissionStatus || payload.bank_submission_status
    }
    if (payload.bankSubmittedAt || payload.bank_submitted_at) {
      row.bank_submitted_at = payload.bankSubmittedAt || payload.bank_submitted_at
    }
    if (payload.bankSubmittedBy || payload.bank_submitted_by) {
      row.bank_submitted_by = payload.bankSubmittedBy || payload.bank_submitted_by
    }
    if (payload.documentReleaseStatus || payload.document_release_status) {
      row.document_release_status = payload.documentReleaseStatus || payload.document_release_status
    }
    if (payload.documentReleasedAt || payload.document_released_at) {
      row.document_released_at = payload.documentReleasedAt || payload.document_released_at
    }
    if (payload.documentReleasedBy || payload.document_released_by) {
      row.document_released_by = payload.documentReleasedBy || payload.document_released_by
    }
    if (payload.inspectionExecutionMode || payload.inspection_execution_mode) {
      row.inspection_execution_mode = payload.inspectionExecutionMode || payload.inspection_execution_mode
    }
    if (payload.customerDesignatedInspectionAgency || payload.customer_designated_inspection_agency) {
      row.customer_designated_inspection_agency = payload.customerDesignatedInspectionAgency || payload.customer_designated_inspection_agency
    }
    if (payload.customerDesignatedInspectionStatus || payload.customer_designated_inspection_status) {
      row.customer_designated_inspection_status = payload.customerDesignatedInspectionStatus || payload.customer_designated_inspection_status
    }
    if (payload.loadingSupervisionMode || payload.loading_supervision_mode) {
      row.loading_supervision_mode = payload.loadingSupervisionMode || payload.loading_supervision_mode
    }
    if (payload.loadingSupervisionAgencyName || payload.loading_supervision_agency_name) {
      row.loading_supervision_agency_name = payload.loadingSupervisionAgencyName || payload.loading_supervision_agency_name
    }
    if (typeof payload.loadingSupervisionRequired === 'boolean' || typeof payload.loading_supervision_required === 'boolean') {
      row.loading_supervision_required = typeof payload.loadingSupervisionRequired === 'boolean'
        ? payload.loadingSupervisionRequired
        : payload.loading_supervision_required
    }
    if (payload.loadingSupervisionFeedbackStatus || payload.loading_supervision_feedback_status) {
      row.loading_supervision_feedback_status = payload.loadingSupervisionFeedbackStatus || payload.loading_supervision_feedback_status
    }
    if (payload.caseCloseStatus || payload.case_close_status) {
      row.case_close_status = payload.caseCloseStatus || payload.case_close_status
    }
    if (payload.caseClosedAt || payload.case_closed_at) {
      row.case_closed_at = payload.caseClosedAt || payload.case_closed_at
    }
    if (payload.caseClosedBy || payload.case_closed_by) {
      row.case_closed_by = payload.caseClosedBy || payload.case_closed_by
    }
    if (payload.archiveStatus || payload.archive_status) {
      row.archive_status = payload.archiveStatus || payload.archive_status
    }
    if (payload.archivedAt || payload.archived_at) {
      row.archived_at = payload.archivedAt || payload.archived_at
    }
    if (payload.archivedBy || payload.archived_by) {
      row.archived_by = payload.archivedBy || payload.archived_by
    }
    const { error } = await supabase
      .from('purchase_order_execution')
      .upsert(row, { onConflict: 'purchase_order_id' })
    if (error) throwServiceError('upsert purchase_order_execution status', error)
    return true
  },
  async confirmCustomerInspectionArrangedByPurchaseOrderId(purchaseOrderId: string, payload?: { remarks?: string }) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing) throw new Error('当前采购单尚未建立执行层记录')
    const { error } = await supabase
      .from('purchase_order_execution')
      .update({
        customer_designated_inspection_status: 'scheduled',
        remarks: payload?.remarks || existing.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('purchase_order_id', purchaseOrderId)
    if (error) throwServiceError('confirm customer inspection arranged', error)
    return true
  },
  async confirmLoadingSupervisionArrangedByPurchaseOrderId(purchaseOrderId: string, payload?: { remarks?: string }) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing) throw new Error('当前采购单尚未建立执行层记录')
    const { error } = await supabase
      .from('purchase_order_execution')
      .update({
        loading_supervision_feedback_status: 'confirmed',
        remarks: payload?.remarks || existing.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('purchase_order_id', purchaseOrderId)
    if (error) throwServiceError('confirm loading supervision arranged', error)
    return true
  },
  async closeCaseByPurchaseOrderId(purchaseOrderId: string, payload?: { closedBy?: string; remarks?: string }) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing) throw new Error('当前采购单尚未建立执行层记录')
    const { error } = await supabase
      .from('purchase_order_execution')
      .update({
        case_close_status: 'closed',
        case_closed_at: new Date().toISOString(),
        case_closed_by: payload?.closedBy || 'admin',
        remarks: payload?.remarks || existing.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('purchase_order_id', purchaseOrderId)
    if (error) throwServiceError('close case by purchase order id', error)
    return true
  },
  async markArchivedByPurchaseOrderId(purchaseOrderId: string, payload?: { archivedBy?: string; remarks?: string }) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    if (!existing) throw new Error('当前采购单尚未建立执行层记录')
    const { error } = await supabase
      .from('purchase_order_execution')
      .update({
        archive_status: 'archived',
        archived_at: new Date().toISOString(),
        archived_by: payload?.archivedBy || 'admin',
        remarks: payload?.remarks || existing.remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('purchase_order_id', purchaseOrderId)
    if (error) throwServiceError('mark archived by purchase order id', error)
    return true
  },
}

function fromVoyageTrackingRow(r: any) {
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

function fromArrivalNoticeRow(r: any) {
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throwServiceError('acknowledge arrival_notice', error)
    return fromArrivalNoticeRow(data)
  },
}

function fromImportClearanceRow(r: any) {
  if (!r) return null
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

function fromDeliveryConfirmationRow(r: any) {
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

function fromDeliveryExceptionRow(r: any) {
  if (!r) return null
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

function fromPostOrderFeedbackRow(r: any) {
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

export const customerShipmentTrackingService = {
  async getByCustomerEmail(customerEmail: string) {
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    if (!normalizedEmail) return []

    const { data: poRows, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, customer_email, supplier_name')
      .eq('customer_email', normalizedEmail)
      .is('deleted_at', null)

    if (poError) throwServiceError('get purchase_orders for customer shipment tracking', poError)

    const purchaseOrders = poRows || []
    if (purchaseOrders.length === 0) return []

    const purchaseOrderIds = purchaseOrders.map((row: any) => row.id).filter(Boolean)
    const voyageMap = new Map<string, any>()
    const arrivalMap = new Map<string, any>()
    const clearanceMap = new Map<string, any>()
    const deliveryMap = new Map<string, any>()
    const feedbackMap = new Map<string, any>()
    const exceptionMap = new Map<string, any[]>()
    const executionMap = new Map<string, any>()

    const { data: voyageRows, error: voyageError } = await supabase
      .from('voyage_tracking')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
      .order('created_at', { ascending: false })

    if (voyageError) throwServiceError('get voyage_tracking for customer shipment tracking', voyageError)

    const { data: executionRows, error: executionError } = await supabase
      .from('purchase_order_execution')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
    if (executionError) throwServiceError('get purchase_order_execution for customer shipment tracking', executionError)
    ;(executionRows || []).forEach((row: any) => {
      if (row.purchase_order_id) {
        executionMap.set(row.purchase_order_id, row)
      }
    })

    ;(voyageRows || []).forEach((row: any) => {
      const poId = row.purchase_order_id
      if (poId && !voyageMap.has(poId)) {
        voyageMap.set(poId, fromVoyageTrackingRow(row))
      }
    })

    const voyageIds = Array.from(new Set((voyageRows || []).map((row: any) => row.id).filter(Boolean)))
    if (voyageIds.length > 0) {
      const { data: arrivalRows, error: arrivalError } = await supabase
        .from('arrival_notices')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (arrivalError) throwServiceError('get arrival_notices for customer shipment tracking', arrivalError)
      ;(arrivalRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (voyageId && !arrivalMap.has(voyageId)) {
          arrivalMap.set(voyageId, fromArrivalNoticeRow(row))
        }
      })

      const { data: clearanceRows, error: clearanceError } = await supabase
        .from('import_clearance_coordination')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (clearanceError) throwServiceError('get import_clearance_coordination for customer shipment tracking', clearanceError)
      ;(clearanceRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (voyageId && !clearanceMap.has(voyageId)) {
          clearanceMap.set(voyageId, fromImportClearanceRow(row))
        }
      })

      const clearanceIds = Array.from(new Set((clearanceRows || []).map((row: any) => row.id).filter(Boolean)))
      if (clearanceIds.length > 0) {
        const { data: deliveryRows, error: deliveryError } = await supabase
          .from('delivery_confirmations')
          .select('*')
          .in('clearance_id', clearanceIds)
          .order('created_at', { ascending: false })
        if (deliveryError) throwServiceError('get delivery_confirmations for customer shipment tracking', deliveryError)
        ;(deliveryRows || []).forEach((row: any) => {
          const clearanceId = row.clearance_id
          if (clearanceId && !deliveryMap.has(clearanceId)) {
            deliveryMap.set(clearanceId, fromDeliveryConfirmationRow(row))
          }
        })
      }

      const { data: exceptionRows, error: exceptionError } = await supabase
        .from('delivery_exceptions')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (exceptionError) throwServiceError('get delivery_exceptions for customer shipment tracking', exceptionError)
      ;(exceptionRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (!voyageId) return
        const existing = exceptionMap.get(voyageId) || []
        existing.push(fromDeliveryExceptionRow(row))
        exceptionMap.set(voyageId, existing)
      })

      const { data: feedbackRows, error: feedbackError } = await supabase
        .from('post_order_feedback')
        .select('*')
        .in('purchase_order_id', purchaseOrderIds)
        .order('created_at', { ascending: false })
      if (feedbackError) throwServiceError('get post_order_feedback for customer shipment tracking', feedbackError)
      ;(feedbackRows || []).forEach((row: any) => {
        const poId = row.purchase_order_id
        if (poId && !feedbackMap.has(poId)) {
          feedbackMap.set(poId, fromPostOrderFeedbackRow(row))
        }
      })
    }

    return purchaseOrders.map((po: any) => {
      const voyage = voyageMap.get(po.id) || null
      const arrival = voyage?.id ? (arrivalMap.get(voyage.id) || null) : null
      const clearance = voyage?.id ? (clearanceMap.get(voyage.id) || null) : null
      const delivery = clearance?.id ? (deliveryMap.get(clearance.id) || null) : null
      return {
        purchaseOrderId: po.id,
        orderNumber: po.po_number || null,
        customerEmail: po.customer_email || null,
        supplierName: po.supplier_name || null,
        execution: executionMap.get(po.id) || null,
        voyage,
        arrivalNotice: arrival,
        importClearance: clearance,
        deliveryConfirmation: delivery,
        deliveryExceptions: voyage?.id ? (exceptionMap.get(voyage.id) || []) : [],
        latestFeedback: feedbackMap.get(po.id) || null,
        workflowSummary: buildShipmentWorkflowSummary({
          execution: executionMap.get(po.id) || null,
          voyage,
          arrivalNotice: arrival,
          importClearance: clearance,
          deliveryConfirmation: delivery,
          latestFeedback: feedbackMap.get(po.id) || null,
        }),
      }
    })
  },
}

export const shipmentWorkflowSummaryService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const [execution, voyage, arrivalNotice, importClearance, deliveryConfirmation, feedbackRows, financePacket] = await Promise.all([
      purchaseOrderExecutionStatusService.getByPurchaseOrderId(purchaseOrderId),
      voyageTrackingService.getByPurchaseOrderId(purchaseOrderId),
      arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId),
      importClearanceCoordinationService.getByPurchaseOrderId(purchaseOrderId),
      deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId),
      postOrderFeedbackService.getByPurchaseOrderId(purchaseOrderId),
      financeCompliancePacketService.getByPurchaseOrderId(purchaseOrderId),
    ])

    const latestFeedback = Array.isArray(feedbackRows) ? feedbackRows[0] || null : null
    return buildShipmentWorkflowSummary({
      execution,
      voyage,
      arrivalNotice,
      importClearance,
      deliveryConfirmation,
      latestFeedback,
      financePacket,
    })
  },
}

function fromFinanceCompliancePacketRow(r: any) {
  if (!r) return null
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
    archivedAt: r.archived_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function fromFinancePacketSlotRow(r: any) {
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

function fromFinancePacketFileRow(r: any) {
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

async function attachCurrentFilesToPackets(packets: any[]) {
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

function buildFinancePacketStatus(slots: any[]) {
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

    const [exportChecks, docSet, customs, voyage, arrivalNotice, delivery, execution] = await Promise.all([
      exportRequirementCheckService.getByPurchaseOrderId(purchaseOrderId),
      shipmentDocumentSetService.getByPurchaseOrderId(purchaseOrderId),
      customsDeclarationService.getByPurchaseOrderId(purchaseOrderId),
      voyageTrackingService.getByPurchaseOrderId(purchaseOrderId),
      arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId),
      deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId),
      purchaseOrderExecutionStatusService.getByPurchaseOrderId(purchaseOrderId),
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
        bankSubmissionStatus: execution?.bank_submission_status || null,
        bankSubmittedAt: execution?.bank_submitted_at || null,
        documentReleaseStatus: execution?.document_release_status || null,
        documentReleasedAt: execution?.document_released_at || null,
      }) : slotByCode.D05?.sourceRef || null,
      status: d05Ready ? 'linked' : 'pending',
      notes: [
        voyage?.blNo ? `BL ${voyage.blNo}` : null,
        execution?.bank_submission_status ? `交单 ${execution.bank_submission_status}` : null,
        execution?.document_release_status ? `放单 ${execution.document_release_status}` : null,
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

function fromDomesticTransferOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    transferNo: r.transfer_no,
    purchaseOrderId: r.purchase_order_id,
    shipmentNo: r.shipment_no,
    sourcePartyType: r.source_party_type,
    sourcePartyId: r.source_party_id,
    sourceLocationId: r.source_location_id,
    destinationPartyType: r.destination_party_type,
    destinationPartyId: r.destination_party_id,
    destinationLocationId: r.destination_location_id,
    carrierType: r.carrier_type,
    carrierId: r.carrier_id,
    carrierName: r.carrier_name,
    carrierContactName: r.carrier_contact_name,
    carrierContactPhone: r.carrier_contact_phone,
    carrierContactEmail: r.carrier_contact_email,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    vehicleNo: r.vehicle_no,
    transportMode: r.transport_mode,
    pickupDate: r.pickup_date,
    plannedArrivalDate: r.planned_arrival_date,
    actualDepartureAt: r.actual_departure_at,
    actualArrivalAt: r.actual_arrival_at,
    trackingNo: r.tracking_no,
    freightCurrency: r.freight_currency,
    freightAmount: r.freight_amount,
    freightChargeParty: r.freight_charge_party,
    freightAdvanceParty: r.freight_advance_party,
    freightSettlementParty: r.freight_settlement_party,
    receiverContactName: r.receiver_contact_name,
    receiverContactPhone: r.receiver_contact_phone,
    warehouseName: r.warehouse_name,
    warehouseType: r.warehouse_type,
    warehouseAddress: r.warehouse_address,
    warehouseSettlementParty: r.warehouse_settlement_party,
    warehouseSettlementCurrency: r.warehouse_settlement_currency,
    warehouseSettlementAmount: r.warehouse_settlement_amount || 0,
    warehouseSettlementStatus: r.warehouse_settlement_status,
    freightPaymentStatus: r.freight_payment_status,
    status: r.status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDomesticTransferOrderRow(order: any) {
  const id = toUUIDOrNull(order.id)
  const purchaseOrderId = toUUIDOrNull(order.purchaseOrderId || order.purchase_order_id)
  return {
    ...(id ? { id } : {}),
    transfer_no: order.transferNo || order.transfer_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    shipment_no: order.shipmentNo || order.shipment_no || null,
    source_party_type: order.sourcePartyType || order.source_party_type || 'supplier',
    source_party_id: order.sourcePartyId || order.source_party_id || null,
    source_location_id: order.sourceLocationId || order.source_location_id || null,
    destination_party_type: order.destinationPartyType || order.destination_party_type || 'warehouse',
    destination_party_id: order.destinationPartyId || order.destination_party_id || null,
    destination_location_id: order.destinationLocationId || order.destination_location_id || null,
    carrier_type: order.carrierType || order.carrier_type || null,
    carrier_id: order.carrierId || order.carrier_id || null,
    carrier_name: order.carrierName || order.carrier_name || null,
    carrier_contact_name: order.carrierContactName || order.carrier_contact_name || null,
    carrier_contact_phone: order.carrierContactPhone || order.carrier_contact_phone || null,
    carrier_contact_email: order.carrierContactEmail || order.carrier_contact_email || null,
    driver_name: order.driverName || order.driver_name || null,
    driver_phone: order.driverPhone || order.driver_phone || null,
    vehicle_no: order.vehicleNo || order.vehicle_no || null,
    transport_mode: order.transportMode || order.transport_mode || null,
    pickup_date: toIsoDate(order.pickupDate || order.pickup_date),
    planned_arrival_date: toIsoDate(order.plannedArrivalDate || order.planned_arrival_date),
    actual_departure_at: order.actualDepartureAt || order.actual_departure_at || null,
    actual_arrival_at: order.actualArrivalAt || order.actual_arrival_at || null,
    tracking_no: order.trackingNo || order.tracking_no || null,
    freight_currency: order.freightCurrency || order.freight_currency || 'CNY',
    freight_amount: Number(order.freightAmount || order.freight_amount || 0),
    freight_charge_party: order.freightChargeParty || order.freight_charge_party || null,
    freight_advance_party: order.freightAdvanceParty || order.freight_advance_party || null,
    freight_settlement_party: order.freightSettlementParty || order.freight_settlement_party || null,
    receiver_contact_name: order.receiverContactName || order.receiver_contact_name || null,
    receiver_contact_phone: order.receiverContactPhone || order.receiver_contact_phone || null,
    warehouse_name: order.warehouseName || order.warehouse_name || null,
    warehouse_type: order.warehouseType || order.warehouse_type || null,
    warehouse_address: order.warehouseAddress || order.warehouse_address || null,
    warehouse_settlement_party: order.warehouseSettlementParty || order.warehouse_settlement_party || null,
    warehouse_settlement_currency: order.warehouseSettlementCurrency || order.warehouse_settlement_currency || 'CNY',
    warehouse_settlement_amount: Number(order.warehouseSettlementAmount || order.warehouse_settlement_amount || 0),
    warehouse_settlement_status: order.warehouseSettlementStatus || order.warehouse_settlement_status || 'pending',
    freight_payment_status: order.freightPaymentStatus || order.freight_payment_status || 'pending',
    status: order.status || 'draft',
    remarks: order.remarks || null,
  }
}

export const domesticTransferOrderService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId domestic_transfer_orders', error)
    return (data || []).map(fromDomesticTransferOrderRow)
  },
  async getByConsolidationPlanId(consolidationPlanId: string) {
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .select('*')
      .eq('consolidation_plan_id', consolidationPlanId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByConsolidationPlanId domestic_transfer_orders', error)
    return (data || []).map(fromDomesticTransferOrderRow)
  },
  async create(order: any) {
    const row = toDomesticTransferOrderRow(order)
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create domestic_transfer_order', error)
    return fromDomesticTransferOrderRow(data)
  },
}

function fromCargoReceiptRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    receiptNo: r.receipt_no,
    transferOrderId: r.transfer_order_id,
    consolidationPlanId: r.consolidation_plan_id,
    receiptStatus: r.receipt_status,
    receiverPartyType: r.receiver_party_type,
    receiverPartyId: r.receiver_party_id,
    receiverLocationId: r.receiver_location_id,
    receivedAt: r.received_at,
    receivedBy: r.received_by,
    contactPhone: r.contact_phone,
    expectedPackages: r.expected_packages || 0,
    receivedPackages: r.received_packages || 0,
    expectedQuantity: r.expected_quantity || 0,
    receivedQuantity: r.received_quantity || 0,
    damageFlag: r.damage_flag ?? false,
    shortageFlag: r.shortage_flag ?? false,
    overageFlag: r.overage_flag ?? false,
    varianceFlag: r.variance_flag ?? false,
    photoFiles: r.photo_files || [],
    signedFiles: r.signed_files || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toCargoReceiptRow(receipt: any) {
  const id = toUUIDOrNull(receipt.id)
  const transferOrderId = toUUIDOrNull(receipt.transferOrderId || receipt.transfer_order_id)
  const consolidationPlanId = toUUIDOrNull(receipt.consolidationPlanId || receipt.consolidation_plan_id)
  return {
    ...(id ? { id } : {}),
    receipt_no: receipt.receiptNo || receipt.receipt_no,
    ...(transferOrderId ? { transfer_order_id: transferOrderId } : {}),
    ...(consolidationPlanId ? { consolidation_plan_id: consolidationPlanId } : {}),
    receipt_status: receipt.receiptStatus || receipt.receipt_status || 'draft',
    receiver_party_type: receipt.receiverPartyType || receipt.receiver_party_type || null,
    receiver_party_id: receipt.receiverPartyId || receipt.receiver_party_id || null,
    receiver_location_id: receipt.receiverLocationId || receipt.receiver_location_id || null,
    received_at: receipt.receivedAt || receipt.received_at || null,
    received_by: receipt.receivedBy || receipt.received_by || null,
    contact_phone: receipt.contactPhone || receipt.contact_phone || null,
    expected_packages: Number(receipt.expectedPackages || receipt.expected_packages || 0),
    received_packages: Number(receipt.receivedPackages || receipt.received_packages || 0),
    expected_quantity: Number(receipt.expectedQuantity || receipt.expected_quantity || 0),
    received_quantity: Number(receipt.receivedQuantity || receipt.received_quantity || 0),
    damage_flag: Boolean(receipt.damageFlag || receipt.damage_flag || false),
    shortage_flag: Boolean(receipt.shortageFlag || receipt.shortage_flag || false),
    overage_flag: Boolean(receipt.overageFlag || receipt.overage_flag || false),
    variance_flag: Boolean(receipt.varianceFlag || receipt.variance_flag || false),
    photo_files: receipt.photoFiles || receipt.photo_files || [],
    signed_files: receipt.signedFiles || receipt.signed_files || [],
    remarks: receipt.remarks || null,
  }
}

function fromCargoReceiptItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    receiptId: r.receipt_id,
    cargoLotId: r.cargo_lot_id,
    productId: r.product_id,
    productName: r.product_name,
    expectedPackages: r.expected_packages || 0,
    receivedPackages: r.received_packages || 0,
    expectedQuantity: r.expected_quantity || 0,
    receivedQuantity: r.received_quantity || 0,
    damageQty: r.damage_qty || 0,
    shortageQty: r.shortage_qty || 0,
    remarks: r.remarks,
  }
}

function toCargoReceiptItemRow(item: any, receiptId?: string) {
  const id = toUUIDOrNull(item.id)
  const resolvedReceiptId = toUUIDOrNull(receiptId || item.receiptId || item.receipt_id)
  const cargoLotId = toUUIDOrNull(item.cargoLotId || item.cargo_lot_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedReceiptId ? { receipt_id: resolvedReceiptId } : {}),
    ...(cargoLotId ? { cargo_lot_id: cargoLotId } : {}),
    product_id: item.productId || item.product_id || null,
    product_name: item.productName || item.product_name || '',
    expected_packages: Number(item.expectedPackages || item.expected_packages || 0),
    received_packages: Number(item.receivedPackages || item.received_packages || 0),
    expected_quantity: Number(item.expectedQuantity || item.expected_quantity || 0),
    received_quantity: Number(item.receivedQuantity || item.received_quantity || 0),
    damage_qty: Number(item.damageQty || item.damage_qty || 0),
    shortage_qty: Number(item.shortageQty || item.shortage_qty || 0),
    remarks: item.remarks || null,
  }
}

export const cargoReceiptService = {
  async getByTransferOrderId(transferOrderId: string) {
    const { data, error } = await supabase
      .from('cargo_receipts')
      .select('*, cargo_receipt_items(*)')
      .eq('transfer_order_id', transferOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByTransferOrderId cargo_receipts', error)
    return (data || []).map((row) => ({
      ...fromCargoReceiptRow(row),
      items: (row.cargo_receipt_items || []).map(fromCargoReceiptItemRow),
    }))
  },
  async createWithItems(payload: any) {
    const receiptRow = toCargoReceiptRow(payload)
    const { data: receiptData, error: receiptError } = await supabase
      .from('cargo_receipts')
      .insert(receiptRow)
      .select()
      .single()
    if (receiptError) throwServiceError('create cargo_receipt', receiptError)

    const items = Array.isArray(payload.items) ? payload.items : []
    let mappedItems: any[] = []
    if (items.length > 0) {
      const itemRows = items.map((item: any) => toCargoReceiptItemRow(item, receiptData.id))
      const { data: itemData, error: itemError } = await supabase
        .from('cargo_receipt_items')
        .insert(itemRows)
        .select()
      if (itemError) throwServiceError('create cargo_receipt_items', itemError)
      mappedItems = (itemData || []).map(fromCargoReceiptItemRow)

      for (const item of items) {
        const consolidationItemId = toUUIDOrNull(item.consolidationItemId || item.consolidation_item_id)
        if (!consolidationItemId) continue
        const { data: existingItem, error: existingItemError } = await supabase
          .from('consolidation_plan_items')
          .select('received_packages, received_quantity, planned_packages, planned_quantity')
          .eq('id', consolidationItemId)
          .single()
        if (existingItemError) throwServiceError('load consolidation_plan_item for receipt sync', existingItemError)

        const nextReceivedPackages = Number(existingItem.received_packages || 0) + Number(item.receivedPackages || item.received_packages || 0)
        const nextReceivedQuantity = Number(existingItem.received_quantity || 0) + Number(item.receivedQuantity || item.received_quantity || 0)
        const plannedPackages = Number(existingItem.planned_packages || 0)
        const plannedQuantity = Number(existingItem.planned_quantity || 0)
        const nextItemStatus =
          nextReceivedPackages >= plannedPackages && nextReceivedQuantity >= plannedQuantity
            ? 'received'
            : 'in_transit'

        const { error: updateItemError } = await supabase
          .from('consolidation_plan_items')
          .update({
            received_packages: nextReceivedPackages,
            received_quantity: nextReceivedQuantity,
            item_status: nextItemStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', consolidationItemId)
        if (updateItemError) throwServiceError('update consolidation_plan_item receipt progress', updateItemError)
      }
    }

    const transferOrderId = receiptData.transfer_order_id
    if (transferOrderId) {
      const { error: transferError } = await supabase
        .from('domestic_transfer_orders')
        .update({
          status: payload.varianceFlag || payload.variance_flag ? 'exception_pending' : 'received',
          actual_arrival_at: payload.receivedAt || payload.received_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferOrderId)
      if (transferError) throwServiceError('update domestic_transfer_order after receipt', transferError)
    }

    const consolidationPlanId = receiptData.consolidation_plan_id
    if (consolidationPlanId) {
      const { data: planItems, error: planItemsError } = await supabase
        .from('consolidation_plan_items')
        .select('planned_packages, planned_quantity, received_packages, received_quantity')
        .eq('plan_id', consolidationPlanId)
      if (planItemsError) throwServiceError('load consolidation_plan_items for status sync', planItemsError)

      const allReceived = (planItems || []).every((item) => {
        const plannedPackages = Number(item.planned_packages || 0)
        const plannedQuantity = Number(item.planned_quantity || 0)
        const receivedPackages = Number(item.received_packages || 0)
        const receivedQuantity = Number(item.received_quantity || 0)
        return receivedPackages >= plannedPackages && receivedQuantity >= plannedQuantity
      })

      const { error: planStatusError } = await supabase
        .from('consolidation_plans')
        .update({
          status: allReceived ? 'ready_for_loading' : 'collecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', consolidationPlanId)
      if (planStatusError) throwServiceError('update consolidation_plan status after receipt', planStatusError)
    }

    return {
      ...fromCargoReceiptRow(receiptData),
      items: mappedItems,
    }
  },
}

function fromBookingQuoteRequestRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    requestNo: r.request_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    destinationPort: r.destination_port,
    tradeTerm: r.trade_term,
    bookingResponsibility: r.booking_responsibility,
    freightConfirmationRequired: r.freight_confirmation_required ?? false,
    customerConfirmationRequired: r.customer_confirmation_required ?? false,
    customerConfirmedAt: r.customer_confirmed_at,
    cargoReadyDate: r.cargo_ready_date,
    containerType: r.container_type,
    quantitySummary: r.quantity_summary,
    quoteDeadlineAt: r.quote_deadline_at,
    selectedOptionId: r.selected_option_id,
    status: r.status,
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBookingQuoteRequestRow(request: any) {
  const id = toUUIDOrNull(request.id)
  const purchaseOrderId = toUUIDOrNull(request.purchaseOrderId || request.purchase_order_id)
  const loadPlanId = toUUIDOrNull(request.loadPlanId || request.load_plan_id)
  return {
    ...(id ? { id } : {}),
    request_no: request.requestNo || request.request_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    destination_port: request.destinationPort || request.destination_port || null,
    trade_term: request.tradeTerm || request.trade_term || null,
    booking_responsibility: request.bookingResponsibility || request.booking_responsibility || null,
    freight_confirmation_required: Boolean(request.freightConfirmationRequired || request.freight_confirmation_required || false),
    customer_confirmation_required: Boolean(request.customerConfirmationRequired || request.customer_confirmation_required || false),
    customer_confirmed_at: request.customerConfirmedAt || request.customer_confirmed_at || null,
    cargo_ready_date: toIsoDate(request.cargoReadyDate || request.cargo_ready_date),
    container_type: request.containerType || request.container_type || null,
    quantity_summary: request.quantitySummary || request.quantity_summary || null,
    quote_deadline_at: request.quoteDeadlineAt || request.quote_deadline_at || null,
    selected_option_id: request.selectedOptionId || request.selected_option_id || null,
    status: request.status || 'draft',
    remarks: request.remarks || null,
    created_by: request.createdBy || request.created_by || null,
  }
}

function fromBookingQuoteOptionRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    requestId: r.request_id,
    optionRank: r.option_rank,
    forwarderId: r.forwarder_id,
    forwarderName: r.forwarder_name,
    carrierName: r.carrier_name,
    vesselName: r.vessel_name,
    voyageNo: r.voyage_no,
    etd: r.etd,
    eta: r.eta,
    transitDays: r.transit_days,
    freightCurrency: r.freight_currency,
    freightAmount: r.freight_amount || 0,
    surchargeAmount: r.surcharge_amount || 0,
    totalAmount: r.total_amount || 0,
    quoteValidUntil: r.quote_valid_until,
    isSelected: r.is_selected ?? false,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBookingQuoteOptionRow(option: any, requestId?: string) {
  const id = toUUIDOrNull(option.id)
  const resolvedRequestId = toUUIDOrNull(requestId || option.requestId || option.request_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedRequestId ? { request_id: resolvedRequestId } : {}),
    option_rank: Number(option.optionRank || option.option_rank || 1),
    forwarder_id: option.forwarderId || option.forwarder_id || null,
    forwarder_name: option.forwarderName || option.forwarder_name || '',
    carrier_name: option.carrierName || option.carrier_name || '',
    vessel_name: option.vesselName || option.vessel_name || null,
    voyage_no: option.voyageNo || option.voyage_no || null,
    etd: toIsoDate(option.etd),
    eta: toIsoDate(option.eta),
    transit_days: option.transitDays ? Number(option.transitDays) : null,
    freight_currency: option.freightCurrency || option.freight_currency || 'USD',
    freight_amount: Number(option.freightAmount || option.freight_amount || 0),
    surcharge_amount: Number(option.surchargeAmount || option.surcharge_amount || 0),
    total_amount: Number(option.totalAmount || option.total_amount || 0),
    quote_valid_until: option.quoteValidUntil || option.quote_valid_until || null,
    is_selected: Boolean(option.isSelected || option.is_selected || false),
    remarks: option.remarks || null,
  }
}

function fromShippingOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    shippingOrderNo: r.shipping_order_no,
    purchaseOrderId: r.purchase_order_id,
    bookingQuoteRequestId: r.booking_quote_request_id,
    selectedQuoteOptionId: r.selected_quote_option_id,
    loadPlanId: r.load_plan_id,
    forwarderId: r.forwarder_id,
    forwarderName: r.forwarder_name,
    carrierName: r.carrier_name,
    vesselName: r.vessel_name,
    voyageNo: r.voyage_no,
    bookingNo: r.booking_no,
    destinationPort: r.destination_port,
    plannedEtd: r.planned_etd,
    bookingCutoffAt: r.booking_cutoff_at,
    siCutoffAt: r.si_cutoff_at,
    portFilingRequired: r.port_filing_required ?? false,
    portFilingStatus: r.port_filing_status,
    shippingOrderStatus: r.shipping_order_status,
    issuedAt: r.issued_at,
    bookingConfirmedAt: r.booking_confirmed_at,
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toShippingOrderRow(order: any) {
  const id = toUUIDOrNull(order.id)
  const purchaseOrderId = toUUIDOrNull(order.purchaseOrderId || order.purchase_order_id)
  const bookingQuoteRequestId = toUUIDOrNull(order.bookingQuoteRequestId || order.booking_quote_request_id)
  const selectedQuoteOptionId = toUUIDOrNull(order.selectedQuoteOptionId || order.selected_quote_option_id)
  const loadPlanId = toUUIDOrNull(order.loadPlanId || order.load_plan_id)
  return {
    ...(id ? { id } : {}),
    shipping_order_no: order.shippingOrderNo || order.shipping_order_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(bookingQuoteRequestId ? { booking_quote_request_id: bookingQuoteRequestId } : {}),
    ...(selectedQuoteOptionId ? { selected_quote_option_id: selectedQuoteOptionId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    forwarder_id: order.forwarderId || order.forwarder_id || null,
    forwarder_name: order.forwarderName || order.forwarder_name || null,
    carrier_name: order.carrierName || order.carrier_name || null,
    vessel_name: order.vesselName || order.vessel_name || null,
    voyage_no: order.voyageNo || order.voyage_no || null,
    booking_no: order.bookingNo || order.booking_no || null,
    destination_port: order.destinationPort || order.destination_port || null,
    planned_etd: toIsoDate(order.plannedEtd || order.planned_etd),
    booking_cutoff_at: order.bookingCutoffAt || order.booking_cutoff_at || null,
    si_cutoff_at: order.siCutoffAt || order.si_cutoff_at || null,
    port_filing_required: Boolean(order.portFilingRequired || order.port_filing_required || false),
    port_filing_status: order.portFilingStatus || order.port_filing_status || 'not_required',
    shipping_order_status: order.shippingOrderStatus || order.shipping_order_status || 'draft',
    issued_at: order.issuedAt || order.issued_at || null,
    booking_confirmed_at: order.bookingConfirmedAt || order.booking_confirmed_at || null,
    remarks: order.remarks || null,
    created_by: order.createdBy || order.created_by || null,
  }
}

export const bookingQuoteRequestService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('booking_quote_requests')
      .select('*, booking_quote_options(*)')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId booking_quote_requests', error)
    return (data || []).map((row) => ({
      ...fromBookingQuoteRequestRow(row),
      options: (row.booking_quote_options || []).map(fromBookingQuoteOptionRow),
    }))
  },
  async createWithOptions(payload: any) {
    const requestRow = toBookingQuoteRequestRow(payload)
    const { data: requestData, error: requestError } = await supabase
      .from('booking_quote_requests')
      .insert(requestRow)
      .select()
      .single()
    if (requestError) throwServiceError('create booking_quote_request', requestError)

    const options = Array.isArray(payload.options) ? payload.options.filter((option) => option?.forwarderName || option?.carrierName) : []
    let selectedOptionId: string | null = null
    let mappedOptions: any[] = []

    if (options.length > 0) {
      const optionRows = options.map((option: any, index: number) =>
        toBookingQuoteOptionRow({
          ...option,
          optionRank: index + 1,
          isSelected: Boolean(option.isSelected),
        }, requestData.id)
      )
      const { data: optionData, error: optionError } = await supabase
        .from('booking_quote_options')
        .insert(optionRows)
        .select()
      if (optionError) throwServiceError('create booking_quote_options', optionError)
      mappedOptions = (optionData || []).map(fromBookingQuoteOptionRow)
      selectedOptionId = mappedOptions.find((option) => option.isSelected)?.id || null
      if (selectedOptionId) {
        const { error: selectError } = await supabase
          .from('booking_quote_requests')
          .update({ selected_option_id: selectedOptionId })
          .eq('id', requestData.id)
        if (selectError) throwServiceError('update booking_quote_request selected_option_id', selectError)
      }
    }

    return {
      ...fromBookingQuoteRequestRow({ ...requestData, selected_option_id: selectedOptionId || requestData.selected_option_id }),
      options: mappedOptions,
    }
  },
}

export const shippingOrderService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('shipping_orders')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId shipping_orders', error)
    return (data || []).map(fromShippingOrderRow)
  },
  async create(order: any) {
    const row = toShippingOrderRow(order)
    const { data, error } = await supabase
      .from('shipping_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create shipping_order', error)
    return fromShippingOrderRow(data)
  },
}

function fromContainerLoadPlanRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    loadPlanNo: r.load_plan_no,
    shipmentNo: r.shipment_no,
    salesContractId: r.sales_contract_id,
    loadingPoolId: r.loading_pool_id,
    solutionId: r.solution_id,
    solutionContainerId: r.solution_container_id,
    status: r.status,
    containerType: r.container_type,
    containerCount: r.container_count,
    loadingMode: r.loading_mode,
    consolidationMode: r.consolidation_mode,
    portOfLoading: r.port_of_loading,
    portOfDestination: r.port_of_destination,
    forwarderId: r.forwarder_id,
    truckCompanyId: r.truck_company_id,
    customsBrokerId: r.customs_broker_id,
    plannedEtd: r.planned_etd,
    bookingCutoffAt: r.booking_cutoff_at,
    plannedCustomsCutoffAt: r.planned_customs_cutoff_at,
    plannedLoadingDate: r.planned_loading_date,
    sealRequired: r.seal_required ?? true,
    finalSealNo: r.final_seal_no,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toContainerLoadPlanRow(plan: any) {
  const id = toUUIDOrNull(plan.id)
  const salesContractId = toUUIDOrNull(plan.salesContractId || plan.sales_contract_id)
  const loadingPoolId = toUUIDOrNull(plan.loadingPoolId || plan.loading_pool_id)
  const solutionId = toUUIDOrNull(plan.solutionId || plan.solution_id)
  const solutionContainerId = toUUIDOrNull(plan.solutionContainerId || plan.solution_container_id)
  return {
    ...(id ? { id } : {}),
    load_plan_no: plan.loadPlanNo || plan.load_plan_no,
    shipment_no: plan.shipmentNo || plan.shipment_no || null,
    ...(salesContractId ? { sales_contract_id: salesContractId } : {}),
    ...(loadingPoolId ? { loading_pool_id: loadingPoolId } : {}),
    ...(solutionId ? { solution_id: solutionId } : {}),
    ...(solutionContainerId ? { solution_container_id: solutionContainerId } : {}),
    status: plan.status || 'draft',
    container_type: plan.containerType || plan.container_type || '',
    container_count: Number(plan.containerCount || plan.container_count || 1),
    loading_mode: plan.loadingMode || plan.loading_mode || null,
    consolidation_mode: plan.consolidationMode || plan.consolidation_mode || null,
    port_of_loading: plan.portOfLoading || plan.port_of_loading || null,
    port_of_destination: plan.portOfDestination || plan.port_of_destination || null,
    forwarder_id: plan.forwarderId || plan.forwarder_id || null,
    truck_company_id: plan.truckCompanyId || plan.truck_company_id || null,
    customs_broker_id: plan.customsBrokerId || plan.customs_broker_id || null,
    planned_etd: toIsoDate(plan.plannedEtd || plan.planned_etd),
    booking_cutoff_at: plan.bookingCutoffAt || plan.booking_cutoff_at || null,
    planned_customs_cutoff_at: plan.plannedCustomsCutoffAt || plan.planned_customs_cutoff_at || null,
    planned_loading_date: toIsoDate(plan.plannedLoadingDate || plan.planned_loading_date),
    seal_required: Boolean(plan.sealRequired ?? plan.seal_required ?? true),
    final_seal_no: plan.finalSealNo || plan.final_seal_no || null,
    remarks: plan.remarks || null,
  }
}

function fromLoadingTaskRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    loadingTaskNo: r.loading_task_no,
    loadPlanId: r.load_plan_id,
    solutionId: r.solution_id,
    solutionContainerId: r.solution_container_id,
    sequenceNo: r.sequence_no,
    taskStatus: r.task_status,
    loadingPointType: r.loading_point_type,
    loadingPointId: r.loading_point_id,
    loadingPointName: r.loading_point_name,
    truckCompanyId: r.truck_company_id,
    containerNo: r.container_no,
    sealStatus: r.seal_status,
    sealNo: r.seal_no,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    vehicleNo: r.vehicle_no,
    supervisorName: r.supervisor_name,
    scheduledArrivalAt: r.scheduled_arrival_at,
    actualArrivalAt: r.actual_arrival_at,
    loadingStartAt: r.loading_start_at,
    loadingFinishAt: r.loading_finish_at,
    departedAt: r.departed_at,
    loadedPackages: r.loaded_packages || 0,
    loadedQuantity: r.loaded_quantity || 0,
    loadedWeight: r.loaded_weight || 0,
    loadedCbm: r.loaded_cbm || 0,
    containerConditionOk: r.container_condition_ok,
    containerCleanOk: r.container_clean_ok,
    containerDryOk: r.container_dry_ok,
    odorCheckOk: r.odor_check_ok,
    doorLockOk: r.door_lock_ok,
    floorCheckOk: r.floor_check_ok,
    emptyContainerPhotos: r.empty_container_photos || [],
    halfLoadedInnerPhotos: r.half_loaded_inner_photos || [],
    fullLoadedBothDoorsOpenPhotos: r.full_loaded_both_doors_open_photos || [],
    leftDoorOpenPhotos: r.left_door_open_photos || [],
    bothDoorsClosedPhotos: r.both_doors_closed_photos || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toLoadingTaskRow(task: any) {
  const id = toUUIDOrNull(task.id)
  const loadPlanId = toUUIDOrNull(task.loadPlanId || task.load_plan_id)
  const solutionId = toUUIDOrNull(task.solutionId || task.solution_id)
  const solutionContainerId = toUUIDOrNull(task.solutionContainerId || task.solution_container_id)
  return {
    ...(id ? { id } : {}),
    loading_task_no: task.loadingTaskNo || task.loading_task_no,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    ...(solutionId ? { solution_id: solutionId } : {}),
    ...(solutionContainerId ? { solution_container_id: solutionContainerId } : {}),
    sequence_no: Number(task.sequenceNo || task.sequence_no || 1),
    task_status: task.taskStatus || task.task_status || 'planned',
    loading_point_type: task.loadingPointType || task.loading_point_type || null,
    loading_point_id: task.loadingPointId || task.loading_point_id || null,
    loading_point_name: task.loadingPointName || task.loading_point_name || null,
    truck_company_id: task.truckCompanyId || task.truck_company_id || null,
    container_no: task.containerNo || task.container_no || null,
    seal_status: task.sealStatus || task.seal_status || 'not_sealed',
    seal_no: task.sealNo || task.seal_no || null,
    driver_name: task.driverName || task.driver_name || null,
    driver_phone: task.driverPhone || task.driver_phone || null,
    vehicle_no: task.vehicleNo || task.vehicle_no || null,
    supervisor_name: task.supervisorName || task.supervisor_name || null,
    scheduled_arrival_at: task.scheduledArrivalAt || task.scheduled_arrival_at || null,
    actual_arrival_at: task.actualArrivalAt || task.actual_arrival_at || null,
    loading_start_at: task.loadingStartAt || task.loading_start_at || null,
    loading_finish_at: task.loadingFinishAt || task.loading_finish_at || null,
    departed_at: task.departedAt || task.departed_at || null,
    loaded_packages: Number(task.loadedPackages || task.loaded_packages || 0),
    loaded_quantity: Number(task.loadedQuantity || task.loaded_quantity || 0),
    loaded_weight: Number(task.loadedWeight || task.loaded_weight || 0),
    loaded_cbm: Number(task.loadedCbm || task.loaded_cbm || 0),
    container_condition_ok: task.containerConditionOk ?? task.container_condition_ok ?? null,
    container_clean_ok: task.containerCleanOk ?? task.container_clean_ok ?? null,
    container_dry_ok: task.containerDryOk ?? task.container_dry_ok ?? null,
    odor_check_ok: task.odorCheckOk ?? task.odor_check_ok ?? null,
    door_lock_ok: task.doorLockOk ?? task.door_lock_ok ?? null,
    floor_check_ok: task.floorCheckOk ?? task.floor_check_ok ?? null,
    empty_container_photos: task.emptyContainerPhotos || task.empty_container_photos || [],
    half_loaded_inner_photos: task.halfLoadedInnerPhotos || task.half_loaded_inner_photos || [],
    full_loaded_both_doors_open_photos: task.fullLoadedBothDoorsOpenPhotos || task.full_loaded_both_doors_open_photos || [],
    left_door_open_photos: task.leftDoorOpenPhotos || task.left_door_open_photos || [],
    both_doors_closed_photos: task.bothDoorsClosedPhotos || task.both_doors_closed_photos || [],
    remarks: task.remarks || null,
  }
}

export const containerLoadPlanService = {
  async create(plan: any) {
    const row = toContainerLoadPlanRow(plan)
    const { data, error } = await supabase
      .from('container_load_plans')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create container_load_plan', error)
    return fromContainerLoadPlanRow(data)
  },
  async getByShipmentNo(shipmentNo: string) {
    const { data, error } = await supabase
      .from('container_load_plans')
      .select('*')
      .eq('shipment_no', shipmentNo)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByShipmentNo container_load_plans', error)
    return (data || []).map(fromContainerLoadPlanRow)
  },
  async getBySolutionContainerId(solutionContainerId: string) {
    const { data, error } = await supabase
      .from('container_load_plans')
      .select('*')
      .eq('solution_container_id', solutionContainerId)
      .maybeSingle()
    if (error) throwServiceError('getBySolutionContainerId container_load_plans', error)
    return fromContainerLoadPlanRow(data)
  },
}

export const loadingTaskService = {
  async create(task: any) {
    const row = toLoadingTaskRow(task)
    const { data, error } = await supabase
      .from('loading_tasks')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create loading_task', error)
    return fromLoadingTaskRow(data)
  },
  async getByLoadPlanId(loadPlanId: string) {
    const { data, error } = await supabase
      .from('loading_tasks')
      .select('*')
      .eq('load_plan_id', loadPlanId)
      .order('sequence_no', { ascending: true })
    if (error) throwServiceError('getByLoadPlanId loading_tasks', error)
    return (data || []).map(fromLoadingTaskRow)
  },
  async getBySolutionContainerId(solutionContainerId: string) {
    const { data, error } = await supabase
      .from('loading_tasks')
      .select('*')
      .eq('solution_container_id', solutionContainerId)
      .order('sequence_no', { ascending: true })
    if (error) throwServiceError('getBySolutionContainerId loading_tasks', error)
    return (data || []).map(fromLoadingTaskRow)
  },
  async update(taskId: string, payload: any) {
    const row = toLoadingTaskRow(payload) as Record<string, any>
    delete row.id
    delete row.load_plan_id
    delete row.loading_task_no
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('loading_tasks')
      .update(row)
      .eq('id', taskId)
      .select('*')
      .single()
    if (error) throwServiceError('update loading_tasks', error)
    return fromLoadingTaskRow(data)
  },
}

function fromLoadingTaskItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    loadingTaskId: r.loading_task_id,
    cargoLotId: r.cargo_lot_id,
    solutionItemId: r.solution_item_id,
    loadedPackages: Number(r.loaded_packages || 0),
    loadedQuantity: Number(r.loaded_quantity || 0),
    remarks: r.remarks || null,
    createdAt: r.created_at,
  }
}

function toLoadingTaskItemRow(item: any) {
  const id = toUUIDOrNull(item.id)
  const loadingTaskId = toUUIDOrNull(item.loadingTaskId || item.loading_task_id)
  const cargoLotId = toUUIDOrNull(item.cargoLotId || item.cargo_lot_id)
  const solutionItemId = toUUIDOrNull(item.solutionItemId || item.solution_item_id)
  return {
    ...(id ? { id } : {}),
    ...(loadingTaskId ? { loading_task_id: loadingTaskId } : {}),
    ...(cargoLotId ? { cargo_lot_id: cargoLotId } : {}),
    ...(solutionItemId ? { solution_item_id: solutionItemId } : {}),
    loaded_packages: Number(item.loadedPackages || item.loaded_packages || 0),
    loaded_quantity: Number(item.loadedQuantity || item.loaded_quantity || 0),
    remarks: item.remarks || null,
  }
}

export const loadingTaskItemService = {
  async getByLoadingTaskId(loadingTaskId: string) {
    const { data, error } = await supabase
      .from('loading_task_items')
      .select('*')
      .eq('loading_task_id', loadingTaskId)
    if (error) throwServiceError('getByLoadingTaskId loading_task_items', error)
    return (data || []).map(fromLoadingTaskItemRow)
  },
  async upsertMany(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) return []
    const rows = items.map(toLoadingTaskItemRow)
    const { data, error } = await supabase
      .from('loading_task_items')
      .upsert(rows, { onConflict: 'loading_task_id,solution_item_id' })
      .select('*')
    if (error) throwServiceError('upsertMany loading_task_items', error)
    return (data || []).map(fromLoadingTaskItemRow)
  },
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

function fromShipmentDocumentSetRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    documentSetNo: r.document_set_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    commercialInvoiceNo: r.commercial_invoice_no,
    packingListNo: r.packing_list_no,
    ciStatus: r.ci_status,
    plStatus: r.pl_status,
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
  return {
    id: r.id,
    customsDeclNo: r.customs_decl_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    brokerName: r.broker_name,
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

function fromThirdPartyWarehouseRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    warehouseNo: r.warehouse_no,
    warehouseName: r.warehouse_name,
    warehouseType: r.warehouse_type,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    address: r.address,
    city: r.city,
    province: r.province,
    country: r.country,
    status: r.status,
    serviceScope: r.service_scope || [],
    settlementTerms: r.settlement_terms,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toThirdPartyWarehouseRow(warehouse: any) {
  const id = toUUIDOrNull(warehouse.id)
  return {
    ...(id ? { id } : {}),
    warehouse_no: warehouse.warehouseNo || warehouse.warehouse_no,
    warehouse_name: warehouse.warehouseName || warehouse.warehouse_name || '',
    warehouse_type: warehouse.warehouseType || warehouse.warehouse_type || 'third_party_warehouse',
    contact_name: warehouse.contactName || warehouse.contact_name || null,
    contact_phone: warehouse.contactPhone || warehouse.contact_phone || null,
    contact_email: warehouse.contactEmail || warehouse.contact_email || null,
    address: warehouse.address || null,
    city: warehouse.city || null,
    province: warehouse.province || null,
    country: warehouse.country || 'China',
    status: warehouse.status || 'active',
    service_scope: warehouse.serviceScope || warehouse.service_scope || [],
    settlement_terms: warehouse.settlementTerms || warehouse.settlement_terms || null,
    remarks: warehouse.remarks || null,
  }
}

function fromConsolidationPlanRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    planNo: r.plan_no,
    shipmentNo: r.shipment_no,
    loadPlanId: r.load_plan_id,
    consolidationPointType: r.consolidation_point_type,
    consolidationPointId: r.consolidation_point_id,
    consolidationPointName: r.consolidation_point_name,
    consolidationPointAddress: r.consolidation_point_address,
    warehouseContactName: r.warehouse_contact_name,
    warehouseContactPhone: r.warehouse_contact_phone,
    plannedLoadingDate: r.planned_loading_date,
    status: r.status,
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toConsolidationPlanRow(plan: any) {
  const id = toUUIDOrNull(plan.id)
  const loadPlanId = toUUIDOrNull(plan.loadPlanId || plan.load_plan_id)
  return {
    ...(id ? { id } : {}),
    plan_no: plan.planNo || plan.plan_no,
    shipment_no: plan.shipmentNo || plan.shipment_no || null,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    consolidation_point_type: plan.consolidationPointType || plan.consolidation_point_type || 'third_party_warehouse',
    consolidation_point_id: plan.consolidationPointId || plan.consolidation_point_id || null,
    consolidation_point_name: plan.consolidationPointName || plan.consolidation_point_name || '',
    consolidation_point_address: plan.consolidationPointAddress || plan.consolidation_point_address || null,
    warehouse_contact_name: plan.warehouseContactName || plan.warehouse_contact_name || null,
    warehouse_contact_phone: plan.warehouseContactPhone || plan.warehouse_contact_phone || null,
    planned_loading_date: toIsoDate(plan.plannedLoadingDate || plan.planned_loading_date),
    status: plan.status || 'planning',
    remarks: plan.remarks || null,
    created_by: plan.createdBy || plan.created_by || null,
  }
}

function fromConsolidationPlanItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    planId: r.plan_id,
    purchaseOrderId: r.purchase_order_id,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    productName: r.product_name,
    modelNo: r.model_no,
    plannedContainerNo: r.planned_container_no,
    plannedContainerSlot: r.planned_container_slot,
    plannedPackages: r.planned_packages || 0,
    plannedQuantity: r.planned_quantity || 0,
    receivedPackages: r.received_packages || 0,
    receivedQuantity: r.received_quantity || 0,
    itemStatus: r.item_status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toConsolidationPlanItemRow(item: any, planId?: string) {
  const id = toUUIDOrNull(item.id)
  const resolvedPlanId = toUUIDOrNull(planId || item.planId || item.plan_id)
  const purchaseOrderId = toUUIDOrNull(item.purchaseOrderId || item.purchase_order_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedPlanId ? { plan_id: resolvedPlanId } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    supplier_id: item.supplierId || item.supplier_id || null,
    supplier_name: item.supplierName || item.supplier_name || null,
    product_name: item.productName || item.product_name || '',
    model_no: item.modelNo || item.model_no || null,
    planned_container_no: item.plannedContainerNo || item.planned_container_no || null,
    planned_container_slot: item.plannedContainerSlot || item.planned_container_slot || null,
    planned_packages: Number(item.plannedPackages || item.planned_packages || 0),
    planned_quantity: Number(item.plannedQuantity || item.planned_quantity || 0),
    received_packages: Number(item.receivedPackages || item.received_packages || 0),
    received_quantity: Number(item.receivedQuantity || item.received_quantity || 0),
    item_status: item.itemStatus || item.item_status || 'planned',
    remarks: item.remarks || null,
  }
}

export const thirdPartyWarehouseService = {
  async getAll() {
    const { data, error } = await supabase
      .from('third_party_warehouses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getAll third_party_warehouses', error)
    return (data || []).map(fromThirdPartyWarehouseRow)
  },
  async upsert(warehouse: any) {
    const row = toThirdPartyWarehouseRow(warehouse)
    const { data, error } = await supabase
      .from('third_party_warehouses')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) throwServiceError('upsert third_party_warehouse', error)
    return fromThirdPartyWarehouseRow(data)
  },
}

export const consolidationPlanService = {
  async getAll() {
    const { data, error } = await supabase
      .from('consolidation_plans')
      .select('*, consolidation_plan_items(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throwServiceError('getAll consolidation_plans', error)
    return (data || []).map((row) => ({
      ...fromConsolidationPlanRow(row),
      items: (row.consolidation_plan_items || []).map(fromConsolidationPlanItemRow),
    }))
  },
  async getByShipmentNo(shipmentNo: string) {
    const { data, error } = await supabase
      .from('consolidation_plans')
      .select('*, consolidation_plan_items(*)')
      .eq('shipment_no', shipmentNo)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByShipmentNo consolidation_plans', error)
    return (data || []).map((row) => ({
      ...fromConsolidationPlanRow(row),
      items: (row.consolidation_plan_items || []).map(fromConsolidationPlanItemRow),
    }))
  },
  async createWithItems(payload: any) {
    const planRow = toConsolidationPlanRow(payload)
    const { data: planData, error: planError } = await supabase
      .from('consolidation_plans')
      .insert(planRow)
      .select()
      .single()
    if (planError) throwServiceError('create consolidation_plan', planError)

    const items = Array.isArray(payload.items) ? payload.items : []
    let mappedItems: any[] = []
    if (items.length > 0) {
      const itemRows = items.map((item: any) => toConsolidationPlanItemRow(item, planData.id))
      const { data: itemData, error: itemError } = await supabase
        .from('consolidation_plan_items')
        .insert(itemRows)
        .select()
      if (itemError) throwServiceError('create consolidation_plan_items', itemError)
      mappedItems = (itemData || []).map(fromConsolidationPlanItemRow)
    }

    return {
      ...fromConsolidationPlanRow(planData),
      items: mappedItems,
    }
  },
}
