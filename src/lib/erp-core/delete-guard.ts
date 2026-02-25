export function canDeleteInquiry(record: any): boolean {
  if (!record) return false;
  const status = String(record.status || '').toLowerCase();
  const submitted = Boolean(record.isSubmitted);
  // Customer-side rule: only draft/not-submitted inquiries are deletable.
  return !submitted && (status === '' || status === 'draft');
}

export function canDeleteQuotation(record: any): boolean {
  if (!record) return false;
  // If already progressed to downstream workflow, upstream delete is blocked.
  if (record.pushedToContract) return false;
  if (record.pushedContractNumber) return false;
  if (record.soNumber) return false;
  if (record.orderNumber) return false;
  if (record.contractNumber) return false;
  return true;
}

export function canDeleteOrder(record: any): boolean {
  if (!record) return false;
  const status = String(record.status || '').toLowerCase();
  // Business-safe default: customer can manually delete active/pending orders,
  // but not completed/delivered historical orders from upstream views.
  return !['delivered', 'completed'].includes(status);
}
