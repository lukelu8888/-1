import { buildTaskCenterCompatFields, buildTaskCenterRiskCountMap, buildTaskCenterSectionCountMap, composeTaskCenterDataBundle, finalizeCollaborationSections, finalizeTaskCenterRiskItems, finalizeTaskSections } from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview } from './taskCenterContracts'

type WarehouseTaskRecord = Record<string, unknown>

export interface WarehouseTaskSummary {
  taskCenter: TaskCenterDataBundle<WarehouseTaskRecord>
  taskSections: TaskCenterCompatFields<WarehouseTaskRecord>['taskSections']
  counts: {
    totalPlans: number
    poolsPendingPlanning: number
    containersAwaitingExecution: number
    releaseBlocked: number
    caseClosePending: number
    archivePending: number
  }
  queues: {
    poolsPendingPlanning: WarehouseTaskRecord[]
    containersAwaitingExecution: WarehouseTaskRecord[]
    releaseBlocked: WarehouseTaskRecord[]
    caseClosePending: WarehouseTaskRecord[]
    archivePending: WarehouseTaskRecord[]
  }
  riskSummary: {
    planningRisk: number
    releaseBlocked: number
    pendingClosure: number
    pendingArchive: number
  }
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

const DONE_POOL_STATUSES = new Set(['closed', 'completed', 'archived'])
const DONE_CONTAINER_STATUSES = new Set(['executing', 'completed', 'loaded'])

export function deriveWarehouseTaskSummary(input: {
  plans: any[]
  loadingPools: any[]
  selectedPoolSolutions: any[]
  exportPrepRows: any[]
}): WarehouseTaskSummary {
  const plans = Array.isArray(input.plans) ? input.plans : []
  const loadingPools = Array.isArray(input.loadingPools) ? input.loadingPools : []
  const selectedPoolSolutions = Array.isArray(input.selectedPoolSolutions) ? input.selectedPoolSolutions : []
  const exportPrepRows = Array.isArray(input.exportPrepRows) ? input.exportPrepRows : []

  const poolsPendingPlanning = loadingPools.filter((pool) => {
    const status = String(pool?.poolStatus || pool?.status || '').trim().toLowerCase()
    return !DONE_POOL_STATUSES.has(status)
  })

  const containersAwaitingExecution = selectedPoolSolutions
    .flatMap((solution) => Array.isArray(solution?.containers) ? solution.containers : [])
    .filter((container) => {
      const status = String(container?.planningStatus || '').trim().toLowerCase()
      return !DONE_CONTAINER_STATUSES.has(status)
    })

  const releaseBlocked = exportPrepRows.filter((row) => {
    const releaseStatus = String(row?.documentReleaseStatus || '').trim().toLowerCase()
    const gateStatus = String(row?.customerBalanceGateStatus || '').trim().toLowerCase()
    const financialRiskBlocked = Boolean(row?.workflowSummary?.replySummary?.customerPaymentControl?.financialRiskBlocked)
    return releaseStatus === 'blocked' || gateStatus === 'blocked' || financialRiskBlocked
  })

  const caseClosePending = exportPrepRows.filter((row) => String(row?.caseCloseStatus || '').trim().toLowerCase() !== 'closed')
  const archivePending = exportPrepRows.filter((row) => {
    const caseClosed = String(row?.caseCloseStatus || '').trim().toLowerCase() === 'closed'
    const archiveStatus = String(row?.archiveStatus || '').trim().toLowerCase()
    return caseClosed && archiveStatus !== 'archived'
  })

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'planning-risk', label: '装柜规划风险', count: poolsPendingPlanning.length + containersAwaitingExecution.length, tone: 'warning' },
    { key: 'release-blocked', label: '放单阻断', count: releaseBlocked.length, tone: 'critical' },
    { key: 'pending-closure', label: '待结案', count: caseClosePending.length, tone: 'info' },
    { key: 'pending-archive', label: '待归档', count: archivePending.length, tone: 'default' },
  ], {
    order: ['release-blocked', 'planning-risk', 'pending-closure', 'pending-archive'],
  })

  const collaborationSections = finalizeCollaborationSections([
    { key: 'warehouse', label: '仓配执行', roles: ['Warehouse_Ops'], count: poolsPendingPlanning.length + containersAwaitingExecution.length },
    { key: 'finance', label: '财务放单', roles: ['Finance'], count: releaseBlocked.length },
    { key: 'docs', label: '单证协同', roles: ['Documentation_Officer'], count: exportPrepRows.filter((row) => String(row?.documentReleaseStatus || '').trim().toLowerCase() === 'blocked').length },
    { key: 'coordinator', label: '跟单协同', roles: ['Order_Coordinator'], count: caseClosePending.length + archivePending.length },
  ], {
    order: ['warehouse', 'finance', 'docs', 'coordinator'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'planning',
      label: '待规划 / 待执行',
      accent: 'orange',
      count: poolsPendingPlanning.length + containersAwaitingExecution.length,
      items: [...poolsPendingPlanning, ...containersAwaitingExecution].slice(0, 5),
    },
    {
      key: 'release-risk',
      label: '放单阻断',
      accent: 'red',
      count: releaseBlocked.length,
      items: releaseBlocked.slice(0, 5),
    },
    {
      key: 'closure-archive',
      label: '结案与归档',
      accent: 'purple',
      count: caseClosePending.length + archivePending.length,
      items: [...caseClosePending, ...archivePending].slice(0, 5),
    },
  ], {
    order: ['planning', 'release-risk', 'closure-archive'],
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
      totalPlans: plans.length,
      poolsPendingPlanning: sectionCounts['planning'] ? poolsPendingPlanning.length : poolsPendingPlanning.length,
      containersAwaitingExecution: containersAwaitingExecution.length,
      releaseBlocked: releaseBlocked.length,
      caseClosePending: sectionCounts['closure-archive'] ? caseClosePending.length : caseClosePending.length,
      archivePending: archivePending.length,
    },
    queues: {
      poolsPendingPlanning,
      containersAwaitingExecution,
      releaseBlocked,
      caseClosePending,
      archivePending,
    },
    riskSummary: {
      planningRisk: riskCounts['planning-risk'] || 0,
      releaseBlocked: riskCounts['release-blocked'] || 0,
      pendingClosure: riskCounts['pending-closure'] || 0,
      pendingArchive: riskCounts['pending-archive'] || 0,
    },
  }
}
