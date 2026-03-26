import { canonicalizePersonnelEmail } from '../personnelEmail'
import { supabase } from '../supabase'

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
  toUUIDOrNull: (value: unknown) => string | null
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
    owner_user_id: deps.toUUIDOrNull(c.ownerUserId || c.owner_user_id || null),
    owner_email: canonicalizePersonnelEmail(c.ownerEmail || c.owner_email || c.salesPerson || '', c.region) || null,
    owner_name: c.ownerName || c.owner_name || c.salesPersonName || null,
    owner_role: c.ownerRole || c.owner_role || null,
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
    trade_terms: c.tradeTerms || null,
    payment_terms: c.paymentTerms || null,
    payment_mode: c.paymentMode || c.payment_mode || null,
    deposit_percentage: c.depositPercentage || 30,
    deposit_amount: c.depositAmount || 0,
    balance_percentage: c.balancePercentage || 70,
    balance_amount: c.balanceAmount || 0,
    additional_cost: c.additionalCost ?? 0,
    fx_rates: c.fxRates ?? {},
    profit_snapshot: c.profitSnapshot ?? null,
    delivery_time: c.deliveryTime || null,
    port_of_loading: c.portOfLoading || null,
    port_of_destination: c.portOfDestination || null,
    status: c.status || 'draft',
    approval_flow: c.approvalFlow || {},
    approval_history: c.approvalHistory || [],
    approval_notes: c.approvalNotes || null,
    rejection_reason: c.rejectionReason || null,
    deposit_proof: c.depositProof || null,
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
      ...(c.documentRenderMeta || c.document_render_meta || {}),
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  }
}

function fromContractRow(r: any) {
  if (!r) return null
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null
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
    tradeTerms: r.trade_terms,
    paymentTerms: r.payment_terms,
    paymentMode: r.payment_mode || null,
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
    status: r.status,
    approvalFlow: r.approval_flow || {},
    approvalHistory: r.approval_history || [],
    approvalNotes: r.approval_notes,
    rejectionReason: r.rejection_reason,
    depositProof: r.deposit_proof,
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
    deposit_payment_proof: o.depositPaymentProof || null,
    balance_payment_proof: o.balancePaymentProof || null,
  }
}

function fromOrderRow(r: any) {
  if (!r) return null
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
    depositPaymentProof: r.deposit_payment_proof,
    balancePaymentProof: r.balance_payment_proof,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toARRow(ar: any) {
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
    status: ar.status || 'pending',
    payment_terms: ar.paymentTerms || null,
    products: ar.products || [],
    payment_history: ar.paymentHistory || [],
    deposit_proof: ar.depositProof || null,
    balance_proof: ar.balanceProof || null,
    created_by: ar.createdBy || null,
    notes: ar.notes || null,
  }
}

function fromARRow(r: any) {
  if (!r) return null
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
    status: r.status,
    paymentTerms: r.payment_terms,
    products: r.products || [],
    paymentHistory: r.payment_history || [],
    depositProof: r.deposit_proof,
    balanceProof: r.balance_proof,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
    notes: r.notes,
  }
}

export function createContractService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase
        .from('sales_contracts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll contracts', error)
      return data
    },

    async getByEmail(email: string) {
      const { data, error } = await supabase
        .from('sales_contracts')
        .select('*')
        .or(`customer_email.eq.${email},sales_person.eq.${email}`)
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getByEmail contracts', error)
      return data
    },

    async upsert(contract: any) {
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(contract, {
        documentCode: 'SC',
        nodeCode: 'sc-create',
        businessData: contract.documentDataSnapshot || contract.document_data_snapshot || contract,
      })
      const row = toContractRow({ ...contract, ...templateBinding }, deps)
      const { data, error } = await supabase
        .from('sales_contracts')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) deps.throwSupabaseError('upsert contract', error)
      return fromContractRow(data)
    },

    async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
      const { data, error } = await supabase
        .from('sales_contracts')
        .update({ status, ...extra, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) deps.throwSupabaseError('updateStatus contract', error)
      return fromContractRow(data)
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('sales_contracts')
        .delete()
        .eq('id', id)
      if (error) deps.throwSupabaseError('delete contract', error)
      return true
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
  return {
    async getAll() {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getAll orders')
      return data
    },

    async getByCustomerEmail(email: string) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
      if (error) return deps.handleError(error, 'getByCustomerEmail orders')
      return data
    },

    async upsert(order: any) {
      const row = toOrderRow(order)
      const { data, error } = await supabase
        .from('orders')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) return deps.handleError(error, 'upsert order')
      return fromOrderRow(data)
    },

    async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, ...extra, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) return deps.handleError(error, 'updateStatus order')
      return fromOrderRow(data)
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
      return data
    },

    async getByEmail(email: string) {
      deps.rememberMissingColumn('accounts_receivable', 'customer_email')
      const { data: allRows, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return deps.handleError(error, 'getByEmail AR fallback')
      }

      return (allRows || []).filter((row: any) => deps.matchesCustomerEmailFallback(row, email))
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
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('order_number', orderNumber)
        .select()
        .single()
      if (error) return deps.handleError(error, 'updateByOrderNumber AR')
      return fromARRow(data)
    },

    async getByOrderNumber(orderNumber: string) {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (error) return deps.handleError(error, 'getByOrderNumber AR')
      return data ? fromARRow(data) : null
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('ar_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_receivable' }, callback)
        .subscribe()
    },
  }
}
