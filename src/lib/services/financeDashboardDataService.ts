import type { AccountReceivable } from '../../contexts/FinanceContext'
import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import {
  buildTaskCenterCompatFields,
  buildTaskCenterRiskCountMap,
  composeTaskCenterDataBundle,
  finalizeTaskCenterRiskItems,
  finalizeCollaborationSections,
  finalizeTaskSections,
} from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview, TaskCenterSection } from './taskCenterContracts'

export interface FinanceDashboardTaskItem {
  id: string
  type: 'collection' | 'payment'
  customer?: string
  supplier?: string
  amount: number
  days: number
  priority: 'urgent' | 'high' | 'medium'
  orderNo?: string
  poNo?: string
}

export interface FinanceDashboardDataState {
  financialData: {
    receivables: {
      total: number
      overdue: number
      due7days: number
      due30days: number
      current: number
      overdueCount: number
      dueCount: number
      collectionRate: number
    }
    payables: {
      total: number
      urgent: number
      due7days: number
      due30days: number
      overdueCount: number
      dueCount: number
      paymentRate: number
    }
    cashflow: {
      todayIn: number
      todayOut: number
      weekIn: number
      weekOut: number
      monthIn: number
      monthOut: number
      balance: number
    }
    tasks: {
      pending: number
      urgent: number
      completed: number
      todayTarget: number
    }
  }
  pendingTasks: FinanceDashboardTaskItem[]
  releaseRiskOrders: PurchaseOrder[]
  taskCenter: TaskCenterDataBundle<FinanceDashboardTaskItem>
  taskSections: TaskCenterCompatFields<FinanceDashboardTaskItem>['taskSections']
  riskSummary: {
    overdueReceivables: number
    dueSoonReceivables: number
    pendingSupplierPayments: number
    releaseBlockedOrders: number
  }
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

function toDayDistance(now: number, dateValue?: string | null): number | null {
  if (!dateValue) return null
  const parsed = Date.parse(dateValue)
  if (Number.isNaN(parsed)) return null
  return Math.floor((now - parsed) / (1000 * 60 * 60 * 24))
}

export function buildFinanceDashboardDataState(
  accountsReceivable: AccountReceivable[],
  purchaseOrders: PurchaseOrder[],
): FinanceDashboardDataState {
  const now = Date.now()

  const openReceivables = accountsReceivable.filter((ar) => ar.status !== 'paid' && Number(ar.remainingAmount || 0) > 0)
  const overdueReceivables = openReceivables.filter((ar) => {
    const days = toDayDistance(now, ar.dueDate)
    return ar.status === 'overdue' || (days != null && days > 0)
  })
  const dueSoonReceivables = openReceivables.filter((ar) => {
    const days = toDayDistance(now, ar.dueDate)
    return days != null && days <= 0 && days >= -7
  })
  const currentReceivables = openReceivables.filter((ar) => !overdueReceivables.includes(ar) && !dueSoonReceivables.includes(ar))

  const procurementOrders = purchaseOrders.filter((order) => String(order.poNumber || '').startsWith('CG-'))
  const pendingSupplierPayments = procurementOrders.filter((order) => {
    const status = String(order.supplierBalanceStatus || '').toLowerCase()
    return !['paid', 'confirmed', 'completed'].includes(status) && Number(order.totalAmount || 0) > 0
  })
  const releaseRiskOrders = procurementOrders.filter((order) => {
    const releaseStatus = String(order.documentReleaseStatus || '').toLowerCase()
    const gateStatus = String(order.customerBalanceGateStatus || '').toLowerCase()
    return releaseStatus === 'blocked' || gateStatus === 'blocked'
  })

  const receivableTasks: FinanceDashboardTaskItem[] = openReceivables.map((ar) => {
    const days = toDayDistance(now, ar.dueDate) ?? 0
    const priority = ar.status === 'overdue' || days > 7 ? 'urgent' : days > 0 ? 'high' : 'medium'
    return {
      id: ar.id,
      type: 'collection',
      customer: ar.customerName,
      amount: Number(ar.remainingAmount || 0),
      days,
      priority,
      orderNo: ar.orderNumber,
    }
  })
  const payableTasks: FinanceDashboardTaskItem[] = pendingSupplierPayments.map((order) => {
    const days = toDayDistance(now, order.expectedDate) ?? 0
    const priority = String(order.cgType || '') === 'urgent' || days > 7 ? 'urgent' : days > 0 ? 'high' : 'medium'
    return {
      id: order.id,
      type: 'payment',
      supplier: order.supplierName,
      amount: Number(order.totalAmount || 0),
      days,
      priority,
      poNo: order.poNumber,
    }
  })
  const pendingTasks = [...receivableTasks, ...payableTasks]
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 8)

  const totalReceivable = openReceivables.reduce((sum, ar) => sum + Number(ar.remainingAmount || 0), 0)
  const totalPayable = pendingSupplierPayments.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
  const urgentPayable = pendingSupplierPayments
    .filter((order) => String(order.cgType || '') === 'urgent')
    .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
  const confirmedReceipts = accountsReceivable.reduce((sum, ar) => sum + Number(ar.paidAmount || 0), 0)

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'overdue-receivables', label: '逾期应收', count: overdueReceivables.length, tone: 'critical' },
    { key: 'due-soon-receivables', label: '7天内到期应收', count: dueSoonReceivables.length, tone: 'warning' },
    { key: 'pending-supplier-payments', label: '待付供应商款', count: pendingSupplierPayments.length, tone: 'info' },
    { key: 'release-blocked-orders', label: '放单阻断订单', count: releaseRiskOrders.length, tone: 'default' },
  ], {
    order: ['overdue-receivables', 'due-soon-receivables', 'release-blocked-orders', 'pending-supplier-payments'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'collections',
      label: '应收催收待办',
      accent: 'orange',
      count: receivableTasks.length,
      items: receivableTasks.slice(0, 5),
    },
    {
      key: 'supplier-payments',
      label: '供应商付款待办',
      accent: 'blue',
      count: payableTasks.length,
      items: payableTasks.slice(0, 5),
    },
    {
      key: 'release-risk',
      label: '放单风险待办',
      accent: 'red',
      count: releaseRiskOrders.length,
      items: releaseRiskOrders.slice(0, 5).map((order) => ({
        id: order.id,
        type: 'payment',
        supplier: order.supplierName,
        amount: Number(order.totalAmount || 0),
        days: toDayDistance(now, order.expectedDate) ?? 0,
        priority: 'urgent' as const,
        poNo: order.poNumber,
      })),
    },
  ], {
    order: ['release-risk', 'collections', 'supplier-payments'],
    defaultAccent: 'blue',
  })

  const collaborationSections = finalizeCollaborationSections([
    { key: 'sales', label: '业务协同', roles: ['Sales_Rep'], count: overdueReceivables.length + dueSoonReceivables.length },
    { key: 'procurement', label: '采购协同', roles: ['Procurement'], count: pendingSupplierPayments.length },
    { key: 'warehouse', label: '仓配协同', roles: ['Warehouse_Ops'], count: releaseRiskOrders.length },
    {
      key: 'docs',
      label: '单证协同',
      roles: ['Documentation_Officer'],
      count: procurementOrders.filter((order) => String(order.collectionControlMode || '').toLowerCase() === 'lc_bank_negotiation').length,
    },
  ], {
    order: ['sales', 'procurement', 'docs', 'warehouse'],
  })

  const taskCenter = composeTaskCenterDataBundle({
    taskSections,
    riskItems,
    collaborationSections,
  })
  const taskCenterCompat = buildTaskCenterCompatFields(taskCenter)
  const riskSummaryMap = buildTaskCenterRiskCountMap(riskItems)

  return {
    financialData: {
      receivables: {
        total: totalReceivable,
        overdue: overdueReceivables.reduce((sum, ar) => sum + Number(ar.remainingAmount || 0), 0),
        due7days: dueSoonReceivables.reduce((sum, ar) => sum + Number(ar.remainingAmount || 0), 0),
        due30days: openReceivables.reduce((sum, ar) => sum + Number(ar.remainingAmount || 0), 0),
        current: currentReceivables.reduce((sum, ar) => sum + Number(ar.remainingAmount || 0), 0),
        overdueCount: overdueReceivables.length,
        dueCount: dueSoonReceivables.length,
        collectionRate: openReceivables.length > 0
          ? Math.round((confirmedReceipts / Math.max(confirmedReceipts + totalReceivable, 1)) * 1000) / 10
          : 100,
      },
      payables: {
        total: totalPayable,
        urgent: urgentPayable,
        due7days: pendingSupplierPayments.slice(0, 7).reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
        due30days: totalPayable,
        overdueCount: releaseRiskOrders.length,
        dueCount: pendingSupplierPayments.length,
        paymentRate: pendingSupplierPayments.length > 0
          ? Math.max(0, 100 - Math.round((releaseRiskOrders.length / pendingSupplierPayments.length) * 1000) / 10)
          : 100,
      },
      cashflow: {
        todayIn: confirmedReceipts,
        todayOut: 0,
        weekIn: confirmedReceipts,
        weekOut: 0,
        monthIn: confirmedReceipts,
        monthOut: 0,
        balance: confirmedReceipts - totalPayable,
      },
      tasks: {
        pending: pendingTasks.length,
        urgent: pendingTasks.filter((task) => task.priority === 'urgent').length,
        completed: accountsReceivable.filter((ar) => ar.status === 'paid').length,
        todayTarget: overdueReceivables.length + releaseRiskOrders.length,
      },
    },
    pendingTasks,
    releaseRiskOrders,
    ...taskCenterCompat,
    riskSummary: {
      overdueReceivables: riskSummaryMap['overdue-receivables'] || 0,
      dueSoonReceivables: riskSummaryMap['due-soon-receivables'] || 0,
      pendingSupplierPayments: riskSummaryMap['pending-supplier-payments'] || 0,
      releaseBlockedOrders: riskSummaryMap['release-blocked-orders'] || 0,
    },
  }
}
