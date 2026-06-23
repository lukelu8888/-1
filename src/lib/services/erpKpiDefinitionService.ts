import type { Database } from '../database.types'

export type ErpKpiDomain =
  | 'inquiry'
  | 'quotation'
  | 'contract'
  | 'order'
  | 'masterdata'
  | 'approval'
  | 'receivable'
  | 'execution'

export type ErpKpiAggregation = 'count' | 'sum'

export type ErpKpiDefinitionId =
  | 'inquiry_submitted_count'
  | 'quotation_total_count'
  | 'quotation_pending_approval_count'
  | 'quotation_approved_count'
  | 'quotation_special_price_count'
  | 'quotation_special_payment_count'
  | 'quotation_strategic_count'
  | 'contract_pending_approval_count'
  | 'contract_active_count'
  | 'order_total_count'
  | 'purchase_order_total_count'
  | 'customer_total_count'
  | 'supplier_total_count'
  | 'inquiry_to_approved_quote_conversion_rate'
  | 'contract_exceptional_clause_count'
  | 'contract_special_account_period_count'
  | 'contract_strategic_count'
  | 'approval_pending_count'
  | 'receivable_unpaid_count'
  | 'receivable_unpaid_amount'
  | 'receivable_overdue_count'
  | 'execution_lc_pending_approval_count'
  | 'execution_lc_open_count'
  | 'execution_seal_invalidated_count'
  | 'execution_seal_blocking_count'

type TableName = keyof Database['public']['Tables']

export interface ErpKpiDefinition {
  id: ErpKpiDefinitionId
  label: string
  domain: ErpKpiDomain
  aggregation: ErpKpiAggregation
  sourceTable: TableName
  unit: 'records' | 'amount_usd' | 'percent'
  timeField: string | null
  owner: string
  description: string
  includeRules: string[]
  excludeRules?: string[]
  relatedFields?: string[]
}

export interface ErpKpiDomainNode {
  domain: ErpKpiDomain
  label: string
  description: string
  metrics: ErpKpiDefinitionId[]
}

export const ERP_KPI_DOMAIN_TREE: ErpKpiDomainNode[] = [
  {
    domain: 'inquiry',
    label: '询盘域',
    description: '销售前段的询盘提交与分配基础口径。',
    metrics: ['inquiry_submitted_count'],
  },
  {
    domain: 'quotation',
    label: 'QT 报价域',
    description: '报价审批流与 QT 分类治理口径。',
    metrics: [
      'quotation_total_count',
      'quotation_pending_approval_count',
      'quotation_approved_count',
      'quotation_special_price_count',
      'quotation_special_payment_count',
      'quotation_strategic_count',
    ],
  },
  {
    domain: 'contract',
    label: 'SC 合同域',
    description: '合同审批流与 SC 分类治理口径。',
    metrics: [
      'contract_pending_approval_count',
      'contract_active_count',
      'contract_exceptional_clause_count',
      'contract_special_account_period_count',
      'contract_strategic_count',
    ],
  },
  {
    domain: 'order',
    label: '订单域',
    description: '成交订单与采购订单基础口径。',
    metrics: ['order_total_count', 'purchase_order_total_count'],
  },
  {
    domain: 'masterdata',
    label: '主数据域',
    description: '客户、供应商与漏斗转化基础口径。',
    metrics: ['customer_total_count', 'supplier_total_count', 'inquiry_to_approved_quote_conversion_rate'],
  },
  {
    domain: 'approval',
    label: '审批域',
    description: '统一审批中心待处理口径。',
    metrics: ['approval_pending_count'],
  },
  {
    domain: 'receivable',
    label: '应收域',
    description: '应收未清与逾期风险基础口径。',
    metrics: ['receivable_unpaid_count', 'receivable_unpaid_amount', 'receivable_overdue_count'],
  },
  {
    domain: 'execution',
    label: '执行治理域',
    description: 'L/C 不符点与封样失效阻断口径。',
    metrics: [
      'execution_lc_pending_approval_count',
      'execution_lc_open_count',
      'execution_seal_invalidated_count',
      'execution_seal_blocking_count',
    ],
  },
]

export const ERP_KPI_DEFINITIONS: Record<ErpKpiDefinitionId, ErpKpiDefinition> = {
  inquiry_submitted_count: {
    id: 'inquiry_submitted_count',
    label: '已提交询盘数',
    domain: 'inquiry',
    aggregation: 'count',
    sourceTable: 'inquiries',
    unit: 'records',
    timeField: 'submitted_at',
    owner: 'Sales',
    description: '进入正式销售处理范围的询盘数。',
    includeRules: [
      '`is_submitted = true` 的记录全部纳入',
      '若历史数据缺失 `is_submitted`，则 `status != draft` 的记录视为已提交',
    ],
    excludeRules: ['纯草稿询盘不纳入'],
    relatedFields: ['status', 'is_submitted', 'submitted_at'],
  },
  quotation_total_count: {
    id: 'quotation_total_count',
    label: 'QT 总数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'created_at',
    owner: 'Sales',
    description: '报价单总量基础口径。',
    includeRules: ['所有有效 `sales_quotations` 记录纳入'],
    relatedFields: ['approval_status', 'qt_type', 'created_at'],
  },
  quotation_pending_approval_count: {
    id: 'quotation_pending_approval_count',
    label: 'QT 待审批数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Approval Center',
    description: '仍停留在审批链中的报价单数量。',
    includeRules: ['`approval_status in (pending_approval, pending_supervisor, pending_director)` 的记录纳入'],
    excludeRules: ['已批准、已驳回、已撤回的报价单不纳入'],
    relatedFields: ['approval_status', 'qt_type', 'qt_last_approval_at'],
  },
  quotation_approved_count: {
    id: 'quotation_approved_count',
    label: 'QT 已批准数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'qt_last_approval_at',
    owner: 'Sales',
    description: '已完成审批链并形成有效报价的数量。',
    includeRules: ['`approval_status = approved` 的记录纳入'],
    relatedFields: ['approval_status', 'qt_last_approval_at'],
  },
  quotation_special_price_count: {
    id: 'quotation_special_price_count',
    label: 'QT 特价数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Pricing',
    description: '按 V2.2 口径被归类为特价单的报价数量。',
    includeRules: ['`qt_type = special_price` 或 `special_price_flag = true` 的记录纳入'],
    relatedFields: ['qt_type', 'special_price_flag', 'special_price_reason'],
  },
  quotation_special_payment_count: {
    id: 'quotation_special_payment_count',
    label: 'QT 特殊付款数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Finance',
    description: '付款条件偏离常规口径的报价数量。',
    includeRules: ['`qt_type = special_payment` 或 `special_payment_terms_flag = true` 的记录纳入'],
    relatedFields: ['qt_type', 'payment_terms', 'special_payment_terms_flag'],
  },
  quotation_strategic_count: {
    id: 'quotation_strategic_count',
    label: 'QT 战略客户数',
    domain: 'quotation',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales Management',
    description: '战略客户口径下的报价数量。',
    includeRules: ['`strategic_customer_flag = true` 的记录纳入'],
    relatedFields: ['strategic_customer_flag', 'qt_type'],
  },
  contract_pending_approval_count: {
    id: 'contract_pending_approval_count',
    label: 'SC 待审批数',
    domain: 'contract',
    aggregation: 'count',
    sourceTable: 'sales_contracts',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Approval Center',
    description: '仍处于合同审批链中的 SC 数量。',
    includeRules: ['`status in (pending_approval, pending_supervisor, pending_director)` 的记录纳入'],
    excludeRules: ['已批准、已驳回、已发送客户的合同不纳入'],
    relatedFields: ['status', 'sc_type', 'sc_last_approval_at'],
  },
  contract_active_count: {
    id: 'contract_active_count',
    label: 'SC 有效合同数',
    domain: 'contract',
    aggregation: 'count',
    sourceTable: 'sales_contracts',
    unit: 'records',
    timeField: 'approved_at',
    owner: 'Sales',
    description: '进入执行或发送客户阶段的有效合同数。',
    includeRules: ['`status in (approved, sent_to_customer, customer_confirmed)` 的记录纳入'],
    relatedFields: ['status', 'approved_at', 'sc_last_approval_at'],
  },
  order_total_count: {
    id: 'order_total_count',
    label: '订单总数',
    domain: 'order',
    aggregation: 'count',
    sourceTable: 'orders',
    unit: 'records',
    timeField: 'created_at',
    owner: 'Sales / Operations',
    description: '销售订单总量基础口径。',
    includeRules: ['所有 `orders` 记录纳入'],
    relatedFields: ['status', 'created_at'],
  },
  purchase_order_total_count: {
    id: 'purchase_order_total_count',
    label: '采购单总数',
    domain: 'order',
    aggregation: 'count',
    sourceTable: 'purchase_orders',
    unit: 'records',
    timeField: 'created_at',
    owner: 'Procurement',
    description: '采购请求与采购合同总量基础口径。',
    includeRules: ['`deleted_at is null` 的 `purchase_orders` 记录纳入'],
    excludeRules: ['软删除采购单不纳入'],
    relatedFields: ['po_number', 'deleted_at', 'procurement_request_status'],
  },
  customer_total_count: {
    id: 'customer_total_count',
    label: '客户总数',
    domain: 'masterdata',
    aggregation: 'count',
    sourceTable: 'users',
    unit: 'records',
    timeField: 'created_at',
    owner: 'CRM / Admin',
    description: '客户门户账号总量基础口径。',
    includeRules: ['`portal_role = customer` 的 `users` 记录纳入'],
    relatedFields: ['portal_role', 'region', 'company'],
  },
  supplier_total_count: {
    id: 'supplier_total_count',
    label: '供应商总数',
    domain: 'masterdata',
    aggregation: 'count',
    sourceTable: 'users',
    unit: 'records',
    timeField: 'created_at',
    owner: 'Procurement / Admin',
    description: '供应商门户账号总量基础口径。',
    includeRules: ['`portal_role = supplier` 的 `users` 记录纳入'],
    relatedFields: ['portal_role', 'region', 'company'],
  },
  inquiry_to_approved_quote_conversion_rate: {
    id: 'inquiry_to_approved_quote_conversion_rate',
    label: '询盘转已批报价转化率',
    domain: 'masterdata',
    aggregation: 'count',
    sourceTable: 'sales_quotations',
    unit: 'percent',
    timeField: 'qt_last_approval_at',
    owner: 'Sales Management',
    description: '以“已批准报价数 / 已提交询盘数”计算的基础转化率。',
    includeRules: ['分子取 `approval_status = approved` 的报价单数量', '分母取已提交询盘数量'],
    relatedFields: ['approval_status', 'qt_last_approval_at'],
  },
  contract_exceptional_clause_count: {
    id: 'contract_exceptional_clause_count',
    label: 'SC 例外条款数',
    domain: 'contract',
    aggregation: 'count',
    sourceTable: 'sales_contracts',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Legal',
    description: '存在例外条款的合同数量。',
    includeRules: ['`exceptional_clause_flag = true` 的记录纳入'],
    relatedFields: ['exceptional_clause_flag', 'exceptional_clause_notes', 'sc_type'],
  },
  contract_special_account_period_count: {
    id: 'contract_special_account_period_count',
    label: 'SC 特殊账期数',
    domain: 'contract',
    aggregation: 'count',
    sourceTable: 'sales_contracts',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales / Finance',
    description: '特殊账期合同数量。',
    includeRules: ['`special_account_period_flag = true` 的记录纳入'],
    relatedFields: ['special_account_period_flag', 'payment_terms', 'sc_type'],
  },
  contract_strategic_count: {
    id: 'contract_strategic_count',
    label: 'SC 战略客户数',
    domain: 'contract',
    aggregation: 'count',
    sourceTable: 'sales_contracts',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'Sales Management',
    description: '战略客户口径下的合同数量。',
    includeRules: ['`strategic_customer_flag = true` 的记录纳入'],
    relatedFields: ['strategic_customer_flag', 'sc_type'],
  },
  approval_pending_count: {
    id: 'approval_pending_count',
    label: '统一待审批数',
    domain: 'approval',
    aggregation: 'count',
    sourceTable: 'approval_records',
    unit: 'records',
    timeField: 'created_at',
    owner: 'Approval Center',
    description: '审批中心仍处于待处理状态的审批记录总数。',
    includeRules: ['`status = pending` 的记录纳入'],
    relatedFields: ['record_type', 'status', 'approver'],
  },
  receivable_unpaid_count: {
    id: 'receivable_unpaid_count',
    label: '应收未清笔数',
    domain: 'receivable',
    aggregation: 'count',
    sourceTable: 'accounts_receivable',
    unit: 'records',
    timeField: 'due_date',
    owner: 'Finance',
    description: '仍存在未结余额的应收笔数。',
    includeRules: ['`status != paid` 或 `remaining_amount > 0` 的记录纳入'],
    relatedFields: ['status', 'remaining_amount', 'due_date'],
  },
  receivable_unpaid_amount: {
    id: 'receivable_unpaid_amount',
    label: '应收未清金额',
    domain: 'receivable',
    aggregation: 'sum',
    sourceTable: 'accounts_receivable',
    unit: 'amount_usd',
    timeField: 'due_date',
    owner: 'Finance',
    description: '按应收单剩余金额汇总的未清余额。',
    includeRules: ['对 `status != paid` 的记录汇总 `remaining_amount`'],
    relatedFields: ['status', 'remaining_amount', 'currency'],
  },
  receivable_overdue_count: {
    id: 'receivable_overdue_count',
    label: '应收逾期笔数',
    domain: 'receivable',
    aggregation: 'count',
    sourceTable: 'accounts_receivable',
    unit: 'records',
    timeField: 'due_date',
    owner: 'Finance',
    description: '已过到期日且仍未结清的应收笔数。',
    includeRules: ['`status != paid` 且 `due_date < today` 的记录纳入'],
    relatedFields: ['status', 'due_date', 'overdue_risk_level'],
  },
  execution_lc_pending_approval_count: {
    id: 'execution_lc_pending_approval_count',
    label: 'L/C 不符点待审批数',
    domain: 'execution',
    aggregation: 'count',
    sourceTable: 'purchase_order_execution',
    unit: 'records',
    timeField: 'lc_discrepancy_approval_requested_at',
    owner: 'Documentation / Finance',
    description: '已提出 L/C 不符点且仍在审批链中的执行单数量。',
    includeRules: ['`lc_discrepancy_approval_status = pending` 的记录纳入'],
    relatedFields: ['lc_discrepancy_status', 'lc_discrepancy_approval_status'],
  },
  execution_lc_open_count: {
    id: 'execution_lc_open_count',
    label: 'L/C 不符点未闭环数',
    domain: 'execution',
    aggregation: 'count',
    sourceTable: 'purchase_order_execution',
    unit: 'records',
    timeField: 'lc_discrepancy_recorded_at',
    owner: 'Documentation / Finance',
    description: 'L/C 不符点仍处于 open/pending/raised 的执行单数量。',
    includeRules: ['`lc_discrepancy_status in (open, pending, raised)` 的记录纳入'],
    relatedFields: ['lc_discrepancy_status', 'lc_discrepancy_approval_status'],
  },
  execution_seal_invalidated_count: {
    id: 'execution_seal_invalidated_count',
    label: '封样失效数',
    domain: 'execution',
    aggregation: 'count',
    sourceTable: 'purchase_order_execution',
    unit: 'records',
    timeField: 'seal_invalidated_at',
    owner: 'QC / Order Execution',
    description: '封样已明确失效的执行单数量。',
    includeRules: ['`seal_status = invalidated` 的记录纳入'],
    relatedFields: ['sample_required', 'seal_status', 'seal_invalidated_reason'],
  },
  execution_seal_blocking_count: {
    id: 'execution_seal_blocking_count',
    label: '封样阻断数',
    domain: 'execution',
    aggregation: 'count',
    sourceTable: 'purchase_order_execution',
    unit: 'records',
    timeField: 'updated_at',
    owner: 'QC / Order Execution',
    description: '要求封样但当前仍无有效封样的执行单数量。',
    includeRules: [
      '`sample_required = true` 的记录先进入候选集',
      '`seal_status in (not_sealed, pending_confirmation, invalidated)` 的记录纳入',
    ],
    excludeRules: ['`seal_status in (confirmed, not_required)` 的记录不纳入'],
    relatedFields: ['sample_required', 'seal_status', 'pre_production_sample_status'],
  },
}

export function getErpKpiDefinition(id: ErpKpiDefinitionId) {
  return ERP_KPI_DEFINITIONS[id]
}

export function getErpKpiDefinitionsByDomain(domain: ErpKpiDomain) {
  return ERP_KPI_DOMAIN_TREE
    .find((node) => node.domain === domain)
    ?.metrics.map((metricId) => ERP_KPI_DEFINITIONS[metricId]) || []
}

export function listErpKpiDefinitions() {
  return Object.values(ERP_KPI_DEFINITIONS)
}
