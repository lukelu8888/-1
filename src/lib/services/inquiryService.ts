import { canonicalizePersonnelEmail } from '../personnelEmail'
import { isCurrentLocalDevHost } from '../localDevHost'
import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { internalInquiryAccessService } from './internalInquiryAccessService'

type InquiryServiceDeps = {
  throwSupabaseError: (context: string, error: any) => never
  withSupabaseTimeout: <T>(task: Promise<T>, timeoutMs: number, message: string) => Promise<T>
  resolveBusinessDocumentTemplateBinding: (input: any, options: {
    documentCode: string
    nodeCode: string
    businessData: Record<string, any>
  }) => Promise<any>
  applyKnownMissingColumns: (table: string, payload: Record<string, any>, removedColumns: string[]) => void
  rememberMissingColumn: (table: string, column: string) => void
  hasKnownMissingColumn: (table: string, column: string) => boolean
  isMissingColumnError: (error: any, column: string) => boolean
  extractMissingColumn: (error: any) => string | null
  enrichInquiryRowsWithTemplateData: (rows: any[] | null | undefined) => Promise<any[]>
  enrichInquiryRowWithTemplateData: (row: any) => Promise<any>
  insertInquiryWithServerAssignedNumber: (payload: Record<string, any>, context: string) => Promise<any>
  isTransientSupabaseRequestError: (error: any) => boolean
  updateInquiryRowViaRest: (id: string, payload: Record<string, any>, context: string) => Promise<any | null>
  toRegionCode: (region: string | null | undefined) => string | null
  toUUIDOrNull: (id: string | null | undefined) => string | null
  sanitizePersistedInquiryProducts: (products?: any[]) => any[]
  isUuidLike: (value: string | null | undefined) => boolean
}

function shouldSkipInquiryTemplateBindingInLocalProxy() {
  return isCurrentLocalDevHost()
}

function toInquiryRow(i: any, deps: Pick<InquiryServiceDeps, 'toRegionCode' | 'toUUIDOrNull' | 'sanitizePersistedInquiryProducts'>) {
  const toIso = (v: any) => {
    if (!v) return new Date().toISOString()
    if (typeof v === 'number') return new Date(v).toISOString()
    return String(v)
  }
  const regionCode = deps.toRegionCode(i.region)
  const id = (i.id && i.id.startsWith('ING-')) ? crypto.randomUUID() : (i.id || crypto.randomUUID())
  const documentRenderMeta = {
    ...(i.documentRenderMeta || i.document_render_meta || {}),
    oemModule: i.oem || i.documentRenderMeta?.oemModule || i.document_render_meta?.oemModule || null,
  }
  return {
    id,
    inquiry_number: i.inquiryNumber || i.inquiry_number || null,
    date: toIsoDate(i.date),
    user_email: i.userEmail || '',
    buyer_name: i.buyerInfo?.contactPerson || i.buyer_name || null,
    buyer_company: i.buyerInfo?.companyName || i.buyer_company || null,
    buyer_country: i.buyerInfo?.country || i.buyer_country || null,
    company_id: i.companyId || null,
    region_code: regionCode,
    status: i.status || 'draft',
    is_submitted: i.isSubmitted || false,
    total_price: i.totalPrice || 0,
    notes: i.message || i.notes || null,
    assigned_to: i.assignedTo || i.salesRepEmail || i.assigned_to || null,
    owner_user_id: deps.toUUIDOrNull(i.ownerUserId || i.owner_user_id || null),
    owner_email: canonicalizePersonnelEmail(i.ownerEmail || i.owner_email || i.salesRepEmail || i.assignedTo || '', i.region || i.region_code) || null,
    owner_name: i.ownerName || i.owner_name || null,
    owner_role: i.ownerRole || i.owner_role || null,
    message: i.message || null,
    buyer_info: i.buyerInfo || null,
    shipping_info: i.shippingInfo || null,
    container_info: i.containerInfo || null,
    products: deps.sanitizePersistedInquiryProducts(i.products || []),
    created_at: toIso(i.createdAt),
    submitted_at: i.submittedAt ? toIso(i.submittedAt) : null,
    template_id: i.templateId || i.template_id || null,
    template_version_id: i.templateVersionId || i.template_version_id || null,
    template_snapshot: i.templateSnapshot || i.template_snapshot || {},
    document_data_snapshot: i.documentDataSnapshot || i.document_data_snapshot || {},
    document_render_meta: documentRenderMeta,
  }
}

export function mapInquiryRowToInquiry(r: any, deps: Pick<InquiryServiceDeps, 'isUuidLike'>) {
  if (!r) return null
  const oem = r.document_render_meta?.oemModule || r.document_data_snapshot?.oem || null
  const snapshotInquiryNo = String(r.document_data_snapshot?.inquiryNo || '').trim()
  const persistedInquiryNumber = String(r.inquiry_number || '').trim()
  const resolvedInquiryNumber =
    ((persistedInquiryNumber && !deps.isUuidLike(persistedInquiryNumber)) ? persistedInquiryNumber : '') ||
    ((snapshotInquiryNo && snapshotInquiryNo !== 'ING-DRAFT' && !deps.isUuidLike(snapshotInquiryNo)) ? snapshotInquiryNo : '')
  const resolvedDocumentDataSnapshot = r.document_data_snapshot && typeof r.document_data_snapshot === 'object'
    ? {
        ...r.document_data_snapshot,
        inquiryNo: resolvedInquiryNumber || r.document_data_snapshot?.inquiryNo || 'ING-DRAFT',
      }
    : r.document_data_snapshot || {}
  const snapshotRequirements = resolvedDocumentDataSnapshot?.requirements && typeof resolvedDocumentDataSnapshot.requirements === 'object'
    ? resolvedDocumentDataSnapshot.requirements
    : {}
  return {
    id: r.id,
    inquiryNumber: resolvedInquiryNumber || null,
    date: r.date,
    userEmail: r.user_email,
    buyerName: r.buyer_name,
    buyerCompany: r.buyer_company,
    buyerCountry: r.buyer_country,
    companyId: r.company_id,
    region: r.region_code,
    status: r.status || 'draft',
    isSubmitted: r.is_submitted || false,
    totalPrice: r.total_price || 0,
    message: r.message || r.notes,
    buyerInfo: r.buyer_info || {
      contactPerson: r.buyer_name || '',
      companyName: r.buyer_company || '',
      country: r.buyer_country || '',
      email: r.user_email || '',
    },
    shippingInfo: r.shipping_info || { cartons: '0', cbm: '0', totalGrossWeight: '0', totalNetWeight: '0' },
    requirements: {
      incoterm: snapshotRequirements.incoterm || '',
      locationLabel: snapshotRequirements.locationLabel || '',
      locationValue: snapshotRequirements.locationValue || '',
      finalDestinationPlan: snapshotRequirements.finalDestinationPlan || '',
      deliveryTime: snapshotRequirements.deliveryTime || '',
      portOfDestination: snapshotRequirements.portOfDestination || '',
      paymentTerms: snapshotRequirements.paymentTerms || '',
      tradeTerms: snapshotRequirements.tradeTerms || '',
      paymentMode: snapshotRequirements.paymentMode || '',
      balanceTrigger: snapshotRequirements.balanceTrigger || '',
      documentReleasePreference: snapshotRequirements.documentReleasePreference || '',
      lcType: snapshotRequirements.lcType || '',
      creditDays: snapshotRequirements.creditDays || '',
      businessScenario: snapshotRequirements.businessScenario || '',
      businessScenarioNotes: snapshotRequirements.businessScenarioNotes || '',
      insuranceRequirement: snapshotRequirements.insuranceRequirement || '',
      packingRequirements: snapshotRequirements.packingRequirements || '',
      certifications: snapshotRequirements.certifications || [],
      otherRequirements: snapshotRequirements.otherRequirements || '',
    },
    containerInfo: r.container_info,
    products: r.products || [],
    oem: oem || undefined,
    assignedTo: r.assigned_to || null,
    salesRepEmail: canonicalizePersonnelEmail(r.owner_email || r.assigned_to || '', r.region_code) || null,
    ownerUserId: r.owner_user_id || null,
    ownerEmail: canonicalizePersonnelEmail(r.owner_email || r.assigned_to || '', r.region_code) || null,
    ownerName: r.owner_name || null,
    ownerRole: r.owner_role || null,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: resolvedDocumentDataSnapshot,
    documentRenderMeta: r.document_render_meta || {},
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
  }
}

function fromInquiryRow(r: any, deps: Pick<InquiryServiceDeps, 'isUuidLike'>) {
  return mapInquiryRowToInquiry(r, deps)
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/')
    return `${y}-${m}-${d}`
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0]
  return String(v)
}

export function createInquiryService(deps: InquiryServiceDeps) {
  return {
    async loadAllSortedRows() {
      if (deps.hasKnownMissingColumn('inquiries', 'created_at')) {
        const { data, error } = await supabase.from('inquiries').select('*')
        if (error) deps.throwSupabaseError('loadAllSortedRows inquiries fallback', error)
        return data || []
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (deps.isMissingColumnError(error, 'created_at')) {
          deps.rememberMissingColumn('inquiries', 'created_at')
          const { data: fallbackRows, error: fallbackError } = await supabase.from('inquiries').select('*')
          if (fallbackError) deps.throwSupabaseError('loadAllSortedRows inquiries fallback', fallbackError)
          return fallbackRows || []
        }
        deps.throwSupabaseError('loadAllSortedRows inquiries', error)
      }
      return data || []
    },

    async getAll() {
      const rows = await this.loadAllSortedRows()
      return (await deps.enrichInquiryRowsWithTemplateData(rows)).map((row: any) => fromInquiryRow(row, deps))
    },

    async getInternalVisible() {
      const rows = await internalInquiryAccessService.listVisible()
      return (await deps.enrichInquiryRowsWithTemplateData(rows)).map((row: any) => fromInquiryRow(row, deps))
    },

    async getSubmitted() {
      const rows = await this.loadAllSortedRows()
      return (await deps.enrichInquiryRowsWithTemplateData(rows))
        .filter((row: any) => row?.is_submitted === true)
        .map((row: any) => fromInquiryRow(row, deps))
    },

    async getByUserEmail(email: string) {
      const normalizedEmail = String(email || '').trim().toLowerCase()
      if (!normalizedEmail) return []

      const filterRows = async (rows: any[]) => (await deps.enrichInquiryRowsWithTemplateData(rows))
        .filter((row: any) => {
          const inquiry = fromInquiryRow(row, deps)
          const rowUserEmail = String(row?.user_email || '').trim().toLowerCase()
          const buyerEmail = String(inquiry?.buyerInfo?.email || '').trim().toLowerCase()
          return rowUserEmail === normalizedEmail || buyerEmail === normalizedEmail
        })
        .map((row: any) => fromInquiryRow(row, deps))

      if (deps.hasKnownMissingColumn('inquiries', 'user_email')) {
        const rows = await this.loadAllSortedRows()
        return filterRows(rows)
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })

      if (error) {
        if (deps.isMissingColumnError(error, 'user_email') || deps.isMissingColumnError(error, 'created_at')) {
          if (deps.isMissingColumnError(error, 'user_email')) deps.rememberMissingColumn('inquiries', 'user_email')
          if (deps.isMissingColumnError(error, 'created_at')) deps.rememberMissingColumn('inquiries', 'created_at')
          const rows = await this.loadAllSortedRows()
          return filterRows(rows)
        }
        deps.throwSupabaseError('getByUserEmail inquiries', error)
      }

      return (await deps.enrichInquiryRowsWithTemplateData(data || [])).map((row: any) => fromInquiryRow(row, deps))
    },

    async getByCompanyId(companyId: string) {
      const normalizedCompanyId = String(companyId || '').trim()
      if (!normalizedCompanyId) return []

      const filterRows = async (rows: any[]) => (await deps.enrichInquiryRowsWithTemplateData(rows))
        .filter((row: any) => String(row?.company_id || '').trim() === normalizedCompanyId)
        .map((row: any) => fromInquiryRow(row, deps))

      if (deps.hasKnownMissingColumn('inquiries', 'company_id')) {
        const rows = await this.loadAllSortedRows()
        return filterRows(rows)
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) {
        if (deps.isMissingColumnError(error, 'company_id') || deps.isMissingColumnError(error, 'created_at')) {
          if (deps.isMissingColumnError(error, 'company_id')) deps.rememberMissingColumn('inquiries', 'company_id')
          if (deps.isMissingColumnError(error, 'created_at')) deps.rememberMissingColumn('inquiries', 'created_at')
          const rows = await this.loadAllSortedRows()
          return filterRows(rows)
        }
        deps.throwSupabaseError('getByCompanyId inquiries', error)
      }

      return (await deps.enrichInquiryRowsWithTemplateData(data || [])).map((row: any) => fromInquiryRow(row, deps))
    },

    async getByBuyerCompany(companyName: string) {
      const normalizedName = String(companyName || '').trim()
      if (!normalizedName) return []

      const filterRows = async (rows: any[]) => (await deps.enrichInquiryRowsWithTemplateData(rows))
        .filter((row: any) => {
          const inquiry = fromInquiryRow(row, deps)
          return String(row?.buyer_company || inquiry?.buyerInfo?.companyName || '').trim() === normalizedName
        })
        .map((row: any) => fromInquiryRow(row, deps))

      if (deps.hasKnownMissingColumn('inquiries', 'buyer_company')) {
        const rows = await this.loadAllSortedRows()
        return filterRows(rows)
      }

      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('buyer_company', normalizedName)
        .order('created_at', { ascending: false })

      if (error) {
        if (deps.isMissingColumnError(error, 'buyer_company') || deps.isMissingColumnError(error, 'created_at')) {
          if (deps.isMissingColumnError(error, 'buyer_company')) deps.rememberMissingColumn('inquiries', 'buyer_company')
          if (deps.isMissingColumnError(error, 'created_at')) deps.rememberMissingColumn('inquiries', 'created_at')
          const rows = await this.loadAllSortedRows()
          return filterRows(rows)
        }
        deps.throwSupabaseError('getByBuyerCompany inquiries', error)
      }

      return (await deps.enrichInquiryRowsWithTemplateData(data || [])).map((row: any) => fromInquiryRow(row, deps))
    },

    async getCustomerVisible(options: {
      email?: string | null
      companyId?: string | null
      companyName?: string | null
    }) {
      const normalizedEmail = String(options.email || '').trim().toLowerCase()
      const normalizedCompanyId = String(options.companyId || '').trim()
      const normalizedCompanyName = String(options.companyName || '').trim()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token
      if (!accessToken || !normalizedEmail) return []

      const query = new URLSearchParams()
      query.set('email', normalizedEmail)
      if (normalizedCompanyId) query.set('companyId', normalizedCompanyId)
      if (normalizedCompanyName) query.set('companyName', normalizedCompanyName)

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-inquiries?${query.toString()}`,
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

      if (!response.ok) {
        const message = String(payload?.message || '').trim() || `HTTP ${response.status}`
        throw new Error(message)
      }

      const rows = Array.isArray(payload?.inquiries) ? payload.inquiries : []
      return (await deps.enrichInquiryRowsWithTemplateData(rows)).map((row: any) => fromInquiryRow(row, deps))
    },

    async createAtomic(inquiry: any) {
      let templateBinding: Record<string, any> = {}
      const shouldDeferTemplateBinding =
        shouldSkipInquiryTemplateBindingInLocalProxy() ||
        inquiry?.templateSnapshot?.pendingResolution === true &&
        !inquiry?.templateId &&
        !inquiry?.templateVersionId &&
        !inquiry?.template_id &&
        !inquiry?.template_version_id

      if (!shouldDeferTemplateBinding) {
        try {
          templateBinding = await deps.withSupabaseTimeout(
            deps.resolveBusinessDocumentTemplateBinding(inquiry, {
              documentCode: 'ING',
              nodeCode: 'ing-create',
              businessData: inquiry.documentDataSnapshot || inquiry.document_data_snapshot || inquiry,
            }),
            8000,
            'Inquiry template binding request timed out',
          )
        } catch (error) {
          console.warn('[Supabase] inquiry template binding unavailable, creating inquiry without template binding.', error)
        }
      }

      const row = toInquiryRow({ ...inquiry, ...templateBinding }, deps)
      const payload: Record<string, any> = { ...row, inquiry_number: null }
      const fallbackData = await deps.insertInquiryWithServerAssignedNumber(payload, 'createAtomic inquiry')
      return fromInquiryRow(fallbackData, deps)
    },

    async upsert(inquiry: any) {
      let templateBinding: Record<string, any> = {}
      const shouldDeferTemplateBinding =
        shouldSkipInquiryTemplateBindingInLocalProxy() ||
        inquiry?.templateSnapshot?.pendingResolution === true &&
        !inquiry?.templateId &&
        !inquiry?.templateVersionId &&
        !inquiry?.template_id &&
        !inquiry?.template_version_id

      if (!shouldDeferTemplateBinding) {
        try {
          templateBinding = await deps.withSupabaseTimeout(
            deps.resolveBusinessDocumentTemplateBinding(inquiry, {
              documentCode: 'ING',
              nodeCode: 'ing-create',
              businessData: inquiry.documentDataSnapshot || inquiry.document_data_snapshot || inquiry,
            }),
            8000,
            'Inquiry template binding request timed out',
          )
        } catch (error) {
          console.warn('[Supabase] inquiry template binding unavailable, saving inquiry without template binding.', error)
        }
      }

      const row = toInquiryRow({ ...inquiry, ...templateBinding }, deps)
      const payload: Record<string, any> = { ...row }
      const removedColumns: string[] = []
      deps.applyKnownMissingColumns('inquiries', payload, removedColumns)
      let data: any = null
      let error: any = null

      for (let i = 0; i < 12; i++) {
        const result = await deps.withSupabaseTimeout(
          supabase.from('inquiries').upsert(payload, { onConflict: 'id', ignoreDuplicates: false }).select().single(),
          12000,
          'Inquiry save request timed out',
        )
        data = result.data
        error = result.error
        if (!error) {
          if (removedColumns.length > 0) {
            console.warn(`[Supabase] upsert inquiry: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
          }
          break
        }
        const missingColumn = deps.extractMissingColumn(error)
        if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
          delete payload[missingColumn]
          deps.rememberMissingColumn('inquiries', missingColumn)
          removedColumns.push(missingColumn)
          continue
        }
        break
      }
      if (!error) return fromInquiryRow(await deps.enrichInquiryRowWithTemplateData(data), deps)

      if (error.code === '23505') {
        console.warn('[Supabase] inquiry_number conflict during upsert, retrying with server-side insert allocation...')
        const atomicPayload: Record<string, any> = { ...payload, inquiry_number: null }
        const fallbackData = await deps.insertInquiryWithServerAssignedNumber(atomicPayload, 'upsert inquiry (retry)')
        return fromInquiryRow(fallbackData, deps)
      }
      deps.throwSupabaseError('upsert inquiry', error)
    },

    async update(id: string, inquiry: any) {
      const row = toInquiryRow({ ...inquiry, id }, deps)
      row.id = id

      const { data, error } = await deps.withSupabaseTimeout(
        supabase
          .from('inquiries')
          .update({
            inquiry_number: row.inquiry_number,
            date: row.date,
            user_email: row.user_email,
            buyer_name: row.buyer_name,
            buyer_company: row.buyer_company,
            buyer_country: row.buyer_country,
            company_id: row.company_id,
            region_code: row.region_code,
            status: row.status,
            is_submitted: row.is_submitted,
            total_price: row.total_price,
            notes: row.notes,
            assigned_to: row.assigned_to,
            owner_user_id: row.owner_user_id,
            owner_email: row.owner_email,
            owner_name: row.owner_name,
            owner_role: row.owner_role,
            message: row.message,
            buyer_info: row.buyer_info,
            shipping_info: row.shipping_info,
            container_info: row.container_info,
            products: row.products,
            submitted_at: row.submitted_at,
            template_id: row.template_id,
            template_version_id: row.template_version_id,
            template_snapshot: row.template_snapshot,
            document_data_snapshot: row.document_data_snapshot,
            document_render_meta: row.document_render_meta,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .maybeSingle(),
        15000,
        'Update inquiry request timed out',
      )
      if (error) deps.throwSupabaseError('update inquiry', error)
      if (!data) {
        // Internal staff updates can succeed while follow-up SELECTs are blocked by RLS.
        // In that case we trust the update call and return the merged local row instead of
        // triggering an INSERT/UPSERT path that is guaranteed to violate policy.
        console.warn('[Supabase] update inquiry returned no row; treating as write-success without refetch:', {
          id,
          inquiryNumber: row.inquiry_number || null,
          assignedTo: row.assigned_to || null,
          ownerEmail: row.owner_email || null,
        })
        return fromInquiryRow(row, deps)
      }
      return fromInquiryRow(await deps.enrichInquiryRowWithTemplateData(data), deps)
    },

    async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
      const payload = { status, ...extra, updated_at: new Date().toISOString() }
      let lastTransientError: any = null

      for (let attempt = 0; attempt < 3; attempt++) {
        let data: any = null
        let error: any = null
        try {
          const result = await deps.withSupabaseTimeout(
            supabase
              .from('inquiries')
              .update(payload)
              .eq('id', id)
              .select()
              .maybeSingle(),
            15000,
            'Update inquiry status request timed out',
          )
          data = result.data
          error = result.error
        } catch (requestError) {
          error = requestError
        }

        if (!error) {
          if (!data) {
            console.warn('[Supabase] updateStatus inquiry returned no row; treating as write-success without refetch:', {
              id,
              status,
            })
            return fromInquiryRow({
              id,
              ...payload,
            }, deps)
          }
          return fromInquiryRow(await deps.enrichInquiryRowWithTemplateData(data), deps)
        }

        if (!deps.isTransientSupabaseRequestError(error)) {
          deps.throwSupabaseError('updateStatus inquiry', error)
        }

        lastTransientError = error
      }

      let blindWriteError: any = null
      try {
        const blindWriteResult = await deps.withSupabaseTimeout(
          supabase
            .from('inquiries')
            .update(payload)
            .eq('id', id),
          12000,
          'Update inquiry status fallback request timed out',
        )
        blindWriteError = blindWriteResult.error
      } catch (requestError) {
        blindWriteError = requestError
      }

      if (!blindWriteError) {
        console.warn('[Supabase] updateStatus inquiry fallback completed without row echo after transient aborts:', {
          id,
          status,
        })
        return fromInquiryRow({
          id,
          ...payload,
        }, deps)
      }

      if (!deps.isTransientSupabaseRequestError(blindWriteError)) {
        deps.throwSupabaseError('updateStatus inquiry', blindWriteError)
      }

      try {
        const restData = await deps.updateInquiryRowViaRest(id, payload, 'updateStatus inquiry')
        if (restData) {
          return fromInquiryRow(await deps.enrichInquiryRowWithTemplateData(restData), deps)
        }
      } catch (restError) {
        if (!deps.isTransientSupabaseRequestError(restError)) {
          deps.throwSupabaseError('updateStatus inquiry', restError)
        }
        lastTransientError = restError
      }

      deps.throwSupabaseError('updateStatus inquiry', lastTransientError || blindWriteError)
    },

    async delete(id: string) {
      const { error } = await deps.withSupabaseTimeout(
        supabase.from('inquiries').delete().eq('id', id),
        12000,
        'Delete inquiry request timed out',
      )
      if (error) deps.throwSupabaseError('delete inquiry', error)
      return true
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('inquiries_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, callback)
        .subscribe()
    },
  }
}
