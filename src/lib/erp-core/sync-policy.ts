import type { SyncFieldRule } from './types';

/**
 * Client ERP <-> Admin Portal field policy
 * - sensitive=true fields must not be sent to the other side unless explicit legal approval is configured.
 */
export const SYNC_FIELD_POLICY: SyncFieldRule[] = [
  { domain: 'ing', field: 'inquiryNumber', sensitive: false, direction: 'bidirectional' },
  { domain: 'ing', field: 'status', sensitive: false, direction: 'bidirectional' },
  { domain: 'ing', field: 'products', sensitive: false, direction: 'bidirectional' },

  { domain: 'qt', field: 'qtNumber', sensitive: false, direction: 'bidirectional' },
  { domain: 'qt', field: 'customerStatus', sensitive: false, direction: 'bidirectional' },
  { domain: 'qt', field: 'totalPrice', sensitive: false, direction: 'bidirectional' },
  { domain: 'qt', field: 'costPrice', sensitive: true, direction: 'admin_to_client', notes: 'seller-sensitive' },
  { domain: 'qt', field: 'profitRate', sensitive: true, direction: 'admin_to_client', notes: 'seller-sensitive' },

  { domain: 'contract', field: 'contractNumber', sensitive: false, direction: 'bidirectional' },
  { domain: 'contract', field: 'status', sensitive: false, direction: 'bidirectional' },
  { domain: 'contract', field: 'sentToCustomerAt', sensitive: false, direction: 'bidirectional' },

  { domain: 'order', field: 'orderNumber', sensitive: false, direction: 'bidirectional' },
  { domain: 'order', field: 'status', sensitive: false, direction: 'bidirectional' },
  { domain: 'order', field: 'expectedDelivery', sensitive: false, direction: 'bidirectional' },
  { domain: 'order', field: 'customerFeedback', sensitive: false, direction: 'bidirectional' },

  { domain: 'shipment', field: 'bookingNo', sensitive: false, direction: 'bidirectional' },
  { domain: 'shipment', field: 'blNo', sensitive: false, direction: 'bidirectional' },
  { domain: 'shipment', field: 'eta', sensitive: false, direction: 'bidirectional' },
  { domain: 'shipment', field: 'freightCost', sensitive: true, direction: 'client_to_admin' },

  { domain: 'warehouse', field: 'grnNo', sensitive: false, direction: 'bidirectional' },
  { domain: 'warehouse', field: 'putawayStatus', sensitive: false, direction: 'bidirectional' },

  { domain: 'finance', field: 'invoiceNo', sensitive: false, direction: 'bidirectional' },
  { domain: 'finance', field: 'amount', sensitive: false, direction: 'bidirectional' },
  { domain: 'finance', field: 'bankProof', sensitive: false, direction: 'bidirectional' },

  { domain: 'document', field: 'documentType', sensitive: false, direction: 'bidirectional' },
  { domain: 'document', field: 'version', sensitive: false, direction: 'bidirectional' },
  { domain: 'document', field: 'fileUrl', sensitive: false, direction: 'bidirectional' },
];

export interface SyncPolicyTag {
  domain: SyncFieldRule['domain'];
  field: string;
  tags: Array<'public' | 'operational' | 'sensitive' | 'finance' | 'identity' | 'document'>;
}

export const SYNC_POLICY_TAGS: SyncPolicyTag[] = [
  { domain: 'ing', field: 'inquiryNumber', tags: ['identity', 'public'] },
  { domain: 'ing', field: 'status', tags: ['operational', 'public'] },
  { domain: 'ing', field: 'products', tags: ['operational'] },

  { domain: 'qt', field: 'qtNumber', tags: ['identity', 'public'] },
  { domain: 'qt', field: 'customerStatus', tags: ['operational', 'public'] },
  { domain: 'qt', field: 'totalPrice', tags: ['finance', 'public'] },
  { domain: 'qt', field: 'costPrice', tags: ['finance', 'sensitive'] },
  { domain: 'qt', field: 'profitRate', tags: ['finance', 'sensitive'] },

  { domain: 'contract', field: 'contractNumber', tags: ['identity', 'public'] },
  { domain: 'contract', field: 'status', tags: ['operational', 'public'] },
  { domain: 'contract', field: 'sentToCustomerAt', tags: ['operational'] },

  { domain: 'order', field: 'orderNumber', tags: ['identity', 'public'] },
  { domain: 'order', field: 'status', tags: ['operational', 'public'] },
  { domain: 'order', field: 'expectedDelivery', tags: ['operational', 'public'] },
  { domain: 'order', field: 'customerFeedback', tags: ['operational'] },

  { domain: 'shipment', field: 'bookingNo', tags: ['identity', 'public'] },
  { domain: 'shipment', field: 'blNo', tags: ['identity', 'document'] },
  { domain: 'shipment', field: 'eta', tags: ['operational', 'public'] },
  { domain: 'shipment', field: 'freightCost', tags: ['finance', 'sensitive'] },

  { domain: 'warehouse', field: 'grnNo', tags: ['identity', 'document'] },
  { domain: 'warehouse', field: 'putawayStatus', tags: ['operational', 'public'] },

  { domain: 'finance', field: 'invoiceNo', tags: ['identity', 'finance'] },
  { domain: 'finance', field: 'amount', tags: ['finance', 'public'] },
  { domain: 'finance', field: 'bankProof', tags: ['finance', 'document'] },

  { domain: 'document', field: 'documentType', tags: ['document', 'public'] },
  { domain: 'document', field: 'version', tags: ['document'] },
  { domain: 'document', field: 'fileUrl', tags: ['document'] },
];

export const SYNC_DENYLIST: Record<SyncFieldRule['domain'], string[]> = {
  ing: ['internalComment', 'deletedAt'],
  qt: ['costPrice', 'profitRate', 'internalApprovalComment', 'deletedAt'],
  contract: ['internalApprovalTrail', 'deletedAt'],
  order: ['internalMargin', 'deletedAt'],
  shipment: ['freightCost', 'internalCarrierRate', 'deletedAt'],
  warehouse: ['warehouseInternalLocationCode', 'deletedAt'],
  finance: ['bankAccountNumber', 'bankRoutingNumber', 'deletedAt'],
  document: ['storageInternalPath', 'deletedAt'],
};

export function getSyncableFields(domain: SyncFieldRule['domain']): string[] {
  const deny = new Set(SYNC_DENYLIST[domain] || []);
  return SYNC_FIELD_POLICY
    .filter((r) => r.domain === domain && !r.sensitive && !deny.has(r.field))
    .map((r) => r.field);
}

export function getSensitiveFields(domain: SyncFieldRule['domain']): string[] {
  return SYNC_FIELD_POLICY.filter((r) => r.domain === domain && r.sensitive).map((r) => r.field);
}

export function isFieldSyncAllowed(domain: SyncFieldRule['domain'], field: string): boolean {
  const deny = new Set(SYNC_DENYLIST[domain] || []);
  if (deny.has(field)) return false;
  return SYNC_FIELD_POLICY.some((r) => r.domain === domain && r.field === field && !r.sensitive);
}

export function getSyncFieldTags(domain: SyncFieldRule['domain'], field: string): SyncPolicyTag['tags'] {
  return SYNC_POLICY_TAGS.find((tag) => tag.domain === domain && tag.field === field)?.tags || [];
}
