import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import { derivePurchaseOrderWorkflowFields } from './purchaseOrderQuoteRequirementServices'
import { buildTaskCenterCompatFields, buildTaskCenterRiskCountMap, buildTaskCenterSectionCountMap, composeTaskCenterDataBundle, finalizeCollaborationSections, finalizeTaskCenterRiskItems, finalizeTaskSections } from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview } from './taskCenterContracts'

const QC_VISIBLE_STATUSES = new Set([
  'supplier_confirmed',
  'pre_production_sample_pending',
  'pre_production_sample_sent',
  'production_in_progress',
  'supplier_self_inspection_submitted',
  'qc_pending',
  'qc_failed',
  'qc_passed',
  'finished_goods_ready',
  'awaiting_loading',
  'loaded',
])

export interface QCTaskSummary {
  executionOrders: PurchaseOrder[]
  taskCenter: TaskCenterDataBundle<PurchaseOrder>
  taskSections: TaskCenterCompatFields<PurchaseOrder>['taskSections']
  counts: {
    supplierConfirmed: number
    preProductionSamplePending: number
    preProductionSampleSent: number
    productionInProgress: number
    supplierSelfInspectionSubmitted: number
    qcPending: number
    qcPassed: number
    finishedGoodsReady: number
    awaitingLoading: number
    loaded: number
      qcFailed: number
  }
  riskSummary: {
    qcBlocked: number
    pendingSample: number
    failedQc: number
    pendingLoading: number
  }
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

export function deriveQCTaskSummary(purchaseOrders: PurchaseOrder[], keyword: string): QCTaskSummary {
  const normalizedKeyword = keyword.trim().toLowerCase()

  const executionOrders = purchaseOrders.filter((po) => {
    const workflow = derivePurchaseOrderWorkflowFields(po)
    const executionStatus = String(po.executionStatus || workflow.executionStatus || '').trim()
    if (workflow.documentType !== 'CG') return false
    if (!QC_VISIBLE_STATUSES.has(executionStatus)) return false
    if (!normalizedKeyword) return true

    return (
      String(po.poNumber || '').toLowerCase().includes(normalizedKeyword) ||
      String(po.sourceRef || po.salesContractNumber || '').toLowerCase().includes(normalizedKeyword) ||
      String(po.supplierName || '').toLowerCase().includes(normalizedKeyword) ||
      (po.items || []).some((item) => String(item.productName || '').toLowerCase().includes(normalizedKeyword))
    )
  })

  const countByStatus = (status: string) =>
    executionOrders.filter((po) => String(po.executionStatus || '') === status).length

  const counts = {
    supplierConfirmed: countByStatus('supplier_confirmed'),
    preProductionSamplePending: countByStatus('pre_production_sample_pending'),
    preProductionSampleSent: countByStatus('pre_production_sample_sent'),
    productionInProgress: countByStatus('production_in_progress'),
    supplierSelfInspectionSubmitted: countByStatus('supplier_self_inspection_submitted'),
    qcPending: countByStatus('qc_pending'),
    qcPassed: countByStatus('qc_passed'),
    finishedGoodsReady: countByStatus('finished_goods_ready'),
    awaitingLoading: countByStatus('awaiting_loading'),
    loaded: countByStatus('loaded'),
    qcFailed: countByStatus('qc_failed'),
  }

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    {
      key: 'qc-blocked',
      label: 'QC阻断',
      count: executionOrders.filter((po) => String(po.qcReleaseStatus || '').toLowerCase() === 'blocked').length,
      tone: 'critical',
    },
    {
      key: 'pending-sample',
      label: '待样品确认',
      count: counts.preProductionSamplePending + counts.preProductionSampleSent,
      tone: 'info',
    },
    { key: 'failed-qc', label: '验货失败', count: counts.qcFailed, tone: 'warning' },
    {
      key: 'pending-loading',
      label: '待装柜推进',
      count: counts.finishedGoodsReady + counts.awaitingLoading,
      tone: 'default',
    },
  ], {
    order: ['qc-blocked', 'failed-qc', 'pending-sample', 'pending-loading'],
  })

  const collaborationSections = finalizeCollaborationSections([
    { key: 'supplier', label: '供应商协同', roles: ['Supplier'], count: counts.preProductionSamplePending + counts.productionInProgress },
    { key: 'sales', label: '业务协同', roles: ['Sales_Rep'], count: executionOrders.filter((po) => String(po.customerPaymentGateStatus || '').toLowerCase() === 'blocked').length },
    { key: 'warehouse', label: '仓配协同', roles: ['Warehouse_Ops'], count: counts.awaitingLoading + counts.loaded },
    { key: 'docs', label: '单证协同', roles: ['Documentation_Officer'], count: executionOrders.filter((po) => String(po.collectionControlMode || '').toLowerCase() === 'lc_bank_negotiation').length },
  ], {
    order: ['supplier', 'sales', 'docs', 'warehouse'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'sample-stage',
      label: '样品与封样',
      accent: 'blue',
      count: counts.preProductionSamplePending + counts.preProductionSampleSent,
      items: executionOrders
        .filter((po) =>
          ['pre_production_sample_pending', 'pre_production_sample_sent'].includes(String(po.executionStatus || '')),
        )
        .slice(0, 5),
    },
    {
      key: 'qc-stage',
      label: '待验货 / 异常',
      accent: 'orange',
      count: counts.qcPending + counts.qcFailed + counts.supplierSelfInspectionSubmitted,
      items: executionOrders
        .filter((po) =>
          ['supplier_self_inspection_submitted', 'qc_pending', 'qc_failed'].includes(String(po.executionStatus || '')),
        )
        .slice(0, 5),
    },
    {
      key: 'loading-handover',
      label: '装柜衔接',
      accent: 'green',
      count: counts.finishedGoodsReady + counts.awaitingLoading,
      items: executionOrders
        .filter((po) =>
          ['finished_goods_ready', 'awaiting_loading'].includes(String(po.executionStatus || '')),
        )
        .slice(0, 5),
    },
  ], {
    order: ['sample-stage', 'qc-stage', 'loading-handover'],
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
    executionOrders,
    ...taskCenterCompat,
    counts: {
      ...counts,
      preProductionSamplePending: sectionCounts['sample-stage']
        ? counts.preProductionSamplePending
        : counts.preProductionSamplePending,
      preProductionSampleSent: counts.preProductionSampleSent,
      supplierSelfInspectionSubmitted: counts.supplierSelfInspectionSubmitted,
      qcPending: sectionCounts['qc-stage']
        ? counts.qcPending
        : counts.qcPending,
      finishedGoodsReady: sectionCounts['loading-handover']
        ? counts.finishedGoodsReady
        : counts.finishedGoodsReady,
      awaitingLoading: counts.awaitingLoading,
    },
    riskSummary: {
      qcBlocked: riskCounts['qc-blocked'] || 0,
      pendingSample: riskCounts['pending-sample'] || 0,
      failedQc: riskCounts['failed-qc'] || 0,
      pendingLoading: riskCounts['pending-loading'] || 0,
    },
  }
}
