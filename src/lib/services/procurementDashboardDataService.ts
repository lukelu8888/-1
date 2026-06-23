import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import { derivePurchaseOrderWorkflowFields } from './purchaseOrderQuoteRequirementServices'
import {
  buildTaskCenterCompatFields,
  buildTaskCenterRiskCountMap,
  composeTaskCenterDataBundle,
  finalizeCollaborationSections,
  finalizeTaskCenterRiskItems,
  finalizeTaskSections,
} from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview, TaskCenterSection } from './taskCenterContracts'

export interface ProcurementDashboardTaskItem {
  poNumber: string
  supplierName: string
  customerLabel: string
  customerCompany: string
  customerName: string
  amount: number
  totalAmount: number
  statusLabel: string
  procurementRequestStatus: string
  itemSummary: string
  items: PurchaseOrder['items']
  cgType: string
  prValidationStatus: string
  allocatedSupplierCount: number
  totalItemCount: number
  inspectionMode: string
  qcInspectionStatus: string
  qcReleaseStatus: string
  collaborationHints: string[]
  raw: PurchaseOrder
}

export interface ProcurementDashboardRiskSummary {
  urgentCount: number
  pendingApprovalCount: number
  pendingValidationCount: number
  qcBlockedCount: number
  missingSupplierCount: number
}

export interface ProcurementDashboardOverview {
  procurementRequests: PurchaseOrder[]
  procurementContracts: PurchaseOrder[]
  prAssignmentQueue: PurchaseOrder[]
  cgApprovalQueue: PurchaseOrder[]
  pendingProcurement: PurchaseOrder[]
  urgentOrders: PurchaseOrder[]
  inspectionOrders: PurchaseOrder[]
  inTransitOrders: PurchaseOrder[]
  amountTotal: number
  topUrgent: ProcurementDashboardTaskItem[]
  topPending: ProcurementDashboardTaskItem[]
  topInspection: ProcurementDashboardTaskItem[]
  topPrAssignment: ProcurementDashboardTaskItem[]
  topCgApproval: ProcurementDashboardTaskItem[]
  taskCenter: TaskCenterDataBundle<ProcurementDashboardTaskItem>
  taskSections: TaskCenterCompatFields<ProcurementDashboardTaskItem>['taskSections']
  riskSummary: ProcurementDashboardRiskSummary
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

function normalizeEmail(value?: string | null): string {
  return String(value || '').trim().toLowerCase()
}

function summarizeItems(order: PurchaseOrder): string {
  const items = Array.isArray(order.items) ? order.items : []
  if (!items.length) return '待补充明细'
  return items
    .slice(0, 2)
    .map((item: any) => `${item.productName || item.product_name || '产品'}×${item.quantity || item.qty || 0}`)
    .join('，')
}

function buildTaskItem(order: PurchaseOrder): ProcurementDashboardTaskItem {
  const workflow = derivePurchaseOrderWorkflowFields(order)
  const statusLabel = workflow.documentType === 'PR'
    ? String(order.procurementRequestStatus || workflow.executionStatus || order.status || '-')
    : String(order.procurementRequestStatus || workflow.approvalStatus || workflow.executionStatus || order.status || '-')
  const inspectionMode = String(order.inspectionExecutionMode || '')
  const qcInspectionStatus = String(order.qcInspectionStatus || '')
  const qcReleaseStatus = String(order.qcReleaseStatus || '')
  const collaborationHints = new Set<string>()

  if (['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || ''))) collaborationHints.add('Procurement_Manager')
  if (inspectionMode) collaborationHints.add('QC')
  if (String(order.customerPaymentGateStatus || '').toLowerCase() === 'blocked') collaborationHints.add('Finance')
  if (String(order.collectionControlMode || '').toLowerCase() === 'lc_bank_negotiation') collaborationHints.add('Documentation_Officer')
  if (String(order.bookingStatus || '').toLowerCase() === 'pending') collaborationHints.add('Order_Coordinator')

  return {
    poNumber: String(order.poNumber || ''),
    supplierName: String(order.supplierName || '待定供应商'),
    customerLabel: String(order.customerCompany || order.customerName || '待补客户'),
    customerCompany: String(order.customerCompany || ''),
    customerName: String(order.customerName || ''),
    amount: Number(order.totalAmount || 0),
    totalAmount: Number(order.totalAmount || 0),
    statusLabel,
    procurementRequestStatus: String(order.procurementRequestStatus || ''),
    itemSummary: summarizeItems(order),
    items: Array.isArray(order.items) ? order.items : [],
    cgType: String(order.cgType || 'standard'),
    prValidationStatus: String(order.prValidationStatus || '-'),
    allocatedSupplierCount: Number(order.allocatedSupplierCount || 0),
    totalItemCount: Math.max(Array.isArray(order.items) ? order.items.length : 0, 1),
    inspectionMode,
    qcInspectionStatus,
    qcReleaseStatus,
    collaborationHints: Array.from(collaborationHints),
    raw: order,
  }
}

export function buildProcurementDashboardOverview(purchaseOrders: PurchaseOrder[], userEmail?: string | null): ProcurementDashboardOverview {
  const normalizedEmail = normalizeEmail(userEmail)
  const scopedOrders = purchaseOrders.filter((order) => {
    const candidates = [
      order.assignedTo,
      order.ownerEmail,
      order.operatorEmail,
      order.authenticatedUserEmail,
      order.actingUserEmail,
    ].map((value) => normalizeEmail(value)).filter(Boolean)
    return normalizedEmail ? candidates.includes(normalizedEmail) : true
  })

  const relevantOrders = scopedOrders.length > 0 ? scopedOrders : purchaseOrders
  const procurementRequests = relevantOrders.filter((order) => derivePurchaseOrderWorkflowFields(order).documentType === 'PR')
  const procurementContracts = relevantOrders.filter((order) => derivePurchaseOrderWorkflowFields(order).documentType === 'CG')
  const prAssignmentQueue = procurementRequests.filter((order) => {
    const workflow = derivePurchaseOrderWorkflowFields(order)
    return ['pending_assignment', 'partially_allocated'].includes(String(workflow.executionStatus || '')) || !order.supplierAllocationReady
  })
  const cgApprovalQueue = procurementContracts.filter((order) => {
    const workflow = derivePurchaseOrderWorkflowFields(order)
    return ['pending_l1', 'pending_l2'].includes(String(workflow.approvalStatus || ''))
  })
  const pendingProcurement = procurementContracts.filter((order) => (
    ['draft', 'pending_l1', 'pending_l2'].includes(String(derivePurchaseOrderWorkflowFields(order).approvalStatus || '')) ||
    ['pending', 'confirmed'].includes(String(order.status || '').toLowerCase())
  ))
  const urgentOrders = procurementContracts.filter((order) => String(order.cgType || '').toLowerCase() === 'urgent')
  const inspectionOrders = procurementContracts.filter((order) => {
    const mode = String(order.inspectionExecutionMode || '').toLowerCase()
    const qcStatus = String(order.qcInspectionStatus || '').toLowerCase()
    return ['our_qc', 'customer_third_party'].includes(mode) || ['pending', 'scheduled', 'in_progress'].includes(qcStatus)
  })
  const inTransitOrders = procurementContracts.filter((order) => {
    const execution = String(order.executionStatus || derivePurchaseOrderWorkflowFields(order).executionStatus || '').toLowerCase()
    const booking = String(order.bookingStatus || '').toLowerCase()
    return ['shipped', 'booking_confirmed', 'in_transit'].includes(execution) || ['booked', 'confirmed'].includes(booking)
  })
  const amountTotal = pendingProcurement.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

  const topUrgent = [...urgentOrders, ...pendingProcurement.filter((order) => ['pending_l1', 'pending_l2'].includes(String(derivePurchaseOrderWorkflowFields(order).approvalStatus || '')))]
    .slice(0, 5)
    .map(buildTaskItem)
  const topPending = pendingProcurement.slice(0, 5).map(buildTaskItem)
  const topInspection = inspectionOrders.slice(0, 5).map(buildTaskItem)
  const topPrAssignment = prAssignmentQueue.slice(0, 5).map(buildTaskItem)
  const topCgApproval = cgApprovalQueue.slice(0, 5).map(buildTaskItem)

  const collaborationSections = finalizeCollaborationSections([
    { key: 'approval', label: '审批协同', roles: ['Procurement_Manager', 'CEO'], count: cgApprovalQueue.length },
    { key: 'quality', label: '质检协同', roles: ['QC'], count: inspectionOrders.length },
    { key: 'finance', label: '财务协同', roles: ['Finance'], count: procurementContracts.filter((order) => String(order.customerPaymentGateStatus || '').toLowerCase() === 'blocked').length },
    { key: 'docs', label: '单证协同', roles: ['Documentation_Officer'], count: procurementContracts.filter((order) => String(order.collectionControlMode || '').toLowerCase() === 'lc_bank_negotiation').length },
    { key: 'shipping', label: '订舱协同', roles: ['Order_Coordinator'], count: procurementContracts.filter((order) => String(order.bookingStatus || '').toLowerCase() === 'pending').length },
  ], {
    order: ['approval', 'quality', 'finance', 'docs', 'shipping'],
  })

  const taskSections = finalizeTaskSections([
    {
      key: 'pr-assignment',
      label: 'PR 分配待办',
      accent: 'blue',
      count: topPrAssignment.length,
      items: topPrAssignment,
    },
    {
      key: 'cg-approval',
      label: 'CG 审批待办',
      accent: 'green',
      count: topCgApproval.length,
      items: topCgApproval,
    },
  ], {
    order: ['cg-approval', 'pr-assignment'],
    defaultAccent: 'blue',
  })

  const pendingValidationCount = procurementContracts.filter(
    (order) => String(order.prValidationStatus || '').toLowerCase() === 'pending',
  ).length
  const qcBlockedCount = procurementContracts.filter(
    (order) => String(order.qcReleaseStatus || '').toLowerCase() === 'blocked',
  ).length
  const missingSupplierCount = procurementContracts.filter(
    (order) => !String(order.supplierName || '').trim(),
  ).length
  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'urgent-count', label: '紧急采购', count: urgentOrders.length, tone: 'critical' },
    { key: 'pending-approval-count', label: '待审批', count: cgApprovalQueue.length, tone: 'info' },
    { key: 'pending-validation-count', label: '待校验', count: pendingValidationCount, tone: 'warning' },
    { key: 'missing-supplier-count', label: '缺供应商', count: missingSupplierCount, tone: 'default' },
    { key: 'qc-blocked-count', label: 'QC阻断', count: qcBlockedCount, tone: 'critical' },
  ], {
    order: ['urgent-count', 'qc-blocked-count', 'pending-validation-count', 'pending-approval-count', 'missing-supplier-count'],
  })

  const taskCenter = composeTaskCenterDataBundle({
    taskSections,
    riskItems,
    collaborationSections,
  })
  const taskCenterCompat = buildTaskCenterCompatFields(taskCenter)
  const riskSummaryMap = buildTaskCenterRiskCountMap(riskItems)
  const riskSummary: ProcurementDashboardRiskSummary = {
    urgentCount: riskSummaryMap['urgent-count'] || 0,
    pendingApprovalCount: riskSummaryMap['pending-approval-count'] || 0,
    pendingValidationCount: riskSummaryMap['pending-validation-count'] || 0,
    qcBlockedCount: riskSummaryMap['qc-blocked-count'] || 0,
    missingSupplierCount: riskSummaryMap['missing-supplier-count'] || 0,
  }

  return {
    procurementRequests,
    procurementContracts,
    prAssignmentQueue,
    cgApprovalQueue,
    pendingProcurement,
    urgentOrders,
    inspectionOrders,
    inTransitOrders,
    amountTotal,
    topUrgent,
    topPending,
    topInspection,
    topPrAssignment,
    topCgApproval,
    ...taskCenterCompat,
    riskSummary,
  }
}
