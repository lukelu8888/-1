type NormalizeEmailFn = (email: string | null | undefined, region?: string | null | undefined) => string | null

function firstNonEmpty(...values: any[]): string | null {
  for (const value of values) {
    if (value == null) continue
    const text = String(value).trim()
    if (text) return text
  }
  return null
}

function firstPresentValue(...values: any[]) {
  for (const value of values) {
    if (value == null) continue
    if (typeof value === 'string') {
      const text = value.trim()
      if (text) return value
      continue
    }
    return value
  }
  return null
}

export function normalizeOwnerFields(
  input: any,
  options: {
    canonicalizeEmail: NormalizeEmailFn
    region?: string | null | undefined
    emailFallbacks?: any[]
    nameFallbacks?: any[]
    roleFallbacks?: any[]
  },
) {
  const region = options.region ?? input?.region ?? input?.region_code ?? null
  const ownerUserId = input?.ownerUserId || input?.owner_user_id || null
  const ownerEmail =
    options.canonicalizeEmail(
      firstNonEmpty(input?.ownerEmail, input?.owner_email, ...(options.emailFallbacks || [])),
      region,
    ) || null
  const ownerName = firstNonEmpty(input?.ownerName, input?.owner_name, ...(options.nameFallbacks || []))
  const ownerRole = firstNonEmpty(input?.ownerRole, input?.owner_role, ...(options.roleFallbacks || []))
  const assignedTo = firstNonEmpty(input?.assignedTo, input?.assigned_to, ownerEmail)

  return {
    owner_user_id: ownerUserId,
    owner_email: ownerEmail,
    owner_name: ownerName,
    owner_role: ownerRole,
    assigned_to: assignedTo,
  }
}

export function normalizeTradeTerms(input: any) {
  const incoterm = firstNonEmpty(
    input?.incoterm,
    input?.incoterms,
    input?.tradeTerms,
    input?.trade_terms,
    input?.deliveryTerms,
    input?.delivery_terms,
  )

  return {
    incoterm,
    trade_terms: firstNonEmpty(input?.tradeTerms, input?.trade_terms, incoterm),
    delivery_terms: firstNonEmpty(input?.deliveryTerms, input?.delivery_terms, incoterm),
  }
}

export function normalizeCustomerPaymentProofs(input: any) {
  return {
    customerPaymentProof: firstPresentValue(
      input?.customerPaymentProof,
      input?.customer_payment_proof,
      input?.depositProof,
      input?.deposit_proof,
      input?.depositPaymentProof,
      input?.deposit_payment_proof,
    ),
    balanceCustomerPaymentProof: firstPresentValue(
      input?.balanceCustomerPaymentProof,
      input?.balance_customer_payment_proof,
      input?.balanceProof,
      input?.balance_proof,
      input?.balancePaymentProof,
      input?.balance_payment_proof,
    ),
    financeReceiptProof: firstPresentValue(
      input?.financeReceiptProof,
      input?.finance_receipt_proof,
      input?.depositReceiptProof,
      input?.deposit_receipt_proof,
    ),
    financeBalanceReceiptProof: firstPresentValue(
      input?.financeBalanceReceiptProof,
      input?.finance_balance_receipt_proof,
      input?.balanceReceiptProof,
      input?.balance_receipt_proof,
    ),
  }
}

export function deriveApprovalRouting(input: any) {
  const approvalStatus = firstNonEmpty(input?.approvalStatus, input?.approval_status, input?.status) || 'draft'
  const approvalChain = Array.isArray(input?.approvalChain || input?.approval_chain)
    ? (input?.approvalChain || input?.approval_chain)
    : []
  const approvalFlow = (input?.approvalFlow || input?.approval_flow || {}) as Record<string, any>
  const approvalHistory = Array.isArray(input?.approvalHistory || input?.approval_history)
    ? (input?.approvalHistory || input?.approval_history)
    : []

  const explicitCurrentStep = firstNonEmpty(approvalFlow?.currentStep, input?.currentApprovalStep, input?.current_approval_step)
  const explicitApproverRole = firstNonEmpty(
    approvalFlow?.currentApproverRole,
    input?.currentApproverRole,
    input?.current_approver_role,
  )

  return {
    currentApprovalStep:
      explicitCurrentStep ||
      approvalChain.find((step: any) => String(step?.status || '').toLowerCase() === 'pending')?.role ||
      approvalFlow?.currentStep ||
      approvalHistory[approvalHistory.length - 1]?.step ||
      (String(approvalStatus).toLowerCase() === 'approved' ? 'completed' : 'draft'),
    currentApproverRole:
      explicitApproverRole ||
      approvalChain.find((step: any) => String(step?.status || '').toLowerCase() === 'pending')?.role ||
      approvalFlow?.currentApproverRole ||
      null,
    requiresDirectorApproval: Boolean(
      input?.requiresDirectorApproval ??
      input?.requires_director_approval ??
      approvalFlow?.requiresDirectorApproval ??
      approvalChain.some((step: any) => String(step?.role || '').toLowerCase() === 'director'),
    ),
  }
}

export function deriveCustomerPortalPaymentStatus(input: any) {
  const explicitStatus = firstNonEmpty(input?.customerPortalPaymentStatus, input?.customer_portal_payment_status)
  if (explicitStatus) return explicitStatus

  const balanceStatus = String(input?.customerBalanceStatus || input?.customer_balance_status || '').toLowerCase()
  const gateStatus = String(input?.customerBalanceGateStatus || input?.customer_balance_gate_status || '').toLowerCase()
  const proofs = normalizeCustomerPaymentProofs(input)

  if (['finance_confirmed', 'paid', 'balance_paid'].includes(balanceStatus)) return 'finance_verified'
  if (gateStatus === 'released') return 'released'
  if (proofs.customerPaymentProof || proofs.balanceCustomerPaymentProof) return 'proof_uploaded'
  if (gateStatus === 'blocked') return 'awaiting_finance_review'
  if (balanceStatus) return balanceStatus
  return 'pending'
}

export function deriveShipmentReadiness(input: any) {
  const explicit = firstNonEmpty(input?.shipmentReadinessStatus, input?.shipment_readiness_status)
  if (explicit) return explicit

  const clearanceStatus = String(input?.clearanceStatus || input?.clearance_status || '').toLowerCase()
  const arrivalNoticeStatus = String(input?.arrivalNoticeStatus || input?.arrival_notice_status || '').toLowerCase()
  const customsReleaseAt = firstNonEmpty(input?.customsReleaseAt, input?.customs_release_at)
  const deliveryConfirmedAt = firstNonEmpty(input?.deliveryConfirmedAt, input?.delivery_confirmed_at)

  if (deliveryConfirmedAt) return 'delivered_to_customer'
  if (customsReleaseAt || clearanceStatus === 'released') return 'customs_released'
  if (['docs_submitted', 'under_review', 'clearing', 'in_progress'].includes(clearanceStatus)) return 'under_import_clearance'
  if (['sent', 'acknowledged'].includes(arrivalNoticeStatus) || clearanceStatus === 'arrived_at_port') return 'arrival_notice_sent'
  return null
}

export function deriveExternalParticipants(input: any) {
  return {
    forwarder: {
      id: firstNonEmpty(input?.forwarderId, input?.forwarder_id),
      name: firstNonEmpty(input?.forwarderName, input?.forwarder_name),
    },
    truckCompany: {
      id: firstNonEmpty(input?.truckCompanyId, input?.truck_company_id),
      name: firstNonEmpty(input?.truckCompanyName, input?.truck_company_name),
    },
    customsBroker: {
      id: firstNonEmpty(input?.customsBrokerId, input?.customs_broker_id),
      name: firstNonEmpty(input?.brokerName, input?.broker_name, input?.importBrokerName, input?.import_broker_name),
      contact: firstNonEmpty(input?.brokerContact, input?.broker_contact, input?.importBrokerContact, input?.import_broker_contact),
    },
    inspectionAgency: {
      name: firstNonEmpty(
        input?.customerDesignatedInspectionAgency,
        input?.customer_designated_inspection_agency,
        input?.loadingSupervisionAgencyName,
        input?.loading_supervision_agency_name,
      ),
    },
    driver: {
      name: firstNonEmpty(input?.driverName, input?.driver_name),
      phone: firstNonEmpty(input?.driverPhone, input?.driver_phone),
    },
  }
}

export function deriveArchiveInfo(input: any) {
  return {
    archiveStatus: firstNonEmpty(input?.archiveStatus, input?.archive_status) || 'pending',
    archivedAt: firstNonEmpty(input?.archivedAt, input?.archived_at),
    archivedBy: firstNonEmpty(input?.archivedBy, input?.archived_by),
    archiveNo: firstNonEmpty(input?.archiveNo, input?.archive_no),
    invoiceNo: firstNonEmpty(input?.invoiceNo, input?.invoice_no, input?.commercialInvoiceNo, input?.commercial_invoice_no),
    invoiceStatus: firstNonEmpty(input?.invoiceStatus, input?.invoice_status, input?.ciStatus, input?.ci_status) || 'pending',
  }
}

export function deriveDeliveryExceptionSummary(input: any) {
  const exceptionType = firstNonEmpty(input?.exceptionType, input?.exception_type) || 'unknown'
  const status = firstNonEmpty(input?.status) || 'open'
  const financialImpact = Number(input?.financialImpact ?? input?.financial_impact ?? 0)
  let severity: 'low' | 'medium' | 'high' = 'low'

  if (['damage', 'clearance_hold', 'wrong_delivery'].includes(String(exceptionType))) severity = 'high'
  else if (['delay', 'document_missing', 'shortage'].includes(String(exceptionType))) severity = 'medium'
  if (financialImpact >= 10000) severity = 'high'

  return {
    exceptionType,
    exceptionStatus: status,
    exceptionSeverity: severity,
  }
}
