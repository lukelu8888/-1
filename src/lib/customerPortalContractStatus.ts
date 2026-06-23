const ACTIVE_CUSTOMER_CONTRACT_STATUSES = new Set([
  'approved',
  'sent_to_customer',
  'sent',
  'customer_confirmed',
  'customer_requested_changes',
  'deposit_uploaded',
  'deposit_confirmed',
  'payment_proof_uploaded',
  'balance_uploaded',
  'po_generated',
  'production',
  'balance_confirmed',
  'shipped',
]);

const STALE_INTERNAL_CONTRACT_STATUSES = new Set([
  'draft',
  'pending',
  'pending_supervisor',
  'pending_director',
  'submitted',
]);

const LEGACY_PERSISTED_CONTRACT_STATUS_MAP: Record<string, string> = {
  sent_to_customer: 'sent',
  awaiting_deposit: 'customer_confirmed',
  in_procurement: 'deposit_confirmed',
  in_pre_production: 'deposit_confirmed',
  in_production: 'deposit_confirmed',
  qc_pending: 'deposit_confirmed',
  qc_passed: 'deposit_confirmed',
  awaiting_balance: 'deposit_confirmed',
  balance_uploaded: 'deposit_confirmed',
  ready_to_ship: 'deposit_confirmed',
  po_generated: 'deposit_confirmed',
  production: 'deposit_confirmed',
  balance_confirmed: 'deposit_confirmed',
  shipped: 'deposit_confirmed',
  completed: 'deposit_confirmed',
};

function readWorkflowValue(contract: any, field: string): string {
  return String(
    contract?.documentRenderMeta?.erpWorkflow?.[field] ??
    contract?.document_render_meta?.erpWorkflow?.[field] ??
    '',
  ).trim().toLowerCase();
}

function readWorkflowLogicalStatus(contract: any): string {
  return readWorkflowValue(contract, 'logicalStatus');
}

function toLogicalStatusFromExecutionStatus(executionStatus: string): string {
  switch (String(executionStatus || '').trim().toLowerCase()) {
    case 'sent_to_customer':
      return 'sent';
    case 'customer_confirmed':
    case 'awaiting_deposit':
      return 'customer_confirmed';
    case 'customer_requested_changes':
      return 'customer_requested_changes';
    case 'customer_rejected':
      return 'customer_rejected';
    case 'deposit_uploaded':
      return 'deposit_uploaded';
    case 'deposit_confirmed':
      return 'deposit_confirmed';
    case 'in_procurement':
    case 'in_pre_production':
      return 'po_generated';
    case 'in_production':
    case 'qc_pending':
    case 'qc_passed':
    case 'awaiting_balance':
      return 'production';
    case 'balance_uploaded':
      return 'balance_uploaded';
    case 'balance_confirmed':
    case 'ready_to_ship':
      return 'balance_confirmed';
    case 'shipped':
      return 'shipped';
    case 'delivered':
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return String(executionStatus || '').trim().toLowerCase();
  }
}

export function deriveSalesContractSplitFields(contractOrStatus: unknown): {
  approvalStatus: string;
  executionStatus: string;
  paymentStatusDeposit: string;
  paymentStatusBalance: string;
} {
  const contract = typeof contractOrStatus === 'string'
    ? { status: contractOrStatus }
    : (contractOrStatus as any) || {};
  const workflowApprovalStatus = readWorkflowValue(contract, 'approvalStatus');
  const workflowExecutionStatus = readWorkflowValue(contract, 'executionStatus');
  const workflowPaymentStatusDeposit = readWorkflowValue(contract, 'paymentStatusDeposit');
  const workflowPaymentStatusBalance = readWorkflowValue(contract, 'paymentStatusBalance');
  const rawStatus = String(
    contract?.status ??
    contract?.customerStatus ??
    contract?.customer_status ??
    '',
  ).trim().toLowerCase();
  const approvalStatus = String(
    contract?.approvalStatus ??
    contract?.approval_status ??
    workflowApprovalStatus,
  ).trim().toLowerCase();
  const executionStatus = String(
    contract?.executionStatus ??
    contract?.execution_status ??
    workflowExecutionStatus,
  ).trim().toLowerCase();
  const paymentStatusDeposit = String(
    contract?.paymentStatusDeposit ??
    contract?.payment_status_deposit ??
    workflowPaymentStatusDeposit,
  ).trim().toLowerCase();
  const paymentStatusBalance = String(
    contract?.paymentStatusBalance ??
    contract?.payment_status_balance ??
    workflowPaymentStatusBalance,
  ).trim().toLowerCase();

  if (approvalStatus && executionStatus && paymentStatusDeposit && paymentStatusBalance) {
    return {
      approvalStatus,
      executionStatus,
      paymentStatusDeposit,
      paymentStatusBalance,
    };
  }

  switch (rawStatus) {
    case 'pending_supervisor':
      return { approvalStatus: 'pending_l1', executionStatus: 'draft', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'pending_director':
      return { approvalStatus: 'pending_l2', executionStatus: 'draft', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'approved':
      return { approvalStatus: 'approved', executionStatus: 'draft', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'sent':
    case 'sent_to_customer':
      return { approvalStatus: 'approved', executionStatus: 'sent_to_customer', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'customer_confirmed':
      return { approvalStatus: 'approved', executionStatus: 'customer_confirmed', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'customer_requested_changes':
      return { approvalStatus: 'approved', executionStatus: 'customer_requested_changes', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'customer_rejected':
      return { approvalStatus: 'approved', executionStatus: 'customer_rejected', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'deposit_uploaded':
    case 'payment_proof_uploaded':
      return { approvalStatus: 'approved', executionStatus: 'deposit_uploaded', paymentStatusDeposit: 'uploaded', paymentStatusBalance: 'not_due' };
    case 'deposit_confirmed':
      return { approvalStatus: 'approved', executionStatus: 'deposit_confirmed', paymentStatusDeposit: 'confirmed', paymentStatusBalance: 'not_due' };
    case 'po_generated':
      return { approvalStatus: 'approved', executionStatus: 'in_procurement', paymentStatusDeposit: 'confirmed', paymentStatusBalance: 'not_due' };
    case 'production':
      return { approvalStatus: 'approved', executionStatus: 'in_production', paymentStatusDeposit: 'confirmed', paymentStatusBalance: 'pending' };
    case 'balance_uploaded':
      return { approvalStatus: 'approved', executionStatus: 'balance_uploaded', paymentStatusDeposit: 'confirmed', paymentStatusBalance: 'uploaded' };
    case 'balance_confirmed':
      return { approvalStatus: 'approved', executionStatus: 'balance_confirmed', paymentStatusDeposit: 'confirmed', paymentStatusBalance: 'confirmed' };
    case 'shipped':
      return { approvalStatus: 'approved', executionStatus: 'shipped', paymentStatusDeposit: 'confirmed', paymentStatusBalance: paymentStatusBalance || 'confirmed' };
    case 'completed':
      return { approvalStatus: 'approved', executionStatus: 'completed', paymentStatusDeposit: 'confirmed', paymentStatusBalance: paymentStatusBalance || 'confirmed' };
    case 'rejected':
      return { approvalStatus: 'rejected', executionStatus: 'draft', paymentStatusDeposit: 'pending', paymentStatusBalance: 'not_due' };
    case 'cancelled':
      return { approvalStatus: approvalStatus || 'approved', executionStatus: 'cancelled', paymentStatusDeposit: paymentStatusDeposit || 'pending', paymentStatusBalance: paymentStatusBalance || 'not_due' };
    default:
      return {
        approvalStatus: approvalStatus || 'draft',
        executionStatus: executionStatus || 'draft',
        paymentStatusDeposit: paymentStatusDeposit || 'pending',
        paymentStatusBalance: paymentStatusBalance || 'not_due',
      };
  }
}

export function getPersistableSalesContractStatus(status: unknown): string {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return 'draft';
  return LEGACY_PERSISTED_CONTRACT_STATUS_MAP[normalized] || normalized;
}

export function normalizeCustomerContractStatus(contractOrStatus: unknown): string {
  if (typeof contractOrStatus === 'string') {
    return String(contractOrStatus || '').trim().toLowerCase();
  }

  const contract = contractOrStatus as any;
  const workflowLogicalStatus = readWorkflowLogicalStatus(contract);
  const explicitExecutionStatus = String(
    contract?.executionStatus ??
    contract?.execution_status ??
    readWorkflowValue(contract, 'executionStatus') ??
    '',
  ).trim().toLowerCase();
  const rawStatus = String(
    contract?.status ??
    contract?.customerStatus ??
    contract?.customer_status ??
    '',
  ).trim().toLowerCase();
  const hasSentSignal = Boolean(
    contract?.sentToCustomerAt ||
    contract?.sent_to_customer_at ||
    contract?.sentAt ||
    contract?.sent_at ||
    contract?.sent_to_customer,
  );

  if (explicitExecutionStatus) {
    return toLogicalStatusFromExecutionStatus(explicitExecutionStatus);
  }

  if (workflowLogicalStatus) {
    return workflowLogicalStatus;
  }

  if (rawStatus && !STALE_INTERNAL_CONTRACT_STATUSES.has(rawStatus)) {
    return rawStatus;
  }

  if (contract?.customerConfirmedAt || contract?.customer_confirmed_at) {
    return 'customer_confirmed';
  }

  if (contract?.depositConfirmedAt || contract?.deposit_confirmed_at) {
    return 'deposit_confirmed';
  }

  if (contract?.depositProof || contract?.customerPaymentProof || contract?.deposit_proof) {
    return 'deposit_uploaded';
  }

  if (hasSentSignal) {
    return 'sent';
  }

  return rawStatus || 'draft';
}

export function isActiveCustomerContractStatus(contractOrStatus: unknown): boolean {
  return ACTIVE_CUSTOMER_CONTRACT_STATUSES.has(normalizeCustomerContractStatus(contractOrStatus));
}
