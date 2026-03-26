import type { Inquiry } from '../../contexts/InquiryContext'
import type { QuotationRequest } from '../../contexts/QuotationRequestContext'
import type { SalesQuotation } from '../../contexts/SalesQuotationContext'
import type { SalesContract } from '../../contexts/SalesContractContext'
import type { PurchaseOrder } from '../../contexts/PurchaseOrderContext'
import { normalizePersonnelEmail } from '../notification-rules'

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
  if (['sc_deposit', 'payment_followup', 'freight_confirmation'].includes(type)) return 'payment'
  if (['arrival_confirmation', 'clearance_docs', 'receipt_confirmation'].includes(type)) return 'delivery'
  if (type === 'feedback_followup') return 'feedback'
  return 'must_today'
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
      navigateTo: 'shipment-management',
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

    if (
      po.collectionControlMode &&
      ['pending', 'awaiting_customer', 'blocked'].includes(String(po.customerBalanceGateStatus || 'pending'))
    ) {
      items.push(buildBaseTodo({
        id: `po-${po.id}-payment`,
        type: 'payment_followup',
        stage: stageFromPo(po),
        blockReason: '客户付款控制节点尚未完成',
        nextAction: '催客户完成付款/交单前条件',
        ...base,
      }, completedMap, followUps, { ageAt: po.customerBalanceConfirmedAt || po.updatedDate || po.createdDate }))
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

  return { todos: items, bucketCounts, customerGroups }
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
