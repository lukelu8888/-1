export type BusinessDomain =
  | 'ing'
  | 'qt'
  | 'contract'
  | 'order'
  | 'shipment'
  | 'warehouse'
  | 'finance'
  | 'document';

export type RecordSystem = 'seller' | 'customer_erp' | 'client_erp';

export interface NumberPair {
  internalNo: string;
  externalNo?: string;
}

export interface IdMappingRecord {
  id: string;
  domain: BusinessDomain;
  internalId: string;
  internalNo: string;
  externalSystem?: string;
  externalId?: string;
  externalNo?: string;
  customerId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SyncDirection = 'client_to_admin' | 'admin_to_client' | 'bidirectional';

export interface SyncFieldRule {
  domain: BusinessDomain;
  field: string;
  sensitive: boolean;
  direction: SyncDirection;
  notes?: string;
}

export type FlowStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export interface MilestoneEvent {
  id: string;
  domain: BusinessDomain;
  recordId: string;
  nodeKey: string;
  status: FlowStatus;
  plannedAt?: string;
  actualAt?: string;
  owner?: string;
  source: RecordSystem;
  evidence?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}
