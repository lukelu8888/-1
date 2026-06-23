import { supabase } from '../supabase'
import {
  deriveCustomerPortalPaymentStatus,
  deriveShipmentReadiness,
} from './businessFieldNormalization'
import {
  buildExecutionRemarksWithMeta,
  parseExecutionRemarksMeta,
} from './shipmentWorkflowRiskService'
import {
  buildLcDiscrepancyApprovalPatch,
  buildSealGovernancePatch,
  normalizeLcDiscrepancyApprovalStatus,
} from './postContractGovernanceService'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

export const purchaseOrderExecutionStatusService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('purchase_order_execution')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .maybeSingle()
    if (error) throwServiceError('get purchase_order_execution status', error)
    if (!data) return null
    return {
      ...data,
      customer_portal_payment_status: deriveCustomerPortalPaymentStatus(data),
      shipment_readiness_status: deriveShipmentReadiness(data) || data.shipment_readiness_status || null,
    }
  },

  async upsertByPurchaseOrderId(purchaseOrderId: string, payload: any) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    const sealGovernance = buildSealGovernancePatch(payload, existing)
    const row: Record<string, any> = {
      purchase_order_id: purchaseOrderId,
      updated_at: new Date().toISOString(),
      seal_status: sealGovernance.sealStatus,
    }
    if (payload.executionStatus || payload.execution_status) {
      row.execution_status = payload.executionStatus || payload.execution_status
    }
    if (payload.supplierConfirmedAt || payload.supplier_confirmed_at) {
      row.supplier_confirmed_at = payload.supplierConfirmedAt || payload.supplier_confirmed_at
    }
    if (payload.supplierRejectedAt || payload.supplier_rejected_at) {
      row.supplier_rejected_at = payload.supplierRejectedAt || payload.supplier_rejected_at
    }
    if (payload.supplierReplyNotes || payload.supplier_reply_notes) {
      row.supplier_reply_notes = payload.supplierReplyNotes || payload.supplier_reply_notes
    }
    if (payload.supplierSelfInspectionStatus || payload.supplier_self_inspection_status) {
      row.supplier_self_inspection_status = payload.supplierSelfInspectionStatus || payload.supplier_self_inspection_status
    }
    if (payload.finishedGoodsConfirmedAt || payload.finished_goods_confirmed_at) {
      row.finished_goods_confirmed_at = payload.finishedGoodsConfirmedAt || payload.finished_goods_confirmed_at
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
    if (payload.sealedSampleRef || payload.sealed_sample_ref) {
      row.sealed_sample_ref = payload.sealedSampleRef || payload.sealed_sample_ref
    }
    if (payload.sealedSampleVersion || payload.sealed_sample_version) {
      row.sealed_sample_version = payload.sealedSampleVersion || payload.sealed_sample_version
    }
    if (payload.sealedSampleUploadedAt || payload.sealed_sample_uploaded_at) {
      row.sealed_sample_uploaded_at = payload.sealedSampleUploadedAt || payload.sealed_sample_uploaded_at
    }
    if (payload.sealedSampleUploadedBy || payload.sealed_sample_uploaded_by) {
      row.sealed_sample_uploaded_by = payload.sealedSampleUploadedBy || payload.sealed_sample_uploaded_by
    }
    if (payload.sealedSampleConfirmedAt || payload.sealed_sample_confirmed_at) {
      row.sealed_sample_confirmed_at = payload.sealedSampleConfirmedAt || payload.sealed_sample_confirmed_at
    }
    if (payload.sealedSampleConfirmedBy || payload.sealed_sample_confirmed_by) {
      row.sealed_sample_confirmed_by = payload.sealedSampleConfirmedBy || payload.sealed_sample_confirmed_by
    }
    if (payload.sealInvalidatedAt || payload.seal_invalidated_at) {
      row.seal_invalidated_at = payload.sealInvalidatedAt || payload.seal_invalidated_at
    }
    if (payload.sealInvalidatedBy || payload.seal_invalidated_by) {
      row.seal_invalidated_by = payload.sealInvalidatedBy || payload.seal_invalidated_by
    }
    if (payload.sealInvalidatedReason || payload.seal_invalidated_reason) {
      row.seal_invalidated_reason = payload.sealInvalidatedReason || payload.seal_invalidated_reason
    }
    if (payload.lcDiscrepancyApprovalStatus || payload.lc_discrepancy_approval_status) {
      row.lc_discrepancy_approval_status = normalizeLcDiscrepancyApprovalStatus(
        payload.lcDiscrepancyApprovalStatus || payload.lc_discrepancy_approval_status,
      )
    }
    if (payload.lcDiscrepancyNotes || payload.lc_discrepancy_notes) {
      row.lc_discrepancy_notes = payload.lcDiscrepancyNotes || payload.lc_discrepancy_notes
    }
    if (payload.lcDiscrepancyRecordedAt || payload.lc_discrepancy_recorded_at) {
      row.lc_discrepancy_recorded_at = payload.lcDiscrepancyRecordedAt || payload.lc_discrepancy_recorded_at
    }
    if (payload.lcDiscrepancyRecordedBy || payload.lc_discrepancy_recorded_by) {
      row.lc_discrepancy_recorded_by = payload.lcDiscrepancyRecordedBy || payload.lc_discrepancy_recorded_by
    }
    if (payload.lcDiscrepancyApprovalRequestedAt || payload.lc_discrepancy_approval_requested_at) {
      row.lc_discrepancy_approval_requested_at = payload.lcDiscrepancyApprovalRequestedAt || payload.lc_discrepancy_approval_requested_at
    }
    if (payload.lcDiscrepancyApprovalRequestedBy || payload.lc_discrepancy_approval_requested_by) {
      row.lc_discrepancy_approval_requested_by = payload.lcDiscrepancyApprovalRequestedBy || payload.lc_discrepancy_approval_requested_by
    }
    if (payload.lcDiscrepancyApprovedAt || payload.lc_discrepancy_approved_at) {
      row.lc_discrepancy_approved_at = payload.lcDiscrepancyApprovedAt || payload.lc_discrepancy_approved_at
    }
    if (payload.lcDiscrepancyApprovedBy || payload.lc_discrepancy_approved_by) {
      row.lc_discrepancy_approved_by = payload.lcDiscrepancyApprovedBy || payload.lc_discrepancy_approved_by
    }
    if (payload.lcDiscrepancyRejectedAt || payload.lc_discrepancy_rejected_at) {
      row.lc_discrepancy_rejected_at = payload.lcDiscrepancyRejectedAt || payload.lc_discrepancy_rejected_at
    }
    if (payload.lcDiscrepancyRejectedBy || payload.lc_discrepancy_rejected_by) {
      row.lc_discrepancy_rejected_by = payload.lcDiscrepancyRejectedBy || payload.lc_discrepancy_rejected_by
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

  async updateLcDiscrepancyByPurchaseOrderId(
    purchaseOrderId: string,
    payload: {
      status: 'none' | 'open' | 'resolved' | 'waived'
      notes?: string | null
      updatedBy?: string | null
    },
  ) {
    const existing = await this.getByPurchaseOrderId(purchaseOrderId)
    const meta = parseExecutionRemarksMeta(existing?.remarks)
    const lcDiscrepancy = payload.status === 'none'
      ? null
      : {
          status: payload.status,
          notes: String(payload.notes || '').trim() || null,
          updatedAt: new Date().toISOString(),
          updatedBy: payload.updatedBy || null,
          resolvedAt: payload.status === 'resolved' ? new Date().toISOString() : null,
        }

    const approvalPatch = buildLcDiscrepancyApprovalPatch({
      discrepancyStatus: payload.status,
      notes: payload.notes,
      actorEmail: payload.updatedBy,
      approvalStatus: payload.status === 'open' ? 'pending' : payload.status === 'none' ? 'not_required' : 'approved',
      approved: payload.status === 'waived' || payload.status === 'resolved' ? true : undefined,
    })

    return this.upsertByPurchaseOrderId(purchaseOrderId, {
      remarks: buildExecutionRemarksWithMeta(meta.plainText, { lcDiscrepancy }),
      ...approvalPatch,
    })
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
