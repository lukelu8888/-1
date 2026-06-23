import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import type { DocumentTaskRecord } from './document-task/documentTaskTypes'
import { buildTaskCenterCompatFields, buildTaskCenterRiskCountMap, buildTaskCenterSectionCountMap, composeTaskCenterDataBundle, finalizeCollaborationSections, finalizeTaskCenterRiskItems, finalizeTaskSections } from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview } from './taskCenterContracts'

export interface DocumentationTaskSummary {
  tasks: DocumentTaskRecord[]
  taskCenter: TaskCenterDataBundle<DocumentTaskRecord>
  taskSections: TaskCenterCompatFields<DocumentTaskRecord>['taskSections']
  riskSummary: {
    lcBankFollowUp: number
    releaseBlocked: number
    arrivalArchivePending: number
    clearanceCoordination: number
  }
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

function buildDerivedTask(
  purchaseOrder: PurchaseOrder,
  suffix: string,
  overrides: Partial<DocumentTaskRecord>,
): DocumentTaskRecord {
  const baseTime = purchaseOrder.updatedDate || purchaseOrder.createdDate || new Date().toISOString()
  return {
    id: `derived-${purchaseOrder.id}-${suffix}`,
    taskNumber: `AUTO-${purchaseOrder.poNumber}-${suffix.toUpperCase()}`,
    sourceMailThreadId: null,
    projectCode: purchaseOrder.projectCode || null,
    orderId: purchaseOrder.poNumber || null,
    contractNo: purchaseOrder.salesContractNumber || null,
    docCode: null,
    taskTitle: overrides.taskTitle || `${purchaseOrder.poNumber} 单证任务`,
    taskSummary: overrides.taskSummary || '系统根据履约状态自动派生的单证待办',
    ownerDepartment: overrides.ownerDepartment || '单证部',
    ownerRole: overrides.ownerRole || 'Documentation_Officer',
    priority: overrides.priority || 'normal',
    dueAt: overrides.dueAt ?? purchaseOrder.expectedDate ?? null,
    status: overrides.status || 'open',
    createdAt: baseTime,
    updatedAt: baseTime,
  }
}

export function deriveDocumentationTaskSummary(purchaseOrders: PurchaseOrder[]): DocumentationTaskSummary {
  const tasks: DocumentTaskRecord[] = []
  const contracts = purchaseOrders.filter((order) => String(order.poNumber || '').startsWith('CG-'))

  contracts.forEach((order) => {
    const bankSubmissionStatus = String(order.bankSubmissionStatus || '').toLowerCase()
    const documentReleaseStatus = String(order.documentReleaseStatus || '').toLowerCase()
    const shipmentReadinessStatus = String(order.shipmentReadinessStatus || '').toLowerCase()
    const collectionControlMode = String(order.collectionControlMode || '').toLowerCase()
    const customerBalanceGateStatus = String(order.customerBalanceGateStatus || '').toLowerCase()

    if (
      collectionControlMode === 'lc_bank_negotiation' &&
      ['pending_submission', 'submitted_to_bank', 'negotiating'].includes(bankSubmissionStatus)
    ) {
      tasks.push(
        buildDerivedTask(order, 'lc-bank', {
          docCode: 'D05',
          taskTitle: `${order.poNumber} 待跟进 L/C 交单`,
          taskSummary: `当前交单状态：${order.bankSubmissionStatus || '待交单'}，需持续跟进银行议付与单证反馈。`,
          priority: bankSubmissionStatus === 'submitted_to_bank' ? 'high' : 'critical',
          status: bankSubmissionStatus === 'submitted_to_bank' ? 'reviewing' : 'open',
        }),
      )
    }

    if (['pending', 'blocked'].includes(documentReleaseStatus)) {
      tasks.push(
        buildDerivedTask(order, 'release', {
          docCode: 'D05',
          taskTitle: `${order.poNumber} 待确认放单条件`,
          taskSummary:
            customerBalanceGateStatus === 'blocked'
              ? '当前因客户收款/风控条件未满足而阻断放单，需与财务和业务协同确认。'
              : `当前放单状态：${order.documentReleaseStatus || 'pending'}，需补齐交单、收款或放单条件。`,
          priority: documentReleaseStatus === 'blocked' ? 'critical' : 'high',
          status: documentReleaseStatus === 'blocked' ? 'reviewing' : 'open',
        }),
      )
    }

    if (shipmentReadinessStatus === 'arrival_notice_sent') {
      tasks.push(
        buildDerivedTask(order, 'arrival', {
          docCode: 'ARRIVAL',
          taskTitle: `${order.poNumber} 到港通知归档待确认`,
          taskSummary: '已进入到港通知阶段，需确认通知发送、客户确认与归档资料是否齐全。',
          priority: 'normal',
          status: 'in_progress',
        }),
      )
    }

    if (shipmentReadinessStatus === 'under_import_clearance') {
      tasks.push(
        buildDerivedTask(order, 'clearance', {
          docCode: 'CLEARANCE',
          taskTitle: `${order.poNumber} 清关资料协同`,
          taskSummary: '订单处于进口清关阶段，需持续跟进清关资料完整性与客户配合状态。',
          priority: 'high',
          status: 'in_progress',
        }),
      )
    }
  })

  const sortedTasks = tasks.sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  const lcBankFollowUp = sortedTasks.filter((task) => task.id.includes('-lc-bank')).length
  const releaseBlocked = sortedTasks.filter((task) => task.id.includes('-release') && task.priority === 'critical').length
  const arrivalArchivePending = sortedTasks.filter((task) => task.id.includes('-arrival')).length
  const clearanceCoordination = sortedTasks.filter((task) => task.id.includes('-clearance')).length

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'lc-bank-follow-up', label: 'L/C交单跟进', count: lcBankFollowUp, tone: 'critical' },
    { key: 'release-blocked', label: '放单阻断', count: releaseBlocked, tone: 'critical' },
    { key: 'arrival-archive-pending', label: '到港归档待办', count: arrivalArchivePending, tone: 'info' },
    { key: 'clearance-coordination', label: '清关协同', count: clearanceCoordination, tone: 'warning' },
  ], {
    order: ['lc-bank-follow-up', 'release-blocked', 'clearance-coordination', 'arrival-archive-pending'],
  })

  const collaborationSections = finalizeCollaborationSections([
    { key: 'finance', label: '财务协同', roles: ['Finance'], count: releaseBlocked },
    { key: 'docs', label: '单证处理', roles: ['Documentation_Officer'], count: lcBankFollowUp + arrivalArchivePending + clearanceCoordination },
    { key: 'sales', label: '业务协同', roles: ['Sales_Rep'], count: sortedTasks.filter((task) => task.priority === 'critical').length },
    { key: 'clearance', label: '清关协同', roles: ['Order_Coordinator'], count: clearanceCoordination + arrivalArchivePending },
  ], {
    order: ['docs', 'finance', 'sales', 'clearance'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'lc-banking',
      label: 'L/C 交单与银行',
      accent: 'purple',
      count: lcBankFollowUp,
      items: sortedTasks.filter((task) => task.id.includes('-lc-bank')).slice(0, 5),
    },
    {
      key: 'release-control',
      label: '放单与收款卡点',
      accent: 'red',
      count: sortedTasks.filter((task) => task.id.includes('-release')).length,
      items: sortedTasks.filter((task) => task.id.includes('-release')).slice(0, 5),
    },
    {
      key: 'arrival-clearance',
      label: '到港与清关',
      accent: 'teal',
      count: arrivalArchivePending + clearanceCoordination,
      items: sortedTasks
        .filter((task) => task.id.includes('-arrival') || task.id.includes('-clearance'))
        .slice(0, 5),
    },
  ], {
    order: ['lc-banking', 'release-control', 'arrival-clearance'],
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
    tasks: sortedTasks,
    ...taskCenterCompat,
    riskSummary: {
      lcBankFollowUp: sectionCounts['lc-banking'] || 0,
      releaseBlocked: riskCounts['release-blocked'] || 0,
      arrivalArchivePending: riskCounts['arrival-archive-pending'] || 0,
      clearanceCoordination: sectionCounts['arrival-clearance']
        ? riskCounts['clearance-coordination'] || 0
        : riskCounts['clearance-coordination'] || 0,
    },
  }
}

export function deriveDocumentationTasks(purchaseOrders: PurchaseOrder[]): DocumentTaskRecord[] {
  return deriveDocumentationTaskSummary(purchaseOrders).tasks
}
