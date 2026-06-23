import { supabase } from '../supabase'
import { toRegionCode } from './supabaseCoreHelpers'
import {
  ERP_KPI_DEFINITIONS,
  ERP_KPI_DOMAIN_TREE,
  type ErpKpiDefinitionId,
  type ErpKpiDomain,
} from './erpKpiDefinitionService'

export type ErpKpiTimeWindow = 'today' | 'week' | 'month' | 'quarter' | 'all'

type TimestampFields = {
  created_at?: string | null
  updated_at?: string | null
  submitted_at?: string | null
  qt_last_approval_at?: string | null
  approved_at?: string | null
  due_date?: string | null
  lc_discrepancy_approval_requested_at?: string | null
  lc_discrepancy_recorded_at?: string | null
  seal_invalidated_at?: string | null
}

type InquiryRow = {
  id: string
  status: string | null
  is_submitted: boolean | null
  region_code?: string | null
  owner_email?: string | null
} & TimestampFields

type QuotationRow = {
  id: string
  approval_status: string | null
  qt_type: string | null
  special_price_flag: boolean | null
  special_payment_terms_flag: boolean | null
  strategic_customer_flag: boolean | null
  region?: string | null
  owner_email?: string | null
  sales_person?: string | null
  customer_email?: string | null
} & TimestampFields

type ContractRow = {
  id: string
  status: string | null
  sc_type: string | null
  exceptional_clause_flag: boolean | null
  special_account_period_flag: boolean | null
  strategic_customer_flag: boolean | null
  region?: string | null
  owner_email?: string | null
  sales_person?: string | null
  customer_email?: string | null
} & TimestampFields

type ApprovalRow = {
  id: string
  status: string | null
  region?: string | null
  submitted_by?: string | null
  current_approver?: string | null
  customer_email?: string | null
} & TimestampFields

type OrderRow = {
  id: string
  region?: string | null
  customer_email?: string | null
} & TimestampFields

type PurchaseOrderRow = {
  id: string
  deleted_at: string | null
  region_code?: string | null
  owner_email?: string | null
  operator_email?: string | null
  acting_user_email?: string | null
  authenticated_user_email?: string | null
  customer_email?: string | null
} & TimestampFields

type UserRow = {
  id: string
  portal_role: string | null
  region?: string | null
} & TimestampFields

type ReceivableRow = {
  id: string
  status: string | null
  remaining_amount: number | null
  due_date: string | null
  region?: string | null
  customer_email?: string | null
} & TimestampFields

type ExecutionRow = {
  id: string
  sample_required: boolean | null
  seal_status: string | null
  lc_discrepancy_status: string | null
  lc_discrepancy_approval_status: string | null
  region?: string | null
} & TimestampFields

export interface ErpKpiMetricValue {
  id: ErpKpiDefinitionId
  label: string
  domain: ErpKpiDomain
  unit: 'records' | 'amount_usd' | 'percent'
  value: number
}

export interface ErpKpiDomainSnapshot {
  domain: ErpKpiDomain
  label: string
  metrics: ErpKpiMetricValue[]
}

export interface ErpKpiSnapshot {
  collectedAt: string
  timeWindow: ErpKpiTimeWindow
  appliedRegion: string | null
  appliedUserEmail: string | null
  domains: ErpKpiDomainSnapshot[]
  metrics: Record<ErpKpiDefinitionId, ErpKpiMetricValue>
}

export interface ErpKpiSnapshotOptions {
  timeWindow?: ErpKpiTimeWindow
  region?: string | null
  userEmail?: string | null
}

const QUOTATION_PENDING_APPROVAL_STATUSES = new Set(['pending_approval', 'pending_supervisor', 'pending_director'])
const CONTRACT_PENDING_APPROVAL_STATUSES = new Set(['pending_approval', 'pending_supervisor', 'pending_director'])
const CONTRACT_ACTIVE_STATUSES = new Set(['approved', 'sent_to_customer', 'customer_confirmed'])
const OPEN_LC_DISCREPANCY_STATUSES = new Set(['open', 'pending', 'raised'])
const SEAL_BLOCKING_STATUSES = new Set(['not_sealed', 'pending_confirmation', 'invalidated'])

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function normalizeEmail(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function normalizeRegion(value?: string | null) {
  return normalize(toRegionCode(value) || value || '')
}

function resolveWindowStart(now: Date, timeWindow: ErpKpiTimeWindow) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (timeWindow === 'today') return start
  if (timeWindow === 'week') {
    const day = start.getDay()
    const diff = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diff)
    return start
  }
  if (timeWindow === 'month') {
    start.setDate(1)
    return start
  }
  if (timeWindow === 'quarter') {
    const month = start.getMonth()
    start.setMonth(Math.floor(month / 3) * 3, 1)
    return start
  }
  return null
}

function isWithinWindow(row: TimestampFields, fieldName: string | null, start: Date | null) {
  if (!start || !fieldName) return true
  const raw = row[fieldName as keyof TimestampFields]
  if (!raw) return false
  const value = new Date(raw)
  return !Number.isNaN(value.getTime()) && value.getTime() >= start.getTime()
}

function isSubmittedInquiry(row: InquiryRow) {
  if (row.is_submitted === true) return true
  return normalize(row.status) !== 'draft'
}

function isUnpaidReceivable(row: ReceivableRow) {
  return normalize(row.status) !== 'paid' || Number(row.remaining_amount || 0) > 0
}

function isOverdueReceivable(row: ReceivableRow, now: Date) {
  if (!isUnpaidReceivable(row)) return false
  if (!row.due_date) return false
  const dueDate = new Date(row.due_date)
  return !Number.isNaN(dueDate.getTime()) && dueDate.getTime() < now.getTime()
}

function buildMetric(id: ErpKpiDefinitionId, value: number): ErpKpiMetricValue {
  const definition = ERP_KPI_DEFINITIONS[id]
  return {
    id,
    label: definition.label,
    domain: definition.domain,
    unit: definition.unit,
    value,
  }
}

function withWindow<T extends TimestampFields>(
  rows: T[],
  metricId: ErpKpiDefinitionId,
  start: Date | null,
) {
  const definition = ERP_KPI_DEFINITIONS[metricId]
  return rows.filter((row) => isWithinWindow(row, definition.timeField, start))
}

function matchesRegionScope(row: Record<string, unknown>, region?: string | null) {
  const normalizedRegion = normalizeRegion(region)
  if (!normalizedRegion || normalizedRegion === 'all') return true

  const candidates = [
    row.region,
    row.region_code,
  ]

  return candidates.some((candidate) => normalizeRegion(String(candidate || '')) === normalizedRegion)
}

function matchesUserScope(row: Record<string, unknown>, userEmail?: string | null) {
  const normalizedUserEmail = normalizeEmail(userEmail)
  if (!normalizedUserEmail) return true

  const candidates = [
    row.owner_email,
    row.sales_person,
    row.customer_email,
    row.submitted_by,
    row.current_approver,
    row.operator_email,
    row.acting_user_email,
    row.authenticated_user_email,
    row.email,
  ]

  return candidates.some((candidate) => normalizeEmail(String(candidate || '')) === normalizedUserEmail)
}

function withScope<T extends Record<string, unknown>>(rows: T[], options: ErpKpiSnapshotOptions) {
  return rows.filter((row) => matchesRegionScope(row, options.region) && matchesUserScope(row, options.userEmail))
}

export async function getErpKpiSnapshot(
  input: ErpKpiTimeWindow | ErpKpiSnapshotOptions = 'all',
): Promise<ErpKpiSnapshot> {
  const options: ErpKpiSnapshotOptions = typeof input === 'string' ? { timeWindow: input } : input
  const timeWindow = options.timeWindow || 'all'
  const now = new Date()
  const windowStart = resolveWindowStart(now, timeWindow)

  const [
    inquiriesRes,
    quotationsRes,
    contractsRes,
    ordersRes,
    purchaseOrdersRes,
    usersRes,
    approvalsRes,
    receivablesRes,
    executionRes,
  ] = await Promise.allSettled([
    supabase.from('inquiries').select('id,status,is_submitted,region_code,owner_email,created_at,updated_at,submitted_at'),
    supabase.from('sales_quotations').select('id,approval_status,qt_type,special_price_flag,special_payment_terms_flag,strategic_customer_flag,region,owner_email,sales_person,customer_email,created_at,updated_at,qt_last_approval_at'),
    supabase.from('sales_contracts').select('id,status,sc_type,exceptional_clause_flag,special_account_period_flag,strategic_customer_flag,region,owner_email,sales_person,customer_email,created_at,updated_at,approved_at'),
    supabase.from('orders').select('id,region,customer_email,created_at'),
    supabase.from('purchase_orders').select('id,deleted_at,region_code,owner_email,operator_email,acting_user_email,authenticated_user_email,customer_email,created_at'),
    supabase.from('users').select('id,portal_role,region,created_at'),
    supabase.from('approval_records').select('id,status,region,submitted_by,current_approver,customer_email,created_at,updated_at,approved_at'),
    supabase.from('accounts_receivable').select('id,status,remaining_amount,due_date,region,customer_email,created_at,updated_at'),
    supabase.from('purchase_order_execution').select('id,sample_required,seal_status,lc_discrepancy_status,lc_discrepancy_approval_status,region,created_at,updated_at,lc_discrepancy_approval_requested_at,lc_discrepancy_recorded_at,seal_invalidated_at'),
  ])

  const getRows = <T,>(result: PromiseSettledResult<{ data: T[] | null; error: unknown }>) => {
    if (result.status !== 'fulfilled') return [] as T[]
    if (result.value?.error) return [] as T[]
    return (result.value?.data || []) as T[]
  }

  const inquiries = withScope(getRows<InquiryRow>(inquiriesRes), options)
  const quotations = withScope(getRows<QuotationRow>(quotationsRes), options)
  const contracts = withScope(getRows<ContractRow>(contractsRes), options)
  const orders = withScope(getRows<OrderRow>(ordersRes), options)
  const purchaseOrders = withScope(getRows<PurchaseOrderRow>(purchaseOrdersRes), options)
  const users = withScope(getRows<UserRow>(usersRes), { region: options.region })
  const approvals = withScope(getRows<ApprovalRow>(approvalsRes), options)
  const receivables = withScope(getRows<ReceivableRow>(receivablesRes), options)
  const executions = withScope(getRows<ExecutionRow>(executionRes), { region: options.region })

  const windowedInquiries = withWindow(inquiries, 'inquiry_submitted_count', windowStart)
  const windowedQuotationTotals = withWindow(quotations, 'quotation_total_count', windowStart)
  const windowedQuotationsPending = withWindow(quotations, 'quotation_pending_approval_count', windowStart)
  const windowedApprovedQuotations = withWindow(quotations, 'quotation_approved_count', windowStart)
  const windowedSpecialPriceQuotations = withWindow(quotations, 'quotation_special_price_count', windowStart)
  const windowedSpecialPaymentQuotations = withWindow(quotations, 'quotation_special_payment_count', windowStart)
  const windowedStrategicQuotations = withWindow(quotations, 'quotation_strategic_count', windowStart)
  const windowedContractsPending = withWindow(contracts, 'contract_pending_approval_count', windowStart)
  const windowedContractsActive = withWindow(contracts, 'contract_active_count', windowStart)
  const windowedExceptionalContracts = withWindow(contracts, 'contract_exceptional_clause_count', windowStart)
  const windowedSpecialAccountContracts = withWindow(contracts, 'contract_special_account_period_count', windowStart)
  const windowedStrategicContracts = withWindow(contracts, 'contract_strategic_count', windowStart)
  const windowedOrders = withWindow(orders, 'order_total_count', windowStart)
  const windowedPurchaseOrders = withWindow(purchaseOrders, 'purchase_order_total_count', windowStart)
  const windowedCustomers = withWindow(users, 'customer_total_count', windowStart)
  const windowedSuppliers = withWindow(users, 'supplier_total_count', windowStart)
  const windowedApprovals = withWindow(approvals, 'approval_pending_count', windowStart)
  const windowedReceivables = withWindow(receivables, 'receivable_unpaid_count', windowStart)
  const windowedExecutionLcPending = withWindow(executions, 'execution_lc_pending_approval_count', windowStart)
  const windowedExecutionLcOpen = withWindow(executions, 'execution_lc_open_count', windowStart)
  const windowedExecutionSealInvalidated = withWindow(executions, 'execution_seal_invalidated_count', windowStart)
  const windowedExecutionSealBlocking = withWindow(executions, 'execution_seal_blocking_count', windowStart)

  const submittedInquiryCount = windowedInquiries.filter(isSubmittedInquiry).length
  const approvedQuotationCount = windowedApprovedQuotations.filter((row) => normalize(row.approval_status) === 'approved').length

  const metrics: Record<ErpKpiDefinitionId, ErpKpiMetricValue> = {
    inquiry_submitted_count: buildMetric('inquiry_submitted_count', submittedInquiryCount),
    quotation_total_count: buildMetric('quotation_total_count', windowedQuotationTotals.length),
    quotation_pending_approval_count: buildMetric(
      'quotation_pending_approval_count',
      windowedQuotationsPending.filter((row) => QUOTATION_PENDING_APPROVAL_STATUSES.has(normalize(row.approval_status))).length,
    ),
    quotation_approved_count: buildMetric(
      'quotation_approved_count',
      approvedQuotationCount,
    ),
    quotation_special_price_count: buildMetric(
      'quotation_special_price_count',
      windowedSpecialPriceQuotations.filter((row) => normalize(row.qt_type) === 'special_price' || row.special_price_flag === true).length,
    ),
    quotation_special_payment_count: buildMetric(
      'quotation_special_payment_count',
      windowedSpecialPaymentQuotations.filter((row) => normalize(row.qt_type) === 'special_payment' || row.special_payment_terms_flag === true).length,
    ),
    quotation_strategic_count: buildMetric(
      'quotation_strategic_count',
      windowedStrategicQuotations.filter((row) => row.strategic_customer_flag === true).length,
    ),
    contract_pending_approval_count: buildMetric(
      'contract_pending_approval_count',
      windowedContractsPending.filter((row) => CONTRACT_PENDING_APPROVAL_STATUSES.has(normalize(row.status))).length,
    ),
    contract_active_count: buildMetric(
      'contract_active_count',
      windowedContractsActive.filter((row) => CONTRACT_ACTIVE_STATUSES.has(normalize(row.status))).length,
    ),
    order_total_count: buildMetric('order_total_count', windowedOrders.length),
    purchase_order_total_count: buildMetric(
      'purchase_order_total_count',
      windowedPurchaseOrders.filter((row) => !row.deleted_at).length,
    ),
    customer_total_count: buildMetric(
      'customer_total_count',
      windowedCustomers.filter((row) => normalize(row.portal_role) === 'customer').length,
    ),
    supplier_total_count: buildMetric(
      'supplier_total_count',
      windowedSuppliers.filter((row) => normalize(row.portal_role) === 'supplier').length,
    ),
    inquiry_to_approved_quote_conversion_rate: buildMetric(
      'inquiry_to_approved_quote_conversion_rate',
      submittedInquiryCount > 0 ? Number(((approvedQuotationCount / submittedInquiryCount) * 100).toFixed(1)) : 0,
    ),
    contract_exceptional_clause_count: buildMetric(
      'contract_exceptional_clause_count',
      windowedExceptionalContracts.filter((row) => row.exceptional_clause_flag === true).length,
    ),
    contract_special_account_period_count: buildMetric(
      'contract_special_account_period_count',
      windowedSpecialAccountContracts.filter((row) => row.special_account_period_flag === true).length,
    ),
    contract_strategic_count: buildMetric(
      'contract_strategic_count',
      windowedStrategicContracts.filter((row) => row.strategic_customer_flag === true).length,
    ),
    approval_pending_count: buildMetric(
      'approval_pending_count',
      windowedApprovals.filter((row) => normalize(row.status) === 'pending').length,
    ),
    receivable_unpaid_count: buildMetric(
      'receivable_unpaid_count',
      windowedReceivables.filter(isUnpaidReceivable).length,
    ),
    receivable_unpaid_amount: buildMetric(
      'receivable_unpaid_amount',
      windowedReceivables
        .filter(isUnpaidReceivable)
        .reduce((sum, row) => sum + Number(row.remaining_amount || 0), 0),
    ),
    receivable_overdue_count: buildMetric(
      'receivable_overdue_count',
      windowedReceivables.filter((row) => isOverdueReceivable(row, now)).length,
    ),
    execution_lc_pending_approval_count: buildMetric(
      'execution_lc_pending_approval_count',
      windowedExecutionLcPending.filter((row) => normalize(row.lc_discrepancy_approval_status) === 'pending').length,
    ),
    execution_lc_open_count: buildMetric(
      'execution_lc_open_count',
      windowedExecutionLcOpen.filter((row) => OPEN_LC_DISCREPANCY_STATUSES.has(normalize(row.lc_discrepancy_status))).length,
    ),
    execution_seal_invalidated_count: buildMetric(
      'execution_seal_invalidated_count',
      windowedExecutionSealInvalidated.filter((row) => normalize(row.seal_status) === 'invalidated').length,
    ),
    execution_seal_blocking_count: buildMetric(
      'execution_seal_blocking_count',
      windowedExecutionSealBlocking.filter(
        (row) => row.sample_required === true && SEAL_BLOCKING_STATUSES.has(normalize(row.seal_status)),
      ).length,
    ),
  }

  const domains: ErpKpiDomainSnapshot[] = ERP_KPI_DOMAIN_TREE.map((node) => ({
    domain: node.domain,
    label: node.label,
    metrics: node.metrics.map((metricId) => metrics[metricId]),
  }))

  return {
    collectedAt: now.toISOString(),
    timeWindow,
    appliedRegion: options.region || null,
    appliedUserEmail: options.userEmail || null,
    domains,
    metrics,
  }
}
