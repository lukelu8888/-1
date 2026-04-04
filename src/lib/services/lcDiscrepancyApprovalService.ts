import { purchaseOrderExecutionStatusService } from './purchaseOrderExecutionStatusService'

function resolvePurchaseOrderId(request: any) {
  return String(
    request?.relatedDocument?.purchaseOrderId ||
    request?.relatedDocument?.purchase_order_id ||
    request?.relatedDocument?.id ||
    request?.relatedDocumentId ||
    '',
  ).trim()
}

function resolveDiscrepancyNotes(request: any, fallbackComment?: string) {
  return String(
    request?.relatedDocument?.lcDiscrepancyNotes ||
    request?.relatedDocument?.lc_discrepancy_notes ||
    request?.relatedDocument?.notes ||
    fallbackComment ||
    '',
  ).trim() || null
}

export const lcDiscrepancyApprovalService = {
  async applyApprovalOutcome(request: any, approved: boolean, actorEmail: string, comment?: string) {
    const purchaseOrderId = resolvePurchaseOrderId(request)
    if (!purchaseOrderId) {
      throw new Error('未找到 L/C 不符点关联采购单')
    }

    return purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(purchaseOrderId, {
      lcDiscrepancyStatus: approved ? 'waived' : 'open',
      lcDiscrepancyNotes: resolveDiscrepancyNotes(request, comment),
      lcDiscrepancyApprovalStatus: approved ? 'approved' : 'rejected',
      lcDiscrepancyApprovedAt: approved ? new Date().toISOString() : null,
      lcDiscrepancyApprovedBy: approved ? actorEmail : null,
      lcDiscrepancyRejectedAt: approved ? null : new Date().toISOString(),
      lcDiscrepancyRejectedBy: approved ? null : actorEmail,
      documentReleaseStatus: approved ? undefined : 'blocked',
    })
  },
}
