import {
  buildPendingRuleContext,
  dedupeByBusinessKey,
  isPendingContractForContext,
  isPendingCostInquiryForContext,
  isPendingExportServiceForContext,
  isPendingInquiryForContext,
  isPendingPaymentForContext,
  isPendingQuotationForContext,
} from '../../components/admin/orderManagementPendingRules'
import { computeSalesTodoSummary } from './salesTodoCenterService'
import type { SalesWorkflowSourceSnapshot } from './salesWorkflowSourceService'

export interface OrderManagementCountActor {
  email?: string | null
  name?: string | null
  role?: string | null
  rawRole?: string | null
  region?: string | null
}

export interface OrderManagementCounts {
  overview: number
  inquiries: number
  costInquiry: number
  quotations: number
  orders: number
  collections: number
  approvals: number
  exportService: number
}

export interface OrderManagementRuleSummary {
  counts: OrderManagementCounts
  salesTodoOpenCount: number
}

const APPROVAL_ROLES = new Set(['regional_manager', 'sales_manager', 'sales_director', 'ceo'])

export function computeOrderManagementRuleSummary(input: {
  actor: OrderManagementCountActor
  snapshot: SalesWorkflowSourceSnapshot
  approvalPendingCount?: number
}): OrderManagementRuleSummary {
  const approvalPendingCount = Number(input.approvalPendingCount || 0)
  const context = buildPendingRuleContext({
    effectiveRuntimeRole: input.actor.role,
    rawRuntimeRole: input.actor.rawRole,
    currentUserEmail: input.actor.email,
    currentUserName: input.actor.name,
    currentUserRegion: input.actor.region,
    linkedCostInquiryKeys: [
      ...input.snapshot.quoteRequirements.flatMap((requirement: any) => [
        requirement?.sourceInquiryNumber,
        requirement?.sourceInquiryId,
      ]),
      ...input.snapshot.quotationRequests.flatMap((request: any) => [
        request?.sourceInquiryNumber,
        request?.sourceInquiryId,
      ]),
    ],
  })

  let inquiries = 0
  let costInquiry = 0
  let quotations = 0
  let orders = 0
  let collections = 0
  let exportService = 0
  let salesTodoOpenCount = 0

  if (context.isSalesRole) {
    const summary = computeSalesTodoSummary({
      salesEmail: String(input.actor.email || ''),
      salesName: String(input.actor.name || ''),
      salesRegion: String(input.actor.region || ''),
      inquiries: input.snapshot.inquiries,
      quoteRequirements: input.snapshot.quoteRequirements,
      quotationRequests: input.snapshot.quotationRequests,
      quotations: input.snapshot.quotations,
      contracts: input.snapshot.contracts,
      purchaseOrders: input.snapshot.purchaseOrders,
      exportServiceOrders: input.snapshot.exportServiceOrders,
    })
    inquiries = summary.moduleCounts.inquiries
    costInquiry = summary.moduleCounts.costInquiry
    quotations = summary.moduleCounts.quotations
    orders = summary.moduleCounts.orders
    collections = summary.moduleCounts.collections
    exportService = summary.moduleCounts.exportService
    salesTodoOpenCount = summary.totalOpen
  } else {
    inquiries = input.snapshot.inquiries.filter((row) => isPendingInquiryForContext(row, context)).length
    costInquiry = dedupeByBusinessKey(input.snapshot.quoteRequirements, 'requirementNo').filter((row) => isPendingCostInquiryForContext(row, context)).length
    quotations = dedupeByBusinessKey(input.snapshot.quotations, 'qtNumber').filter((row) => isPendingQuotationForContext(row, context)).length
    orders = dedupeByBusinessKey(input.snapshot.contracts, 'contractNumber').filter((row) => isPendingContractForContext(row, context)).length
    collections = dedupeByBusinessKey(input.snapshot.payments, 'id').filter((row) => isPendingPaymentForContext(row)).length
    exportService = input.snapshot.exportServiceOrders.filter((row) => isPendingExportServiceForContext(row, context)).length
  }

  const shouldShowApprovals = APPROVAL_ROLES.has(String(context.normalizedRoleForCounts || ''))
  const approvals = shouldShowApprovals ? approvalPendingCount : 0
  const overview = inquiries + costInquiry + quotations + orders + collections + approvals + exportService

  return {
    counts: {
      overview,
      inquiries,
      costInquiry,
      quotations,
      orders,
      collections,
      approvals,
      exportService,
    },
    salesTodoOpenCount,
  }
}

export function computeOrderManagementCounts(input: {
  actor: OrderManagementCountActor
  snapshot: SalesWorkflowSourceSnapshot
  approvalPendingCount?: number
}): OrderManagementCounts {
  return computeOrderManagementRuleSummary(input).counts
}
