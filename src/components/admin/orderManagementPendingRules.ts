import { canonicalizePersonnelEmail, getPersonnelEmailAliases } from '../../lib/personnelEmail';

type PendingRuleContextInput = {
  effectiveRuntimeRole?: string | null;
  rawRuntimeRole?: string | null;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  currentUserRegion?: string | null;
  linkedCostInquiryKeys?: Iterable<unknown> | null;
};

export type PendingRuleContext = ReturnType<typeof buildPendingRuleContext>;

export const normalizePendingRuleStatus = (value: unknown) => String(value || '').trim().toLowerCase();

// Base "pending" status pools. The module-level functions below further narrow
// these sets by current role and by ownership / region.
const pendingCostInquiryStatuses = new Set(['pending', 'partial', 'processing', 'submitted']);
const pendingQuotationApprovalStatuses = new Set(['draft', 'pending_approval', 'pending_supervisor', 'pending_director', 'approved']);
const pendingContractStatuses = new Set([
  'draft',
  'pending_supervisor',
  'pending_director',
  'approved',
  'sent',
  'sent_to_customer',
  'customer_confirmed',
  'customer_requested_changes',
  'deposit_uploaded',
  'deposit_confirmed',
  'po_generated',
  'production',
  'balance_confirmed',
  'shipped',
]);
const pendingExportServiceStages = new Set([
  'draft_request',
  'request_from_email',
  'waiting_manager_acceptance',
  'assigned_to_sales',
  'pi_preparing',
  'pi_pending_approval',
  'pi_approved',
  'pi_sent_to_customer',
  'pi_rejected',
  'pi_accepted_by_customer',
  'waiting_ctn_submission',
  'ctn_received',
  'waiting_shipping_notice',
  'freight_quoting',
  'waiting_freight_confirmation',
  'booking_in_progress',
  'shipment_coordination',
  'bill_of_lading_isolation',
  'soa_preparing',
  'soa_sent',
  'waiting_payment_slip',
  'payment_slip_received',
  'payment_received_pending_check',
  'payment_confirmed',
  'freight_paid_to_forwarder',
  'bl_received_by_us',
  'bl_forwarded_to_supplier',
]);
const salesRoles = new Set(['sales_rep', 'sales_assistant']);
const managerRoles = new Set(['regional_manager', 'sales_manager', 'sales_director', 'ceo']);
const financeRoles = new Set(['finance', 'cfo', 'external_accountant']);
const procurementRoles = new Set(['procurement', 'procurement_manager']);

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();
const normalizeName = (value: unknown) => String(value || '').trim().toLowerCase();
const normalizeIdentityText = (value: unknown) => String(value || '').trim().toLowerCase().replace(/[\s._-]+/g, '');
const normalizeRegion = (value: unknown) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (['na', 'north america', 'north_america', '北美'].includes(normalized)) return 'na';
  if (['sa', 'south america', 'south_america', '南美'].includes(normalized)) return 'sa';
  if (['ea', 'eu', 'europe & africa', 'europe_africa', '欧非'].includes(normalized)) return 'ea';
  if (normalized === 'all') return 'all';
  return normalized;
};

export const dedupeByBusinessKey = (rows: any[], primaryKey: string, fallbackKey = 'id') => {
  const merged = new Map<string, any>();
  rows.forEach((row) => {
    const key = String(row?.[primaryKey] || row?.[fallbackKey] || '').trim();
    if (!key) return;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...row, ...existing } : row);
  });
  return Array.from(merged.values());
};

// Context is computed once in the screen, then reused by every module rule.
export function buildPendingRuleContext(input: PendingRuleContextInput) {
  const normalizedRoleForCounts = normalizePendingRuleStatus(input.effectiveRuntimeRole || input.rawRuntimeRole);
  const normalizedCurrentEmail = normalizeEmail(canonicalizePersonnelEmail(input.currentUserEmail || '', input.currentUserRegion || '') || input.currentUserEmail || '');
  const normalizedCurrentName = normalizeName(input.currentUserName || '');
  const normalizedCurrentIdentity = normalizeIdentityText(normalizedCurrentName);
  const normalizedCurrentEmailLocalPart = normalizeIdentityText(normalizedCurrentEmail.split('@')[0] || '');
  const normalizedCurrentRegion = normalizeRegion(input.currentUserRegion || '');
  const currentUserEmailAliases = new Set(getPersonnelEmailAliases(normalizedCurrentEmail, input.currentUserRegion || '').map((value) => normalizeEmail(value)));
  const linkedCostInquiryKeys = new Set(
    Array.from(input.linkedCostInquiryKeys || [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  );

  const isSameRegion = (value: unknown) => {
    if (!normalizedCurrentRegion || normalizedCurrentRegion === 'all') return true;
    return normalizeRegion(value) === normalizedCurrentRegion;
  };

  const isOwnedByCurrentSales = (...candidates: unknown[]) =>
    candidates.some((candidate) => {
      const candidateEmail = normalizeEmail(canonicalizePersonnelEmail(String(candidate || ''), input.currentUserRegion || '') || candidate);
      if (!candidateEmail) return false;
      if (candidateEmail === normalizedCurrentEmail) return true;
      return currentUserEmailAliases.has(candidateEmail);
    });

  const isAssignedToCurrentIdentity = (...candidates: unknown[]) =>
    candidates.some((candidate) => {
      const normalizedCandidateName = normalizeName(candidate);
      const normalizedCandidateIdentity = normalizeIdentityText(candidate);
      const normalizedCandidateEmail = normalizeEmail(candidate);
      const normalizedCandidateEmailLocalPart = normalizeIdentityText(normalizedCandidateEmail.split('@')[0] || '');

      if (!normalizedCandidateName && !normalizedCandidateEmail && !normalizedCandidateIdentity) return false;
      if (normalizedCandidateEmail && normalizedCandidateEmail === normalizedCurrentEmail) return true;
      if (normalizedCurrentName && normalizedCandidateName && normalizedCandidateName === normalizedCurrentName) return true;
      if (normalizedCurrentIdentity && normalizedCandidateIdentity && normalizedCandidateIdentity === normalizedCurrentIdentity) return true;
      if (normalizedCurrentEmailLocalPart && normalizedCandidateIdentity && normalizedCandidateIdentity === normalizedCurrentEmailLocalPart) return true;
      if (normalizedCurrentIdentity && normalizedCandidateEmailLocalPart && normalizedCandidateEmailLocalPart === normalizedCurrentIdentity) return true;
      if (normalizedCurrentEmailLocalPart && normalizedCandidateEmailLocalPart && normalizedCandidateEmailLocalPart === normalizedCurrentEmailLocalPart) return true;
      return false;
    });

  const hasLinkedCostInquiry = (...candidates: unknown[]) =>
    candidates.some((candidate) => linkedCostInquiryKeys.has(String(candidate || '').trim()));

  return {
    normalizedRoleForCounts,
    isSalesRole: salesRoles.has(normalizedRoleForCounts),
    isManagerRole: managerRoles.has(normalizedRoleForCounts),
    isFinanceRole: financeRoles.has(normalizedRoleForCounts),
    isProcurementRole: procurementRoles.has(normalizedRoleForCounts),
    isSameRegion,
    isOwnedByCurrentSales,
    isAssignedToCurrentIdentity,
    hasLinkedCostInquiry,
  };
}

// Inquiry tab:
// Sales sees own pending inquiries, managers see same-region pending inquiries,
// finance / procurement do not carry this badge.
export function isPendingInquiryForContext(inquiry: any, context: PendingRuleContext) {
  const hasLinkedCostInquiry = context.hasLinkedCostInquiry(
    inquiry?.inquiryNumber,
    inquiry?.id,
  );

  if (context.isFinanceRole || context.isProcurementRole) return false;
  if (hasLinkedCostInquiry) return false;
  if (context.isSalesRole && !context.isOwnedByCurrentSales(inquiry?.ownerEmail, inquiry?.salesRepEmail, inquiry?.assignedTo, inquiry?.userEmail)) return false;
  if (context.isManagerRole && !context.isSameRegion(inquiry?.region)) return false;
  return normalizePendingRuleStatus(inquiry?.status) === 'pending';
}

// Cost inquiry tab:
// Sales focuses on submit / follow-up / push-to-quotation work, managers on new
// incoming pending items, procurement on procurement-processing items.
export function isPendingCostInquiryForContext(requirement: any, context: PendingRuleContext) {
  const status = normalizePendingRuleStatus(requirement?.status);
  const hasPurchaserFeedback = normalizePendingRuleStatus(requirement?.purchaserFeedback?.status) === 'quoted';

  if (context.isFinanceRole) return false;
  if (context.isManagerRole) return context.isSameRegion(requirement?.region) && status === 'pending';
  if (context.isProcurementRole) return ['partial', 'processing', 'submitted', 'completed'].includes(status) && !requirement?.pushedToQuotation;
  if (context.isSalesRole) {
    if (!context.isOwnedByCurrentSales(requirement?.ownerEmail, requirement?.requestedBy, requirement?.assignedTo, requirement?.createdBy)) return false;
    return status === 'pending' || (!requirement?.pushedToQuotation && (hasPurchaserFeedback || ['submitted', 'partial', 'processing', 'completed'].includes(status)));
  }

  return pendingCostInquiryStatuses.has(status) && !requirement?.pushedToQuotation;
}

// Quotation tab:
// For sales we intentionally keep only items that still need business action
// before contract push, rather than all approval pipeline states.
export function isPendingQuotationForContext(quotation: any, context: PendingRuleContext) {
  const approvalStatus = normalizePendingRuleStatus(quotation?.approvalStatus);
  const customerStatus = normalizePendingRuleStatus(quotation?.customerStatus);
  const isApprovedSalesAction = customerStatus === '' || ['not_sent', 'sent', 'viewed', 'negotiating', 'rejected'].includes(customerStatus);

  if (context.isFinanceRole || context.isProcurementRole) return false;
  if (context.isManagerRole) return false;
  if (context.isSalesRole) {
    if (!context.isOwnedByCurrentSales(
      quotation?.ownerEmail,
      quotation?.salesPerson,
      quotation?.operatorEmail,
      quotation?.actingUserEmail,
      quotation?.authenticatedUserEmail,
      quotation?.createdBy,
    )) return false;
    if (quotation?.pushedToContract) return false;
    if (approvalStatus === 'draft' || approvalStatus === 'rejected') return true;
    if (approvalStatus === 'approved') return isApprovedSalesAction;
    return false;
  }

  return pendingQuotationApprovalStatuses.has(approvalStatus) && !quotation?.pushedToContract;
}

// Contract tab:
// Each role sees only the statuses that still require its own next action.
export function isPendingContractForContext(contract: any, context: PendingRuleContext) {
  const status = normalizePendingRuleStatus(contract?.status);

  if (context.isFinanceRole) return ['sent', 'sent_to_customer', 'customer_confirmed', 'deposit_uploaded'].includes(status);
  if (context.isManagerRole) return context.isSameRegion(contract?.region) && ['pending_supervisor', 'pending_director'].includes(status);
  if (context.isSalesRole) {
    if (!context.isOwnedByCurrentSales(contract?.ownerEmail, contract?.salesPerson)) return false;
    return ['draft', 'approved', 'customer_confirmed', 'customer_requested_changes', 'deposit_confirmed', 'balance_confirmed', 'shipped'].includes(status);
  }
  if (context.isProcurementRole) return ['po_generated'].includes(status);

  return pendingContractStatuses.has(status);
}

// Collection tab:
// Unified rule for now: only true pending collection items count.
export function isPendingPaymentForContext(payment: any) {
  return normalizePendingRuleStatus(payment?.status) === 'pending';
}

// Export service tab:
// Name / identity matching is intentionally tolerant because the current export
// service records store assignees as labels rather than stable user ids.
export function isPendingExportServiceForContext(order: any, context: PendingRuleContext) {
  const stage = normalizePendingRuleStatus(order?.internalStage);

  if (context.isFinanceRole) {
    return ['waiting_payment_slip', 'payment_slip_received', 'payment_received_pending_check', 'payment_confirmed', 'bl_forwarded_to_supplier'].includes(stage);
  }
  if (context.isManagerRole) {
    return context.isSameRegion(order?.region) && ['waiting_manager_acceptance', 'pi_pending_approval'].includes(stage);
  }
  if (context.isSalesRole) {
    if (!context.isAssignedToCurrentIdentity(order?.salesName)) return false;
    return ['assigned_to_sales', 'pi_preparing', 'pi_approved', 'pi_rejected', 'pi_accepted_by_customer', 'ctn_received', 'waiting_shipping_notice', 'freight_quoting', 'waiting_freight_confirmation', 'booking_in_progress'].includes(stage);
  }
  if (context.isProcurementRole) return false;

  return pendingExportServiceStages.has(stage);
}
