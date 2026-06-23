import type { SalesWorkflowSourceSnapshot } from './salesWorkflowSourceService'

export interface DeadlineEscalationItem {
  key: string
  type:
    | 'ing_first_response_overdue'
    | 'qt_feedback_overdue'
    | 'sc_unsigned_overdue'
    | 'sc_deposit_overdue'
    | 'oa_due_warning'
    | 'da_maturity_warning'
    | 'usance_lc_maturity_warning'
  title: string
  owner: string | null
  relatedNumber: string | null
  severity: 'medium' | 'high' | 'critical'
  dueAt: string | null
  overdueHours: number | null
  payload: Record<string, unknown>
}

export interface DeadlineEscalationSummary {
  items: DeadlineEscalationItem[]
  groups: Record<DeadlineEscalationItem['type'], DeadlineEscalationItem[]>
}

function parseDate(value: unknown): number | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

function hoursSince(value: unknown, now: number): number | null {
  const parsed = parseDate(value)
  if (parsed == null) return null
  return Math.floor((now - parsed) / (1000 * 60 * 60))
}

function daysUntil(value: unknown, now: number): number | null {
  const parsed = parseDate(value)
  if (parsed == null) return null
  return Math.ceil((parsed - now) / (1000 * 60 * 60 * 24))
}

function isCompletedStatus(value: unknown) {
  const status = String(value || '').trim().toLowerCase()
  return ['completed', 'closed', 'paid', 'released', 'archived'].includes(status)
}

function groupItems(items: DeadlineEscalationItem[]): DeadlineEscalationSummary['groups'] {
  return items.reduce((acc, item) => {
    acc[item.type].push(item)
    return acc
  }, {
    ing_first_response_overdue: [],
    qt_feedback_overdue: [],
    sc_unsigned_overdue: [],
    sc_deposit_overdue: [],
    oa_due_warning: [],
    da_maturity_warning: [],
    usance_lc_maturity_warning: [],
  } as DeadlineEscalationSummary['groups'])
}

export function deriveDeadlineEscalations(snapshot: SalesWorkflowSourceSnapshot, now = Date.now()): DeadlineEscalationSummary {
  const items: DeadlineEscalationItem[] = []

  snapshot.inquiries.forEach((inquiry: any) => {
    const overdueHours = hoursSince(inquiry?.submittedAt || inquiry?.submitted_at || inquiry?.createdAt || inquiry?.created_at, now)
    const status = String(inquiry?.status || '').trim().toLowerCase()
    if (overdueHours != null && overdueHours >= 24 && !['quoted', 'closed', 'completed'].includes(status)) {
      items.push({
        key: `ing-${inquiry?.id || inquiry?.inquiryNumber || inquiry?.inquiry_number}`,
        type: 'ing_first_response_overdue',
        title: `${inquiry?.inquiryNumber || inquiry?.inquiry_number || inquiry?.id} 超过 24h 未首响`,
        owner: inquiry?.assignedTo || inquiry?.ownerEmail || inquiry?.userEmail || null,
        relatedNumber: inquiry?.inquiryNumber || inquiry?.inquiry_number || null,
        severity: overdueHours >= 48 ? 'critical' : 'high',
        dueAt: inquiry?.submittedAt || inquiry?.submitted_at || inquiry?.createdAt || inquiry?.created_at || null,
        overdueHours,
        payload: { region: inquiry?.region || inquiry?.region_code || null },
      })
    }
  })

  snapshot.quotations.forEach((quotation: any) => {
    const sentAt = quotation?.sentToCustomerAt || quotation?.sent_to_customer_at || quotation?.sentAt || quotation?.sent_at
    const overdueHours = hoursSince(sentAt, now)
    const customerStatus = String(quotation?.customerStatus || quotation?.customer_status || '').trim().toLowerCase()
    if (overdueHours != null && overdueHours >= 24 * 7 && !['accepted', 'rejected', 'closed'].includes(customerStatus)) {
      items.push({
        key: `qt-${quotation?.id || quotation?.qtNumber || quotation?.qt_number}`,
        type: 'qt_feedback_overdue',
        title: `${quotation?.qtNumber || quotation?.qt_number || quotation?.id} 超过 7 天未反馈`,
        owner: quotation?.salesPersonEmail || quotation?.ownerEmail || quotation?.customerEmail || null,
        relatedNumber: quotation?.qtNumber || quotation?.qt_number || null,
        severity: overdueHours >= 24 * 10 ? 'critical' : 'high',
        dueAt: sentAt || null,
        overdueHours,
        payload: { customerStatus },
      })
    }
  })

  snapshot.contracts.forEach((contract: any) => {
    const sentAt = contract?.sentToCustomerAt || contract?.sent_to_customer_at || contract?.submittedAt || contract?.submitted_at
    const overdueHours = hoursSince(sentAt, now)
    const signed = Boolean(contract?.buyerSignature || contract?.buyer_signature || contract?.buyerSignedAt || contract?.buyer_signed_at)
    if (overdueHours != null && overdueHours >= 24 * 3 && !signed) {
      items.push({
        key: `sc-unsigned-${contract?.id || contract?.contractNumber || contract?.contract_number}`,
        type: 'sc_unsigned_overdue',
        title: `${contract?.contractNumber || contract?.contract_number || contract?.id} 超过 3 天未签回`,
        owner: contract?.salesPersonEmail || contract?.ownerEmail || null,
        relatedNumber: contract?.contractNumber || contract?.contract_number || null,
        severity: overdueHours >= 24 * 5 ? 'critical' : 'high',
        dueAt: sentAt || null,
        overdueHours,
        payload: { customer: contract?.customerCompany || contract?.customerName || null },
      })
    }
  })

  snapshot.purchaseOrders.forEach((order: any) => {
    const poNumber = String(order?.poNumber || order?.po_number || '')
    if (!poNumber.startsWith('CG-')) return

    const paymentMode = String(order?.paymentMode || order?.payment_mode || '').trim().toLowerCase()
    const customerBalanceStatus = String(order?.customerBalanceStatus || order?.customer_balance_status || '').trim().toLowerCase()
    const expectedDate = order?.expectedDate || order?.expected_date
    const daysToExpected = daysUntil(expectedDate, now)
    const overdueHours = hoursSince(expectedDate, now)
    const maturityDate = order?.acceptanceMaturityDate || order?.acceptance_maturity_date || order?.lcMaturityDate || order?.lc_maturity_date
    const daysToMaturity = daysUntil(maturityDate, now)

    if (
      ['tt_deposit_balance_before_shipment', 'tt_deposit_balance_against_bl', 'deposit_plus_lc'].includes(paymentMode) &&
      overdueHours != null &&
      overdueHours >= 24 * 5 &&
      !['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
    ) {
      items.push({
        key: `sc-deposit-${order?.id || poNumber}`,
        type: 'sc_deposit_overdue',
        title: `${poNumber} 定金/余款超期未确认`,
        owner: order?.salesOwnerEmail || order?.ownerEmail || null,
        relatedNumber: poNumber || null,
        severity: overdueHours >= 24 * 7 ? 'critical' : 'high',
        dueAt: expectedDate || null,
        overdueHours,
        payload: { paymentMode, customerBalanceStatus },
      })
    }

    if (paymentMode === 'oa' && daysToExpected != null && daysToExpected >= 0 && daysToExpected <= 7 && !isCompletedStatus(customerBalanceStatus)) {
      items.push({
        key: `oa-${order?.id || poNumber}`,
        type: 'oa_due_warning',
        title: `${poNumber} O/A 账期临近到期`,
        owner: order?.salesOwnerEmail || order?.ownerEmail || null,
        relatedNumber: poNumber || null,
        severity: daysToExpected <= 3 ? 'critical' : 'high',
        dueAt: expectedDate || null,
        overdueHours: null,
        payload: { daysToExpected },
      })
    }

    if (paymentMode === 'da' && daysToMaturity != null && daysToMaturity >= 0 && daysToMaturity <= 3) {
      items.push({
        key: `da-${order?.id || poNumber}`,
        type: 'da_maturity_warning',
        title: `${poNumber} D/A 承兑即将到期`,
        owner: order?.salesOwnerEmail || order?.ownerEmail || null,
        relatedNumber: poNumber || null,
        severity: daysToMaturity <= 1 ? 'critical' : 'high',
        dueAt: maturityDate || null,
        overdueHours: null,
        payload: { daysToMaturity },
      })
    }

    if (String(order?.lcType || order?.lc_type || '').trim().toLowerCase() === 'usance' && daysToMaturity != null && daysToMaturity >= 0 && daysToMaturity <= 5) {
      items.push({
        key: `usance-${order?.id || poNumber}`,
        type: 'usance_lc_maturity_warning',
        title: `${poNumber} Usance L/C 即将到期`,
        owner: order?.salesOwnerEmail || order?.ownerEmail || null,
        relatedNumber: poNumber || null,
        severity: daysToMaturity <= 2 ? 'critical' : 'high',
        dueAt: maturityDate || null,
        overdueHours: null,
        payload: { daysToMaturity },
      })
    }
  })

  return {
    items,
    groups: groupItems(items),
  }
}
