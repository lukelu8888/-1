const QT_DIRECTOR_THRESHOLD = 20_000
const SC_DIRECTOR_THRESHOLD = 20_000
const DEFAULT_SPECIAL_PRICE_MARGIN_FLOOR = 15

export type QtApprovalCategory =
  | 'regular'
  | 'large_amount'
  | 'special_price'
  | 'special_payment'
  | 'strategic_customer'

export type ScApprovalCategory =
  | 'regular'
  | 'large_amount'
  | 'exceptional_clause'
  | 'strategic_customer'
  | 'special_account_period'

export type SalesGovernanceSnapshot<TCategory extends string> = {
  category: TCategory
  triggerLabels: string[]
  requiresManagerApproval: boolean
  requiresDirectorApproval: boolean
  summary: string
}

function toLowerText(value: unknown) {
  return String(value || '').trim().toLowerCase()
}

function toAmount(value: unknown) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function toPercent(value: unknown) {
  const rate = Number(value || 0)
  return Number.isFinite(rate) ? rate : 0
}

function hasKeyword(value: unknown, keywords: string[]) {
  const text = toLowerText(value)
  return Boolean(text) && keywords.some((keyword) => text.includes(keyword))
}

export function isSpecialPaymentTerms(input: any) {
  if (Boolean(input?.specialPaymentTermsFlag ?? input?.special_payment_terms_flag)) return true

  const paymentMode = toLowerText(input?.paymentMode ?? input?.payment_mode)
  if (['oa', 'da', 'dp'].includes(paymentMode)) return true

  return hasKeyword(input?.paymentTerms ?? input?.payment_terms, [
    'open account',
    'oa',
    'net ',
    '账期',
    '赊销',
    'd/a',
    'd/p',
    '远期',
    '分期',
  ])
}

export function deriveQtApprovalGovernance(input: any): SalesGovernanceSnapshot<QtApprovalCategory> {
  const amount = toAmount(input?.totalPrice ?? input?.total_price ?? input?.totalAmount ?? input?.total_amount)
  const profitRate = toPercent(input?.profitRate ?? input?.profit_rate ?? input?.profitMargin ?? input?.profit_margin)
  const specialPriceFlag = Boolean(input?.specialPriceFlag ?? input?.special_price_flag)
    || Boolean(String((input?.specialPriceReason ?? input?.special_price_reason) || '').trim())
    || (profitRate > 0 && profitRate < DEFAULT_SPECIAL_PRICE_MARGIN_FLOOR)
  const specialPayment = isSpecialPaymentTerms(input)
  const strategicCustomer = Boolean(input?.strategicCustomerFlag ?? input?.strategic_customer_flag)
  const largeAmount = amount >= QT_DIRECTOR_THRESHOLD

  const triggerLabels: string[] = []
  if (largeAmount) triggerLabels.push('大额QT')
  if (specialPriceFlag) triggerLabels.push('特价QT')
  if (specialPayment) triggerLabels.push('特殊付款条款QT')
  if (strategicCustomer) triggerLabels.push('战略客户QT')

  const category: QtApprovalCategory = specialPriceFlag
    ? 'special_price'
    : specialPayment
      ? 'special_payment'
      : strategicCustomer
        ? 'strategic_customer'
        : largeAmount
          ? 'large_amount'
          : 'regular'

  const requiresDirectorApproval = largeAmount || specialPriceFlag || specialPayment
  const summary = triggerLabels.length > 0
    ? `触发 ${triggerLabels.join(' / ')}`
    : '常规QT，按主管审批处理'

  return {
    category,
    triggerLabels: triggerLabels.length > 0 ? triggerLabels : ['常规QT'],
    requiresManagerApproval: true,
    requiresDirectorApproval,
    summary,
  }
}

export function deriveScApprovalGovernance(input: any): SalesGovernanceSnapshot<ScApprovalCategory> {
  const amount = toAmount(input?.totalAmount ?? input?.total_amount)
  const exceptionalClause = Boolean(input?.exceptionalClauseFlag ?? input?.exceptional_clause_flag)
    || Boolean(String((input?.exceptionalClauseNotes ?? input?.exceptional_clause_notes) || '').trim())
  const specialAccountPeriod = Boolean(input?.specialAccountPeriodFlag ?? input?.special_account_period_flag)
    || isSpecialPaymentTerms(input)
  const strategicCustomer = Boolean(input?.strategicCustomerFlag ?? input?.strategic_customer_flag)
  const largeAmount = amount >= SC_DIRECTOR_THRESHOLD

  const triggerLabels: string[] = []
  if (largeAmount) triggerLabels.push('大额SC')
  if (exceptionalClause) triggerLabels.push('例外条款SC')
  if (specialAccountPeriod) triggerLabels.push('特殊账期SC')
  if (strategicCustomer) triggerLabels.push('战略客户SC')

  const category: ScApprovalCategory = exceptionalClause
    ? 'exceptional_clause'
    : specialAccountPeriod
      ? 'special_account_period'
      : strategicCustomer
        ? 'strategic_customer'
        : largeAmount
          ? 'large_amount'
          : 'regular'

  const requiresDirectorApproval = largeAmount || exceptionalClause || specialAccountPeriod
  const summary = triggerLabels.length > 0
    ? `触发 ${triggerLabels.join(' / ')}`
    : '常规SC，按主管审批处理'

  return {
    category,
    triggerLabels: triggerLabels.length > 0 ? triggerLabels : ['常规SC'],
    requiresManagerApproval: true,
    requiresDirectorApproval,
    summary,
  }
}

export function buildManagerDirectorApprovalChain(
  managerEmail: string,
  directorEmail: string,
  options: { requiresDirectorApproval: boolean },
) {
  return [
    { level: 1, approverRole: '区域业务主管', approverEmail: managerEmail, status: 'pending' },
    ...(options.requiresDirectorApproval
      ? [{ level: 2, approverRole: '销售总监', approverEmail: directorEmail, status: 'pending' }]
      : []),
  ]
}
