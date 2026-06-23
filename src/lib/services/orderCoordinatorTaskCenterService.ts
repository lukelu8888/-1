import type { OrderManagementCounts } from './orderManagementCountService'
import type { SalesWorkflowSourceSnapshot } from './salesWorkflowSourceService'
import { derivePurchaseOrderWorkflowFields } from './purchaseOrderQuoteRequirementServices'
import { buildTaskCenterCompatFields, buildTaskCenterRiskCountMap, buildTaskCenterSectionCountMap, composeTaskCenterDataBundle, finalizeCollaborationSections, finalizeTaskCenterRiskItems, finalizeTaskSections } from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview } from './taskCenterContracts'

type OrderCoordinatorTaskRecord = Record<string, unknown>

export interface OrderCoordinatorTaskSummary {
  taskCenter: TaskCenterDataBundle<OrderCoordinatorTaskRecord>
  taskSections: TaskCenterCompatFields<OrderCoordinatorTaskRecord>['taskSections']
  counts: {
    contractsPending: number
    procurementPending: number
    fulfillmentPending: number
    collectionsPending: number
    releaseRisk: number
  }
  queues: {
    contractsPending: OrderCoordinatorTaskRecord[]
    procurementPending: OrderCoordinatorTaskRecord[]
    fulfillmentPending: OrderCoordinatorTaskRecord[]
    releaseRisk: OrderCoordinatorTaskRecord[]
  }
  riskSummary: {
    contractFollowUp: number
    procurementHandover: number
    fulfillmentPush: number
    releaseRisk: number
  }
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

export function deriveOrderCoordinatorTaskSummary(input: {
  snapshot: SalesWorkflowSourceSnapshot
  pendingCounts: OrderManagementCounts
}): OrderCoordinatorTaskSummary {
  const snapshot = input.snapshot
  const contracts = Array.isArray(snapshot.contracts) ? snapshot.contracts : []
  const purchaseOrders = Array.isArray(snapshot.purchaseOrders) ? snapshot.purchaseOrders : []

  const contractsPending = contracts.filter((contract: any) => {
    const status = String(contract?.status || '').trim().toLowerCase()
    return !['closed', 'completed', 'archived'].includes(status)
  })

  const procurementPending = purchaseOrders.filter((order: any) => {
    const workflow = derivePurchaseOrderWorkflowFields(order)
    if (workflow.documentType === 'PR') {
      return ['pending_assignment', 'partially_allocated'].includes(String(workflow.executionStatus || '').trim().toLowerCase())
    }
    return ['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || '').trim().toLowerCase())
  })

  const fulfillmentPending = purchaseOrders.filter((order: any) => {
    const workflow = derivePurchaseOrderWorkflowFields(order)
    const executionStatus = String(order?.executionStatus || workflow.executionStatus || '').trim().toLowerCase()
    if (workflow.documentType !== 'CG') return false
    return ['supplier_confirmed', 'production_in_progress', 'qc_pending', 'finished_goods_ready', 'awaiting_loading', 'loaded'].includes(executionStatus)
  })

  const releaseRisk = purchaseOrders.filter((order: any) => {
    const documentReleaseStatus = String(order?.documentReleaseStatus || '').trim().toLowerCase()
    const gateStatus = String(order?.customerBalanceGateStatus || '').trim().toLowerCase()
    return documentReleaseStatus === 'blocked' || gateStatus === 'blocked'
  })

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'contract-follow-up', label: '合同跟进', count: contractsPending.length, tone: 'info' },
    { key: 'procurement-handover', label: '采购交接', count: procurementPending.length, tone: 'warning' },
    { key: 'fulfillment-push', label: '履约推进', count: fulfillmentPending.length, tone: 'default' },
    { key: 'release-risk', label: '放单风险', count: releaseRisk.length, tone: 'critical' },
  ], {
    order: ['release-risk', 'procurement-handover', 'contract-follow-up', 'fulfillment-push'],
  })

  const collaborationSections = finalizeCollaborationSections([
    { key: 'sales', label: '业务协同', roles: ['Sales_Rep'], count: contractsPending.length },
    { key: 'procurement', label: '采购协同', roles: ['Procurement'], count: procurementPending.length },
    { key: 'warehouse', label: '仓配协同', roles: ['Warehouse_Ops'], count: fulfillmentPending.length },
    { key: 'finance', label: '财务协同', roles: ['Finance'], count: Number(input.pendingCounts.collections || 0) + releaseRisk.length },
  ], {
    order: ['sales', 'procurement', 'warehouse', 'finance'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'contract-follow-up',
      label: '合同跟进',
      accent: 'blue',
      count: contractsPending.length,
      items: contractsPending.slice(0, 5),
    },
    {
      key: 'procurement-handover',
      label: '采购衔接',
      accent: 'orange',
      count: procurementPending.length,
      items: procurementPending.slice(0, 5),
    },
    {
      key: 'fulfillment-release',
      label: '履约与放单',
      accent: 'red',
      count: fulfillmentPending.length + releaseRisk.length,
      items: [...releaseRisk, ...fulfillmentPending].slice(0, 5),
    },
  ], {
    order: ['contract-follow-up', 'procurement-handover', 'fulfillment-release'],
    defaultAccent: 'blue',
  })

  const taskCenter = composeTaskCenterDataBundle({
    taskSections,
    riskItems,
    collaborationSections,
  })
  const taskCenterCompat = buildTaskCenterCompatFields(taskCenter)
  const riskCounts = buildTaskCenterRiskCountMap(riskItems)
  const sectionCounts = buildTaskCenterSectionCountMap(taskSections)

  return {
    ...taskCenterCompat,
    counts: {
      contractsPending: sectionCounts['contract-follow-up'] || 0,
      procurementPending: sectionCounts['procurement-handover'] || 0,
      fulfillmentPending: fulfillmentPending.length,
      collectionsPending: Number(input.pendingCounts.collections || 0),
      releaseRisk: releaseRisk.length,
    },
    queues: {
      contractsPending,
      procurementPending,
      fulfillmentPending,
      releaseRisk,
    },
    riskSummary: {
      contractFollowUp: riskCounts['contract-follow-up'] || 0,
      procurementHandover: riskCounts['procurement-handover'] || 0,
      fulfillmentPush: riskCounts['fulfillment-push'] || 0,
      releaseRisk: riskCounts['release-risk'] || 0,
    },
  }
}
