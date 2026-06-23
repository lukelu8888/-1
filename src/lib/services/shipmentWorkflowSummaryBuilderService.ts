import { getCollectionControlRuleSummary, type ReceivableReleaseRiskSummary } from './shipmentWorkflowRiskService'

function toDisplayTime(value: any): string {
  if (!value) return '-'
  return String(value).includes('T') ? String(value).slice(0, 16) : String(value)
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

export function buildShipmentWorkflowSummary(payload: {
  execution?: any
  receivableRisk?: ReceivableReleaseRiskSummary | null
  voyage?: any
  arrivalNotice?: any
  importClearance?: any
  deliveryConfirmation?: any
  latestFeedback?: any
  financePacket?: any
}) {
  const execution = payload.execution || null
  const receivableRisk = payload.receivableRisk || null
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
    const collectionRule = getCollectionControlRuleSummary(execution, receivableRisk)
    const paymentStatus = execution?.customer_balance_status || 'pending'
    replySummary.customerPaymentControl = {
      label: collectionRule.label,
      mode: execution?.collection_control_mode || null,
      gateStatus: execution?.customer_balance_gate_status || null,
      status: paymentStatus,
      confirmedAt: execution?.customer_balance_confirmed_at || null,
      blockedReason: collectionRule.blockedReason,
      financialRiskBlocked: collectionRule.financialReleaseBlocked || false,
      overdueRiskLevel: receivableRisk?.overdueRiskLevel || null,
      creditLimitUsd: receivableRisk?.creditLimitUsd ?? null,
      creditReleaseApprovedBy: receivableRisk?.creditReleaseApprovedBy || null,
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
    const collectionRule = getCollectionControlRuleSummary(execution, receivableRisk)
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
    const collectionRule = getCollectionControlRuleSummary(execution, receivableRisk)
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
