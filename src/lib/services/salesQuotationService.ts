import { canonicalizePersonnelEmail, getPersonnelEmailAliases } from '../personnelEmail'
import { supabase } from '../supabase'

type DependencyBag = {
  throwSupabaseError: (context: string, error: any) => never
  buildSupabaseError: (
    context: string,
    error: any,
    options?: {
      removedColumns?: string[]
      adjustedProfitRate?: boolean
    },
  ) => Error
  resolveBusinessDocumentTemplateBinding: (
    document: any,
    options: {
      documentCode: string
      nodeCode: string
      businessData: any
    },
  ) => Promise<Record<string, any>>
  upsertWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    onConflict: string,
    context: string,
  ) => Promise<{ data: any; error: Error | null }>
  normalizeProfitRateForStorage: (input: any, totalProfit?: any, totalCost?: any) => number
  normalizeProfitRatePercent: (value: any) => number
  toUUID: (id: string | null | undefined) => string
  toUUIDOrNull: (id: string | null | undefined) => string | null
}

function toSalesQuotationRow(q: any, deps: DependencyBag) {
  const uuid = deps.toUUID(q.id)
  const createdBy = deps.toUUIDOrNull(q.createdBy || q.created_by || null)
  const customerResponseValue =
    q.customerResponse == null
      ? null
      : (typeof q.customerResponse === 'string'
          ? q.customerResponse
          : JSON.stringify(q.customerResponse))
  const profitRateValue = deps.normalizeProfitRateForStorage(
    q.profitRate ?? q.profit_rate,
    q.totalProfit ?? q.total_profit,
    q.totalCost ?? q.total_cost,
  )
  return {
    id: uuid,
    qt_number: q.qtNumber || q.qt_number,
    quotation_number: q.qtNumber || q.qt_number || uuid,
    qr_number: q.qrNumber || null,
    inq_number: q.inqNumber || null,
    inquiry_number: q.inqNumber || null,
    region: q.region || null,
    customer_name: q.customerName || '',
    customer_email: q.customerEmail || '',
    customer_company: q.customerCompany || null,
    project_id: q.projectId || q.project_id || null,
    project_code: q.projectCode || q.project_code || null,
    project_name: q.projectName || q.project_name || null,
    project_revision_id: q.projectRevisionId || q.project_revision_id || null,
    project_revision_code: q.projectRevisionCode || q.project_revision_code || null,
    project_revision_status: q.projectRevisionStatus || q.project_revision_status || null,
    final_revision_id: q.finalRevisionId || q.final_revision_id || null,
    quotation_role: q.quotationRole || q.quotation_role || null,
    sales_person: canonicalizePersonnelEmail(q.salesPerson, q.region) || '',
    sales_person_name: q.salesPersonName || null,
    owner_user_id: deps.toUUIDOrNull(q.ownerUserId || q.owner_user_id || null),
    owner_email: canonicalizePersonnelEmail(q.ownerEmail || q.owner_email || q.salesPerson || '', q.region) || null,
    owner_name: q.ownerName || q.owner_name || q.salesPersonName || null,
    owner_role: q.ownerRole || q.owner_role || null,
    operator_user_id: deps.toUUIDOrNull(q.operatorUserId || q.operator_user_id || null),
    operator_email: canonicalizePersonnelEmail(q.operatorEmail || q.operator_email || '', q.region) || null,
    operator_role: q.operatorRole || q.operator_role || null,
    acting_user_id: deps.toUUIDOrNull(q.actingUserId || q.acting_user_id || null),
    acting_user_email: canonicalizePersonnelEmail(q.actingUserEmail || q.acting_user_email || '', q.region) || null,
    acting_user_role: q.actingUserRole || q.acting_user_role || null,
    authenticated_user_id: deps.toUUIDOrNull(q.authenticatedUserId || q.authenticated_user_id || null),
    authenticated_user_email: canonicalizePersonnelEmail(q.authenticatedUserEmail || q.authenticated_user_email || '', q.region) || null,
    authenticated_user_role: q.authenticatedUserRole || q.authenticated_user_role || null,
    items: q.items || [],
    total_cost: q.totalCost || 0,
    total_price: q.totalPrice || 0,
    total_amount: q.totalPrice || 0,
    total_profit: q.totalProfit || 0,
    profit_rate: profitRateValue,
    currency: q.currency || 'USD',
    payment_terms: q.paymentTerms || null,
    payment_mode: q.paymentMode || q.payment_mode || null,
    delivery_terms: q.deliveryTerms || null,
    delivery_date: q.deliveryDate || null,
    delivery_time: q.deliveryDate || null,
    valid_until: q.validUntil || null,
    validity_period: q.validUntil || null,
    version: q.version || 1,
    previous_version: q.previousVersion || null,
    approval_status: q.approvalStatus || 'draft',
    approval_chain: q.approvalChain || [],
    customer_status: q.customerStatus || 'not_sent',
    customer_response: customerResponseValue,
    so_number: q.soNumber || null,
    pushed_to_contract: q.pushedToContract || false,
    pushed_contract_number: q.pushedContractNumber || null,
    pushed_contract_at: q.pushedContractAt || null,
    pushed_by: q.pushedBy || null,
    customer_notes: q.customerNotes || null,
    internal_notes: q.internalNotes || null,
    trade_terms: q.tradeTerms || null,
    pricing_defaults: q.pricingDefaults || q.pricing_defaults || q.globalDefaults || null,
    remarks: q.remarks || null,
    sent_at: q.sentAt || null,
    sent_to_customer: q.customerStatus !== 'not_sent',
    sent_to_customer_at: q.sentAt || null,
    status: q.approvalStatus || 'draft',
    created_by: createdBy,
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || {},
    document_render_meta: q.documentRenderMeta || q.document_render_meta || {},
  }
}

function fromSalesQuotationRow(r: any, deps: DependencyBag) {
  if (!r) return null
  let parsedCustomerResponse: any = null
  const responseRaw = r.customer_response_data ?? r.customer_response
  if (responseRaw != null) {
    if (typeof responseRaw === 'string') {
      try {
        parsedCustomerResponse = JSON.parse(responseRaw)
      } catch {
        parsedCustomerResponse = responseRaw
      }
    } else {
      parsedCustomerResponse = responseRaw
    }
  }
  return {
    id: r.id,
    qtNumber: r.qt_number || r.quotation_number,
    qrNumber: r.qr_number,
    inqNumber: r.inq_number || r.inquiry_number,
    region: r.region,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    projectId: r.project_id || null,
    projectCode: r.project_code || null,
    projectName: r.project_name || null,
    projectRevisionId: r.project_revision_id || null,
    projectRevisionCode: r.project_revision_code || null,
    projectRevisionStatus: r.project_revision_status || null,
    finalRevisionId: r.final_revision_id || null,
    quotationRole: r.quotation_role || null,
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
    items: r.items || [],
    totalCost: r.total_cost || 0,
    totalPrice: r.total_price || r.total_amount || 0,
    totalProfit: r.total_profit || 0,
    profitRate: deps.normalizeProfitRatePercent(r.profit_rate || 0),
    currency: r.currency || 'USD',
    paymentTerms: r.payment_terms,
    paymentMode: r.payment_mode || null,
    deliveryTerms: r.delivery_terms,
    deliveryDate: r.delivery_date || r.delivery_time,
    validUntil: r.valid_until || r.validity_period,
    version: r.version || 1,
    previousVersion: r.previous_version,
    approvalStatus: r.approval_status || 'draft',
    approvalChain: r.approval_chain || [],
    customerStatus: r.customer_status || 'not_sent',
    customerResponse: parsedCustomerResponse,
    soNumber: r.so_number,
    pushedToContract: r.pushed_to_contract || false,
    pushedContractNumber: r.pushed_contract_number,
    pushedContractAt: r.pushed_contract_at,
    pushedBy: r.pushed_by,
    customerNotes: r.customer_notes,
    internalNotes: r.internal_notes,
    tradeTerms: r.trade_terms,
    pricingDefaults: r.pricing_defaults || null,
    globalDefaults: r.pricing_defaults || null,
    remarks: r.remarks,
    sentAt: r.sent_at || r.sent_to_customer_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  }
}

export function createSalesQuotationService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase
        .from('sales_quotations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll salesQuotations', error)
      return (data || []).map((row: any) => fromSalesQuotationRow(row, deps))
    },

    async getByCustomerEmail(email: string) {
      const normalizedEmail = String(email || '').trim().toLowerCase()

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        deps.throwSupabaseError('getByCustomerEmail salesQuotations session', sessionError)
      }

      const accessToken = session?.access_token
      if (accessToken) {
        const response = await fetch('/api/sales-quotations?view=customer', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        let result: any = null
        try {
          result = await response.json()
        } catch {
          result = null
        }

        if (!response.ok) {
          const message =
            String(result?.message || '').trim() ||
            `HTTP ${response.status}`
          throw new Error(message)
        }

        const rows = Array.isArray(result?.quotations) ? result.quotations : []
        return rows
          .filter((row: any) => {
            const rowEmail = String(row?.customerEmail || row?.customer_email || '').trim().toLowerCase()
            return !normalizedEmail || !rowEmail || rowEmail === normalizedEmail
          })
          .map((row: any) =>
            typeof row?.quotationNumber === 'string' || typeof row?.quotation_number === 'string'
              ? fromSalesQuotationRow(row, deps)
              : row,
          )
      }

      const { data, error } = await supabase
        .from('sales_quotations')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getByCustomerEmail salesQuotations', error)
      return (data || []).map((row: any) => fromSalesQuotationRow(row, deps))
    },

    async customerRespond(
      quotationUidOrNumber: string,
      status: 'accepted' | 'negotiating' | 'rejected',
      comment?: string,
    ) {
      const quotationKey = String(quotationUidOrNumber || '').trim()
      if (!quotationKey) {
        throw new Error('Quotation identifier is missing')
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        deps.throwSupabaseError('customerRespond salesQuotation session', sessionError)
      }

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Login session expired')
      }

      const url = `/api/sales-quotations/${encodeURIComponent(quotationKey)}/customer-response`
      const body = JSON.stringify({
        status,
        ...(comment ? { comment } : {}),
      })

      const requestInit: RequestInit = {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      }

      let response = await fetch(url, requestInit)

      if (!response.ok && [404, 405].includes(response.status)) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'X-HTTP-Method-Override': 'PATCH',
          },
          body,
        })
      }

      let result: any = null
      try {
        result = await response.json()
      } catch {
        result = null
      }

      if (!response.ok) {
        const message =
          String(result?.message || '').trim() ||
          `HTTP ${response.status}`
        throw new Error(message)
      }

      return result?.quotation ?? result
    },

    async getBySalesPerson(email: string) {
      const aliases = getPersonnelEmailAliases(email)
      if (aliases.length > 1) {
        const { data, error } = await supabase
          .from('sales_quotations')
          .select('*')
          .in('sales_person', aliases)
          .order('created_at', { ascending: false })
        if (error) deps.throwSupabaseError('getBySalesPerson salesQuotations', error)
        return (data || []).map((row: any) => fromSalesQuotationRow(row, deps))
      }

      const { data, error } = await supabase
        .from('sales_quotations')
        .select('*')
        .eq('sales_person', canonicalizePersonnelEmail(email))
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getBySalesPerson salesQuotations', error)
      return (data || []).map((row: any) => fromSalesQuotationRow(row, deps))
    },

    async getByQrNumber(qrNumber: string) {
      const { data, error } = await supabase
        .from('sales_quotations')
        .select('*')
        .eq('qr_number', qrNumber)
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getByQrNumber salesQuotations', error)
      return (data || []).map((row: any) => fromSalesQuotationRow(row, deps))
    },

    async upsert(quotation: any) {
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(quotation, {
        documentCode: 'QT',
        nodeCode: 'qt-create',
        businessData: quotation.documentDataSnapshot || quotation.document_data_snapshot || quotation,
      })
      const row = toSalesQuotationRow({ ...quotation, ...templateBinding }, deps)
      const { data, error } = await deps.upsertWithSchemaFallback(
        'sales_quotations',
        row,
        'id',
        'upsert salesQuotation',
      )
      if (error) throw (error instanceof Error ? error : deps.buildSupabaseError('upsert salesQuotation', error))
      return fromSalesQuotationRow(data, deps)
    },

    async updateStatus(idOrQtNumber: string, status: string, extra: Record<string, any> = {}) {
      const payload: Record<string, any> = {
        approval_status: status,
        updated_at: new Date().toISOString(),
      }

      if ('approval_chain' in extra) payload.approval_chain = extra.approval_chain
      if ('items' in extra) payload.items = extra.items
      if ('total_price' in extra) payload.total_price = extra.total_price
      if ('totalPrice' in extra) payload.total_price = extra.totalPrice
      if ('total_amount' in extra) payload.total_amount = extra.total_amount
      if ('totalAmount' in extra) payload.total_amount = extra.totalAmount
      if ('total_cost' in extra) payload.total_cost = extra.total_cost
      if ('totalCost' in extra) payload.total_cost = extra.totalCost
      if ('total_profit' in extra) payload.total_profit = extra.total_profit
      if ('totalProfit' in extra) payload.total_profit = extra.totalProfit
      if ('profit_rate' in extra) payload.profit_rate = deps.normalizeProfitRateForStorage(extra.profit_rate)
      if ('profitRate' in extra) payload.profit_rate = deps.normalizeProfitRateForStorage(extra.profitRate)
      if ('pricing_defaults' in extra) payload.pricing_defaults = extra.pricing_defaults
      if ('pricingDefaults' in extra) payload.pricing_defaults = extra.pricingDefaults
      if ('globalDefaults' in extra) payload.pricing_defaults = extra.globalDefaults
      if ('payment_terms' in extra) payload.payment_terms = extra.payment_terms
      if ('paymentTerms' in extra) payload.payment_terms = extra.paymentTerms
      if ('payment_mode' in extra) payload.payment_mode = extra.payment_mode
      if ('paymentMode' in extra) payload.payment_mode = extra.paymentMode
      if ('delivery_terms' in extra) payload.delivery_terms = extra.delivery_terms
      if ('deliveryTerms' in extra) payload.delivery_terms = extra.deliveryTerms
      if ('delivery_date' in extra) payload.delivery_date = extra.delivery_date
      if ('deliveryDate' in extra) payload.delivery_date = extra.deliveryDate
      if ('delivery_time' in extra) payload.delivery_time = extra.delivery_time
      if ('valid_until' in extra) payload.valid_until = extra.valid_until
      if ('validUntil' in extra) payload.valid_until = extra.validUntil
      if ('customer_status' in extra) payload.customer_status = extra.customer_status
      if ('customerStatus' in extra) payload.customer_status = extra.customerStatus
      if ('customer_response' in extra) payload.customer_response = extra.customer_response
      if ('customerResponse' in extra) {
        payload.customer_response = typeof extra.customerResponse === 'string'
          ? extra.customerResponse
          : JSON.stringify(extra.customerResponse)
      }
      if ('customer_notes' in extra) payload.customer_notes = extra.customer_notes
      if ('customerNotes' in extra) payload.customer_notes = extra.customerNotes
      if ('internal_notes' in extra) payload.internal_notes = extra.internal_notes
      if ('internalNotes' in extra) payload.internal_notes = extra.internalNotes
      if ('trade_terms' in extra) payload.trade_terms = extra.trade_terms
      if ('tradeTerms' in extra) payload.trade_terms = extra.tradeTerms
      if ('remarks' in extra) payload.remarks = extra.remarks
      if ('sent_at' in extra) payload.sent_at = extra.sent_at
      if ('sentAt' in extra) payload.sent_at = extra.sentAt
      if ('sent_to_customer' in extra) payload.sent_to_customer = extra.sent_to_customer
      if ('sentToCustomer' in extra) payload.sent_to_customer = extra.sentToCustomer
      if ('sent_to_customer_at' in extra) payload.sent_to_customer_at = extra.sent_to_customer_at
      if ('sentToCustomerAt' in extra) payload.sent_to_customer_at = extra.sentToCustomerAt
      if ('pushed_contract_number' in extra) payload.pushed_contract_number = extra.pushed_contract_number
      if ('pushedContractNumber' in extra) payload.pushed_contract_number = extra.pushedContractNumber
      if ('pushed_contract_at' in extra) payload.pushed_contract_at = extra.pushed_contract_at
      if ('pushedContractAt' in extra) payload.pushed_contract_at = extra.pushedContractAt
      if ('pushed_by' in extra) payload.pushed_by = extra.pushed_by
      if ('pushedBy' in extra) payload.pushed_by = extra.pushedBy
      if ('template_id' in extra) payload.template_id = extra.template_id
      if ('templateId' in extra) payload.template_id = extra.templateId
      if ('template_version_id' in extra) payload.template_version_id = extra.template_version_id
      if ('templateVersionId' in extra) payload.template_version_id = extra.templateVersionId
      if ('template_snapshot' in extra) payload.template_snapshot = extra.template_snapshot
      if ('templateSnapshot' in extra) payload.template_snapshot = extra.templateSnapshot
      if ('document_data_snapshot' in extra) payload.document_data_snapshot = extra.document_data_snapshot
      if ('documentDataSnapshot' in extra) payload.document_data_snapshot = extra.documentDataSnapshot
      if ('document_render_meta' in extra) payload.document_render_meta = extra.document_render_meta
      if ('documentRenderMeta' in extra) payload.document_render_meta = extra.documentRenderMeta
      const identifier = String(idOrQtNumber || '').trim()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)

      let data: any = null
      let error: any = null

      const updateByBusinessNumber = async (column: 'qt_number' | 'quotation_number') => {
        const response = await supabase
          .from('sales_quotations')
          .update(payload)
          .eq(column, identifier)
          .select()
        return response
      }

      if (isUuid) {
        let response = await supabase
          .from('sales_quotations')
          .update(payload)
          .eq('id', identifier)
          .select()

        if (!response.error && Array.isArray(response.data) && response.data.length === 0) {
          response = await updateByBusinessNumber('qt_number')
        }

        if (!response.error && Array.isArray(response.data) && response.data.length === 0) {
          response = await updateByBusinessNumber('quotation_number')
        }

        data = Array.isArray(response.data) ? response.data[0] ?? null : response.data
        error = response.error
      } else {
        let response = await updateByBusinessNumber('qt_number')

        if (!response.error && Array.isArray(response.data) && response.data.length === 0) {
          response = await updateByBusinessNumber('quotation_number')
        }

        data = Array.isArray(response.data) ? response.data[0] ?? null : response.data
        error = response.error
      }

      if (error) deps.throwSupabaseError('updateStatus salesQuotation', error)
      if (!data) {
        throw new Error(`No sales quotation matched identifier: ${identifier}`)
      }
      return fromSalesQuotationRow(data, deps)
    },

    async delete(id: string) {
      const { error } = await supabase.from('sales_quotations').delete().eq('id', id)
      if (error) deps.throwSupabaseError('delete salesQuotation', error)
      return true
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('sales_quotations_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_quotations' }, callback)
        .subscribe()
    },
  }
}
