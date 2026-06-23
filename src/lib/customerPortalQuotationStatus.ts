const VISIBLE_CUSTOMER_QUOTATION_STATUSES = new Set([
  'approved',
  'sent_to_customer',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'negotiating',
  'expired',
]);

export function normalizeCustomerQuotationStatus(quotation: any): string {
  const rawStatus = String(
    quotation?.customerStatus ??
    quotation?.customer_status ??
    quotation?.status ??
    quotation?.customerResponse?.status ??
    quotation?.customer_response?.status ??
    '',
  ).trim().toLowerCase();
  const hasSentSignal = Boolean(
    quotation?.sentToCustomerAt ||
    quotation?.sent_to_customer_at ||
    quotation?.sentAt ||
    quotation?.sent_at ||
    quotation?.sent_to_customer,
  );
  const staleInternalStatuses = new Set([
    'draft',
    'not_sent',
    'pending',
    'submitted',
    'pending_approval',
  ]);

  if (rawStatus && !(hasSentSignal && staleInternalStatuses.has(rawStatus))) {
    return rawStatus;
  }

  if (hasSentSignal) {
    return 'sent';
  }

  return rawStatus || 'not_sent';
}

export function isVisibleCustomerQuotationStatus(quotation: any): boolean {
  return VISIBLE_CUSTOMER_QUOTATION_STATUSES.has(normalizeCustomerQuotationStatus(quotation));
}
