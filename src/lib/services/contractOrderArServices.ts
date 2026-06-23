import { canonicalizePersonnelEmail } from '../personnelEmail'
import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { getLocalAdminAuth } from '../internalAdminLocalAuth'
import { customerEnterpriseMemberService } from './customerEnterpriseServices'
import { customerOrganizationService, customerPortalProfileService } from './portalOrganizationServices'
import { normalizeCustomerPaymentProofs, normalizeOwnerFields, normalizeTradeTerms } from './businessFieldNormalization'
import { deriveApprovalRouting, deriveCustomerPortalPaymentStatus } from './businessFieldNormalization'
import { auditLogService } from './auditLogService'
import {
  deriveSalesContractSplitFields,
  getPersistableSalesContractStatus,
  normalizeCustomerContractStatus,
} from '../customerPortalContractStatus'
import {
  buildCustomerPortalEmailScope,
  normalizeCustomerPortalEmail,
} from '../customerPortalScope'

type DependencyBag = {
  handleError: (error: any, context: string) => any
  throwSupabaseError: (context: string, error: any) => never
  resolveBusinessDocumentTemplateBinding: (
    document: any,
    options: {
      documentCode: string
      nodeCode: string
      businessData: any
    },
  ) => Promise<Record<string, any>>
  rememberMissingColumn: (table: string, column: string) => void
  matchesCustomerEmailFallback: (row: Record<string, any> | null | undefined, email: string) => boolean
  upsertWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    onConflict: string,
    context: string,
  ) => Promise<{ data: any; error: Error | null }>
  updateWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    applyFilters: (query: any) => any,
    context: string,
  ) => Promise<{ error: Error | null }>
  toUUIDOrNull: (value: unknown) => string | null
}

const SC_APPROVED_STATUSES = new Set([
  'approved',
  'sent',
  'customer_confirmed',
  'production',
  'shipped',
  'completed',
])

function withScApprovalGovernanceFields(status: string, extra: Record<string, any>) {
  if (!SC_APPROVED_STATUSES.has(String(status || '').trim())) {
    return extra
  }

  const approvalAt =
    extra.sc_last_approval_at ||
    extra.scLastApprovalAt ||
    extra.approved_at ||
    extra.approvedAt ||
    new Date().toISOString()

  return {
    ...extra,
    approved_at: extra.approved_at || extra.approvedAt || approvalAt,
    sc_last_approval_at: extra.sc_last_approval_at || extra.scLastApprovalAt || approvalAt,
  }
}

function toContractRow(c: any, deps: DependencyBag) {
  const projectExecutionBaseline = c.documentRenderMeta?.projectExecutionBaseline || (c.projectRevisionId
    ? {
        projectId: c.projectId || null,
        projectCode: c.projectCode || null,
        projectName: c.projectName || null,
        projectRevisionId: c.projectRevisionId || null,
        projectRevisionCode: c.projectRevisionCode || null,
        projectRevisionStatus: c.projectRevisionStatus || null,
        finalRevisionId: c.finalRevisionId || null,
        finalQuotationId: c.finalQuotationId || null,
        finalQuotationNumber: c.finalQuotationNumber || c.quotationNumber || null,
        quotationRole: c.quotationRole || null,
      }
    : null)
  const ownerFields = normalizeOwnerFields(c, {
    canonicalizeEmail: canonicalizePersonnelEmail,
    region: c.region,
    emailFallbacks: [c.salesPerson],
    nameFallbacks: [c.salesPersonName],
  })
  const commercialTerms = normalizeTradeTerms(c)
  const paymentProofs = normalizeCustomerPaymentProofs(c)
  const logicalStatus = normalizeCustomerContractStatus(c)
  const persistedStatus = getPersistableSalesContractStatus(logicalStatus)
  const splitFields = deriveSalesContractSplitFields({ ...c, status: logicalStatus })
  const existingRenderMeta = c.documentRenderMeta || c.document_render_meta || {}
  return {
    id: c.id,
    contract_number: c.contractNumber,
    quotation_number: c.quotationNumber || null,
    inquiry_number: c.inquiryNumber || null,
    customer_name: c.customerName || '',
    customer_email: c.customerEmail || '',
    customer_company: c.customerCompany || null,
    customer_address: c.customerAddress || null,
    customer_country: c.customerCountry || null,
    sales_person: canonicalizePersonnelEmail(c.salesPerson, c.region) || '',
    sales_person_name: c.salesPersonName || null,
    owner_user_id: deps.toUUIDOrNull(ownerFields.owner_user_id),
    owner_email: ownerFields.owner_email,
    owner_name: ownerFields.owner_name,
    owner_role: ownerFields.owner_role,
    operator_user_id: deps.toUUIDOrNull(c.operatorUserId || c.operator_user_id || null),
    operator_email: canonicalizePersonnelEmail(c.operatorEmail || c.operator_email || '', c.region) || null,
    operator_role: c.operatorRole || c.operator_role || null,
    acting_user_id: deps.toUUIDOrNull(c.actingUserId || c.acting_user_id || null),
    acting_user_email: canonicalizePersonnelEmail(c.actingUserEmail || c.acting_user_email || '', c.region) || null,
    acting_user_role: c.actingUserRole || c.acting_user_role || null,
    authenticated_user_id: deps.toUUIDOrNull(c.authenticatedUserId || c.authenticated_user_id || null),
    authenticated_user_email: canonicalizePersonnelEmail(c.authenticatedUserEmail || c.authenticated_user_email || '', c.region) || null,
    authenticated_user_role: c.authenticatedUserRole || c.authenticated_user_role || null,
    supervisor: c.supervisor || null,
    region: c.region || null,
    products: c.products || [],
    total_amount: c.totalAmount || 0,
    currency: c.currency || 'USD',
    trade_terms: commercialTerms.trade_terms,
    payment_terms: c.paymentTerms || null,
    payment_mode: c.paymentMode || c.payment_mode || null,
    balance_trigger: c.balanceTrigger || c.balance_trigger || null,
    sc_type: c.scType || c.sc_type || null,
    exceptional_clause_flag: Boolean(c.exceptionalClauseFlag ?? c.exceptional_clause_flag ?? false),
    exceptional_clause_notes: c.exceptionalClauseNotes || c.exceptional_clause_notes || null,
    special_account_period_flag: Boolean(c.specialAccountPeriodFlag ?? c.special_account_period_flag ?? false),
    strategic_customer_flag: Boolean(c.strategicCustomerFlag ?? c.strategic_customer_flag ?? false),
    sc_last_approval_at: c.scLastApprovalAt || c.sc_last_approval_at || null,
    deposit_percentage: c.depositPercentage ?? 30,
    deposit_amount: c.depositAmount || 0,
    balance_percentage: c.balancePercentage ?? 70,
    balance_amount: c.balanceAmount || 0,
    additional_cost: c.additionalCost ?? 0,
    fx_rates: c.fxRates ?? {},
    profit_snapshot: c.profitSnapshot ?? null,
    delivery_time: c.deliveryTime || null,
    port_of_loading: c.portOfLoading || null,
    port_of_destination: c.portOfDestination || null,
    status: persistedStatus,
    approval_status: splitFields.approvalStatus,
    execution_status: splitFields.executionStatus,
    payment_status_deposit: splitFields.paymentStatusDeposit,
    payment_status_balance: splitFields.paymentStatusBalance,
    approval_flow: c.approvalFlow || {},
    approval_history: c.approvalHistory || [],
    approval_notes: c.approvalNotes || null,
    rejection_reason: c.rejectionReason || null,
    deposit_proof: paymentProofs.customerPaymentProof,
    deposit_confirmed_by: c.depositConfirmedBy || c.deposit_confirmed_by || null,
    deposit_confirmed_at: c.depositConfirmedAt || c.deposit_confirmed_at || null,
    deposit_confirm_notes: c.depositConfirmNotes || c.deposit_confirm_notes || null,
    purchase_order_numbers: c.purchaseOrderNumbers || c.purchase_order_numbers || null,
    remarks: c.remarks || null,
    submitted_at: c.submittedAt || null,
    approved_at: c.approvedAt || null,
    sent_to_customer_at: c.sentToCustomerAt || null,
    customer_confirmed_at: c.customerConfirmedAt || null,
    buyer_signature: c.buyerSignature || c.buyer_signature || null,
    seller_signature: c.sellerSignature || c.seller_signature || null,
    customer_feedback: c.customerFeedback || c.customer_feedback || null,
    template_id: c.templateId || c.template_id || null,
    template_version_id: c.templateVersionId || c.template_version_id || null,
    template_snapshot: c.templateSnapshot || c.template_snapshot || {},
    document_data_snapshot: c.documentDataSnapshot || c.document_data_snapshot || {},
    document_render_meta: {
      ...existingRenderMeta,
      erpWorkflow: {
        ...(existingRenderMeta?.erpWorkflow || {}),
        logicalStatus,
        persistedStatus,
        approvalStatus: splitFields.approvalStatus,
        executionStatus: splitFields.executionStatus,
        paymentStatusDeposit: splitFields.paymentStatusDeposit,
        paymentStatusBalance: splitFields.paymentStatusBalance,
      },
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  }
}

function fromContractRow(r: any) {
  if (!r) return null
  const commercialTerms = normalizeTradeTerms(r)
  const paymentProofs = normalizeCustomerPaymentProofs(r)
  const approvalRouting = deriveApprovalRouting(r)
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null
  const inferredStatus = normalizeCustomerContractStatus(r)
  const splitFields = deriveSalesContractSplitFields(r)
  return {
    id: r.id,
    contractNumber: r.contract_number,
    quotationNumber: r.quotation_number,
    inquiryNumber: r.inquiry_number,
    projectId: projectExecutionBaseline?.projectId || null,
    projectCode: projectExecutionBaseline?.projectCode || null,
    projectName: projectExecutionBaseline?.projectName || null,
    projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
    projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
    finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
    finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
    finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,
    quotationRole: projectExecutionBaseline?.quotationRole || null,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    customerAddress: r.customer_address,
    customerCountry: r.customer_country,
    salesPerson: canonicalizePersonnelEmail(r.sales_person, r.region),
    salesPersonName: r.sales_person_name,
    ownerUserId: r.owner_user_id || null,
    ownerEmail: canonicalizePersonnelEmail(r.owner_email || r.sales_person || '', r.region) || null,
    ownerName: r.owner_name || r.sales_person_name || null,
    ownerRole: r.owner_role || null,
    operatorUserId: r.operator_user_id || null,
    operatorEmail: canonicalizePersonnelEmail(r.operator_email || '', r.region) || null,
    operatorRole: r.operator_role || null,
    actingUserId: r.acting_user_id || null,
    actingUserEmail: canonicalizePersonnelEmail(r.acting_user_email || '', r.region) || null,
    actingUserRole: r.acting_user_role || null,
    authenticatedUserId: r.authenticated_user_id || null,
    authenticatedUserEmail: canonicalizePersonnelEmail(r.authenticated_user_email || '', r.region) || null,
    authenticatedUserRole: r.authenticated_user_role || null,
    supervisor: r.supervisor,
    region: r.region,
    products: r.products || [],
    totalAmount: r.total_amount,
    currency: r.currency,
    tradeTerms: commercialTerms.trade_terms,
    incoterm: commercialTerms.incoterm,
    paymentTerms: r.payment_terms,
    paymentMode: r.payment_mode || null,
    balanceTrigger: r.balance_trigger || null,
    scType: r.sc_type || null,
    exceptionalClauseFlag: Boolean(r.exceptional_clause_flag),
    exceptionalClauseNotes: r.exceptional_clause_notes || null,
    specialAccountPeriodFlag: Boolean(r.special_account_period_flag),
    strategicCustomerFlag: Boolean(r.strategic_customer_flag),
    scLastApprovalAt: r.sc_last_approval_at || null,
    depositPercentage: r.deposit_percentage,
    depositAmount: r.deposit_amount,
    balancePercentage: r.balance_percentage,
    balanceAmount: r.balance_amount,
    additionalCost: r.additional_cost ?? 0,
    fxRates: r.fx_rates ?? {},
    profitSnapshot: r.profit_snapshot ?? null,
    deliveryTime: r.delivery_time,
    portOfLoading: r.port_of_loading,
    portOfDestination: r.port_of_destination,
    status: inferredStatus,
    approvalStatus: splitFields.approvalStatus,
    executionStatus: splitFields.executionStatus,
    paymentStatusDeposit: splitFields.paymentStatusDeposit,
    paymentStatusBalance: splitFields.paymentStatusBalance,
    approvalStatusLegacy: r.approval_status || null,
    executionStatusLegacy: r.execution_status || null,
    paymentStatusDepositLegacy: r.payment_status_deposit || null,
    paymentStatusBalanceLegacy: r.payment_status_balance || null,
    approvalFlow: r.approval_flow || {},
    approvalHistory: r.approval_history || [],
    currentApprovalStep: approvalRouting.currentApprovalStep,
    currentApproverRole: approvalRouting.currentApproverRole,
    requiresDirectorApproval: approvalRouting.requiresDirectorApproval,
    approvalNotes: r.approval_notes,
    rejectionReason: r.rejection_reason,
    depositProof: paymentProofs.customerPaymentProof,
    customerPaymentProof: paymentProofs.customerPaymentProof,
    financeReceiptProof: paymentProofs.financeReceiptProof,
    depositConfirmedBy: r.deposit_confirmed_by || null,
    depositConfirmedAt: r.deposit_confirmed_at || null,
    depositConfirmNotes: r.deposit_confirm_notes || null,
    purchaseOrderNumbers: r.purchase_order_numbers || [],
    customerPortalPaymentStatus: deriveCustomerPortalPaymentStatus(r),
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
    sentToCustomerAt: r.sent_to_customer_at,
    customerConfirmedAt: r.customer_confirmed_at,
    buyerSignature: r.buyer_signature || null,
    sellerSignature: r.seller_signature || null,
    customerFeedback: r.customer_feedback || null,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  }
}

function toOrderRow(o: any) {
  const paymentProofs = normalizeCustomerPaymentProofs(o)
  return {
    id: o.id,
    order_number: o.orderNumber,
    customer: o.customer || '',
    customer_email: o.customerEmail || null,
    quotation_id: o.quotationId || null,
    quotation_number: o.quotationNumber || null,
    contract_number: o.contractNumber || null,
    date: o.date || new Date().toISOString().split('T')[0],
    expected_delivery: o.expectedDelivery || null,
    total_amount: o.totalAmount || 0,
    currency: o.currency || 'USD',
    status: o.status || 'Pending',
    progress: o.progress || 0,
    products: o.products || [],
    payment_status: o.paymentStatus || null,
    shipping_method: o.shippingMethod || null,
    tracking_number: o.trackingNumber || null,
    notes: o.notes || null,
    region: o.region || null,
    confirmed: o.confirmed ?? null,
    confirmed_at: o.confirmedAt || null,
    confirmed_by: o.confirmedBy || null,
    confirmed_date: o.confirmedDate || null,
    customer_feedback: o.customerFeedback || o.customer_feedback || null,
    deposit_payment_proof: paymentProofs.customerPaymentProof,
    deposit_receipt_proof: paymentProofs.financeReceiptProof,
    balance_payment_proof: paymentProofs.balanceCustomerPaymentProof,
    balance_receipt_proof: paymentProofs.financeBalanceReceiptProof,
  }
}

function toOrderUpdateRow(status: string, extra: Record<string, any> = {}) {
  const paymentProofs = normalizeCustomerPaymentProofs(extra)
  const row: Record<string, any> = {
    status,
  }

  if (extra.paymentStatus !== undefined || extra.payment_status !== undefined) {
    row.payment_status = extra.paymentStatus ?? extra.payment_status
  }
  if (extra.progress !== undefined) row.progress = extra.progress
  if (extra.notes !== undefined) row.notes = extra.notes
  if (extra.customerFeedback !== undefined || extra.customer_feedback !== undefined) {
    row.customer_feedback = extra.customerFeedback ?? extra.customer_feedback
  }
  if (extra.confirmed !== undefined) row.confirmed = extra.confirmed
  if (extra.confirmedAt !== undefined || extra.confirmed_at !== undefined) {
    row.confirmed_at = extra.confirmedAt ?? extra.confirmed_at
  }
  if (extra.confirmedBy !== undefined || extra.confirmed_by !== undefined) {
    row.confirmed_by = extra.confirmedBy ?? extra.confirmed_by
  }
  if (extra.confirmedDate !== undefined || extra.confirmed_date !== undefined) {
    row.confirmed_date = extra.confirmedDate ?? extra.confirmed_date
  }
  if (paymentProofs.customerPaymentProof !== null) {
    row.deposit_payment_proof = paymentProofs.customerPaymentProof
  }
  if (paymentProofs.financeReceiptProof !== null) {
    row.deposit_receipt_proof = paymentProofs.financeReceiptProof
  }
  if (paymentProofs.balanceCustomerPaymentProof !== null) {
    row.balance_payment_proof = paymentProofs.balanceCustomerPaymentProof
  }
  if (paymentProofs.financeBalanceReceiptProof !== null) {
    row.balance_receipt_proof = paymentProofs.financeBalanceReceiptProof
  }

  return row
}

function fromOrderRow(r: any) {
  if (!r) return null
  const paymentProofs = normalizeCustomerPaymentProofs(r)
  return {
    id: r.id,
    orderNumber: r.order_number,
    customer: r.customer,
    customerEmail: r.customer_email,
    quotationId: r.quotation_id,
    quotationNumber: r.quotation_number,
    contractNumber: r.contract_number,
    date: r.date,
    expectedDelivery: r.expected_delivery,
    totalAmount: r.total_amount,
    currency: r.currency,
    status: r.status,
    progress: r.progress,
    products: r.products || [],
    paymentStatus: r.payment_status,
    shippingMethod: r.shipping_method,
    trackingNumber: r.tracking_number,
    notes: r.notes,
    region: r.region,
    confirmed: r.confirmed ?? undefined,
    confirmedAt: r.confirmed_at || undefined,
    confirmedBy: r.confirmed_by || undefined,
    confirmedDate: r.confirmed_date || undefined,
    customerFeedback: r.customer_feedback || null,
    depositPaymentProof: paymentProofs.customerPaymentProof,
    depositReceiptProof: paymentProofs.financeReceiptProof,
    balancePaymentProof: paymentProofs.balanceCustomerPaymentProof,
    balanceReceiptProof: paymentProofs.financeBalanceReceiptProof,
    customerPaymentProof: paymentProofs.customerPaymentProof,
    balanceCustomerPaymentProof: paymentProofs.balanceCustomerPaymentProof,
    financeReceiptProof: paymentProofs.financeReceiptProof,
    financeBalanceReceiptProof: paymentProofs.financeBalanceReceiptProof,
    customerPortalPaymentStatus: deriveCustomerPortalPaymentStatus(r),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toARRow(ar: any) {
  const paymentProofs = normalizeCustomerPaymentProofs(ar)
  return {
    id: ar.id,
    ar_number: ar.arNumber,
    order_number: ar.orderNumber,
    quotation_number: ar.quotationNumber || null,
    contract_number: ar.contractNumber || null,
    customer_name: ar.customerName || '',
    customer_email: ar.customerEmail || '',
    region: ar.region || null,
    invoice_date: ar.invoiceDate || new Date().toISOString().split('T')[0],
    due_date: ar.dueDate || '',
    total_amount: ar.totalAmount || 0,
    paid_amount: ar.paidAmount || 0,
    remaining_amount: ar.remainingAmount || 0,
    currency: ar.currency || 'USD',
    credit_limit_usd: ar.creditLimitUsd ?? ar.credit_limit_usd ?? null,
    overdue_risk_level: ar.overdueRiskLevel || ar.overdue_risk_level || null,
    credit_release_approved_by: ar.creditReleaseApprovedBy || ar.credit_release_approved_by || null,
    status: ar.status || 'pending',
    payment_terms: ar.paymentTerms || null,
    products: ar.products || [],
    payment_history: ar.paymentHistory || [],
    deposit_proof: paymentProofs.customerPaymentProof,
    balance_proof: paymentProofs.balanceCustomerPaymentProof,
    deposit_receipt_proof: paymentProofs.financeReceiptProof,
    balance_receipt_proof: paymentProofs.financeBalanceReceiptProof,
    created_by: ar.createdBy || null,
    notes: ar.notes || null,
  }
}

function toARUpdateRow(update: Record<string, any>) {
  const row: Record<string, any> = {}
  Object.entries(update || {}).forEach(([key, value]) => {
    if (value === undefined) return
    switch (key) {
      case 'arNumber':
        row.ar_number = value
        break
      case 'orderNumber':
        row.order_number = value
        break
      case 'quotationNumber':
        row.quotation_number = value
        break
      case 'contractNumber':
        row.contract_number = value
        break
      case 'customerName':
        row.customer_name = value
        break
      case 'customerEmail':
        row.customer_email = value
        break
      case 'invoiceDate':
        row.invoice_date = value
        break
      case 'dueDate':
        row.due_date = value
        break
      case 'totalAmount':
        row.total_amount = value
        break
      case 'paidAmount':
        row.paid_amount = value
        break
      case 'remainingAmount':
        row.remaining_amount = value
        break
      case 'paymentTerms':
        row.payment_terms = value
        break
      case 'paymentHistory':
        row.payment_history = value
        break
      case 'creditLimitUsd':
        row.credit_limit_usd = value
        break
      case 'overdueRiskLevel':
        row.overdue_risk_level = value
        break
      case 'creditReleaseApprovedBy':
        row.credit_release_approved_by = value
        break
      case 'depositProof':
      case 'customerPaymentProof':
      case 'depositPaymentProof':
        row.deposit_proof = value
        break
      case 'balanceProof':
      case 'balanceCustomerPaymentProof':
      case 'balancePaymentProof':
        row.balance_proof = value
        break
      case 'depositReceiptProof':
      case 'financeReceiptProof':
        row.deposit_receipt_proof = value
        break
      case 'balanceReceiptProof':
      case 'financeBalanceReceiptProof':
        row.balance_receipt_proof = value
        break
      case 'createdBy':
        row.created_by = value
        break
      default:
        row[key] = value
        break
    }
  })
  return row
}

function fromARRow(r: any) {
  if (!r) return null
  const paymentProofs = normalizeCustomerPaymentProofs(r)
  return {
    id: r.id,
    arNumber: r.ar_number,
    orderNumber: r.order_number,
    quotationNumber: r.quotation_number,
    contractNumber: r.contract_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    region: r.region,
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount,
    remainingAmount: r.remaining_amount,
    currency: r.currency,
    creditLimitUsd: r.credit_limit_usd ?? null,
    overdueRiskLevel: r.overdue_risk_level || null,
    creditReleaseApprovedBy: r.credit_release_approved_by || null,
    status: r.status,
    paymentTerms: r.payment_terms,
    products: r.products || [],
    paymentHistory: r.payment_history || [],
    depositProof: paymentProofs.customerPaymentProof,
    balanceProof: paymentProofs.balanceCustomerPaymentProof,
    depositReceiptProof: paymentProofs.financeReceiptProof,
    balanceReceiptProof: paymentProofs.financeBalanceReceiptProof,
    customerPaymentProof: paymentProofs.customerPaymentProof,
    balanceCustomerPaymentProof: paymentProofs.balanceCustomerPaymentProof,
    financeReceiptProof: paymentProofs.financeReceiptProof,
    financeBalanceReceiptProof: paymentProofs.financeBalanceReceiptProof,
    customerPortalPaymentStatus: deriveCustomerPortalPaymentStatus(r),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
    notes: r.notes,
  }
}

export function createContractService(deps: DependencyBag) {
  const listViaServer = async (options: { ownerEmail?: string; contractNumber?: string } = {}) => {
    const normalizedOwnerEmail = canonicalizePersonnelEmail(options.ownerEmail || '') || String(options.ownerEmail || '').trim().toLowerCase()
    const contractNumber = String(options.contractNumber || '').trim()
    const localAdminAuth = getLocalAdminAuth()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      apikey: supabaseAnonKey,
    }
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const query = new URLSearchParams()
    if (normalizedOwnerEmail) query.set('ownerEmail', normalizedOwnerEmail)
    if (contractNumber) query.set('contractNumber', contractNumber)
    if (localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password) {
      query.set('localAdminAuth', '1')
      query.set('localAdminEmail', localAdminAuth.email)
      query.set('localAdminPassword', localAdminAuth.password)
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/list-sales-contracts?${query.toString()}`,
      { headers },
    )

    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.success === false) {
      throw new Error(String(payload?.message || '服务端读取 SC 列表失败'))
    }

    return Array.isArray(payload?.contracts)
      ? payload.contracts.map((row: any) => fromContractRow(row))
      : []
  }

  return {
    async getAll() {
      const localAdminAuth = getLocalAdminAuth()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token && localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password) {
        const { data, error } = await supabase
          .from('sales_contracts')
          .select('*')
          .order('created_at', { ascending: false })
        if (!error) {
          return Array.isArray(data) ? data.map((row) => fromContractRow(row)) : []
        }
        console.warn('⚠️ [contractService.getAll] 本地管理员客户端直读失败，尝试服务端读取:', error)
      }

      try {
        return await listViaServer()
      } catch (error) {
        console.warn('⚠️ [contractService.getAll] 服务端读取失败，回退客户端直读:', error)
      }

      const { data, error } = await supabase
        .from('sales_contracts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll contracts', error)
      return Array.isArray(data) ? data.map((row) => fromContractRow(row)) : []
    },

    async getByEmail(email: string) {
      const normalizedEmail = normalizeCustomerPortalEmail(email)
      const relatedEmails = new Set<string>()
      const relatedCompanies = new Set<string>()

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const enterpriseAuthUserId = await customerEnterpriseMemberService.resolveEnterpriseAuthUserIdForUser(
          String(session?.user?.id || '').trim(),
          normalizedEmail,
        )
        const [members, organizationByAuthUser, organizationByEmail, portalProfile] = await Promise.all([
          enterpriseAuthUserId
            ? customerEnterpriseMemberService.listByEnterpriseAuthUser(enterpriseAuthUserId).catch(() => [])
            : Promise.resolve([]),
          enterpriseAuthUserId
            ? customerOrganizationService.getByAuthUser(enterpriseAuthUserId).catch(() => null)
            : Promise.resolve(null),
          normalizedEmail ? customerOrganizationService.getByEmail(normalizedEmail).catch(() => null) : Promise.resolve(null),
          normalizedEmail ? customerPortalProfileService.getByLoginEmail(normalizedEmail).catch(() => null) : Promise.resolve(null),
        ])

        const emailScope = buildCustomerPortalEmailScope({
          customerEmail: normalizedEmail,
          enterpriseMembers: Array.isArray(members) ? members : [],
          organization: organizationByAuthUser || organizationByEmail || null,
          extraEmails: portalProfile?.loginEmail ? [portalProfile.loginEmail] : [],
        })

        emailScope.relatedEmails.forEach((value) => relatedEmails.add(value))
        emailScope.relatedCompanies.forEach((value) => relatedCompanies.add(value))
      } catch {
        // Keep the basic email match when enterprise lookup fails.
      }

      const matchesCustomerScope = (row: any) => {
        const rowEmail = normalizeCustomerPortalEmail(row?.customerEmail || row?.customer_email)
        const rowCompany = String(row?.customerCompany || row?.customer_company || '').trim().toLowerCase()
        if (!normalizedEmail && relatedEmails.size === 0 && relatedCompanies.size === 0) return true
        return (
          (!!rowEmail && relatedEmails.has(rowEmail)) ||
          (!!rowCompany && relatedCompanies.has(rowCompany))
        )
      }

      const merged = new Map<string, any>()
      const bindRows = (rows: any[]) => {
        ;(rows || []).forEach((row: any) => {
          if (!matchesCustomerScope(row)) return
          const normalized = fromContractRow(row)
          const key = String(normalized?.id || normalized?.contractNumber || row?.id || row?.contract_number || '').trim()
          if (key) merged.set(key, normalized)
        })
      }

      try {
        if (relatedEmails.size > 0) {
          const { data, error } = await supabase
            .from('sales_contracts')
            .select('*')
            .in('customer_email', Array.from(relatedEmails))
            .order('created_at', { ascending: false })
          if (error) deps.throwSupabaseError('getByEmail contracts', error)
          bindRows(data || [])
        }

        if (relatedCompanies.size > 0) {
          for (const companyName of relatedCompanies) {
            const { data, error } = await supabase
              .from('sales_contracts')
              .select('*')
              .eq('customer_company', companyName)
              .order('created_at', { ascending: false })
            if (error) deps.throwSupabaseError('getByEmail contracts by company', error)
            bindRows(data || [])
          }
        }
      } catch (error) {
        console.warn('⚠️ [contractService.getByEmail] 客户合同直读失败，返回空列表以避免越权重试:', error)
        return []
      }

      if (merged.size > 0) {
        return Array.from(merged.values())
      }

      try {
        const { data, error } = await supabase
          .from('sales_contracts')
          .select('*')
          .or(`customer_email.eq.${normalizedEmail},sales_person.eq.${normalizedEmail}`)
          .order('created_at', { ascending: false })
        if (error) deps.throwSupabaseError('getByEmail contracts', error)
        return Array.isArray(data) ? data.map((row) => fromContractRow(row)) : []
      } catch (error) {
        console.warn('⚠️ [contractService.getByEmail] 客户合同兜底查询失败，返回空列表:', error)
        return []
      }
    },

    async upsert(contract: any) {
      const contractId = String(contract.id || '').trim()
      const { data: beforeRow } = contractId
        ? await supabase.from('sales_contracts').select('*').eq('id', contractId).maybeSingle()
        : { data: null as any }
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(contract, {
        documentCode: 'SC',
        nodeCode: 'sc-create',
        businessData: contract.documentDataSnapshot || contract.document_data_snapshot || contract,
      })
      const row = toContractRow({ ...contract, ...templateBinding }, deps)
      const { data, error } = await deps.upsertWithSchemaFallback(
        'sales_contracts',
        row,
        'id',
        'upsert contract',
      )
      if (error) deps.throwSupabaseError('upsert contract', error)
      await auditLogService.logEntityChange({
        entityType: 'sales_contract',
        entityId: data?.id || contractId,
        action: beforeRow ? 'update' : 'create',
        before: beforeRow,
        after: data,
        actor: {
          actorId: contract.authenticatedUserId || contract.authenticated_user_id || contract.actingUserId || contract.acting_user_id || contract.operatorUserId || contract.operator_user_id || contract.ownerUserId || contract.owner_user_id || null,
          actorEmail: contract.authenticatedUserEmail || contract.authenticated_user_email || contract.actingUserEmail || contract.acting_user_email || contract.operatorEmail || contract.operator_email || contract.salesPerson || contract.sales_person || null,
          actorRole: contract.authenticatedUserRole || contract.authenticated_user_role || contract.actingUserRole || contract.acting_user_role || contract.operatorRole || contract.operator_role || contract.ownerRole || contract.owner_role || null,
        },
      })
      return fromContractRow(data)
    },

    async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
      const contractKey = String(id || '').trim()
      const logicalStatus = normalizeCustomerContractStatus(status)
      const persistedStatus = getPersistableSalesContractStatus(logicalStatus)
      const existingRenderMeta = extra.documentRenderMeta || extra.document_render_meta || {}
      const splitFields = deriveSalesContractSplitFields({
        ...extra,
        status: logicalStatus,
      })
      const payload = {
        status: persistedStatus,
        approval_status: splitFields.approvalStatus,
        execution_status: splitFields.executionStatus,
        payment_status_deposit: splitFields.paymentStatusDeposit,
        payment_status_balance: splitFields.paymentStatusBalance,
        ...withScApprovalGovernanceFields(persistedStatus, extra),
        document_render_meta: {
          ...existingRenderMeta,
          erpWorkflow: {
            ...(existingRenderMeta?.erpWorkflow || {}),
            logicalStatus,
            persistedStatus,
            approvalStatus: splitFields.approvalStatus,
            executionStatus: splitFields.executionStatus,
            paymentStatusDeposit: splitFields.paymentStatusDeposit,
            paymentStatusBalance: splitFields.paymentStatusBalance,
          },
        },
        updated_at: new Date().toISOString(),
      }
      const readContractRow = async (): Promise<Record<string, any> | null> => {
        if (!contractKey) return null
        const readAttempts = [
          supabase.from('sales_contracts').select('*').eq('id', contractKey).maybeSingle(),
          supabase.from('sales_contracts').select('*').eq('contract_number', contractKey).maybeSingle(),
        ]

        for (const attempt of readAttempts) {
          try {
            const { data, error } = await attempt
            if (data) return data as Record<string, any>
            if (error) {
              console.warn('⚠️ [contractService.updateStatus] readable row lookup failed:', error)
            }
          } catch (lookupError) {
            console.warn('⚠️ [contractService.updateStatus] readable row lookup threw:', lookupError)
          }
        }

        return null
      }

      const beforeRow = await readContractRow()
      const updateFilters = [
        { column: 'id', value: contractKey },
        { column: 'contract_number', value: contractKey },
      ].filter((item) => item.value)

      let updateError: Error | null = null
      for (const filter of updateFilters) {
        const { error } = await deps.updateWithSchemaFallback(
          'sales_contracts',
          payload,
          (query) => query.eq(filter.column, filter.value),
          'updateStatus contract',
        )
        if (!error) {
          updateError = null
          break
        }
        updateError = error
      }
      if (updateError) deps.throwSupabaseError('updateStatus contract', updateError)

      let resolvedRow = await readContractRow()
      if (!resolvedRow) {
        resolvedRow = beforeRow
          ? {
              ...beforeRow,
              ...payload,
              id: beforeRow.id || contractKey,
              contract_number: beforeRow.contract_number || beforeRow.contractNumber || contractKey,
            }
          : {
              id: contractKey,
              contract_number: contractKey,
              ...payload,
            }
        console.warn('⚠️ [contractService.updateStatus] update succeeded but updated row is not readable; returning synthetic row', {
          id: contractKey,
          status: persistedStatus,
        })
      }
      if (beforeRow && String(resolvedRow.status || '') !== String(persistedStatus)) {
        resolvedRow = {
          ...beforeRow,
          ...payload,
          id: beforeRow.id || contractKey,
          contract_number: beforeRow.contract_number || beforeRow.contractNumber || contractKey,
        }
      }
      await auditLogService.logEntityChange({
        entityType: 'sales_contract',
        entityId: contractKey,
        action: ['approved', 'customer_confirmed', 'completed'].includes(String(logicalStatus)) ? 'approve' : ['rejected', 'customer_rejected'].includes(String(logicalStatus)) ? 'reject' : 'update',
        before: beforeRow,
        after: resolvedRow,
        actor: {
          actorId: extra.authenticatedUserId || extra.authenticated_user_id || extra.actingUserId || extra.acting_user_id || extra.operatorUserId || extra.operator_user_id || null,
          actorEmail: extra.authenticatedUserEmail || extra.authenticated_user_email || extra.actingUserEmail || extra.acting_user_email || extra.operatorEmail || extra.operator_email || extra.approverEmail || null,
          actorRole: extra.authenticatedUserRole || extra.authenticated_user_role || extra.actingUserRole || extra.acting_user_role || extra.operatorRole || extra.operator_role || null,
        },
      })
      return fromContractRow(resolvedRow)
    },

    async delete(id: string) {
      const localAdminAuth = getLocalAdminAuth()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
      }
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`
      }

      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/delete-sales-contract`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id,
              ...(localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password
                ? {
                    localAdminAuth: {
                      email: localAdminAuth.email,
                      password: localAdminAuth.password,
                    },
                  }
                : {}),
            }),
          },
        )
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.success === false) {
          throw new Error(String(payload?.message || '服务端删除 SC 失败'))
        }
        return {
          deletedContract: fromContractRow(payload?.deletedContract),
          remainingLatestContract: fromContractRow(payload?.remainingLatestContract),
        }
      } catch (serverError) {
        console.warn('⚠️ [contractService.delete] 服务端删除失败，回退客户端直删:', serverError)
      }

      const { data: beforeRow, error: lookupError } = await supabase
        .from('sales_contracts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (lookupError) deps.throwSupabaseError('lookup contract before delete', lookupError)

      const { error } = await supabase
        .from('sales_contracts')
        .delete()
        .eq('id', id)
      if (error) deps.throwSupabaseError('delete contract', error)

      let remainingLatestContract: any = null
      const quotationNumber = String(beforeRow?.quotation_number || '').trim()
      if (quotationNumber) {
        const { data: remainingRows, error: remainingError } = await supabase
          .from('sales_contracts')
          .select('*')
          .eq('quotation_number', quotationNumber)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
        if (remainingError) deps.throwSupabaseError('fetch remaining contract after delete', remainingError)
        remainingLatestContract = Array.isArray(remainingRows) ? fromContractRow(remainingRows[0]) : null
      }

      return {
        deletedContract: fromContractRow(beforeRow),
        remainingLatestContract,
      }
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('sales_contracts_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_contracts' }, callback)
        .subscribe()
    },
  }
}

export function createOrderService(deps: DependencyBag) {
  const listViaServer = async (options: { orderNumber?: string; customerEmail?: string } = {}) => {
    const localAdminAuth = getLocalAdminAuth()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      apikey: supabaseAnonKey,
    }
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    const query = new URLSearchParams()
    if (options.orderNumber) query.set('orderNumber', String(options.orderNumber).trim())
    if (options.customerEmail) query.set('customerEmail', String(options.customerEmail).trim().toLowerCase())
    if (localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password) {
      query.set('localAdminAuth', '1')
      query.set('localAdminEmail', localAdminAuth.email)
      query.set('localAdminPassword', localAdminAuth.password)
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/list-orders?${query.toString()}`,
      { headers },
    )

    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.success === false) {
      throw new Error(String(payload?.message || '服务端读取订单失败'))
    }

    return Array.isArray(payload?.orders)
      ? payload.orders.map((row: any) => fromOrderRow(row))
      : []
  }

  return {
    async getAll() {
      try {
        return await listViaServer()
      } catch (error) {
        console.warn('⚠️ [orderService.getAll] 服务端读取失败，回退客户端直读:', error)
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getAll orders')
      return Array.isArray(data) ? data.map((row) => fromOrderRow(row)) : []
    },

    async getByCustomerEmail(email: string) {
      const normalizedEmail = String(email || '').trim().toLowerCase()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (accessToken && normalizedEmail) {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-orders?email=${encodeURIComponent(normalizedEmail)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              apikey: supabaseAnonKey,
            },
          },
        )

        let payload: any = null
        try {
          payload = await response.json()
        } catch {
          payload = null
        }

        if (response.ok) {
          return Array.isArray(payload?.orders) ? payload.orders.map((row: any) => fromOrderRow(row)) : []
        }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', normalizedEmail)
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getByCustomerEmail orders')
      return Array.isArray(data) ? data.map((row) => fromOrderRow(row)) : []
    },

    async upsert(order: any) {
      const row = toOrderRow(order)
      const { data, error } = await deps.upsertWithSchemaFallback(
        'orders',
        row,
        'id',
        'upsert order',
      )
      if (error) return deps.handleError(error, 'upsert order')
      return fromOrderRow(data)
    },

    async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
      const orderKey = String(id || '').trim()
      const payload = {
        ...toOrderUpdateRow(status, extra),
        updated_at: new Date().toISOString(),
      }

      const readOrderRow = async (): Promise<Record<string, any> | null> => {
        if (!orderKey) return null
        const readAttempts = [
          supabase.from('orders').select('*').eq('id', orderKey).maybeSingle(),
          supabase.from('orders').select('*').eq('order_number', orderKey).maybeSingle(),
          supabase.from('orders').select('*').eq('contract_number', orderKey).maybeSingle(),
        ]

        for (const attempt of readAttempts) {
          try {
            const { data, error } = await attempt
            if (data) return data as Record<string, any>
            if (error) {
              console.warn('⚠️ [orderService.updateStatus] readable row lookup failed:', error)
            }
          } catch (lookupError) {
            console.warn('⚠️ [orderService.updateStatus] readable row lookup threw:', lookupError)
          }
        }

        return null
      }

      const beforeRow = await readOrderRow()
      const updateFilters = [
        { column: 'id', value: orderKey },
        { column: 'order_number', value: orderKey },
        { column: 'contract_number', value: orderKey },
      ].filter((item) => item.value)

      let updateError: Error | null = null
      for (const filter of updateFilters) {
        const { error } = await deps.updateWithSchemaFallback(
          'orders',
          payload,
          (query) => query.eq(filter.column, filter.value),
          'updateStatus order',
        )
        if (!error) {
          updateError = null
          break
        }
        updateError = error
      }
      if (updateError) deps.throwSupabaseError('updateStatus order', updateError)

      let resolvedRow = await readOrderRow()
      if (!resolvedRow) {
        resolvedRow = beforeRow
          ? {
              ...beforeRow,
              ...payload,
              id: beforeRow.id || orderKey,
              order_number: beforeRow.order_number || beforeRow.orderNumber || orderKey,
              contract_number: beforeRow.contract_number || beforeRow.contractNumber || null,
            }
          : {
              id: orderKey,
              order_number: orderKey,
              ...payload,
            }
        console.warn('⚠️ [orderService.updateStatus] update succeeded but updated row is not readable; returning synthetic row', {
          id: orderKey,
          status,
        })
      }

      return fromOrderRow(resolvedRow)
    },

    async delete(id: string) {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (error) return deps.handleError(error, 'delete order')
      return true
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
        .subscribe()
    },
  }
}

export function createArService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getAll AR')
      return Array.isArray(data) ? data.map((row) => fromARRow(row)) : []
    },

    async getByEmail(email: string) {
      deps.rememberMissingColumn('accounts_receivable', 'customer_email')
      const normalizedEmail = normalizeCustomerPortalEmail(email)
      const { data: allRows, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return deps.handleError(error, 'getByEmail AR fallback')
      }

      return (allRows || [])
        .filter((row: any) => deps.matchesCustomerEmailFallback(row, normalizedEmail))
        .map((row: any) => fromARRow(row))
    },

    async upsert(ar: any) {
      const row = toARRow(ar)
      const { data, error } = await deps.upsertWithSchemaFallback(
        'accounts_receivable',
        row,
        'id',
        'upsert AR',
      )
      if (error) return deps.handleError(error, 'upsert AR')
      return fromARRow(data)
    },

    async updateByOrderNumber(orderNumber: string, update: Record<string, any>) {
      const normalizedUpdate = toARUpdateRow(update)
      const arKey = String(orderNumber || '').trim()
      const payload = { ...normalizedUpdate, updated_at: new Date().toISOString() }
      const filters = [
        { column: 'order_number', value: arKey },
        { column: 'contract_number', value: arKey },
      ].filter((item) => item.value)

      let updatedRow: any = null
      let updateError: any = null

      for (const filter of filters) {
        const { data, error } = await supabase
          .from('accounts_receivable')
          .update(payload)
          .eq(filter.column, filter.value)
          .select()
          .maybeSingle()

        if (!error && data) {
          updatedRow = data
          updateError = null
          break
        }

        if (error) {
          updateError = error
        }
      }

      if (updateError) return deps.handleError(updateError, 'updateByOrderNumber AR')
      return updatedRow ? fromARRow(updatedRow) : null
    },

    async getByOrderNumber(orderNumber: string) {
      const arKey = String(orderNumber || '').trim()
      const readAttempts = [
        supabase.from('accounts_receivable').select('*').eq('order_number', arKey).maybeSingle(),
        supabase.from('accounts_receivable').select('*').eq('contract_number', arKey).maybeSingle(),
      ]

      for (const attempt of readAttempts) {
        const { data, error } = await attempt
        if (data) return fromARRow(data)
        if (error) {
          console.warn('⚠️ [arService.getByOrderNumber] readable row lookup failed:', error)
        }
      }

      return null
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('ar_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_receivable' }, callback)
        .subscribe()
    },
  }
}
