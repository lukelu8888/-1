import { supabase } from '../supabase'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

const LC_DISCREPANCY_MARKER = '[LC_DISCREPANCY]'

export function parseExecutionRemarksMeta(remarks: any): {
  plainText: string | null
  lcDiscrepancy: {
    status?: string | null
    notes?: string | null
    updatedAt?: string | null
    updatedBy?: string | null
    resolvedAt?: string | null
  } | null
} {
  const raw = String(remarks || '').trim()
  if (!raw) return { plainText: null, lcDiscrepancy: null }

  let lcDiscrepancy: {
    status?: string | null
    notes?: string | null
    updatedAt?: string | null
    updatedBy?: string | null
    resolvedAt?: string | null
  } | null = null

  const plainLines = raw.split('\n').filter((line) => {
    if (!line.startsWith(LC_DISCREPANCY_MARKER)) return true
    try {
      lcDiscrepancy = JSON.parse(line.slice(LC_DISCREPANCY_MARKER.length))
    } catch {
      lcDiscrepancy = null
    }
    return false
  })

  const plainText = plainLines.join('\n').trim()
  return { plainText: plainText || null, lcDiscrepancy }
}

export function buildExecutionRemarksWithMeta(
  plainText: string | null | undefined,
  meta: {
    lcDiscrepancy?: {
      status?: string | null
      notes?: string | null
      updatedAt?: string | null
      updatedBy?: string | null
      resolvedAt?: string | null
    } | null
  },
): string | null {
  const parts: string[] = []
  const trimmed = String(plainText || '').trim()
  if (trimmed) parts.push(trimmed)
  if (meta.lcDiscrepancy) {
    parts.push(`${LC_DISCREPANCY_MARKER}${JSON.stringify(meta.lcDiscrepancy)}`)
  }
  return parts.join('\n') || null
}

export type ReceivableReleaseRiskSummary = {
  hasOverdueReceivable: boolean
  exceedsCreditLimit: boolean
  blockedReason: string | null
  contractNumber: string | null
  orderNumber: string | null
  arNumber: string | null
  dueDate: string | null
  remainingAmount: number | null
  currency: string | null
  creditLimitUsd: number | null
  overdueRiskLevel: string | null
  creditReleaseApprovedBy: string | null
}

export async function getReceivableReleaseRiskSummary(purchaseOrderId: string): Promise<ReceivableReleaseRiskSummary> {
  const defaultSummary: ReceivableReleaseRiskSummary = {
    hasOverdueReceivable: false,
    exceedsCreditLimit: false,
    blockedReason: null,
    contractNumber: null,
    orderNumber: null,
    arNumber: null,
    dueDate: null,
    remainingAmount: null,
    currency: null,
    creditLimitUsd: null,
    overdueRiskLevel: null,
    creditReleaseApprovedBy: null,
  }

  if (!purchaseOrderId) return defaultSummary

  const { data: poRow, error: poError } = await supabase
    .from('purchase_orders')
    .select('order_number, contract_number')
    .eq('id', purchaseOrderId)
    .maybeSingle()
  if (poError) throwServiceError('get purchase_orders for receivable release risk', poError)

  const orderNumber = poRow?.order_number || null
  const contractNumber = poRow?.contract_number || null
  if (!orderNumber && !contractNumber) {
    return defaultSummary
  }

  let query = supabase
    .from('accounts_receivable')
    .select('ar_number, order_number, contract_number, due_date, remaining_amount, currency, status, credit_limit_usd, overdue_risk_level, credit_release_approved_by, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (orderNumber && contractNumber) {
    query = query.or(`order_number.eq.${orderNumber},contract_number.eq.${contractNumber}`)
  } else if (orderNumber) {
    query = query.eq('order_number', orderNumber)
  } else {
    query = query.eq('contract_number', contractNumber)
  }

  const { data: arRows, error: arError } = await query
  if (arError) throwServiceError('get accounts_receivable for release risk', arError)

  const ar = Array.isArray(arRows) ? arRows[0] || null : null
  if (!ar) {
    return {
      ...defaultSummary,
      orderNumber,
      contractNumber,
    }
  }

  const remainingAmount = Number(ar.remaining_amount ?? 0)
  const creditLimitUsd = ar.credit_limit_usd == null ? null : Number(ar.credit_limit_usd)
  const overdueStatus = String(ar.status || '').toLowerCase()
  const overdueRiskLevel = ar.overdue_risk_level ? String(ar.overdue_risk_level) : null
  const dueDate = ar.due_date ? String(ar.due_date) : null
  const isPastDue = Boolean(
    dueDate &&
    remainingAmount > 0 &&
    !Number.isNaN(Date.parse(dueDate)) &&
    new Date(dueDate).getTime() < Date.now()
  )
  const hasOverdueReceivable = overdueStatus === 'overdue' || isPastDue
  const exceedsCreditLimit = creditLimitUsd != null && remainingAmount > creditLimitUsd

  let blockedReason: string | null = null
  if (hasOverdueReceivable) {
    blockedReason = `存在逾期应收未清${dueDate ? `（到期 ${dueDate.slice(0, 10)}）` : ''}`
  } else if (exceedsCreditLimit) {
    blockedReason = `未收余额超出信用额度（余额 ${remainingAmount} ${ar.currency || ''} / 额度 ${creditLimitUsd} USD）`
  }

  return {
    hasOverdueReceivable,
    exceedsCreditLimit,
    blockedReason,
    contractNumber: ar.contract_number || contractNumber,
    orderNumber: ar.order_number || orderNumber,
    arNumber: ar.ar_number || null,
    dueDate,
    remainingAmount,
    currency: ar.currency || null,
    creditLimitUsd,
    overdueRiskLevel,
    creditReleaseApprovedBy: ar.credit_release_approved_by || null,
  }
}

export function getCollectionControlRuleSummary(execution: any, receivableRisk?: ReceivableReleaseRiskSummary | null) {
  const mode = String(execution?.collection_control_mode || '')
  const customerBalanceStatus = String(execution?.customer_balance_status || 'pending')
  const bankSubmissionStatus = String(execution?.bank_submission_status || 'not_required')
  const documentReleaseStatus = String(execution?.document_release_status || 'pending')
  const lcDiscrepancy = parseExecutionRemarksMeta(execution?.remarks).lcDiscrepancy
  const lcDiscrepancyStatus = String(execution?.lc_discrepancy_status || lcDiscrepancy?.status || '')
  const lcDiscrepancyApprovalStatus = String(execution?.lc_discrepancy_approval_status || 'not_required')
  const lcDiscrepancyOpen = ['open', 'pending', 'raised'].includes(lcDiscrepancyStatus)
    && lcDiscrepancyApprovalStatus !== 'approved'
  const financialReleaseBlocked = Boolean(receivableRisk?.blockedReason)
  const financialBlockedReason = receivableRisk?.blockedReason || null

  switch (mode) {
    case 'prepaid_before_booking':
      return {
        label: '前T/T',
        paymentRequired: true,
        bankRequired: false,
        gateTitle: '订舱前收齐余款',
        releaseTitle: '全款后放单',
        blockedReason: financialBlockedReason || (
          ['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
            ? null
            : '前T/T模式下，订舱与放单前需财务确认客户余款到账'
        ),
        financialReleaseBlocked,
      }
    case 'post_tt_before_obl_release':
      return {
        label: '后T/T',
        paymentRequired: true,
        bankRequired: false,
        gateTitle: '允许出运，放正本前收余款',
        releaseTitle: '余款到账后放正本提单',
        blockedReason: financialBlockedReason || (
          ['finance_confirmed', 'paid', 'balance_paid'].includes(customerBalanceStatus)
            ? null
            : '后T/T模式下，可先出运，但放正本提单前必须财务确认余款到账'
        ),
        financialReleaseBlocked,
      }
    case 'lc_bank_negotiation':
      return {
        label: 'L/C',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后银行交单议付',
        releaseTitle: '银行议付/收汇后放单',
        blockedReason: financialBlockedReason
          ? financialBlockedReason
          : lcDiscrepancyOpen
            ? `L/C存在不符点${execution?.lc_discrepancy_notes || lcDiscrepancy?.notes ? `：${execution?.lc_discrepancy_notes || lcDiscrepancy?.notes}` : ''}`
            : ['negotiated', 'collected'].includes(bankSubmissionStatus) || documentReleaseStatus === 'released'
              ? null
              : 'L/C模式下，需完成银行交单/议付或收汇后才能放单',
        financialReleaseBlocked,
      }
    case 'dp_collection':
      return {
        label: 'D/P',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后按托收赎单控制',
        releaseTitle: '客户赎单/托收到账后放单',
        blockedReason: financialBlockedReason
          ? financialBlockedReason
          : bankSubmissionStatus === 'collected' || documentReleaseStatus === 'released'
            ? null
            : 'D/P模式下，需确认托收到账/客户赎单后才能放单',
        financialReleaseBlocked,
      }
    case 'da_acceptance':
      return {
        label: 'D/A',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后交单并跟踪承兑',
        releaseTitle: '承兑确认后放单',
        blockedReason: financialBlockedReason
          ? financialBlockedReason
          : ['accepted', 'negotiated', 'collected'].includes(bankSubmissionStatus) || documentReleaseStatus === 'released'
            ? null
            : 'D/A模式下，需先确认承兑后才能放单',
        financialReleaseBlocked,
      }
    case 'dp_or_other_collection':
      return {
        label: '托收',
        paymentRequired: false,
        bankRequired: true,
        gateTitle: '出运后按托收方式控制',
        releaseTitle: '收汇/承兑确认后放单',
        blockedReason: financialBlockedReason
          ? financialBlockedReason
          : bankSubmissionStatus === 'collected' || documentReleaseStatus === 'released'
            ? null
            : '托收模式下，需确认客户赎单或承兑/收汇后才能放单',
        financialReleaseBlocked,
      }
    default:
      return {
        label: execution?.collection_control_mode || execution?.payment_mode || '未知',
        paymentRequired: false,
        bankRequired: false,
        gateTitle: '按合同约定执行',
        releaseTitle: '按放单条件执行',
        blockedReason: financialBlockedReason,
        financialReleaseBlocked,
      }
  }
}
