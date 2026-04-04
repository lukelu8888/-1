export type SealStatus =
  | 'not_required'
  | 'pending'
  | 'sealed'
  | 'uploaded'
  | 'confirmed'
  | 'invalidated'

export type LcDiscrepancyApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected'

function normalizeText(value: unknown) {
  return String(value || '').trim()
}

function isProductionExecutionStatus(value: unknown) {
  const text = normalizeText(value).toLowerCase()
  return [
    'production',
    'production_in_progress',
    'in_production',
    'preparing_production',
  ].includes(text)
}

export function normalizeSealStatus(value: unknown): SealStatus {
  const text = normalizeText(value).toLowerCase()
  if (['pending', 'sealed', 'uploaded', 'confirmed', 'invalidated'].includes(text)) {
    return text as SealStatus
  }
  return 'not_required'
}

export function normalizeLcDiscrepancyApprovalStatus(value: unknown): LcDiscrepancyApprovalStatus {
  const text = normalizeText(value).toLowerCase()
  if (['pending', 'approved', 'rejected'].includes(text)) {
    return text as LcDiscrepancyApprovalStatus
  }
  return 'not_required'
}

export function buildSealGovernancePatch(input: any, existing?: any) {
  const sampleRequired = Boolean(
    input?.sampleRequired ??
    input?.sample_required ??
    existing?.sample_required ??
    false,
  )
  const explicitSealStatus = input?.sealStatus ?? input?.seal_status
  const productionStartedAt = input?.productionStartedAt ?? input?.production_started_at
  const executionStatus = input?.executionStatus ?? input?.execution_status
  const sealConfirmedAt = input?.sealConfirmedAt ?? input?.seal_confirmed_at
  const sealUploadedAt = input?.sealedSampleUploadedAt ?? input?.sealed_sample_uploaded_at
  const sealInvalidatedAt = input?.sealInvalidatedAt ?? input?.seal_invalidated_at

  let sealStatus = explicitSealStatus != null
    ? normalizeSealStatus(explicitSealStatus)
    : normalizeSealStatus(existing?.seal_status)

  if (!sampleRequired && sealStatus === 'not_required') {
    return { sealStatus, sampleRequired }
  }

  if (!sampleRequired) {
    sealStatus = 'not_required'
  } else if (sealInvalidatedAt) {
    sealStatus = 'invalidated'
  } else if (sealConfirmedAt) {
    sealStatus = 'confirmed'
  } else if (sealUploadedAt) {
    sealStatus = 'uploaded'
  } else if (sealStatus === 'not_required' || !sealStatus) {
    sealStatus = 'pending'
  }

  if ((productionStartedAt || isProductionExecutionStatus(executionStatus)) && sampleRequired && !['confirmed'].includes(sealStatus)) {
    throw new Error('当前订单尚无有效封样，禁止进入量产')
  }

  return { sealStatus, sampleRequired }
}

export function buildLcDiscrepancyApprovalPatch(input: {
  discrepancyStatus?: unknown
  approvalStatus?: unknown
  notes?: unknown
  actorEmail?: unknown
  approved?: boolean
}) {
  const discrepancyStatus = normalizeText(input.discrepancyStatus).toLowerCase()
  const notes = normalizeText(input.notes) || null
  const actorEmail = normalizeText(input.actorEmail) || null
  const now = new Date().toISOString()

  if (!discrepancyStatus || discrepancyStatus === 'none') {
    return {
      lc_discrepancy_status: 'none',
      lc_discrepancy_notes: null,
      lc_discrepancy_recorded_at: null,
      lc_discrepancy_recorded_by: null,
      lc_discrepancy_approval_status: 'not_required',
      lc_discrepancy_approval_requested_at: null,
      lc_discrepancy_approval_requested_by: null,
      lc_discrepancy_approved_at: null,
      lc_discrepancy_approved_by: null,
      lc_discrepancy_rejected_at: null,
      lc_discrepancy_rejected_by: null,
    }
  }

  const explicitApprovalStatus = normalizeLcDiscrepancyApprovalStatus(input.approvalStatus)
  const approvalStatus = explicitApprovalStatus !== 'not_required'
    ? explicitApprovalStatus
    : (input.approved == null ? 'pending' : input.approved ? 'approved' : 'rejected')

  return {
    lc_discrepancy_status: input.approved === true ? 'waived' : discrepancyStatus,
    lc_discrepancy_notes: notes,
    lc_discrepancy_recorded_at: now,
    lc_discrepancy_recorded_by: actorEmail,
    lc_discrepancy_approval_status: approvalStatus,
    lc_discrepancy_approval_requested_at: approvalStatus === 'pending' ? now : null,
    lc_discrepancy_approval_requested_by: approvalStatus === 'pending' ? actorEmail : null,
    lc_discrepancy_approved_at: approvalStatus === 'approved' ? now : null,
    lc_discrepancy_approved_by: approvalStatus === 'approved' ? actorEmail : null,
    lc_discrepancy_rejected_at: approvalStatus === 'rejected' ? now : null,
    lc_discrepancy_rejected_by: approvalStatus === 'rejected' ? actorEmail : null,
  }
}
