import type { Inquiry } from '../../contexts/InquiryContext'
import type { QuotationRequest } from '../../contexts/QuotationRequestContext'
import type { SalesQuotation } from '../../contexts/SalesQuotationContext'
import type { SalesContract } from '../../contexts/SalesContractContext'
import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import { normalizePersonnelEmail } from '../notification-rules'
import {
  buildTaskCenterCompatFields,
  buildTaskCenterRiskCountMap,
  buildTaskCenterSectionCountMap,
  composeTaskCenterDataBundle,
  finalizeCollaborationSections,
  finalizeTaskCenterRiskItems,
  finalizeTaskSections,
} from './taskCenterContracts'
import type { RoleCollaborationSection, TaskCenterCompatFields, TaskCenterDataBundle, TaskCenterRiskItem, TaskCenterRiskOverview, TaskCenterSection } from './taskCenterContracts'

// ── computeSalesTodoSummary input/output types (used by SalesManagerTodoCenter & orderManagementCountService) ──
export interface ComputeSalesTodoSummaryInput {
  salesEmail: string
  salesName?: string
  salesRegion?: string
  inquiries: Inquiry[]
  quotationRequests: QuotationRequest[]
  quotations: SalesQuotation[]
  contracts: SalesContract[]
  purchaseOrders: PurchaseOrder[]
  quoteRequirements?: any[]
  exportServiceOrders?: any[]
}

export interface ComputeSalesTodoSummaryResult {
  aggregated: AggregateTodosResult
  totalOpen: number
  moduleCounts: {
    inquiries: number
    costInquiry: number
    quotations: number
    orders: number
    collections: number
    exportService: number
  }
}

export type TodoPriority = 'overdue' | 'high' | 'medium' | 'normal'

export type TodoType =
  | 'ing_new'
  | 'ing_clarify'
  | 'qr_waiting_cost'
  | 'qt_send'
  | 'qt_customer_feedback'
  | 'qt_negotiating'
  | 'sc_sign'
  | 'sc_deposit'
  | 'inspection_method'
  | 'third_party_inspection'
  | 'payment_followup'
  | 'balance_tt_chase'
  | 'lc_open_chase'
  | 'lc_terms_confirm'
  | 'bl_copy_send'
  | 'dp_redemption_chase'
  | 'da_acceptance_chase'
  | 'da_maturity_chase'
  | 'oa_period_warning'
  | 'oa_overdue_chase'
  | 'freight_confirmation'
  | 'arrival_confirmation'
  | 'clearance_docs'
  | 'receipt_confirmation'
  | 'feedback_followup'

export type TodoBucket =
  | 'must_today'
  | 'quote_contract'
  | 'payment'
  | 'delivery'
  | 'feedback'
  | 'done_today'

export type FollowUpAction =
  | 'contacted'
  | 'sent_qt'
  | 'chased_contract'
  | 'chased_deposit'
  | 'shared_report'
  | 'chased_payment'
  | 'notified_arrival'
  | 'requested_clearance_docs'
  | 'confirmed_receipt'
  | 'invited_feedback'
  | 'scheduled'

export interface FollowUpRecord {
  todoId: string
  docNumber: string
  action: FollowUpAction
  note?: string
  nextFollowUpAt?: string
  recordedAt: string
}

export interface SalesTodoItem {
  id: string
  type: TodoType
  bucket: TodoBucket
  priority: TodoPriority
  customerName: string
  customerCompany: string
  customerEmail?: string
  docNumber: string
  docType: 'ING' | 'QR' | 'QT' | 'SC' | 'CG'
  stage: string
  blockReason: string
  nextAction: string
  createdAt: string
  dueAt?: string
  lastContactAt?: string
  nextFollowUpAt?: string
  navigateTo?: string
  referenceId: string
  isCompleted?: boolean
  completedAt?: string
  completedNote?: string
}

export interface CustomerGroup {
  customerCompany: string
  customerName: string
  customerEmail?: string
  todos: SalesTodoItem[]
  highestPriority: TodoPriority
  hasOverdue: boolean
}

export interface AggregateTodosInput {
  salesEmail: string
  inquiries: Inquiry[]
  quotationRequests: QuotationRequest[]
  quotations: SalesQuotation[]
  contracts: SalesContract[]
  purchaseOrders: PurchaseOrder[]
}

export interface AggregateTodosResult {
  todos: SalesTodoItem[]
  bucketCounts: Record<TodoBucket, number>
  customerGroups: CustomerGroup[]
  summary: SalesTodoDashboardSummary
  taskCenter: TaskCenterDataBundle<SalesTodoItem>
  taskSections: TaskCenterCompatFields<SalesTodoItem>['taskSections']
  riskItems: TaskCenterRiskItem[]
  riskOverview: TaskCenterRiskOverview
  collaborationSections: RoleCollaborationSection[]
}

export interface SalesTodoDashboardSummary {
  totalOpen: number
  mustTodayCount: number
  overdueCount: number
  completedTodayCount: number
  highRiskGroups: CustomerGroup[]
  upcomingTodos: SalesTodoItem[]
  mustTodayDone: number
  mustTodayTotal: number
  progressPct: number
}

export interface CustomerReplyItem {
  customerCompany: string
  customerName: string
  docNumber: string
  source: string
  summary: string
  repliedAt: string
}

const FOLLOW_UP_STORAGE_KEY = 'sales_todo_followup_records'
const COMPLETED_STORAGE_KEY = 'sales_todo_completed_ids'

export function saveFollowUpRecord(record: FollowUpRecord): void {
  const existing = getFollowUpRecords()
  existing.unshift(record)
  localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(existing.slice(0, 300)))
}

export function getFollowUpRecords(): FollowUpRecord[] {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_UP_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function markTodoCompleted(todoId: string, note?: string): void {
  const completed = getCompletedMap()
  completed[todoId] = { completedAt: new Date().toISOString(), note }
  localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completed))
}

export function getCompletedMap(): Record<string, { completedAt: string; note?: string }> {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase()
}

function normalizeSalesOwnerEmail(email?: string | null, region?: string | null): string {
  return normalizePersonnelEmail(email, region)
}

function toIso(value?: string | number | null): string {
  if (!value) return new Date().toISOString()
  if (typeof value === 'number') return new Date(value).toISOString()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function relativeDaysFromNow(value?: string | number | null): number | null {
  if (!value) return null
  const ts = typeof value === 'number' ? value : new Date(value).getTime()
  if (!Number.isFinite(ts)) return null
  return Math.floor((ts - Date.now()) / 86_400_000)
}

function calcPriority(opts: { isNew?: boolean; dueAt?: string; ageAt?: string }): TodoPriority {
  if (opts.isNew) return 'high'
  const dueDays = relativeDaysFromNow(opts.dueAt)
  if (dueDays != null) {
    if (dueDays < 0) return 'overdue'
    if (dueDays <= 1) return 'high'
    if (dueDays <= 3) return 'medium'
  }

  if (opts.ageAt) {
    const ageMs = Date.now() - new Date(opts.ageAt).getTime()
    const ageDays = Math.floor(ageMs / 86_400_000)
    if (ageDays >= 7) return 'high'
    if (ageDays >= 3) return 'medium'
  }

  return 'normal'
}

function calcBucket(type: TodoType, priority: TodoPriority): TodoBucket {
  if (priority === 'overdue' || priority === 'high' || type === 'ing_new') return 'must_today'
  if (['qt_send', 'qt_customer_feedback', 'qt_negotiating', 'sc_sign', 'inspection_method', 'third_party_inspection'].includes(type)) {
    return 'quote_contract'
  }
  if ([
    'sc_deposit',
    'payment_followup',
    'balance_tt_chase',
    'lc_open_chase',
    'lc_terms_confirm',
    'bl_copy_send',
    'dp_redemption_chase',
    'da_acceptance_chase',
    'da_maturity_chase',
    'oa_period_warning',
    'oa_overdue_chase',
    'freight_confirmation',
  ].includes(type)) return 'payment'
  if (['arrival_confirmation', 'clearance_docs', 'receipt_confirmation'].includes(type)) return 'delivery'
  if (type === 'feedback_followup') return 'feedback'
  return 'must_today'
}

function collaborationRolesForTodoType(type: TodoType): string[] {
  switch (type) {
    case 'qr_waiting_cost':
      return ['Procurement']
    case 'sc_sign':
      return ['Customer']
    case 'sc_deposit':
    case 'balance_tt_chase':
    case 'dp_redemption_chase':
    case 'da_acceptance_chase':
    case 'da_maturity_chase':
    case 'oa_period_warning':
    case 'oa_overdue_chase':
      return ['Finance']
    case 'inspection_method':
    case 'third_party_inspection':
      return ['QC']
    case 'lc_open_chase':
      return ['Finance', 'Customer']
    case 'lc_terms_confirm':
      return ['Documentation_Officer', 'Finance']
    case 'freight_confirmation':
    case 'arrival_confirmation':
    case 'receipt_confirmation':
      return ['Order_Coordinator']
    case 'clearance_docs':
      return ['Documentation_Officer']
    case 'feedback_followup':
      return ['Marketing_Ops']
    default:
      return []
  }
}

function pickLatestFollowUp(todoId: string, all: FollowUpRecord[]) {
  return all.find((record) => record.todoId === todoId)
}

function stageFromPo(po: PurchaseOrder): string {
  if (po.shipmentReadinessStatus === 'delivered_to_customer') return '已交付，待客户反馈'
  if (po.shipmentReadinessStatus === 'customs_released') return '清关已放行，待确认收货'
  if (po.shipmentReadinessStatus === 'under_import_clearance') return '清关中，待客户配合资料'
  if (po.shipmentReadinessStatus === 'arrival_notice_sent' || po.shipmentReadinessStatus === 'arrived_at_port') return '已到港，待客户确认'
  if (po.finishedGoodsConfirmedAt) return '完货后客户协同'
  return '履约协同'
}

function buildPaymentTodoConfig(
  po: PurchaseOrder,
  contract: Partial<SalesContract> | null,
): { type: TodoType; blockReason: string; nextAction: string; ageAt?: string; dueAt?: string } | null {
  const mode = String(po.collectionControlMode || '').trim()
  const gateStatus = String(po.customerBalanceGateStatus || 'pending').trim().toLowerCase()
  const bankStatus = String(po.bankSubmissionStatus || 'not_required').trim().toLowerCase()
  const documentStatus = String(po.documentReleaseStatus || 'pending').trim().toLowerCase()
  const paymentMode = String(contract?.paymentMode || '').trim()

  if (!mode || ['released', 'completed', 'collected', 'finance_confirmed'].includes(gateStatus)) {
    return null
  }

  if (mode === 'prepaid_before_booking' || mode === 'post_tt_before_obl_release') {
    if (paymentMode === 'tt_deposit_balance_against_bl' && !po.customerPaymentReceivedAt && !po.customerPaymentConfirmedAt) {
      return {
        type: 'bl_copy_send',
        blockReason: '见提单付款场景下，待向客户发送提单副本并催收尾款',
        nextAction: '发送提单副本并催客户付款',
        ageAt: po.updatedDate || po.createdDate,
      }
    }

    return {
      type: 'balance_tt_chase',
      blockReason: mode === 'prepaid_before_booking'
        ? '订舱前尾款尚未完成确认'
        : '放单前尾款尚未完成确认',
      nextAction: mode === 'prepaid_before_booking' ? '催客户完成订舱前尾款' : '催客户完成放单前尾款',
      ageAt: po.customerBalanceConfirmedAt || po.customerPaymentReceivedAt || po.updatedDate || po.createdDate,
    }
  }

  if (mode === 'lc_bank_negotiation') {
    if (['pending_lc_issuance', 'awaiting_customer', 'blocked'].includes(gateStatus)) {
      return {
        type: 'lc_open_chase',
        blockReason: '信用证尚未落实，无法进入交单议付环节',
        nextAction: '催客户开立并确认 L/C',
        ageAt: po.updatedDate || po.createdDate,
      }
    }

    if (['pending_submission', 'submitted_to_bank'].includes(bankStatus)) {
      return {
        type: 'lc_terms_confirm',
        blockReason: bankStatus === 'submitted_to_bank'
          ? '已向银行交单，待跟进议付与单证条件'
          : 'L/C 已到位，待确认交单要求与议付条件',
        nextAction: bankStatus === 'submitted_to_bank' ? '跟进银行议付与单证状态' : '确认 L/C 条款与交单要求',
        ageAt: po.bankSubmittedAt || po.updatedDate || po.createdDate,
      }
    }

    return {
      type: 'lc_terms_confirm',
      blockReason: 'L/C 相关条件尚未完成闭环',
      nextAction: '跟进 L/C 条款、交单与议付结果',
      ageAt: po.bankSubmittedAt || po.updatedDate || po.createdDate,
    }
  }

  if (mode === 'dp_collection' || mode === 'dp_or_other_collection' || mode === 'da_acceptance') {
    if (paymentMode === 'oa') {
      const overdue = gateStatus.includes('overdue') || documentStatus === 'blocked'
      return {
        type: overdue ? 'oa_overdue_chase' : 'oa_period_warning',
        blockReason: overdue ? '账期已逾期，待客户完成回款' : '账期临近或待客户完成账期内付款',
        nextAction: overdue ? '催客户处理逾期账款' : '提醒客户在账期内完成付款',
        ageAt: po.customerPaymentReceivedAt || po.updatedDate || po.createdDate,
      }
    }

    if (mode === 'da_acceptance' || paymentMode === 'da') {
      const maturityStates = ['accepted', 'matured', 'due', 'awaiting_maturity']
      const isMaturityStage = maturityStates.some((state) => bankStatus.includes(state)) || documentStatus === 'released'
      return {
        type: isMaturityStage ? 'da_maturity_chase' : 'da_acceptance_chase',
        blockReason: isMaturityStage ? '承兑已进入到期付款阶段，待客户履约付款' : '承兑交单场景下，待客户完成承兑确认',
        nextAction: isMaturityStage ? '催客户按承兑到期付款' : '催客户完成承兑确认',
        ageAt: po.bankSubmittedAt || po.updatedDate || po.createdDate,
      }
    }

    return {
      type: 'dp_redemption_chase',
      blockReason: '托收/赎单条件尚未完成，待客户在银行完成赎单',
      nextAction: '催客户完成银行赎单或托收确认',
      ageAt: po.bankSubmittedAt || po.updatedDate || po.createdDate,
    }
  }

  return {
    type: 'payment_followup',
    blockReason: '客户付款控制节点尚未完成',
    nextAction: '催客户完成付款/交单前条件',
    ageAt: po.customerBalanceConfirmedAt || po.updatedDate || po.createdDate,
  }
}

function findContractForPurchaseOrder(
  po: PurchaseOrder,
  contracts: SalesContract[],
  quotations: SalesQuotation[],
) {
  const refs = new Set([
    String(po.salesContractNumber || '').trim(),
    String(po.sourceRef || '').trim(),
  ].filter(Boolean))

  const contract = contracts.find((item) =>
    refs.has(String(item.contractNumber || '').trim()) ||
    (po.quotationNumber && String(item.quotationNumber || '').trim() === String(po.quotationNumber).trim()),
  )

  if (contract) return contract

  if (po.quotationNumber) {
    const quotation = quotations.find((item) => String(item.qtNumber || '').trim() === String(po.quotationNumber).trim())
    if (quotation) {
      return {
        customerName: quotation.customerName,
        customerEmail: quotation.customerEmail,
        customerCompany: quotation.customerCompany,
        contractNumber: '',
        quotationNumber: quotation.qtNumber,
      } as Partial<SalesContract>
    }
  }

  return null
}

function buildBaseTodo(
  partial: Omit<SalesTodoItem, 'bucket' | 'priority' | 'isCompleted' | 'completedAt' | 'completedNote'>,
  completedMap: Record<string, { completedAt: string; note?: string }>,
  followUps: FollowUpRecord[],
  priorityOpts: { isNew?: boolean; dueAt?: string; ageAt?: string },
): SalesTodoItem {
  const priority = calcPriority(priorityOpts)
  const completed = completedMap[partial.id]
  const latestFollowUp = pickLatestFollowUp(partial.id, followUps)

  return {
    ...partial,
    bucket: calcBucket(partial.type, priority),
    priority,
    lastContactAt: latestFollowUp?.recordedAt || partial.lastContactAt,
    nextFollowUpAt: latestFollowUp?.nextFollowUpAt || partial.nextFollowUpAt,
    isCompleted: Boolean(completed),
    completedAt: completed?.completedAt,
    completedNote: completed?.note,
  }
}

export function aggregateSalesTodosFromContexts(input: AggregateTodosInput): AggregateTodosResult {
  const { salesEmail, inquiries, quotationRequests, quotations, contracts, purchaseOrders } = input
  const completedMap = getCompletedMap()
  const followUps = getFollowUpRecords()
  const me = normalizeSalesOwnerEmail(salesEmail)
  const items: SalesTodoItem[] = []

  for (const inq of inquiries) {
    const ownerMatched = normalizeSalesOwnerEmail(inq.salesRepEmail, inq.region) === me
    const submissionMatched = Boolean(
      inq.isSubmitted ||
      inq.submittedAt ||
      inq.status === 'pending' ||
      inq.status === 'approved' ||
      inq.status === 'quoted',
    )
    if (!ownerMatched || !submissionMatched) continue

    const base = {
      customerName: inq.buyerInfo?.contactPerson || '—',
      customerCompany: inq.buyerInfo?.companyName || '未命名客户',
      customerEmail: inq.buyerInfo?.email || undefined,
      docNumber: inq.inquiryNumber || `ING-${inq.id}`,
      docType: 'ING' as const,
      createdAt: toIso(inq.submittedAt || inq.createdAt),
      referenceId: inq.id,
      navigateTo: 'business-process-center',
    }

    if (inq.status === 'pending') {
      items.push(buildBaseTodo({
        id: `ing-${inq.id}-reply`,
        type: 'ing_new',
        stage: '新询价待响应',
        blockReason: '客户已提交询价，等待业务员首轮响应',
        nextAction: '联系客户并确认需求',
        ...base,
      }, completedMap, followUps, { isNew: true, ageAt: base.createdAt }))
      continue
    }

    if (inq.status === 'approved' || inq.status === 'quoted') {
      items.push(buildBaseTodo({
        id: `ing-${inq.id}-clarify`,
        type: 'ing_clarify',
        stage: '询价待澄清',
        blockReason: '仍需补充规格、数量、交期或目标价',
        nextAction: '补齐客户需求信息',
        ...base,
      }, completedMap, followUps, { ageAt: base.createdAt }))
    }
  }

  for (const qr of quotationRequests) {
    if (normalizeEmail(qr.requestedBy) !== me) continue
    if (qr.status !== 'pending' && qr.status !== 'processing') continue

    items.push(buildBaseTodo({
      id: `qr-${qr.id}`,
      type: 'qr_waiting_cost',
      customerName: qr.customerName || '—',
      customerCompany: qr.customerName || '未命名客户',
      customerEmail: qr.customerEmail,
      docNumber: qr.requestNumber,
      docType: 'QR',
      stage: '等待采购成本回传',
      blockReason: qr.status === 'processing' ? '采购已接单，待回传成本与供应商信息' : '报价请求已发起，等待采购开始处理',
      nextAction: '跟进采购成本与报价回传',
      createdAt: toIso(qr.createdDate || qr.requestDate),
      dueAt: qr.expectedQuoteDate,
      referenceId: qr.id,
      navigateTo: 'business-process-center',
    }, completedMap, followUps, { dueAt: qr.expectedQuoteDate, ageAt: qr.createdDate || qr.requestDate }))
  }

  for (const qt of quotations) {
    if (normalizeEmail(qt.salesPerson) !== me) continue

    const base = {
      customerName: qt.customerName || qt.contactPerson || '—',
      customerCompany: qt.customerCompany || qt.customerName || '未命名客户',
      customerEmail: qt.customerEmail,
      docNumber: qt.qtNumber,
      docType: 'QT' as const,
      createdAt: qt.createdAt,
      dueAt: qt.validUntil,
      referenceId: qt.id,
      navigateTo: 'business-process-center',
    }

    if (qt.approvalStatus === 'approved' && qt.customerStatus === 'not_sent') {
      items.push(buildBaseTodo({
        id: `qt-${qt.id}-send`,
        type: 'qt_send',
        stage: 'QT 待发送',
        blockReason: '报价已可发送，但尚未正式发给客户',
        nextAction: '发送 QT 给客户',
        ...base,
      }, completedMap, followUps, { dueAt: qt.validUntil, ageAt: qt.createdAt }))
    }

    if (qt.approvalStatus === 'approved' && ['sent', 'viewed'].includes(qt.customerStatus)) {
      items.push(buildBaseTodo({
        id: `qt-${qt.id}-feedback`,
        type: 'qt_customer_feedback',
        stage: 'QT 待客户反馈',
        blockReason: '报价已发出，等待客户回复',
        nextAction: '联系客户确认报价反馈',
        lastContactAt: qt.sentAt,
        ...base,
      }, completedMap, followUps, { dueAt: qt.validUntil, ageAt: qt.sentAt || qt.createdAt }))
    }

    if (qt.approvalStatus === 'approved' && qt.customerStatus === 'negotiating') {
      items.push(buildBaseTodo({
        id: `qt-${qt.id}-negotiating`,
        type: 'qt_negotiating',
        stage: 'QT 协商中',
        blockReason: '客户提出修改意见，待继续推进',
        nextAction: '回复客户并推进谈判',
        lastContactAt: qt.customerResponse?.respondedAt || qt.sentAt,
        ...base,
      }, completedMap, followUps, { dueAt: qt.validUntil, ageAt: qt.customerResponse?.respondedAt || qt.sentAt || qt.createdAt }))
    }

    if (qt.approvalStatus === 'approved' && qt.customerStatus === 'accepted' && !qt.pushedToContract) {
      items.push(buildBaseTodo({
        id: `qt-${qt.id}-prepare-sc`,
        type: 'qt_prepare_sc',
        stage: '客户已确认 QT',
        blockReason: '客户已接受报价，尚未生成销售合同',
        nextAction: '下推生成 SC，并提交合同审批',
        lastContactAt: qt.customerResponse?.respondedAt || qt.sentAt,
        ...base,
      }, completedMap, followUps, { dueAt: qt.validUntil, ageAt: qt.customerResponse?.respondedAt || qt.sentAt || qt.createdAt }))
    }
  }

  for (const sc of contracts) {
    if (normalizeEmail(sc.salesPerson) !== me) continue

    const base = {
      customerName: sc.customerName || sc.contactPerson || '—',
      customerCompany: sc.customerCompany || sc.customerName || '未命名客户',
      customerEmail: sc.customerEmail,
      docNumber: sc.contractNumber,
      docType: 'SC' as const,
      createdAt: sc.createdAt,
      referenceId: sc.id,
      navigateTo: 'business-process-center',
    }

    if (sc.status === 'approved' || sc.status === 'sent') {
      items.push(buildBaseTodo({
        id: `sc-${sc.id}-sign`,
        type: 'sc_sign',
        stage: 'SC 待客户签署',
        blockReason: '合同已发出，等待客户确认或签回',
        nextAction: '催客户确认合同',
        lastContactAt: sc.sentToCustomerAt,
        ...base,
      }, completedMap, followUps, { ageAt: sc.sentToCustomerAt || sc.createdAt }))
    }

    if (sc.status === 'customer_confirmed' || sc.status === 'deposit_uploaded') {
      items.push(buildBaseTodo({
        id: `sc-${sc.id}-deposit`,
        type: 'sc_deposit',
        stage: 'SC 待客户定金',
        blockReason: sc.status === 'deposit_uploaded'
          ? '客户已上传定金凭证，待财务确认'
          : '客户已确认合同，等待支付定金',
        nextAction: '跟进客户定金与财务确认',
        ...base,
      }, completedMap, followUps, { ageAt: sc.customerConfirmedAt || sc.createdAt }))
    }
  }

  for (const po of purchaseOrders) {
    const contract = findContractForPurchaseOrder(po, contracts, quotations)
    if (!contract) continue

    const ownerMatched = normalizeEmail((contract as any).salesPerson || '') === me
    if (!ownerMatched) continue

    const customerName = String((contract as any).contactPerson || (contract as any).customerName || '—')
    const customerCompany = String((contract as any).customerCompany || (contract as any).customerName || '未命名客户')
    const customerEmail = (contract as any).customerEmail || undefined
    const base = {
      customerName,
      customerCompany,
      customerEmail,
      docNumber: po.poNumber,
      docType: 'CG' as const,
      createdAt: toIso(po.updatedDate || po.createdDate || po.orderDate),
      referenceId: po.id,
      navigateTo: 'shipping-document-management',
    }

    if (po.finishedGoodsConfirmedAt && !po.customerInspectionMode) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-inspection-method`,
        type: 'inspection_method',
        stage: stageFromPo(po),
        blockReason: '完货后等待客户确认验货方式',
        nextAction: '确认客户验货方式',
        ...base,
      }, completedMap, followUps, { ageAt: po.finishedGoodsConfirmedAt }))
    }

    if (
      po.customerInspectionMode === 'customer_third_party' &&
      ['pending', 'requested', 'not_arranged'].includes(String(po.customerDesignatedInspectionStatus || 'pending'))
    ) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-third-party-inspection`,
        type: 'third_party_inspection',
        stage: stageFromPo(po),
        blockReason: '客户选择第三方验货，但尚未确认安排',
        nextAction: '催客户安排第三方验货',
        ...base,
      }, completedMap, followUps, { ageAt: po.finishedGoodsConfirmedAt || po.updatedDate || po.createdDate }))
    }

    if (
      po.loadingSupervisionMode === 'third_party' &&
      ['pending', 'requested', 'not_arranged'].includes(String(po.loadingSupervisionFeedbackStatus || 'pending'))
    ) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-third-party-loading`,
        type: 'third_party_inspection',
        stage: stageFromPo(po),
        blockReason: '客户要求第三方监装，但尚未确认安排',
        nextAction: '催客户安排第三方监装',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }

    const paymentTodoConfig = buildPaymentTodoConfig(po, contract)
    if (paymentTodoConfig) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-payment-${paymentTodoConfig.type}`,
        type: paymentTodoConfig.type,
        stage: stageFromPo(po),
        blockReason: paymentTodoConfig.blockReason,
        nextAction: paymentTodoConfig.nextAction,
        ...base,
      }, completedMap, followUps, { ageAt: paymentTodoConfig.ageAt, dueAt: paymentTodoConfig.dueAt }))
    }

    if (po.freightConfirmationRequired && !po.freightConfirmedByCustomerAt) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-freight`,
        type: 'freight_confirmation',
        stage: stageFromPo(po),
        blockReason: '海运费/船期方案待客户确认',
        nextAction: '跟进客户确认运费与船期',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }

    if (po.shipmentReadinessStatus === 'arrival_notice_sent') {
      items.push(buildBaseTodo({
        id: `po-${po.id}-arrival`,
        type: 'arrival_confirmation',
        stage: stageFromPo(po),
        blockReason: '到港通知已发，待客户确认',
        nextAction: '确认客户已收到到港通知',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }

    if (po.shipmentReadinessStatus === 'under_import_clearance') {
      items.push(buildBaseTodo({
        id: `po-${po.id}-clearance`,
        type: 'clearance_docs',
        stage: stageFromPo(po),
        blockReason: '清关进行中，待客户配合资料',
        nextAction: '催客户提供清关资料',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }

    if (po.shipmentReadinessStatus === 'customs_released') {
      items.push(buildBaseTodo({
        id: `po-${po.id}-receipt`,
        type: 'receipt_confirmation',
        stage: stageFromPo(po),
        blockReason: '清关已放行，待客户确认收货',
        nextAction: '确认客户收货情况',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }

    if (po.shipmentReadinessStatus === 'delivered_to_customer') {
      items.push(buildBaseTodo({
        id: `po-${po.id}-feedback`,
        type: 'feedback_followup',
        stage: stageFromPo(po),
        blockReason: '客户已收货，待回访和收集反馈',
        nextAction: '邀请客户提交反馈',
        ...base,
      }, completedMap, followUps, { ageAt: po.updatedDate || po.createdDate }))
    }
  }

  const bucketCounts: Record<TodoBucket, number> = {
    must_today: 0,
    quote_contract: 0,
    payment: 0,
    delivery: 0,
    feedback: 0,
    done_today: 0,
  }

  for (const item of items) {
    if (item.isCompleted) bucketCounts.done_today += 1
    else bucketCounts[item.bucket] += 1
  }

  const groupMap = new Map<string, SalesTodoItem[]>()
  for (const item of items) {
    const key = item.customerCompany || item.customerName || '未命名客户'
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(item)
  }

  const priorityOrder: TodoPriority[] = ['overdue', 'high', 'medium', 'normal']
  const customerGroups: CustomerGroup[] = Array.from(groupMap.entries()).map(([company, todos]) => {
    const allPriorities = todos.map((t) => t.priority)
    const highestPriority = priorityOrder.find((priority) => allPriorities.includes(priority)) || 'normal'
    return {
      customerCompany: company,
      customerName: todos[0]?.customerName || '—',
      customerEmail: todos[0]?.customerEmail,
      todos: todos.sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)),
      highestPriority,
      hasOverdue: allPriorities.includes('overdue'),
    }
  })

  customerGroups.sort((a, b) => priorityOrder.indexOf(a.highestPriority) - priorityOrder.indexOf(b.highestPriority))

  const openTodos = items.filter((item) => !item.isCompleted)
  const taskSections: TaskCenterSection<SalesTodoItem>[] = finalizeTaskSections([
    {
      key: 'must-today',
      label: '今日必须跟进',
      accent: 'red',
      count: openTodos.filter((item) => item.bucket === 'must_today').length,
      items: openTodos.filter((item) => item.bucket === 'must_today').slice(0, 5),
    },
    {
      key: 'payment',
      label: '付款与放单',
      accent: 'orange',
      count: openTodos.filter((item) => item.bucket === 'payment').length,
      items: openTodos.filter((item) => item.bucket === 'payment').slice(0, 5),
    },
    {
      key: 'delivery-feedback',
      label: '交付与反馈',
      accent: 'blue',
      count: openTodos.filter((item) => item.bucket === 'delivery' || item.bucket === 'feedback').length,
      items: openTodos.filter((item) => item.bucket === 'delivery' || item.bucket === 'feedback').slice(0, 5),
    },
  ], {
    order: ['must-today', 'payment', 'delivery-feedback'],
    defaultAccent: 'blue',
  })

  const riskItems: TaskCenterRiskItem[] = finalizeTaskCenterRiskItems([
    { key: 'overdue', label: '超期事项', count: openTodos.filter((item) => item.priority === 'overdue').length, tone: 'critical' },
    { key: 'high-priority', label: '高优先级', count: openTodos.filter((item) => item.priority === 'high').length, tone: 'warning' },
    { key: 'payment-risk', label: '付款/放单风险', count: openTodos.filter((item) => item.bucket === 'payment').length, tone: 'info' },
    { key: 'delivery-risk', label: '交付/反馈待跟进', count: openTodos.filter((item) => item.bucket === 'delivery' || item.bucket === 'feedback').length, tone: 'default' },
  ], {
    order: ['overdue', 'high-priority', 'payment-risk', 'delivery-risk'],
  })

  const collaborationAccumulator = new Map<string, RoleCollaborationSection>()
  openTodos.forEach((item) => {
    collaborationRolesForTodoType(item.type).forEach((role) => {
      const key = role.toLowerCase()
      const existing = collaborationAccumulator.get(key)
      if (existing) {
        existing.count += 1
      } else {
        collaborationAccumulator.set(key, {
          key,
          label: `${role}协同`,
          roles: [role],
          count: 1,
        })
      }
    })
  })
  const collaborationSections = finalizeCollaborationSections(Array.from(collaborationAccumulator.values()), {
    order: ['finance', 'procurement', 'docs', 'coordinator', 'qc', 'marketing_ops', 'customer'],
  })

  const taskCenter = composeTaskCenterDataBundle({
    taskSections,
    riskItems,
    collaborationSections,
  })
  const taskCenterCompat = buildTaskCenterCompatFields(taskCenter)
  const taskSectionCountMap = buildTaskCenterSectionCountMap(taskSections)
  const riskCountMap = buildTaskCenterRiskCountMap(riskItems)
  const highRiskGroups = customerGroups
    .filter((group) => group.hasOverdue || group.highestPriority === 'high')
    .slice(0, 5)
  const upcomingTodos = openTodos
    .filter((item) => item.nextFollowUpAt || item.dueAt)
    .sort(
      (a, b) =>
        new Date(a.nextFollowUpAt || a.dueAt || 0).getTime() -
        new Date(b.nextFollowUpAt || b.dueAt || 0).getTime(),
    )
    .slice(0, 5)
  const mustTodayCount = taskSectionCountMap['must-today'] || 0
  const completedTodayCount = bucketCounts.done_today || 0
  const overdueCount = riskCountMap['overdue'] || 0
  const mustTodayDone = items.filter(
    (item) =>
      item.isCompleted &&
      (item.bucket === 'must_today' || item.priority === 'overdue' || item.priority === 'high'),
  ).length
  const mustTodayTotal = mustTodayCount + mustTodayDone
  const progressPct = mustTodayTotal > 0 ? Math.round((mustTodayDone / mustTodayTotal) * 100) : 100
  const summary: SalesTodoDashboardSummary = {
    totalOpen: openTodos.length,
    mustTodayCount,
    overdueCount,
    completedTodayCount,
    highRiskGroups,
    upcomingTodos,
    mustTodayDone,
    mustTodayTotal,
    progressPct,
  }

  return {
    todos: items,
    bucketCounts,
    customerGroups,
    summary,
    ...taskCenterCompat,
  }
}

export function aggregateCustomerReplies(params: {
  quotations: SalesQuotation[]
  contracts: SalesContract[]
  salesEmail: string
}): CustomerReplyItem[] {
  const me = normalizeEmail(params.salesEmail)
  const replies: CustomerReplyItem[] = []

  for (const qt of params.quotations) {
    if (normalizeEmail(qt.salesPerson) !== me) continue
    if (!qt.customerResponse?.respondedAt) continue
    replies.push({
      customerCompany: qt.customerCompany || qt.customerName || '未命名客户',
      customerName: qt.customerName || '—',
      docNumber: qt.qtNumber,
      source: 'QT',
      summary: qt.customerResponse.comment || `客户已${qt.customerResponse.status === 'accepted' ? '接受' : qt.customerResponse.status === 'rejected' ? '拒绝' : '提出修改意见'}报价`,
      repliedAt: qt.customerResponse.respondedAt,
    })
  }

  for (const sc of params.contracts) {
    if (normalizeEmail(sc.salesPerson) !== me) continue
    const feedback = sc.customerFeedback
    const respondedAt = feedback?.respondedAt || feedback?.updatedAt || feedback?.timestamp
    if (!respondedAt) continue
    replies.push({
      customerCompany: sc.customerCompany || sc.customerName || '未命名客户',
      customerName: sc.customerName || '—',
      docNumber: sc.contractNumber,
      source: 'SC',
      summary: String(feedback?.comment || feedback?.note || '客户已对合同给出反馈'),
      repliedAt: String(respondedAt),
    })
  }

  return replies.sort((a, b) => new Date(b.repliedAt).getTime() - new Date(a.repliedAt).getTime())
}

// ── Higher-level summary used by SalesManagerTodoCenter and orderManagementCountService ──
export function computeSalesTodoSummary(input: ComputeSalesTodoSummaryInput): ComputeSalesTodoSummaryResult {
  const aggregated = aggregateSalesTodosFromContexts({
    salesEmail: input.salesEmail,
    inquiries: input.inquiries,
    quotationRequests: input.quotationRequests,
    quotations: input.quotations,
    contracts: input.contracts,
    purchaseOrders: input.purchaseOrders,
  })

  const openTodos = aggregated.todos.filter((t) => !t.isCompleted)
  const totalOpen = openTodos.length

  // Derive module-level counts from open todo types
  const moduleCounts = {
    inquiries: openTodos.filter((t) => t.docType === 'ING').length,
    costInquiry: openTodos.filter((t) => t.docType === 'QR').length,
    quotations: openTodos.filter((t) => t.docType === 'QT').length,
    orders: openTodos.filter((t) => t.docType === 'SC').length,
    collections: openTodos.filter((t) => [
      'sc_deposit',
      'payment_followup',
      'balance_tt_chase',
      'lc_open_chase',
      'lc_terms_confirm',
      'bl_copy_send',
      'dp_redemption_chase',
      'da_acceptance_chase',
      'da_maturity_chase',
      'oa_period_warning',
      'oa_overdue_chase',
    ].includes(t.type)).length,
    exportService: openTodos.filter((t) => ['freight_confirmation', 'arrival_confirmation', 'clearance_docs', 'receipt_confirmation'].includes(t.type)).length,
  }

  return { aggregated, totalOpen, moduleCounts }
}
