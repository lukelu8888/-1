import { canonicalizePersonnelEmail, getPersonnelEmailAliases } from '../personnelEmail'
import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { getLocalAdminAuth } from '../internalAdminLocalAuth'
import { deriveApprovalRouting, normalizeOwnerFields, normalizeTradeTerms } from './businessFieldNormalization'
import { customerEnterpriseMemberService } from './customerEnterpriseServices'
import { customerOrganizationService } from './portalOrganizationServices'
import { auditLogService } from './auditLogService'

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
  const createdBy = deps.toUUIDOrNull(
    q.createdBy ||
    q.created_by ||
    q.authenticatedUserId ||
    q.authenticated_user_id ||
    q.actingUserId ||
    q.acting_user_id ||
    q.operatorUserId ||
    q.operator_user_id ||
    null,
  )
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
  const ownerFields = normalizeOwnerFields(q, {
    canonicalizeEmail: canonicalizePersonnelEmail,
    region: q.region,
    emailFallbacks: [q.salesPerson],
    nameFallbacks: [q.salesPersonName],
  })
  const commercialTerms = normalizeTradeTerms(q)
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
    owner_user_id: deps.toUUIDOrNull(ownerFields.owner_user_id),
    owner_email: ownerFields.owner_email,
    owner_name: ownerFields.owner_name,
    owner_role: ownerFields.owner_role,
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
    balance_trigger: q.balanceTrigger || q.balance_trigger || null,
    qt_type: q.qtType || q.qt_type || null,
    special_price_flag: Boolean(q.specialPriceFlag ?? q.special_price_flag ?? false),
    special_price_reason: q.specialPriceReason || q.special_price_reason || null,
    special_payment_terms_flag: Boolean(q.specialPaymentTermsFlag ?? q.special_payment_terms_flag ?? false),
    strategic_customer_flag: Boolean(q.strategicCustomerFlag ?? q.strategic_customer_flag ?? false),
    qt_last_approval_at: q.qtLastApprovalAt || q.qt_last_approval_at || null,
    delivery_terms: commercialTerms.delivery_terms,
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
    trade_terms: commercialTerms.trade_terms,
    pricing_defaults: q.pricingDefaults || q.pricing_defaults || q.globalDefaults || null,
    remarks: q.remarks || null,
    sent_at: q.sentAt || null,
    sent_to_customer: q.customerStatus !== 'not_sent',
    sent_to_customer_at: q.sentAt || null,
    status: q.approvalStatus || 'draft',
    created_by: createdBy,
    requested_by: ownerFields.owner_email,
    requested_by_name: q.salesPersonName || ownerFields.owner_name || null,
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || {},
    document_render_meta: q.documentRenderMeta || q.document_render_meta || {},
  }
}

function normalizeQuotationItemsForCustomerPortal(quotation: any) {
  const rawItems = Array.isArray(quotation?.items)
    ? quotation.items
    : Array.isArray(quotation?.documentDataSnapshot?.products)
      ? quotation.documentDataSnapshot.products
      : Array.isArray(quotation?.templateSnapshot?.products)
        ? quotation.templateSnapshot.products
        : []

  const normalized = rawItems
    .map((item: any, index: number) => {
      const quantity = Number(
        item?.quantity ??
        item?.qty ??
        item?.pcs ??
        item?.count ??
        0,
      )
      const productName = String(
        item?.productName ??
        item?.name ??
        item?.product_name ??
        item?.itemName ??
        item?.item_name ??
        item?.title ??
        item?.description ??
        item?.modelNo ??
        item?.model_no ??
        item?.specification ??
        item?.sku ??
        '',
      ).trim()
      const salesPrice = Number(
        item?.salesPrice ??
        item?.unitPrice ??
        item?.quotePrice ??
        item?.sales_price ??
        item?.price ??
        0,
      )
      const costPrice = Number(item?.costPrice ?? item?.cost_price ?? 0)
      return {
        id: item?.id || `${String(quotation?.qtNumber || quotation?.id || 'qt')}-${index + 1}`,
        productName: productName || `Product ${index + 1}`,
        modelNo: String(item?.modelNo ?? item?.model_no ?? '').trim(),
        specification: String(item?.specification ?? item?.spec ?? '').trim(),
        quantity,
        unit: String(item?.unit ?? item?.uom ?? 'PCS').trim() || 'PCS',
        costPrice,
        salesPrice,
        profitMargin: Number(item?.profitMargin ?? item?.profit_margin ?? 0),
        totalCost: Number(item?.totalCost ?? item?.total_cost ?? (costPrice * quantity)),
        totalPrice: Number(item?.totalPrice ?? item?.total_price ?? item?.totalAmount ?? (salesPrice * quantity)),
        currency: String(item?.currency || quotation?.currency || 'USD').trim() || 'USD',
        hsCode: String(item?.hsCode ?? item?.hs_code ?? '').trim(),
        remarks: String(item?.remarks ?? '').trim(),
      }
    })
    .filter((item: any) => item.quantity > 0 || item.salesPrice > 0 || item.totalPrice > 0)

  if (normalized.length > 0) {
    return normalized
  }

  const fallbackTotalPrice = Number(
    quotation?.totalPrice ??
    quotation?.total_price ??
    quotation?.totalAmount ??
    quotation?.total_amount ??
    0,
  )
  const fallbackTotalCost = Number(quotation?.totalCost ?? quotation?.total_cost ?? 0)
  if (fallbackTotalPrice > 0) {
    return [
      {
        id: `${String(quotation?.qtNumber || quotation?.id || 'qt')}-1`,
        productName: String(
          quotation?.productName ??
          quotation?.documentDataSnapshot?.productName ??
          quotation?.templateSnapshot?.productName ??
          'Product 1',
        ).trim() || 'Product 1',
        modelNo: '',
        specification: '',
        quantity: 1,
        unit: 'PCS',
        costPrice: fallbackTotalCost,
        salesPrice: fallbackTotalPrice,
        profitMargin: Number(quotation?.profitRate ?? quotation?.profit_rate ?? 0),
        totalCost: fallbackTotalCost,
        totalPrice: fallbackTotalPrice,
        currency: String(quotation?.currency || 'USD').trim() || 'USD',
        hsCode: '',
        remarks: '',
      },
    ]
  }

  return []
}

async function readApiErrorPayload(response: Response) {
  const rawText = await response.text().catch(() => '')
  let parsed: any = null
  try {
    parsed = rawText ? JSON.parse(rawText) : null
  } catch {
    parsed = null
  }

  const validationErrors = parsed?.errors && typeof parsed.errors === 'object'
    ? Object.entries(parsed.errors)
        .flatMap(([field, messages]) => {
          const list = Array.isArray(messages) ? messages : [messages]
          return list
            .map((message) => String(message || '').trim())
            .filter(Boolean)
            .map((message) => `${field}: ${message}`)
        })
    : []

  const message =
    String(parsed?.message || '').trim() ||
    validationErrors.join(' | ') ||
    rawText.trim() ||
    `HTTP ${response.status}`

  return {
    rawText,
    parsed,
    message,
  }
}

function fromSalesQuotationRow(r: any, deps: DependencyBag) {
  if (!r) return null
  const commercialTerms = normalizeTradeTerms(r)
  const approvalRouting = deriveApprovalRouting(r)
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
  const legacyCustomerStatus = String(
    r.customer_status ??
    r.customerStatus ??
    parsedCustomerResponse?.status ??
    '',
  ).trim().toLowerCase()
  const hasLegacySentFlag = Boolean(
    r.sent_to_customer ||
    r.sent_to_customer_at ||
    r.sent_at ||
    r.sentToCustomerAt ||
    r.sentAt,
  )
  const staleCustomerStatuses = new Set([
    'draft',
    'not_sent',
    'pending',
    'submitted',
    'pending_approval',
  ])
  const customerStatus =
    legacyCustomerStatus && !(hasLegacySentFlag && staleCustomerStatuses.has(legacyCustomerStatus))
      ? legacyCustomerStatus
      : hasLegacySentFlag
        ? 'sent'
        : legacyCustomerStatus || 'not_sent'
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
    balanceTrigger: r.balance_trigger || null,
    qtType: r.qt_type || null,
    specialPriceFlag: Boolean(r.special_price_flag),
    specialPriceReason: r.special_price_reason || null,
    specialPaymentTermsFlag: Boolean(r.special_payment_terms_flag),
    strategicCustomerFlag: Boolean(r.strategic_customer_flag),
    qtLastApprovalAt: r.qt_last_approval_at || null,
    deliveryTerms: commercialTerms.delivery_terms,
    deliveryDate: r.delivery_date || r.delivery_time,
    validUntil: r.valid_until || r.validity_period,
    version: r.version || 1,
    previousVersion: r.previous_version,
    approvalStatus: r.approval_status || 'draft',
    approvalChain: r.approval_chain || [],
    currentApprovalStep: approvalRouting.currentApprovalStep,
    currentApproverRole: approvalRouting.currentApproverRole,
    requiresDirectorApproval: approvalRouting.requiresDirectorApproval,
    customerStatus,
    customerResponse: parsedCustomerResponse,
    soNumber: r.so_number,
    pushedToContract: r.pushed_to_contract || false,
    pushedContractNumber: r.pushed_contract_number,
    pushedContractAt: r.pushed_contract_at,
    pushedBy: r.pushed_by,
    customerNotes: r.customer_notes,
    internalNotes: r.internal_notes,
    tradeTerms: commercialTerms.trade_terms,
    incoterm: commercialTerms.incoterm,
    pricingDefaults: r.pricing_defaults || null,
    globalDefaults: r.pricing_defaults || null,
    remarks: r.remarks,
    sentAt: r.sent_at || r.sent_to_customer_at || r.sentAt || r.sentToCustomerAt || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdBy: r.created_by || null,
  }
}

export function createSalesQuotationService(deps: DependencyBag) {
  return {
    async upsertViaServer(quotation: any) {
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

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/push-sales-quotation`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            quotation,
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
        throw new Error(String(payload?.message || '服务端保存 QT 失败'))
      }

      return fromSalesQuotationRow(payload?.quotation, deps)
    },

    async listViaServer(options: { ownerEmail?: string; qtNumber?: string } = {}) {
      const normalizedOwnerEmail = canonicalizePersonnelEmail(options.ownerEmail || '') || String(options.ownerEmail || '').trim().toLowerCase();
      const qtNumber = String(options.qtNumber || '').trim();
      const localAdminAuth = getLocalAdminAuth();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const query = new URLSearchParams();
      if (normalizedOwnerEmail) query.set('ownerEmail', normalizedOwnerEmail);
      if (qtNumber) query.set('qtNumber', qtNumber);
      if (localAdminAuth.enabled && localAdminAuth.email && localAdminAuth.password) {
        query.set('localAdminAuth', '1');
        query.set('localAdminEmail', localAdminAuth.email);
        query.set('localAdminPassword', localAdminAuth.password);
      }

      const headers: Record<string, string> = {
        apikey: supabaseAnonKey,
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/list-sales-quotations?${query.toString()}`,
        { headers },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(String(payload?.message || '服务端读取 QT 列表失败'));
      }

      const rows = Array.isArray(payload?.quotations) ? payload.quotations : [];
      return rows.map((row: any) => fromSalesQuotationRow(row, deps));
    },

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
      const relatedEmails = new Set<string>(normalizedEmail ? [normalizedEmail] : [])
      const relatedCompanies = new Set<string>()

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        deps.throwSupabaseError('getByCustomerEmail salesQuotations session', sessionError)
      }

      try {
        const enterpriseAuthUserId = await customerEnterpriseMemberService.resolveEnterpriseAuthUserIdForUser(
          String(session?.user?.id || '').trim(),
          normalizedEmail,
        )
        if (enterpriseAuthUserId) {
          const [members, organization] = await Promise.all([
            customerEnterpriseMemberService.listByEnterpriseAuthUser(enterpriseAuthUserId).catch(() => []),
            customerOrganizationService.getByAuthUser(enterpriseAuthUserId).catch(() => null),
          ])

          ;(Array.isArray(members) ? members : []).forEach((member: any) => {
            const loginEmail = String(member?.loginEmail || '').trim().toLowerCase()
            const businessEmail = String(member?.businessEmail || '').trim().toLowerCase()
            if (loginEmail) relatedEmails.add(loginEmail)
            if (businessEmail) relatedEmails.add(businessEmail)
          })

          const orgEmail = String(organization?.email || '').trim().toLowerCase()
          const orgCompany = String(organization?.companyName || '').trim()
          if (orgEmail) relatedEmails.add(orgEmail)
          if (orgCompany) relatedCompanies.add(orgCompany)
        }
      } catch {
        // 企业主数据查找失败时保持基础邮箱匹配，不阻塞客户看单。
      }

      const matchesCustomerScope = (row: any) => {
        const rowEmail = String(row?.customerEmail || row?.customer_email || '').trim().toLowerCase()
        const rowCompany = String(row?.customerCompany || row?.customer_company || '').trim()
        if (!normalizedEmail && relatedEmails.size === 0 && relatedCompanies.size === 0) return true
        return (
          (!!rowEmail && relatedEmails.has(rowEmail)) ||
          (!!rowCompany && relatedCompanies.has(rowCompany))
        )
      }

      const accessToken = session?.access_token
      if (accessToken) {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        }

        const edgeResponse = await fetch(
          `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-sales-quotations?email=${encodeURIComponent(normalizedEmail)}`,
          { headers },
        )

        let edgeResult: any = null
        try {
          edgeResult = await edgeResponse.json()
        } catch {
          edgeResult = null
        }

        if (edgeResponse.ok) {
          const edgeRows = Array.isArray(edgeResult?.quotations) ? edgeResult.quotations : []
          const matchedRows = edgeRows
            .map((row: any) =>
              row?.qt_number ||
              row?.quotation_number ||
              row?.customer_status ||
              row?.total_amount !== undefined ||
              row?.created_at
                ? fromSalesQuotationRow(row, deps)
                : row,
            )
          if (matchedRows.length > 0) return matchedRows
        }

        const response = await fetch('/api/sales-quotations?view=customer', {
          headers,
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
        const matchedRows = rows
          .filter((row: any) => matchesCustomerScope(row))
          .map((row: any) =>
            row?.qt_number ||
            row?.quotation_number ||
            row?.customer_status ||
            row?.total_amount !== undefined ||
            row?.created_at
              ? fromSalesQuotationRow(row, deps)
              : row,
          )
        if (matchedRows.length > 0) return matchedRows
      }

      const merged = new Map<string, any>()
      const bindRows = (rows: any[]) => {
        ;(rows || []).forEach((row: any) => {
          const normalized = fromSalesQuotationRow(row, deps)
          const key = String(normalized?.id || normalized?.qtNumber || row?.id || row?.qt_number || '').trim()
          if (key) merged.set(key, normalized)
        })
      }

      if (relatedEmails.size > 0) {
        const { data, error } = await supabase
          .from('sales_quotations')
          .select('*')
          .in('customer_email', Array.from(relatedEmails))
          .order('created_at', { ascending: false })
        if (error) deps.throwSupabaseError('getByCustomerEmail salesQuotations', error)
        bindRows(data || [])
      }

      if (relatedCompanies.size > 0) {
        for (const companyName of relatedCompanies) {
          const { data, error } = await supabase
            .from('sales_quotations')
            .select('*')
            .eq('customer_company', companyName)
            .order('created_at', { ascending: false })
          if (error) deps.throwSupabaseError('getByCustomerEmail salesQuotations company', error)
          bindRows(data || [])
        }
      }

      return Array.from(merged.values())
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      }

      if (supabaseAnonKey) {
        headers.apikey = supabaseAnonKey
      }

      const edgeResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-sales-quotations/respond`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            quotationKey,
            status,
            ...(comment ? { comment } : {}),
          }),
        },
      )

      let edgeResult: any = null
      try {
        edgeResult = await edgeResponse.json()
      } catch {
        edgeResult = null
      }

      if (edgeResponse.ok) {
        return edgeResult?.quotation ? fromSalesQuotationRow(edgeResult.quotation, deps) : edgeResult
      }

      const url = `/api/sales-quotations/${encodeURIComponent(quotationKey)}/customer-response`
      const body = JSON.stringify({
        status,
        ...(comment ? { comment } : {}),
      })

      const requestInit: RequestInit = {
        method: 'PATCH',
        headers,
        body,
      }

      let response = await fetch(url, requestInit)

      if (!response.ok && [404, 405].includes(response.status)) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            ...headers,
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
          String(edgeResult?.message || '').trim() ||
          String(result?.message || '').trim() ||
          `HTTP ${response.status}`
        throw new Error(message)
      }

      return result?.quotation ?? result
    },

    async syncAndSendToCustomerApi(
      quotation: any,
      options: { force?: boolean } = {},
    ) {
      const quotationKey = String(
        quotation?.qtNumber ||
        quotation?.qt_number ||
        quotation?.quotationNumber ||
        quotation?.quotation_number ||
        quotation?.id ||
        '',
      ).trim()
      if (!quotationKey) {
        throw new Error('Quotation identifier is missing')
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        deps.throwSupabaseError('syncAndSendToCustomerApi salesQuotation session', sessionError)
      }

      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('Login session expired')
      }

      const normalizedItems = normalizeQuotationItemsForCustomerPortal(quotation)

      if (normalizedItems.length === 0) {
        throw new Error('Quotation items are missing')
      }

      const upsertBody = {
        qrNumber: String(quotation?.qrNumber || quotation?.qr_number || '').trim(),
        qtNumber: quotationKey,
        inqNumber: String(quotation?.inqNumber || quotation?.inq_number || quotation?.inquiryNumber || '').trim(),
        region: String(quotation?.region || '').trim() || null,
        customerCompany: String(quotation?.customerCompany || quotation?.customer_company || quotation?.customerName || quotation?.customer_name || '').trim(),
        customerName: String(quotation?.customerName || quotation?.customer_name || quotation?.customerCompany || quotation?.customer_company || '').trim(),
        customerEmail: String(quotation?.customerEmail || quotation?.customer_email || '').trim().toLowerCase(),
        customerPhone: String(quotation?.customerPhone || quotation?.customer_phone || '').trim(),
        customerAddress: String(quotation?.customerAddress || quotation?.customer_address || '').trim(),
        items: normalizedItems,
        totalCost: Number(quotation?.totalCost ?? quotation?.total_cost ?? 0),
        totalPrice: Number(quotation?.totalPrice ?? quotation?.total_price ?? quotation?.totalAmount ?? quotation?.total_amount ?? 0),
        totalProfit: Number(quotation?.totalProfit ?? quotation?.total_profit ?? 0),
        profitRate: Number(quotation?.profitRate ?? quotation?.profit_rate ?? 0),
        currency: String(quotation?.currency || 'USD').trim() || 'USD',
        paymentTerms: quotation?.paymentTerms || quotation?.payment_terms || '',
        deliveryTerms: quotation?.deliveryTerms || quotation?.delivery_terms || '',
        deliveryDate: quotation?.deliveryDate || quotation?.delivery_date || null,
        validUntil: quotation?.validUntil || quotation?.valid_until || null,
        notes: quotation?.notes || quotation?.internalNotes || quotation?.internal_notes || '',
      }

      const upsertResponse = await fetch('/api/sales-quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(upsertBody),
      })
      if (!upsertResponse.ok) {
        const errorPayload = await readApiErrorPayload(upsertResponse)
        console.error('❌ [salesQuotationService] sync quotation failed', {
          status: upsertResponse.status,
          statusText: upsertResponse.statusText,
          body: errorPayload.rawText,
          parsed: errorPayload.parsed,
          upsertBody,
        })
        throw new Error(String(errorPayload.message || 'Failed to sync quotation to customer portal'))
      }
      const upsertPayload = await upsertResponse.json().catch(() => ({}))

      const sendResponse = await fetch(
        `/api/sales-quotations/${encodeURIComponent(quotationKey)}/send-to-customer`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ force: Boolean(options.force) }),
        },
      )
      if (!sendResponse.ok) {
        const errorPayload = await readApiErrorPayload(sendResponse)
        console.error('❌ [salesQuotationService] send quotation failed', {
          status: sendResponse.status,
          statusText: sendResponse.statusText,
          body: errorPayload.rawText,
          parsed: errorPayload.parsed,
          quotationKey,
        })
        throw new Error(String(errorPayload.message || 'Failed to send quotation to customer'))
      }
      const sendPayload = await sendResponse.json().catch(() => ({}))

      return sendPayload?.quotation ?? sendPayload
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
      const quotationId = deps.toUUID(quotation.id)
      const { data: beforeRow } = await supabase
        .from('sales_quotations')
        .select('*')
        .eq('id', quotationId)
        .maybeSingle()
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
      await auditLogService.logEntityChange({
        entityType: 'sales_quotation',
        entityId: data?.id || quotationId,
        action: beforeRow ? 'update' : 'create',
        before: beforeRow,
        after: data,
        actor: {
          actorId: quotation.authenticatedUserId || quotation.authenticated_user_id || quotation.actingUserId || quotation.acting_user_id || quotation.operatorUserId || quotation.operator_user_id || quotation.createdBy || quotation.created_by || null,
          actorEmail: quotation.authenticatedUserEmail || quotation.authenticated_user_email || quotation.actingUserEmail || quotation.acting_user_email || quotation.operatorEmail || quotation.operator_email || quotation.salesPerson || quotation.sales_person || null,
          actorRole: quotation.authenticatedUserRole || quotation.authenticated_user_role || quotation.actingUserRole || quotation.acting_user_role || quotation.operatorRole || quotation.operator_role || quotation.ownerRole || quotation.owner_role || null,
        },
      })
      return fromSalesQuotationRow(data, deps)
    },

    async updateStatus(idOrQtNumber: string, status: string, extra: Record<string, any> = {}) {
      const identifier = String(idOrQtNumber || '').trim()
      const beforeFetch = async () => {
        const base = supabase.from('sales_quotations').select('*')
        const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
        if (isUuidLike) {
          const byId = await base.eq('id', identifier).maybeSingle()
          if (byId.data) return byId.data
        }
        const byQt = await supabase.from('sales_quotations').select('*').eq('qt_number', identifier).maybeSingle()
        if (byQt.data) return byQt.data
        const byQuotation = await supabase.from('sales_quotations').select('*').eq('quotation_number', identifier).maybeSingle()
        return byQuotation.data || null
      }
      const beforeRow = await beforeFetch()
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
      if ('balanceTrigger' in extra) payload.balance_trigger = extra.balanceTrigger
      if ('delivery_terms' in extra || 'deliveryTerms' in extra || 'incoterm' in extra || 'incoterms' in extra) {
        payload.delivery_terms = normalizeTradeTerms(extra).delivery_terms
      }
      if ('delivery_date' in extra) payload.delivery_date = extra.delivery_date
      if ('deliveryDate' in extra) payload.delivery_date = extra.deliveryDate
      if ('delivery_time' in extra) payload.delivery_time = extra.delivery_time
      if ('valid_until' in extra) payload.valid_until = extra.valid_until
      if ('validUntil' in extra) payload.valid_until = extra.validUntil
      if ('customer_email' in extra) payload.customer_email = String(extra.customer_email || '').trim().toLowerCase()
      if ('customerEmail' in extra) payload.customer_email = String(extra.customerEmail || '').trim().toLowerCase()
      if ('customer_name' in extra) payload.customer_name = extra.customer_name
      if ('customerName' in extra) payload.customer_name = extra.customerName
      if ('customer_company' in extra) payload.customer_company = extra.customer_company
      if ('customerCompany' in extra) payload.customer_company = extra.customerCompany
      if ('inq_number' in extra) {
        const inqNumber = String(extra.inq_number || '').trim()
        payload.inq_number = inqNumber || null
        payload.inquiry_number = inqNumber || null
      }
      if ('inqNumber' in extra) {
        const inqNumber = String(extra.inqNumber || '').trim()
        payload.inq_number = inqNumber || null
        payload.inquiry_number = inqNumber || null
      }
      if ('inquiry_number' in extra) {
        const inquiryNumber = String(extra.inquiry_number || '').trim()
        payload.inq_number = inquiryNumber || null
        payload.inquiry_number = inquiryNumber || null
      }
      if ('inquiryNumber' in extra) {
        const inquiryNumber = String(extra.inquiryNumber || '').trim()
        payload.inq_number = inquiryNumber || null
        payload.inquiry_number = inquiryNumber || null
      }
      if ('region' in extra) payload.region = extra.region
      if ('sales_person' in extra) payload.sales_person = canonicalizePersonnelEmail(extra.sales_person, extra.region) || null
      if ('salesPerson' in extra) payload.sales_person = canonicalizePersonnelEmail(extra.salesPerson, extra.region) || null
      if ('sales_person_name' in extra) payload.sales_person_name = extra.sales_person_name || null
      if ('salesPersonName' in extra) payload.sales_person_name = extra.salesPersonName || null
      if ('owner_user_id' in extra) payload.owner_user_id = deps.toUUIDOrNull(extra.owner_user_id)
      if ('ownerUserId' in extra) payload.owner_user_id = deps.toUUIDOrNull(extra.ownerUserId)
      if ('owner_email' in extra) payload.owner_email = canonicalizePersonnelEmail(extra.owner_email, extra.region) || null
      if ('ownerEmail' in extra) payload.owner_email = canonicalizePersonnelEmail(extra.ownerEmail, extra.region) || null
      if ('owner_name' in extra) payload.owner_name = extra.owner_name || null
      if ('ownerName' in extra) payload.owner_name = extra.ownerName || null
      if ('owner_role' in extra) payload.owner_role = extra.owner_role || null
      if ('ownerRole' in extra) payload.owner_role = extra.ownerRole || null
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
      if ('trade_terms' in extra || 'tradeTerms' in extra || 'incoterm' in extra || 'incoterms' in extra) {
        payload.trade_terms = normalizeTradeTerms(extra).trade_terms
      }
      if ('remarks' in extra) payload.remarks = extra.remarks
      if ('sent_at' in extra) payload.sent_at = extra.sent_at
      if ('sentAt' in extra) payload.sent_at = extra.sentAt
      if ('sent_to_customer' in extra) payload.sent_to_customer = extra.sent_to_customer
      if ('sentToCustomer' in extra) payload.sent_to_customer = extra.sentToCustomer
      if ('sent_to_customer_at' in extra) payload.sent_to_customer_at = extra.sent_to_customer_at
      if ('sentToCustomerAt' in extra) payload.sent_to_customer_at = extra.sentToCustomerAt
      if ('pushed_to_contract' in extra) payload.pushed_to_contract = Boolean(extra.pushed_to_contract)
      if ('pushedToContract' in extra) payload.pushed_to_contract = Boolean(extra.pushedToContract)
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)

      let data: any = null
      let error: any = null

      const extraBusinessIdentifier = String(
        extra.qtNumber ||
        extra.qt_number ||
        extra.quotationNumber ||
        extra.quotation_number ||
        extra.documentDataSnapshot?.quotationNo ||
        extra.document_data_snapshot?.quotationNo ||
        '',
      ).trim()

      const updateByBusinessNumber = async (column: 'qt_number' | 'quotation_number', matchValue = identifier) => {
        const response = await supabase
          .from('sales_quotations')
          .update(payload)
          .eq(column, matchValue)
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

        if (!response.error && Array.isArray(response.data) && response.data.length === 0 && extraBusinessIdentifier) {
          response = await updateByBusinessNumber('qt_number', extraBusinessIdentifier)
        }

        if (!response.error && Array.isArray(response.data) && response.data.length === 0 && extraBusinessIdentifier) {
          response = await updateByBusinessNumber('quotation_number', extraBusinessIdentifier)
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
      await auditLogService.logEntityChange({
        entityType: 'sales_quotation',
        entityId: data?.id || beforeRow?.id || identifier,
        action: ['approved', 'customer_confirmed'].includes(String(status)) ? 'approve' : ['rejected', 'customer_rejected'].includes(String(status)) ? 'reject' : 'update',
        before: beforeRow,
        after: data,
        actor: {
          actorId: extra.authenticatedUserId || extra.authenticated_user_id || extra.actingUserId || extra.acting_user_id || extra.operatorUserId || extra.operator_user_id || null,
          actorEmail: extra.authenticatedUserEmail || extra.authenticated_user_email || extra.actingUserEmail || extra.acting_user_email || extra.operatorEmail || extra.operator_email || extra.approverEmail || null,
          actorRole: extra.authenticatedUserRole || extra.authenticated_user_role || extra.actingUserRole || extra.acting_user_role || extra.operatorRole || extra.operator_role || null,
        },
      })
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
