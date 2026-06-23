/** finance-v2（赵敏）类型 — 与 mock 数据对齐，后续可替换为 API 模型 */

export type FinanceTaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type FinanceTaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';

export interface WorkbenchStatItem {
  id: string;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'warn' | 'danger' | 'ok';
}

export interface TodoTaskRecord {
  id: string;
  type: string;
  title: string;
  module: string;
  status: FinanceTaskStatus;
  priority: FinanceTaskPriority;
  dueAt: string;
  owner?: string;
  refNo?: string;
  amount?: string;
}

export interface RiskSummaryItem {
  id: string;
  label: string;
  value: string;
  level: 'info' | 'warn' | 'risk';
}

export interface CollectionRecord {
  id: string;
  skNo: string;
  ysNo: string;
  orderNo: string;
  customer: string;
  amount: number;
  currency: string;
  recvDate: string;
  method: string;
  matchStatus: string;
  writeoffStatus: string;
}

export interface ReceivableRecord {
  id: string;
  arNo: string;
  orderNo: string;
  customer: string;
  total: number;
  received: number;
  open: number;
  currency: string;
  dueDate: string;
  agingBucket: string;
  status: string;
}

export interface PaymentRequestRecord {
  id: string;
  prNo: string;
  applicant: string;
  payee: string;
  purpose: string;
  amount: number;
  currency: string;
  submitAt: string;
  approveStatus: string;
  execStatus: string;
}

export interface PayableRecord {
  id: string;
  apNo: string;
  scope: 'business' | 'management';
  vendor: string;
  sourceDoc: string;
  openAmount: number;
  currency: string;
  dueDate: string;
  status: string;
  subject?: string;
  department?: string;
  costCenter?: string;
  region?: 'NA' | 'EA' | 'SA';
  assignmentLine?: 'business_line' | 'management_line' | 'shared_line';
  assignmentType?: 'customer' | 'project' | 'contract' | 'sales_order' | 'quotation' | 'purchase_order' | 'region' | 'department' | 'cost_center' | 'shared_pool' | 'unassigned';
  assignmentTarget?: string;
  allocationStatus?: 'auto_assigned' | 'manually_confirmed' | 'pending_assignment' | 'assignment_exception';
}

export interface PaymentExecutionRecord {
  id: string;
  fkNo: string;
  apNo: string;
  expenseScope?: 'business' | 'management';
  expenseSubject?: string;
  payee: string;
  payeeType: 'supplier' | 'customs' | 'inspection' | 'forwarder' | 'other_service';
  amount: number;
  currency: string;
  region: 'NA' | 'EA' | 'SA';
  paidAt: string;
  method: string;
  bankRef: string;
  bankName: string;
  accountMask: string;
  status: string;
  operator?: string;
  department?: string;
  costCenter?: string;
  expensePeriod?: string;
  intakeSource?: 'manual' | 'file' | 'ocr' | 'voice';
  assignmentLine?: 'business_line' | 'management_line' | 'shared_line';
  assignmentType?: 'customer' | 'project' | 'contract' | 'sales_order' | 'quotation' | 'purchase_order' | 'region' | 'department' | 'cost_center' | 'shared_pool' | 'unassigned';
  assignmentTarget?: string;
  allocationStatus?: 'auto_assigned' | 'manually_confirmed' | 'pending_assignment' | 'assignment_exception';
}

export interface PaymentIntakeRecord {
  id: string;
  intakeNo: string;
  sourceMode: 'manual' | 'file' | 'ocr' | 'voice';
  reviewStatus: 'pending_review' | 'ready_dispatch' | 'dispatched';
  targetModule: 'business_payables' | 'management_payables';
  expenseScope: 'business' | 'management';
  expenseSubject: string;
  payee: string;
  payeeMasterId?: string;
  payeeMatchStatus?: 'matched' | 'suspected' | 'unmatched';
  payeeCategory?: string;
  payeeEntityType?: 'company' | 'person';
  payeeRoutingNote?: string;
  amount: number;
  currency: string;
  method: string;
  createdAt: string;
  operator: string;
  apNo?: string;
  region?: 'NA' | 'EA' | 'SA';
  department?: string;
  costCenter?: string;
  expensePeriod?: string;
  fileName?: string;
  remarks?: string;
  assignmentLine?: 'business_line' | 'management_line' | 'shared_line';
  assignmentType?: 'customer' | 'project' | 'contract' | 'sales_order' | 'quotation' | 'purchase_order' | 'region' | 'department' | 'cost_center' | 'shared_pool' | 'unassigned';
  assignmentTarget?: string;
  allocationStatus?: 'auto_assigned' | 'manually_confirmed' | 'pending_assignment' | 'assignment_exception';
  allocationReason?: string;
}

export type InvoiceKind = 'output' | 'input' | 'tax_doc';

export interface InvoiceRecord {
  id: string;
  kind: InvoiceKind;
  invNo: string;
  counterparty: string;
  relatedOrder?: string;
  amount: number;
  currency: string;
  taxRate: string;
  issueDate: string;
  status: string;
}

export interface BankAccountRecord {
  id: string;
  bankName: string;
  accountMask: string;
  currency: string;
  balance: number;
  available: number;
  lastSync: string;
}

export interface BankTransactionRecord {
  id: string;
  txnDate: string;
  direction: 'in' | 'out';
  counterparty: string;
  memo: string;
  amount: number;
  currency: string;
  balanceAfter: number;
  status: string;
}

export interface RiskEventRecord {
  id: string;
  category: string;
  title: string;
  entity: string;
  detectedAt: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
}

export interface ReleaseBlockRecord {
  id: string;
  orderNo: string;
  customer: string;
  reason: string;
  blockedSince: string;
  owner: string;
}

export interface ReportCatalogItem {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  format: string;
}

/** 管理中心一级 Tab */
export type FinanceManagementTabId =
  | 'collection'
  | 'receivables'
  | 'payment_intake'
  | 'payment_request'
  | 'payables'
  | 'invoice'
  | 'bank'
  | 'risk'
  | 'reports';

export const FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY = 'financeV2ManagementTab';

export const FINANCE_MANAGEMENT_TAB_IDS: FinanceManagementTabId[] = [
  'collection',
  'receivables',
  'payment_intake',
  'payment_request',
  'payables',
  'invoice',
  'bank',
  'risk',
  'reports',
];

export function parseFinanceManagementTabId(raw: string | null): FinanceManagementTabId | undefined {
  if (!raw) return undefined;
  return FINANCE_MANAGEMENT_TAB_IDS.includes(raw as FinanceManagementTabId)
    ? (raw as FinanceManagementTabId)
    : undefined;
}
