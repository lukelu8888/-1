import { canonicalizePersonnelEmail } from '../personnelEmail'
import { supabase } from '../supabase'
import { normalizeOwnerFields, normalizeTradeTerms } from './businessFieldNormalization'
import {
  buildProcurementRequestNotes,
  DEFAULT_DOWNSTREAM_VISIBILITY,
  extractProcurementRequestContext,
  mergeCustomerInfoWithProcurementContext,
} from '../../utils/procurementRequestContext'
import { auditLogService } from './auditLogService'
import { buildSealGovernancePatch } from './postContractGovernanceService'

function readProcurementWorkflowValue(order: any, field: string): string {
  return String(
    order?.documentRenderMeta?.procurementWorkflow?.[field] ??
    order?.document_render_meta?.procurementWorkflow?.[field] ??
    '',
  ).trim()
}

export function derivePurchaseOrderWorkflowFields(order: any): {
  documentType: 'PR' | 'CG'
  approvalStatus: 'draft' | 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'not_required'
  executionStatus: string
} {
  const procurementRequestStatus = String(order?.procurementRequestStatus || order?.procurement_request_status || '').trim()
  const explicitExecutionStatus = String(order?.executionStatus || order?.execution_status || readProcurementWorkflowValue(order, 'executionStatus') || '').trim()
  const explicitDocumentType = String(order?.documentType || order?.document_type || readProcurementWorkflowValue(order, 'documentType') || '').trim().toUpperCase()
  const explicitApprovalStatus = String(order?.approvalStatus || order?.approval_status || readProcurementWorkflowValue(order, 'approvalStatus') || '').trim().toLowerCase()
  const poNumber = String(order?.poNumber || order?.po_number || '').trim().toUpperCase()
  const hasParentRequest = Boolean(order?.parentRequestPoNumber || order?.parent_request_po_number)

  const isCGStatus = [
    'draft_allocated',
    'pending_manager_approval',
    'pending_ceo_approval',
    'approved_boss',
    'rejected_boss',
    'pushed_supplier',
  ].includes(procurementRequestStatus)

  const documentType: 'PR' | 'CG' =
    explicitDocumentType === 'PR' || explicitDocumentType === 'CG'
      ? (explicitDocumentType as 'PR' | 'CG')
      : (poNumber.startsWith('CG-') || hasParentRequest || isCGStatus ? 'CG' : 'PR')

  if (documentType === 'PR') {
    const executionStatus =
      explicitExecutionStatus ||
      (procurementRequestStatus === 'allocated_completed'
        ? 'fully_allocated'
        : procurementRequestStatus === 'partial_allocated'
          ? 'partially_allocated'
          : procurementRequestStatus === 'pending_procurement_assignment'
            ? 'pending_assignment'
            : 'initiated')
    return {
      documentType,
      approvalStatus: explicitApprovalStatus === 'not_required' ? 'not_required' : 'not_required',
      executionStatus,
    }
  }

  const approvalStatus =
    explicitApprovalStatus ||
    (procurementRequestStatus === 'pending_manager_approval'
      ? 'pending_l1'
      : procurementRequestStatus === 'pending_ceo_approval'
        ? 'pending_l2'
        : procurementRequestStatus === 'approved_boss' || procurementRequestStatus === 'pushed_supplier'
          ? 'approved'
          : procurementRequestStatus === 'rejected_boss'
            ? 'rejected'
            : 'draft')

  const executionStatus =
    explicitExecutionStatus ||
    (procurementRequestStatus === 'pushed_supplier'
      ? 'pushed_to_supplier'
      : procurementRequestStatus === 'approved_boss'
        ? 'approved'
        : 'draft')

  return {
    documentType,
    approvalStatus: approvalStatus as 'draft' | 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'not_required',
    executionStatus,
  }
}

type DependencyBag = {
  throwSupabaseError: (context: string, error: any) => never
  resolveBusinessDocumentTemplateBinding: (
    document: any,
    options: {
      documentCode: string
      nodeCode: string
      businessData: any
    },
  ) => Promise<Record<string, any>>
  upsertWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    onConflict: string,
    context: string,
  ) => Promise<{ data: any; error: Error | null }>
  toUUID: (id: string | null | undefined) => string
  toUUIDOrNull: (id: string | null | undefined) => string | null
  toIsoDate: (v: any) => string | null
  toRegionCode: (region: string | null | undefined) => string | null
  fromRegionCode: (code: string | null | undefined) => string | null
}

async function withServiceTimeout<T>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return await Promise.race([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label}超时，请稍后重试`))
      }, timeoutMs)
    }),
  ])
}

const createPendingTemplateBinding = (
  documentCode: string,
  nodeCode: string,
  businessData: any,
  error: unknown,
) => ({
  template_id: null,
  template_version_id: null,
  template_snapshot: {
    pendingResolution: true,
    documentCode,
    nodeCode,
    reason: error instanceof Error ? error.message : String(error || 'Template binding unavailable'),
    capturedAt: new Date().toISOString(),
  },
  document_data_snapshot: businessData || {},
  templateId: null,
  templateVersionId: null,
  templateSnapshot: {
    pendingResolution: true,
    documentCode,
    nodeCode,
    reason: error instanceof Error ? error.message : String(error || 'Template binding unavailable'),
    capturedAt: new Date().toISOString(),
  },
  documentDataSnapshot: businessData || {},
})

function toPOExecutionRow(p: any, deps: DependencyBag, purchaseOrderId?: string) {
  const resolvedPurchaseOrderId = deps.toUUID(purchaseOrderId || p.purchaseOrderId || p.purchase_order_id || p.id)
  if (!resolvedPurchaseOrderId) return null

  const workflowFields = derivePurchaseOrderWorkflowFields(p)
  if (workflowFields.documentType === 'PR') return null
  const procurementRequestStatus = String(p.procurementRequestStatus || p.procurement_request_status || '').trim()
  const explicitExecutionStatus = String(p.executionStatus || p.execution_status || '').trim()
  const mappedExecutionStatus = (() => {
    const candidate = explicitExecutionStatus || (
      procurementRequestStatus === 'pushed_supplier'
        ? 'supplier_pending_confirmation'
        : workflowFields.executionStatus
    )

    switch (candidate) {
      case 'pushed_to_supplier':
      case 'supplier_pending_confirmation':
        return 'supplier_pending_confirmation'
      case 'supplier_confirmed':
        return 'supplier_confirmed'
      case 'pre_production_sample_pending':
      case 'pre_production_sample_sent':
      case 'awaiting_sample_confirmation':
      case 'sample_confirmed':
      case 'sampling':
        return 'sampling'
      case 'production_in_progress':
      case 'in_production':
        return 'in_production'
      case 'supplier_self_inspection_pending':
        return 'supplier_self_inspection_pending'
      case 'supplier_self_inspection_submitted':
        return 'supplier_self_inspection_submitted'
      case 'qc_pending':
        return 'qc_pending'
      case 'qc_passed':
        return 'qc_passed'
      case 'qc_failed':
        return 'qc_failed'
      case 'finished_goods_ready':
        return 'finished_goods_ready'
      case 'awaiting_loading':
        return 'awaiting_loading'
      case 'loaded':
        return 'loaded'
      case 'shipped':
        return 'shipped'
      case 'completed':
        return 'completed'
      default:
        return ''
    }
  })()

  if (!mappedExecutionStatus) return null

  const sealGovernance = buildSealGovernancePatch(p)

  return {
    purchase_order_id: resolvedPurchaseOrderId,
    execution_status: mappedExecutionStatus,
    supplier_confirmed_at: p.supplierConfirmedAt || p.supplier_confirmed_at || null,
    supplier_rejected_at: p.supplierRejectedAt || p.supplier_rejected_at || null,
    supplier_reply_notes: p.supplierReplyNotes || p.supplier_reply_notes || null,
    sample_required: Boolean(p.sampleRequired || p.sample_required || false),
    pre_production_sample_status: p.preProductionSampleStatus || p.pre_production_sample_status || (Boolean(p.sampleRequired || p.sample_required) ? 'pending' : 'not_required'),
    pre_production_sample_no: p.preProductionSampleNo || p.pre_production_sample_no || null,
    sample_round: Number(p.sampleRound || p.sample_round || 1),
    pre_production_sample_sent_at: p.preProductionSampleSentAt || p.pre_production_sample_sent_at || null,
    sample_confirmed_at: p.sampleConfirmedAt || p.sample_confirmed_at || null,
    seal_confirmed_at: p.sealConfirmedAt || p.seal_confirmed_at || null,
    seal_status: sealGovernance.sealStatus,
    sealed_sample_ref: p.sealedSampleRef || p.sealed_sample_ref || null,
    sealed_sample_version: p.sealedSampleVersion || p.sealed_sample_version || null,
    sealed_sample_uploaded_at: p.sealedSampleUploadedAt || p.sealed_sample_uploaded_at || null,
    sealed_sample_uploaded_by: p.sealedSampleUploadedBy || p.sealed_sample_uploaded_by || null,
    sealed_sample_confirmed_at: p.sealedSampleConfirmedAt || p.sealed_sample_confirmed_at || p.sealConfirmedAt || p.seal_confirmed_at || null,
    sealed_sample_confirmed_by: p.sealedSampleConfirmedBy || p.sealed_sample_confirmed_by || null,
    seal_invalidated_at: p.sealInvalidatedAt || p.seal_invalidated_at || null,
    seal_invalidated_by: p.sealInvalidatedBy || p.seal_invalidated_by || null,
    seal_invalidated_reason: p.sealInvalidatedReason || p.seal_invalidated_reason || null,
    production_started_at: p.productionStartedAt || p.production_started_at || null,
    estimated_completion_date: deps.toIsoDate(p.estimatedCompletionDate || p.estimated_completion_date),
    production_completed_at: p.productionCompletedAt || p.production_completed_at || null,
    supplier_self_inspection_status: p.supplierSelfInspectionStatus || p.supplier_self_inspection_status || 'pending',
    qc_inspection_status: p.qcInspectionStatus || p.qc_inspection_status || 'pending',
    qc_release_status: p.qcReleaseStatus || p.qc_release_status || null,
    qc_release_block_reason: p.qcReleaseBlockReason || p.qc_release_block_reason || null,
    release_approved_by: p.releaseApprovedBy || p.release_approved_by || null,
    inspection_execution_mode: p.inspectionExecutionMode || p.inspection_execution_mode || null,
    customer_designated_inspection_agency: p.customerDesignatedInspectionAgency || p.customer_designated_inspection_agency || null,
    customer_designated_inspection_status: p.customerDesignatedInspectionStatus || p.customer_designated_inspection_status || 'pending',
    finished_goods_confirmed_at: p.finishedGoodsConfirmedAt || p.finished_goods_confirmed_at || null,
    customer_inspection_mode: p.customerInspectionMode || p.customer_inspection_mode || null,
    goods_ready_notified_to_customer_at: p.goodsReadyNotifiedToCustomerAt || p.goods_ready_notified_to_customer_at || null,
    inspection_method_notified_at: p.inspectionMethodNotifiedAt || p.inspection_method_notified_at || null,
    qc_report_shared_to_customer_at: p.qcReportSharedToCustomerAt || p.qc_report_shared_to_customer_at || null,
    customer_balance_status: p.customerBalanceStatus || p.customer_balance_status || 'pending',
    supplier_balance_status: p.supplierBalanceStatus || p.supplier_balance_status || 'pending',
    collection_control_mode: p.collectionControlMode || p.collection_control_mode || null,
    document_release_mode: p.documentReleaseMode || p.document_release_mode || null,
    customer_balance_gate_status: p.customerBalanceGateStatus || p.customer_balance_gate_status || 'pending',
    customer_balance_confirmed_at: p.customerBalanceConfirmedAt || p.customer_balance_confirmed_at || null,
    lc_type: p.lcType || p.lc_type || null,
    lc_opened_at: p.lcOpenedAt || p.lc_opened_at || null,
    lc_discrepancy_status: p.lcDiscrepancyStatus || p.lc_discrepancy_status || null,
    lc_discrepancy_notes: p.lcDiscrepancyNotes || p.lc_discrepancy_notes || null,
    lc_discrepancy_recorded_at: p.lcDiscrepancyRecordedAt || p.lc_discrepancy_recorded_at || null,
    lc_discrepancy_recorded_by: p.lcDiscrepancyRecordedBy || p.lc_discrepancy_recorded_by || null,
    lc_discrepancy_approval_status: p.lcDiscrepancyApprovalStatus || p.lc_discrepancy_approval_status || 'not_required',
    lc_discrepancy_approval_requested_at: p.lcDiscrepancyApprovalRequestedAt || p.lc_discrepancy_approval_requested_at || null,
    lc_discrepancy_approval_requested_by: p.lcDiscrepancyApprovalRequestedBy || p.lc_discrepancy_approval_requested_by || null,
    lc_discrepancy_approved_at: p.lcDiscrepancyApprovedAt || p.lc_discrepancy_approved_at || null,
    lc_discrepancy_approved_by: p.lcDiscrepancyApprovedBy || p.lc_discrepancy_approved_by || null,
    lc_discrepancy_rejected_at: p.lcDiscrepancyRejectedAt || p.lc_discrepancy_rejected_at || null,
    lc_discrepancy_rejected_by: p.lcDiscrepancyRejectedBy || p.lc_discrepancy_rejected_by || null,
    lc_maturity_date: p.lcMaturityDate || p.lc_maturity_date || null,
    acceptance_status: p.acceptanceStatus || p.acceptance_status || null,
    acceptance_date: p.acceptanceDate || p.acceptance_date || null,
    acceptance_maturity_date: p.acceptanceMaturityDate || p.acceptance_maturity_date || null,
    supplier_balance_confirmed_at: p.supplierBalanceConfirmedAt || p.supplier_balance_confirmed_at || null,
    supplier_balance_confirmed_by: p.supplierBalanceConfirmedBy || p.supplier_balance_confirmed_by || null,
    bank_submitted_at: p.bankSubmittedAt || p.bank_submitted_at || null,
    bank_submitted_by: p.bankSubmittedBy || p.bank_submitted_by || null,
    booking_responsibility: p.bookingResponsibility || p.booking_responsibility || null,
    freight_confirmation_required: Boolean(p.freightConfirmationRequired || p.freight_confirmation_required || false),
    freight_confirmed_by_customer_at: p.freightConfirmedByCustomerAt || p.freight_confirmed_by_customer_at || null,
    booking_status: p.bookingStatus || p.booking_status || 'pending',
    freight_inquiry_status: p.freightInquiryStatus || p.freight_inquiry_status || 'pending',
    selected_booking_quote_id: p.selectedBookingQuoteId || p.selected_booking_quote_id || null,
    shipping_order_status: p.shippingOrderStatus || p.shipping_order_status || 'pending',
    customer_payment_received_at: p.customerPaymentReceivedAt || p.customer_payment_received_at || null,
    customer_payment_confirmed_at: p.customerPaymentConfirmedAt || p.customer_payment_confirmed_at || null,
    finance_confirmed_received_by: p.financeConfirmedReceivedBy || p.finance_confirmed_received_by || null,
    bank_submission_status: p.bankSubmissionStatus || p.bank_submission_status || 'not_required',
    document_release_status: p.documentReleaseStatus || p.document_release_status || 'pending',
    document_released_at: p.documentReleasedAt || p.document_released_at || null,
    document_released_by: p.documentReleasedBy || p.document_released_by || null,
    fulfillment_mode: p.fulfillmentMode || p.fulfillment_mode || null,
    consolidation_required: Boolean(p.consolidationRequired || p.consolidation_required || false),
    loading_supervision_mode: p.loadingSupervisionMode || p.loading_supervision_mode || null,
    loading_supervision_agency_name: p.loadingSupervisionAgencyName || p.loading_supervision_agency_name || null,
    loading_supervision_required: Boolean(p.loadingSupervisionRequired || p.loading_supervision_required || false),
    loading_supervision_feedback_status: p.loadingSupervisionFeedbackStatus || p.loading_supervision_feedback_status || 'pending',
    shipment_readiness_status: p.shipmentReadinessStatus || p.shipment_readiness_status || 'pending',
    remarks: p.executionRemarks || p.execution_remarks || p.remarks || null,
  }
}

function mergePOExecution(r: any) {
  const executionRaw = Array.isArray(r?.purchase_order_execution)
    ? r.purchase_order_execution[0]
    : r?.purchase_order_execution
  if (!executionRaw) return {}
  return {
    executionStatus: executionRaw.execution_status || undefined,
    supplierConfirmedAt: executionRaw.supplier_confirmed_at || undefined,
    supplierRejectedAt: executionRaw.supplier_rejected_at || undefined,
    supplierReplyNotes: executionRaw.supplier_reply_notes || undefined,
    sampleRequired: executionRaw.sample_required ?? false,
    preProductionSampleStatus: executionRaw.pre_production_sample_status || undefined,
    preProductionSampleNo: executionRaw.pre_production_sample_no || undefined,
    sampleRound: executionRaw.sample_round || undefined,
    preProductionSampleSentAt: executionRaw.pre_production_sample_sent_at || undefined,
    sampleConfirmedAt: executionRaw.sample_confirmed_at || undefined,
    sealConfirmedAt: executionRaw.seal_confirmed_at || undefined,
    sealStatus: executionRaw.seal_status || undefined,
    sealedSampleRef: executionRaw.sealed_sample_ref || undefined,
    sealedSampleVersion: executionRaw.sealed_sample_version || undefined,
    sealedSampleUploadedAt: executionRaw.sealed_sample_uploaded_at || undefined,
    sealedSampleUploadedBy: executionRaw.sealed_sample_uploaded_by || undefined,
    sealedSampleConfirmedAt: executionRaw.sealed_sample_confirmed_at || undefined,
    sealedSampleConfirmedBy: executionRaw.sealed_sample_confirmed_by || undefined,
    sealInvalidatedAt: executionRaw.seal_invalidated_at || undefined,
    sealInvalidatedBy: executionRaw.seal_invalidated_by || undefined,
    sealInvalidatedReason: executionRaw.seal_invalidated_reason || undefined,
    productionStartedAt: executionRaw.production_started_at || undefined,
    estimatedCompletionDate: executionRaw.estimated_completion_date || undefined,
    productionCompletedAt: executionRaw.production_completed_at || undefined,
    supplierSelfInspectionStatus: executionRaw.supplier_self_inspection_status || undefined,
    qcInspectionStatus: executionRaw.qc_inspection_status || undefined,
    qcReleaseStatus: executionRaw.qc_release_status || undefined,
    qcReleaseBlockReason: executionRaw.qc_release_block_reason || undefined,
    releaseApprovedBy: executionRaw.release_approved_by || undefined,
    inspectionExecutionMode: executionRaw.inspection_execution_mode || undefined,
    customerDesignatedInspectionAgency: executionRaw.customer_designated_inspection_agency || undefined,
    customerDesignatedInspectionStatus: executionRaw.customer_designated_inspection_status || undefined,
    finishedGoodsConfirmedAt: executionRaw.finished_goods_confirmed_at || undefined,
    customerInspectionMode: executionRaw.customer_inspection_mode || undefined,
    goodsReadyNotifiedToCustomerAt: executionRaw.goods_ready_notified_to_customer_at || undefined,
    inspectionMethodNotifiedAt: executionRaw.inspection_method_notified_at || undefined,
    qcReportSharedToCustomerAt: executionRaw.qc_report_shared_to_customer_at || undefined,
    customerBalanceStatus: executionRaw.customer_balance_status || undefined,
    supplierBalanceStatus: executionRaw.supplier_balance_status || undefined,
    collectionControlMode: executionRaw.collection_control_mode || undefined,
    documentReleaseMode: executionRaw.document_release_mode || undefined,
    customerBalanceGateStatus: executionRaw.customer_balance_gate_status || undefined,
    customerBalanceConfirmedAt: executionRaw.customer_balance_confirmed_at || undefined,
    lcType: executionRaw.lc_type || undefined,
    lcOpenedAt: executionRaw.lc_opened_at || undefined,
    lcDiscrepancyStatus: executionRaw.lc_discrepancy_status || undefined,
    lcDiscrepancyNotes: executionRaw.lc_discrepancy_notes || undefined,
    lcDiscrepancyRecordedAt: executionRaw.lc_discrepancy_recorded_at || undefined,
    lcDiscrepancyRecordedBy: executionRaw.lc_discrepancy_recorded_by || undefined,
    lcDiscrepancyApprovalStatus: executionRaw.lc_discrepancy_approval_status || undefined,
    lcDiscrepancyApprovalRequestedAt: executionRaw.lc_discrepancy_approval_requested_at || undefined,
    lcDiscrepancyApprovalRequestedBy: executionRaw.lc_discrepancy_approval_requested_by || undefined,
    lcDiscrepancyApprovedAt: executionRaw.lc_discrepancy_approved_at || undefined,
    lcDiscrepancyApprovedBy: executionRaw.lc_discrepancy_approved_by || undefined,
    lcDiscrepancyRejectedAt: executionRaw.lc_discrepancy_rejected_at || undefined,
    lcDiscrepancyRejectedBy: executionRaw.lc_discrepancy_rejected_by || undefined,
    lcMaturityDate: executionRaw.lc_maturity_date || undefined,
    acceptanceStatus: executionRaw.acceptance_status || undefined,
    acceptanceDate: executionRaw.acceptance_date || undefined,
    acceptanceMaturityDate: executionRaw.acceptance_maturity_date || undefined,
    supplierBalanceConfirmedAt: executionRaw.supplier_balance_confirmed_at || undefined,
    supplierBalanceConfirmedBy: executionRaw.supplier_balance_confirmed_by || undefined,
    bankSubmittedAt: executionRaw.bank_submitted_at || undefined,
    bankSubmittedBy: executionRaw.bank_submitted_by || undefined,
    bookingResponsibility: executionRaw.booking_responsibility || undefined,
    freightConfirmationRequired: executionRaw.freight_confirmation_required ?? false,
    freightConfirmedByCustomerAt: executionRaw.freight_confirmed_by_customer_at || undefined,
    bookingStatus: executionRaw.booking_status || undefined,
    freightInquiryStatus: executionRaw.freight_inquiry_status || undefined,
    selectedBookingQuoteId: executionRaw.selected_booking_quote_id || undefined,
    shippingOrderStatus: executionRaw.shipping_order_status || undefined,
    customerPaymentReceivedAt: executionRaw.customer_payment_received_at || undefined,
    customerPaymentConfirmedAt: executionRaw.customer_payment_confirmed_at || undefined,
    financeConfirmedReceivedBy: executionRaw.finance_confirmed_received_by || undefined,
    bankSubmissionStatus: executionRaw.bank_submission_status || undefined,
    documentReleaseStatus: executionRaw.document_release_status || undefined,
    documentReleasedAt: executionRaw.document_released_at || undefined,
    documentReleasedBy: executionRaw.document_released_by || undefined,
    fulfillmentMode: executionRaw.fulfillment_mode || undefined,
    consolidationRequired: executionRaw.consolidation_required ?? false,
    loadingSupervisionMode: executionRaw.loading_supervision_mode || undefined,
    loadingSupervisionAgencyName: executionRaw.loading_supervision_agency_name || undefined,
    loadingSupervisionRequired: executionRaw.loading_supervision_required ?? false,
    loadingSupervisionFeedbackStatus: executionRaw.loading_supervision_feedback_status || undefined,
    shipmentReadinessStatus: executionRaw.shipment_readiness_status || undefined,
    executionRemarks: executionRaw.remarks || undefined,
  }
}

function toPORow(p: any, deps: DependencyBag) {
  const ownerFields = normalizeOwnerFields(p, {
    canonicalizeEmail: canonicalizePersonnelEmail,
    region: p.region || p.region_code,
  })
  const commercialTerms = normalizeTradeTerms(p)
  const workflowFields = derivePurchaseOrderWorkflowFields(p)
  const existingRenderMeta = p.documentRenderMeta || p.document_render_meta || {}
  const procurementLinkage = {
    sourceRef: String(p.sourceRef || p.source_ref || '').trim() || null,
    sourceSONumber: String(p.sourceSONumber || p.source_so_number || '').trim() || null,
    salesContractNumber: String(p.salesContractNumber || p.sales_contract_number || '').trim() || null,
    quotationNumber: String(p.quotationNumber || p.quotation_number || '').trim() || null,
  }
  return {
    id: deps.toUUID(p.id),
    po_number: p.poNumber || p.po_number || '',
    requirement_no: p.requirementNo || p.requirement_no || null,
    xj_number: p.xjNumber || p.xj_number || null,
    supplier_code: p.supplierCode || p.supplier_code || '',
    supplier_name: p.supplierName || p.supplier_name || '',
    supplier_email: p.supplierEmail || p.supplier_email || '',
    region_code: deps.toRegionCode(p.region || p.region_code),
    items: p.items || p.products || [],
    total_amount: p.totalAmount || p.total_amount || 0,
    currency: p.currency || 'USD',
    payment_mode: p.paymentMode || p.payment_mode || null,
    payment_terms: p.paymentTerms || p.payment_terms || null,
    delivery_terms: commercialTerms.delivery_terms,
    expected_delivery_date: deps.toIsoDate(p.expectedDeliveryDate || p.expected_delivery_date),
    status: p.status || 'draft',
    notes: p.notes || p.remarks || null,
    created_by: deps.toUUIDOrNull(p.createdBy || p.created_by || null),
    owner_user_id: deps.toUUIDOrNull(ownerFields.owner_user_id),
    owner_email: ownerFields.owner_email,
    owner_name: ownerFields.owner_name,
    owner_role: ownerFields.owner_role,
    operator_user_id: deps.toUUIDOrNull(p.operatorUserId || p.operator_user_id || null),
    operator_email: canonicalizePersonnelEmail(p.operatorEmail || p.operator_email || '', p.region || p.region_code) || null,
    operator_role: p.operatorRole || p.operator_role || null,
    acting_user_id: deps.toUUIDOrNull(p.actingUserId || p.acting_user_id || null),
    acting_user_email: canonicalizePersonnelEmail(p.actingUserEmail || p.acting_user_email || '', p.region || p.region_code) || null,
    acting_user_role: p.actingUserRole || p.acting_user_role || null,
    authenticated_user_id: deps.toUUIDOrNull(p.authenticatedUserId || p.authenticated_user_id || null),
    authenticated_user_email: canonicalizePersonnelEmail(p.authenticatedUserEmail || p.authenticated_user_email || '', p.region || p.region_code) || null,
    authenticated_user_role: p.authenticatedUserRole || p.authenticated_user_role || null,
    cg_number: p.cgNumber || p.cg_number || p.poNumber || p.po_number || null,
    parent_request_po_number: p.parentRequestPoNumber || p.parent_request_po_number || null,
    pending_supplier_po_numbers: p.pendingSupplierPONumbers || p.pending_supplier_po_numbers || null,
    allocated_supplier_count: p.allocatedSupplierCount ?? p.allocated_supplier_count ?? null,
    supplier_allocation_ready: p.supplierAllocationReady ?? p.supplier_allocation_ready ?? false,
    document_type: p.documentType || p.document_type || workflowFields.documentType,
    approval_status: p.approvalStatus || p.approval_status || workflowFields.approvalStatus,
    execution_status: p.executionStatus || p.execution_status || workflowFields.executionStatus,
    procurement_request_status: p.procurementRequestStatus || p.procurement_request_status || null,
    pr_validation_status: p.prValidationStatus || p.pr_validation_status || null,
    pr_validated_at: p.prValidatedAt || p.pr_validated_at || null,
    pr_validated_by: p.prValidatedBy || p.pr_validated_by || null,
    cg_type: p.cgType || p.cg_type || null,
    selected_bj_id: p.selectedBjId || p.selected_bj_id || null,
    bj_locked_at: p.bjLockedAt || p.bj_locked_at || null,
    template_id: p.templateId || p.template_id || null,
    template_version_id: p.templateVersionId || p.template_version_id || null,
    template_snapshot: p.templateSnapshot || p.template_snapshot || {},
    document_data_snapshot: p.documentDataSnapshot || p.document_data_snapshot || {},
    document_render_meta: {
      ...existingRenderMeta,
      procurementLinkage,
      procurementWorkflow: {
        ...(existingRenderMeta?.procurementWorkflow || {}),
        documentType: workflowFields.documentType,
        approvalStatus: workflowFields.approvalStatus,
        executionStatus: workflowFields.executionStatus,
      },
    },
  }
}

function fromPORow(r: any, deps: DependencyBag) {
  if (!r) return null
  const commercialTerms = normalizeTradeTerms(r)
  const workflowFields = derivePurchaseOrderWorkflowFields(r)
  const procurementLinkage = r.document_render_meta?.procurementLinkage || {}
  const normalizedCreatedDate = String(
    r.created_at ||
    r.createdAt ||
    r.updated_at ||
    r.updatedAt ||
    '',
  ).split('T')[0]
  const normalizedExpectedDate = String(
    r.expected_date ||
    r.expected_delivery_date ||
    r.expectedDeliveryDate ||
    '',
  ).split('T')[0]
  return {
    id: r.id,
    poNumber: r.po_number,
    requirementNo: r.requirement_no,
    xjNumber: r.xj_number,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierEmail: r.supplier_email,
    region: deps.fromRegionCode(r.region_code),
    items: r.items || [],
    totalAmount: r.total_amount || 0,
    currency: r.currency || 'USD',
    paymentMode: r.payment_mode || undefined,
    paymentTerms: r.payment_terms,
    deliveryTerms: commercialTerms.delivery_terms,
    incoterm: commercialTerms.incoterm,
    sourceRef: r.source_ref || procurementLinkage.sourceRef || null,
    sourceSONumber: r.source_so_number || procurementLinkage.sourceSONumber || null,
    salesContractNumber: r.sales_contract_number || procurementLinkage.salesContractNumber || null,
    quotationNumber: r.quotation_number || procurementLinkage.quotationNumber || null,
    orderDate: normalizedCreatedDate,
    expectedDate: normalizedExpectedDate,
    expectedDeliveryDate: r.expected_delivery_date,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    ownerUserId: r.owner_user_id || null,
    ownerEmail: canonicalizePersonnelEmail(r.owner_email || '', r.region_code) || null,
    ownerName: r.owner_name || null,
    ownerRole: r.owner_role || null,
    operatorUserId: r.operator_user_id || null,
    operatorEmail: canonicalizePersonnelEmail(r.operator_email || '', r.region_code) || null,
    operatorRole: r.operator_role || null,
    actingUserId: r.acting_user_id || null,
    actingUserEmail: canonicalizePersonnelEmail(r.acting_user_email || '', r.region_code) || null,
    actingUserRole: r.acting_user_role || null,
    authenticatedUserId: r.authenticated_user_id || null,
    authenticatedUserEmail: canonicalizePersonnelEmail(r.authenticated_user_email || '', r.region_code) || null,
    authenticatedUserRole: r.authenticated_user_role || null,
    cgNumber: r.cg_number || r.po_number,
    parentRequestPoNumber: r.parent_request_po_number || undefined,
    pendingSupplierPONumbers: r.pending_supplier_po_numbers || undefined,
    allocatedSupplierCount: r.allocated_supplier_count ?? undefined,
    supplierAllocationReady: r.supplier_allocation_ready ?? false,
    procurementRequestStatus: r.procurement_request_status || undefined,
    documentType: r.document_type || workflowFields.documentType,
    approvalStatus: r.approval_status || workflowFields.approvalStatus,
    prValidationStatus: r.pr_validation_status || undefined,
    prValidatedAt: r.pr_validated_at || undefined,
    prValidatedBy: r.pr_validated_by || undefined,
    cgType: r.cg_type || undefined,
    selectedBjId: r.selected_bj_id || undefined,
    bjLockedAt: r.bj_locked_at || undefined,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdDate: normalizedCreatedDate,
    createdAt: r.created_at,
    updatedDate: r.updated_at,
    updatedAt: r.updated_at,
    ...mergePOExecution(r),
    executionStatus: mergePOExecution(r).executionStatus || r.execution_status || workflowFields.executionStatus || undefined,
  }
}

function toPRRow(p: any, deps: DependencyBag) {
  const reqNo = p.requirementNo || p.requirementNumber || p.requirement_no || p.qr_number || ''
  const createdByRaw = p.createdBy || p.created_by || null
  const createdBy = (createdByRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdByRaw))
    ? createdByRaw : null
  const rawDate = p.requiredDate || p.required_date || null
  const requiredDate = rawDate ? String(rawDate).split('T')[0] : null
  const context = extractProcurementRequestContext(p)
  const commercialTerms = {
    ...(context.commercialTerms || {}),
    ...(p.commercialTerms || {}),
    expectedQuoteDate: p.expectedQuoteDate || p.expected_quote_date || context.commercialTerms?.expectedQuoteDate || null,
    deliveryDate: p.deliveryDate || p.delivery_date || context.commercialTerms?.deliveryDate || null,
    tradeTerms: normalizeTradeTerms({
      ...context.commercialTerms,
      ...p,
    }).trade_terms,
    paymentTerms: p.paymentTerms || p.payment_terms || context.commercialTerms?.paymentTerms || null,
    targetCostRange: p.targetCostRange || p.target_cost_range || context.commercialTerms?.targetCostRange || null,
    qualityRequirements: p.qualityRequirements || p.quality_requirements || context.commercialTerms?.qualityRequirements || null,
    packagingRequirements: p.packagingRequirements || p.packaging_requirements || context.commercialTerms?.packagingRequirements || null,
    remarks: p.remarks || context.commercialTerms?.remarks || null,
  }
  const customerInfo = mergeCustomerInfoWithProcurementContext(
    p.customer || p.customer_info || null,
    {
      customerRequirements: p.customerRequirements || context.customerRequirements || null,
      commercialTerms,
      downstreamVisibility: p.downstreamVisibility || context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
    },
  )

  const ownerFields = normalizeOwnerFields(p, {
    canonicalizeEmail: canonicalizePersonnelEmail,
    region: p.region,
    emailFallbacks: [p.requestedBy],
    nameFallbacks: [p.requestedByName],
  })
  return {
    id: deps.toUUID(p.id),
    requirement_no: reqNo,
    source_inquiry_number: p.sourceInquiryNumber || p.source_inquiry_number || null,
    source_so_number: p.sourceSoNumber || p.source_so_number || null,
    region: p.region || null,
    urgency: p.urgency || 'medium',
    required_date: requiredDate,
    items: (p.items || p.products || []).map((item: any) => ({
      ...item,
      id: (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)))
        ? item.id
        : crypto.randomUUID(),
    })),
    status: (['pending','in_progress','completed','cancelled','partial','processing','submitted','quoted','draft'].includes(p.status) ? p.status : 'pending'),
    notes: p.notes || p.specialRequirements || p.special_requirements || commercialTerms.remarks || null,
    purchaser_feedback: p.purchaserFeedback || p.purchaser_feedback || null,
    pushed_to_quotation: p.pushedToQuotation ?? p.pushed_to_quotation ?? false,
    pushed_to_quotation_at: p.pushedToQuotationDate || p.pushed_to_quotation_at || null,
    pushed_by: p.pushedBy || p.pushed_by || null,
    quotation_number: p.quotationNumber || p.quotation_number || null,
    created_by: createdBy,
    owner_user_id: deps.toUUIDOrNull(ownerFields.owner_user_id),
    owner_email: ownerFields.owner_email,
    owner_name: ownerFields.owner_name,
    owner_role: ownerFields.owner_role,
    operator_user_id: deps.toUUIDOrNull(p.operatorUserId || p.operator_user_id || null),
    operator_email: canonicalizePersonnelEmail(p.operatorEmail || p.operator_email || '', p.region) || null,
    operator_role: p.operatorRole || p.operator_role || null,
    acting_user_id: deps.toUUIDOrNull(p.actingUserId || p.acting_user_id || null),
    acting_user_email: canonicalizePersonnelEmail(p.actingUserEmail || p.acting_user_email || '', p.region) || null,
    acting_user_role: p.actingUserRole || p.acting_user_role || null,
    authenticated_user_id: deps.toUUIDOrNull(p.authenticatedUserId || p.authenticated_user_id || null),
    authenticated_user_email: canonicalizePersonnelEmail(p.authenticatedUserEmail || p.authenticated_user_email || '', p.region) || null,
    authenticated_user_role: p.authenticatedUserRole || p.authenticated_user_role || null,
    assigned_to: ownerFields.assigned_to,
    qr_number: reqNo || null,
    display_number: reqNo || null,
    customer_info: customerInfo,
    template_id: p.templateId || p.template_id || null,
    template_version_id: p.templateVersionId || p.template_version_id || null,
    template_snapshot: p.templateSnapshot || p.template_snapshot || {},
    document_data_snapshot: p.documentDataSnapshot || p.document_data_snapshot || {},
    document_render_meta: p.documentRenderMeta || p.document_render_meta || {},
  }
}

function fromPRRow(r: any) {
  if (!r) return null
  const customerInfo = r.customer_info || null
  const context = extractProcurementRequestContext({ customer_info: customerInfo })
  const commercialTerms = normalizeTradeTerms(context.commercialTerms || {})
  return {
    id: r.id,
    requirementNo: r.requirement_no || r.qr_number || '',
    requirementNumber: r.requirement_no || r.qr_number || '',
    sourceInquiryNumber: r.source_inquiry_number,
    sourceSoNumber: r.source_so_number,
    region: r.region,
    urgency: r.urgency || 'medium',
    requiredDate: r.required_date,
    items: r.items || [],
    status: r.status || 'pending',
    notes: r.notes,
    specialRequirements: r.notes,
    expectedQuoteDate: context.commercialTerms?.expectedQuoteDate || null,
    deliveryDate: context.commercialTerms?.deliveryDate || null,
    tradeTerms: commercialTerms.trade_terms,
    incoterm: commercialTerms.incoterm,
    paymentTerms: context.commercialTerms?.paymentTerms || null,
    targetCostRange: context.commercialTerms?.targetCostRange || null,
    qualityRequirements: context.commercialTerms?.qualityRequirements || null,
    packagingRequirements: context.commercialTerms?.packagingRequirements || null,
    remarks: context.commercialTerms?.remarks || r.notes || null,
    commercialTerms: context.commercialTerms || null,
    customerRequirements: context.customerRequirements || null,
    downstreamVisibility: context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
    purchaserFeedback: r.purchaser_feedback || null,
    pushedToQuotation: r.pushed_to_quotation || false,
    pushedToQuotationDate: r.pushed_to_quotation_at || null,
    pushedBy: r.pushed_by || null,
    quotationNumber: r.quotation_number || null,
    createdBy: r.created_by,
    requestedBy: canonicalizePersonnelEmail(r.requested_by || r.owner_email || '', r.region) || null,
    requestedByName: r.requested_by_name || r.owner_name || null,
    ownerUserId: r.owner_user_id || null,
    ownerEmail: canonicalizePersonnelEmail(r.owner_email || '', r.region) || null,
    ownerName: r.owner_name || null,
    ownerRole: r.owner_role || null,
    operatorUserId: r.operator_user_id || null,
    operatorEmail: canonicalizePersonnelEmail(r.operator_email || '', r.region) || null,
    operatorRole: r.operator_role || null,
    actingUserId: r.acting_user_id || null,
    actingUserEmail: canonicalizePersonnelEmail(r.acting_user_email || '', r.region) || null,
    actingUserRole: r.acting_user_role || null,
    authenticatedUserId: r.authenticated_user_id || null,
    authenticatedUserEmail: canonicalizePersonnelEmail(r.authenticated_user_email || '', r.region) || null,
    authenticatedUserRole: r.authenticated_user_role || null,
    assignedTo: r.assigned_to,
    createdDate: r.created_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: customerInfo || null,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  }
}

export function createPurchaseOrderService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_execution(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll purchase_orders', error)
      return (data || []).map((row: any) => fromPORow(row, deps))
    },
    async getById(id: string) {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_execution(*)')
        .eq('id', id)
        .single()
      if (error) deps.throwSupabaseError('getById purchase_order', error)
      return fromPORow(data, deps)
    },
    async upsert(p: any) {
      const purchaseOrderId = deps.toUUID(p.id)
      const { data: beforeRow } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .maybeSingle()
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(p, {
        documentCode: 'CG',
        nodeCode: 'cg-create',
        businessData: p.documentDataSnapshot || p.document_data_snapshot || p,
      })
      const row = toPORow({ ...p, ...templateBinding }, deps)
      const { data, error } = await deps.upsertWithSchemaFallback(
        'purchase_orders',
        row,
        'id',
        'upsert purchase_order',
      )
      if (error) deps.throwSupabaseError('upsert purchase_order', error)
      const executionRow = toPOExecutionRow({ ...p, ...templateBinding }, deps, data?.id)
      if (executionRow) {
        const { error: executionError } = await supabase
          .from('purchase_order_execution')
          .upsert(executionRow, { onConflict: 'purchase_order_id' })
        if (executionError) deps.throwSupabaseError('upsert purchase_order_execution', executionError)
      }
      const { data: hydrated, error: hydratedError } = await supabase
        .from('purchase_orders')
        .select('*, purchase_order_execution(*)')
        .eq('id', data.id)
        .single()
      if (hydratedError) deps.throwSupabaseError('reload purchase_order with execution', hydratedError)
      await auditLogService.logEntityChange({
        entityType: 'purchase_order',
        entityId: data?.id || purchaseOrderId,
        action: beforeRow ? 'update' : 'create',
        before: beforeRow,
        after: data,
        actor: {
          actorId: p.authenticatedUserId || p.authenticated_user_id || p.actingUserId || p.acting_user_id || p.operatorUserId || p.operator_user_id || p.ownerUserId || p.owner_user_id || null,
          actorEmail: p.authenticatedUserEmail || p.authenticated_user_email || p.actingUserEmail || p.acting_user_email || p.operatorEmail || p.operator_email || p.ownerEmail || p.owner_email || null,
          actorRole: p.authenticatedUserRole || p.authenticated_user_role || p.actingUserRole || p.acting_user_role || p.operatorRole || p.operator_role || p.ownerRole || p.owner_role || null,
        },
      })
      return fromPORow(hydrated, deps)
    },
    async delete(id: string) {
      const { error } = await supabase.from('purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) deps.throwSupabaseError('delete purchase_order', error)
    },
    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('purchase_orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, callback)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_order_execution' }, callback)
        .subscribe()
    },
  }
}

export function createQuoteRequirementService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await withServiceTimeout(
        supabase.from('quote_requirements').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        12000,
        '加载成本询报列表',
      )
      if (error) deps.throwSupabaseError('getAll quote_requirements', error)
      return (data || []).map(fromPRRow)
    },
    async upsert(p: any) {
      return await withServiceTimeout(
        (async () => {
          const businessData = p.documentDataSnapshot || p.document_data_snapshot || p
          let templateBinding: Record<string, any>
          try {
            templateBinding = await withServiceTimeout(
              deps.resolveBusinessDocumentTemplateBinding(p, {
                documentCode: 'QR',
                nodeCode: 'qr-create',
                businessData,
              }),
              2500,
              `QR ${p?.requirementNo || p?.id || ''} 模板绑定`,
            )
          } catch (error) {
            console.warn('[QuoteRequirement] template binding unavailable, saving QR with pending template binding.', error)
            templateBinding = createPendingTemplateBinding('QR', 'qr-create', businessData, error)
          }
          const row = toPRRow({ ...p, ...templateBinding }, deps)
          const { data, error } = await deps.upsertWithSchemaFallback(
            'quote_requirements',
            row,
            'id',
            'upsert quote_requirement',
          )
          if (error) deps.throwSupabaseError('upsert quote_requirement', error)
          return fromPRRow(data)
        })(),
        12000,
        `QR ${p?.requirementNo || p?.id || ''} 写入`,
      )
    },
    async delete(id: string) {
      const { error } = await withServiceTimeout(
        supabase.from('quote_requirements').update({ deleted_at: new Date().toISOString() }).eq('id', id),
        12000,
        '删除成本询报',
      )
      if (error) deps.throwSupabaseError('delete quote_requirement', error)
    },
    subscribeToChanges(callback: (payload: any) => void) {
      return supabase.channel('quote_requirements_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requirements' }, callback).subscribe()
    },
  }
}
