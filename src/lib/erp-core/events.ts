import type { BusinessDomain } from './types';

export const ERP_EVENT_KEYS = {
  INQUIRY_CREATED: 'inquiry.created',
  INQUIRY_SUBMITTED: 'inquiry.submitted',
  INQUIRY_DELETED: 'inquiry.deleted',
  QUOTATION_CREATED: 'quotation.created',
  QUOTATION_SENT: 'quotation.sent',
  QUOTATION_ACCEPTED: 'quotation.accepted',
  QUOTATION_DELETED: 'quotation.deleted',
  ORDER_CREATED: 'order.created',
  ORDER_SUBMITTED: 'order.submitted',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  ORDER_DELETED: 'order.deleted',
  TRACKING_NODE_UPDATED: 'tracking.node_updated',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_APPROVED: 'document.approved',
  SYNC_PUSH_REQUESTED: 'sync.push_requested',
  SYNC_PULL_REQUESTED: 'sync.pull_requested',
} as const;

export type ErpEventKey = (typeof ERP_EVENT_KEYS)[keyof typeof ERP_EVENT_KEYS];

export interface ErpEventPayload {
  id: string;
  key: ErpEventKey;
  domain: BusinessDomain;
  recordId: string;
  internalNo?: string;
  externalNo?: string;
  companyId?: string;
  source: 'client' | 'admin' | 'integration';
  occurredAt: string;
  metadata?: Record<string, unknown>;
}
