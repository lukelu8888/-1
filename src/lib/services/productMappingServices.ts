import { supabase } from '../supabase'

function buildSupabaseError(context: string, error: any): Error {
  const rawMessage = String(error?.message || error || 'Unknown Supabase error').trim()
  return new Error(`${context} failed${rawMessage ? `: ${rawMessage}` : ''}`)
}

function throwSupabaseError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : buildSupabaseError(context, error))
}

function isTransientSupabaseRequestError(error: any): boolean {
  const message = [
    error?.name,
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    error?.cause?.message,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  return (
    error?.name === 'AbortError' ||
    error?.name === 'TypeError' ||
    message.includes('signal is aborted') ||
    message.includes('request aborted') ||
    message.includes('timed out') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('connection refused') ||
    message.includes('err_connection_refused')
  )
}

function isMissingFactoryModelNoColumn(error: any): boolean {
  const message = [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  return message.includes('factory_model_no')
}

function withoutFactoryModelNo(row: Record<string, any>) {
  const { factory_model_no: _factoryModelNo, ...fallbackRow } = row
  return fallbackRow
}

function toProductMasterRow(product: any) {
  return {
    id: product.id || undefined,
    internal_model_no: product.internalModelNo || product.modelNo || product.internal_model_no || product.model_no,
    factory_model_no:
      product.factoryModelNo ||
      product.factorySku ||
      product.factory_model_no ||
      product.factory_sku ||
      product.internalFactoryNo ||
      product.internal_factory_no ||
      product.internalModelNo ||
      product.modelNo ||
      product.internal_model_no ||
      product.model_no,
    region_code: product.regionCode || product.region_code || 'NA',
    product_name: product.productName || product.product_name || '',
    description: product.description || product.specifications || product.externalSpecification || product.external_specification || null,
    image_url: product.imageUrl || product.image || product.image_url || null,
    status: product.status || 'active',
  }
}

function fromProductMasterRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    internalModelNo: row.internal_model_no,
    modelNo: row.internal_model_no,
    factoryModelNo: row.factory_model_no || row.internal_model_no || '',
    factorySku: row.factory_model_no || row.internal_model_no || '',
    regionCode: row.region_code,
    productName: row.product_name,
    description: row.description || '',
    imageUrl: row.image_url || '',
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProductMappingRow(mapping: any) {
  return {
    id: mapping.id || undefined,
    product_id: mapping.productId || mapping.product_id,
    party_type: mapping.partyType || mapping.party_type,
    party_id: mapping.partyId || mapping.party_id,
    external_model_no: mapping.externalModelNo || mapping.external_model_no,
    external_product_name: mapping.externalProductName || mapping.external_product_name || null,
    external_specification: mapping.externalSpecification || mapping.external_specification || null,
    external_image_url: mapping.externalImageUrl || mapping.external_image_url || null,
    is_primary: Boolean(mapping.isPrimary || mapping.is_primary),
    mapping_status: mapping.mappingStatus || mapping.mapping_status || 'pending',
    match_confidence: mapping.matchConfidence ?? mapping.match_confidence ?? null,
    suggested_product_id: mapping.suggestedProductId || mapping.suggested_product_id || null,
    confirmed_product_id: mapping.confirmedProductId || mapping.confirmed_product_id || null,
    created_from_doc_type: mapping.createdFromDocType || mapping.created_from_doc_type || null,
    created_from_doc_id: mapping.createdFromDocId || mapping.created_from_doc_id || null,
    created_by: mapping.createdBy || mapping.created_by || null,
    confirmed_by: mapping.confirmedBy || mapping.confirmed_by || null,
    confirmed_at: mapping.confirmedAt || mapping.confirmed_at || null,
    remarks: mapping.remarks || null,
  }
}

function fromProductMappingRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    productId: row.product_id,
    partyType: row.party_type,
    partyId: row.party_id,
    externalModelNo: row.external_model_no,
    externalProductName: row.external_product_name || '',
    externalSpecification: row.external_specification || '',
    externalImageUrl: row.external_image_url || '',
    isPrimary: Boolean(row.is_primary),
    mappingStatus: row.mapping_status || 'pending',
    matchConfidence: row.match_confidence == null ? null : Number(row.match_confidence),
    suggestedProductId: row.suggested_product_id,
    confirmedProductId: row.confirmed_product_id,
    createdFromDocType: row.created_from_doc_type,
    createdFromDocId: row.created_from_doc_id,
    createdBy: row.created_by,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    remarks: row.remarks || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: row.product_master ? fromProductMasterRow(row.product_master) : null,
    suggestedProduct: row.suggested_product_master ? fromProductMasterRow(row.suggested_product_master) : null,
    confirmedProduct: row.confirmed_product_master ? fromProductMasterRow(row.confirmed_product_master) : null,
  }
}

function toProductMappingEventRow(event: any) {
  return {
    id: event.id || undefined,
    external_model_id: event.externalModelId || event.external_model_id,
    event_type: event.eventType || event.event_type,
    from_product_id: event.fromProductId || event.from_product_id || null,
    to_product_id: event.toProductId || event.to_product_id || null,
    operator_id: event.operatorId || event.operator_id || null,
    notes: event.notes || null,
  }
}

function fromProductMappingEventRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    externalModelId: row.external_model_id,
    eventType: row.event_type,
    fromProductId: row.from_product_id,
    toProductId: row.to_product_id,
    operatorId: row.operator_id,
    notes: row.notes || '',
    createdAt: row.created_at,
  }
}

function sanitizeInquiryDraftProducts(products: any[] = []) {
  return (Array.isArray(products) ? products : []).map((product) => {
    const safeProduct = { ...product }
    if (safeProduct.image && typeof safeProduct.image === 'string' && safeProduct.image.startsWith('data:')) {
      safeProduct.image = ''
    }
    if (safeProduct.oem?.files?.length) {
      safeProduct.oem = {
        ...safeProduct.oem,
        files: safeProduct.oem.files.map((file: any) => ({
          ...file,
          fileObject: null,
          previewUrl: null,
        })),
      }
    }
    return safeProduct
  })
}

export function sanitizePersistedInquiryProducts(products: any[] = []) {
  return sanitizeInquiryDraftProducts(products).map((product) => {
    const safeProduct = { ...product }
    if (safeProduct.imageUrl && typeof safeProduct.imageUrl === 'string' && safeProduct.imageUrl.startsWith('data:')) {
      safeProduct.imageUrl = ''
    }
    return safeProduct
  })
}

function fromCustomerInquiryDraftRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    draftType: row.draft_type || 'new_inquiry',
    customerEmail: row.customer_email || '',
    customerUserId: row.customer_user_id || null,
    companyId: row.company_id || null,
    regionCode: row.region_code || null,
    products: Array.isArray(row.products_json) ? row.products_json : [],
    status: row.status || 'active',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const productMasterService = {
  async getAll() {
    const { data, error } = await supabase.from('product_master').select('*').order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll product_master', error)
    return (data || []).map(fromProductMasterRow)
  },

  async getByInternalModelNo(internalModelNo: string) {
    const { data, error } = await supabase.from('product_master').select('*').eq('internal_model_no', internalModelNo).maybeSingle()
    if (error) throwSupabaseError('getByInternalModelNo product_master', error)
    return fromProductMasterRow(data)
  },

  async search(keyword: string) {
    const q = `%${String(keyword || '').trim()}%`
    if (q === '%%') return this.getAll()
    const { data, error } = await supabase
      .from('product_master')
      .select('*')
      .or(`internal_model_no.ilike.${q},product_name.ilike.${q},description.ilike.${q}`)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('search product_master', error)
    return (data || []).map(fromProductMasterRow)
  },

  async create(product: any) {
    const row = toProductMasterRow(product)
    let { data, error } = await supabase.from('product_master').insert(row).select().single()
    if (error && isMissingFactoryModelNoColumn(error)) {
      ;({ data, error } = await supabase.from('product_master').insert(withoutFactoryModelNo(row)).select().single())
    }
    if (error) throwSupabaseError('create product_master', error)
    return fromProductMasterRow(data)
  },

  async upsert(product: any) {
    const row = toProductMasterRow(product)
    let lastTransientError: any = null

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('product_master')
        .upsert(row, { onConflict: 'internal_model_no' })
        .select()
        .single()
      if (!error) return fromProductMasterRow(data)
      if (isMissingFactoryModelNoColumn(error)) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('product_master')
          .upsert(withoutFactoryModelNo(row), { onConflict: 'internal_model_no' })
          .select()
          .single()
        if (!fallbackError) return fromProductMasterRow(fallbackData)
        if (!isTransientSupabaseRequestError(fallbackError)) {
          throwSupabaseError('upsert product_master', fallbackError)
        }
        lastTransientError = fallbackError
        continue
      }
      if (!isTransientSupabaseRequestError(error)) {
        throwSupabaseError('upsert product_master', error)
      }
      lastTransientError = error
    }

    const { error: blindWriteError } = await supabase
      .from('product_master')
      .upsert(row, { onConflict: 'internal_model_no' })

    if (!blindWriteError) {
      const refetched = await this.getByInternalModelNo(row.internal_model_no)
      if (refetched) return refetched
    } else if (isMissingFactoryModelNoColumn(blindWriteError)) {
      const { error: fallbackBlindWriteError } = await supabase
        .from('product_master')
        .upsert(withoutFactoryModelNo(row), { onConflict: 'internal_model_no' })
      if (!fallbackBlindWriteError) {
        const refetched = await this.getByInternalModelNo(row.internal_model_no)
        if (refetched) return refetched
      } else if (!isTransientSupabaseRequestError(fallbackBlindWriteError)) {
        throwSupabaseError('upsert product_master', fallbackBlindWriteError)
      }
    } else if (!isTransientSupabaseRequestError(blindWriteError)) {
      throwSupabaseError('upsert product_master', blindWriteError)
    }

    throwSupabaseError('upsert product_master', lastTransientError || blindWriteError)
  },
}

export const customerInquiryDraftService = {
  async getByCustomerEmail(customerEmail: string, draftType = 'new_inquiry') {
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    if (!normalizedEmail) return null
    const { data, error } = await supabase
      .from('customer_inquiry_drafts')
      .select('*')
      .eq('customer_email', normalizedEmail)
      .eq('draft_type', draftType)
      .eq('status', 'active')
      .maybeSingle()
    if (error) throwSupabaseError('get customer_inquiry_drafts', error)
    return fromCustomerInquiryDraftRow(data)
  },

  async upsert(input: {
    customerEmail: string
    customerUserId?: string | null
    companyId?: string | null
    regionCode?: string | null
    products?: any[]
    draftType?: string
    status?: string
  }) {
    const normalizedEmail = String(input.customerEmail || '').trim().toLowerCase()
    if (!normalizedEmail) throw new Error('customerEmail is required for inquiry drafts')

    const row = {
      draft_type: input.draftType || 'new_inquiry',
      customer_email: normalizedEmail,
      customer_user_id: input.customerUserId || null,
      company_id: input.companyId || null,
      region_code: input.regionCode || null,
      products_json: sanitizeInquiryDraftProducts(input.products || []),
      status: input.status || 'active',
    }

    const { data, error } = await supabase
      .from('customer_inquiry_drafts')
      .upsert(row, { onConflict: 'customer_email,draft_type' })
      .select('*')
      .single()
    if (error) throwSupabaseError('upsert customer_inquiry_drafts', error)
    return fromCustomerInquiryDraftRow(data)
  },

  async clearByCustomerEmail(customerEmail: string, draftType = 'new_inquiry') {
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    if (!normalizedEmail) return
    const { error } = await supabase
      .from('customer_inquiry_drafts')
      .delete()
      .eq('customer_email', normalizedEmail)
      .eq('draft_type', draftType)
    if (error) throwSupabaseError('clear customer_inquiry_drafts', error)
  },
}

export const productMappingEventService = {
  async log(event: any) {
    const row = toProductMappingEventRow(event)
    const { data, error } = await supabase.from('product_mapping_events').insert(row).select().single()
    if (error) throwSupabaseError('log product_mapping_events', error)
    return fromProductMappingEventRow(data)
  },

  async getByExternalModelId(externalModelId: string) {
    const { data, error } = await supabase
      .from('product_mapping_events')
      .select('*')
      .eq('external_model_id', externalModelId)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByExternalModelId product_mapping_events', error)
    return (data || []).map(fromProductMappingEventRow)
  },
}

export const productModelMappingService = {
  async getAllCompact(partyType?: 'customer' | 'supplier') {
    let query = supabase
      .from('product_model_mappings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (partyType) {
      query = query.eq('party_type', partyType)
    }

    const { data, error } = await query
    if (error) throwSupabaseError('getAllCompact product_model_mappings', error)
    return (data || []).map(fromProductMappingRow)
  },

  async getAll(partyType?: 'customer' | 'supplier') {
    let query = supabase
      .from('product_model_mappings')
      .select(`
        *,
        product_master:product_id (*),
        suggested_product_master:suggested_product_id (*),
        confirmed_product_master:confirmed_product_id (*)
      `)
      .order('created_at', { ascending: false })

    if (partyType) {
      query = query.eq('party_type', partyType)
    }

    const { data, error } = await query
    if (error) throwSupabaseError('getAll product_model_mappings', error)
    return (data || []).map(fromProductMappingRow)
  },

  async getById(mappingId: string) {
    const { data, error } = await supabase.from('product_model_mappings').select('*').eq('id', mappingId).maybeSingle()
    if (error) throwSupabaseError('getById product_model_mappings', error)
    return fromProductMappingRow(data)
  },

  async findOne(mapping: any) {
    let query = supabase
      .from('product_model_mappings')
      .select('*')
      .eq('party_type', mapping.partyType || mapping.party_type)
      .eq('external_model_no', mapping.externalModelNo || mapping.external_model_no)
      .limit(1)

    const productId = mapping.productId || mapping.product_id
    const partyId = mapping.partyId || mapping.party_id

    if (productId) query = query.eq('product_id', productId)
    if (partyId) query = query.eq('party_id', partyId)

    const { data, error } = await query.maybeSingle()
    if (error) throwSupabaseError('findOne product_model_mappings', error)
    return fromProductMappingRow(data)
  },

  async createPending(mapping: any) {
    const row = toProductMappingRow({
      ...mapping,
      mappingStatus: mapping.mappingStatus || 'pending',
    })
    const { data, error } = await supabase.from('product_model_mappings').insert(row).select().single()
    if (error) throwSupabaseError('createPending product_model_mapping', error)
    const result = fromProductMappingRow(data)
    await productMappingEventService.log({
      externalModelId: result.id,
      eventType: 'created',
      toProductId: result.productId,
      operatorId: mapping.createdBy || mapping.created_by || null,
      notes: mapping.remarks || 'Pending external model mapping created',
    })
    return result
  },

  async ensurePending(mapping: any) {
    const existing = await this.findOne(mapping)
    if (existing) return existing
    return this.createPending(mapping)
  },

  async getPending(partyType?: 'customer' | 'supplier') {
    let query = supabase
      .from('product_model_mappings')
      .select(`
        *,
        product_master:product_id (*),
        suggested_product_master:suggested_product_id (*),
        confirmed_product_master:confirmed_product_id (*)
      `)
      .in('mapping_status', ['pending', 'suggested'])
      .order('created_at', { ascending: false })

    if (partyType) {
      query = query.eq('party_type', partyType)
    }

    const { data, error } = await query
    if (error) throwSupabaseError('getPending product_model_mappings', error)
    return (data || []).map(fromProductMappingRow)
  },

  async getByProductId(productId: string) {
    const { data, error } = await supabase.from('product_model_mappings').select('*').eq('product_id', productId).order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByProductId product_model_mappings', error)
    return (data || []).map(fromProductMappingRow)
  },

  async suggestMatch(mappingId: string, suggestedProductId: string, matchConfidence: number) {
    const { data, error } = await supabase
      .from('product_model_mappings')
      .update({
        mapping_status: 'suggested',
        suggested_product_id: suggestedProductId,
        match_confidence: matchConfidence,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mappingId)
      .select()
      .single()
    if (error) throwSupabaseError('suggestMatch product_model_mappings', error)
    const result = fromProductMappingRow(data)
    await productMappingEventService.log({
      externalModelId: result.id,
      eventType: 'auto_suggested',
      toProductId: suggestedProductId,
      notes: `Auto suggestion with confidence ${matchConfidence}`,
    })
    return result
  },

  async confirmMapping(mappingId: string, productId: string, confirmedBy?: string) {
    const before = await this.getById(mappingId)
    const { data, error } = await supabase
      .from('product_model_mappings')
      .update({
        product_id: productId,
        confirmed_product_id: productId,
        mapping_status: 'confirmed',
        confirmed_by: confirmedBy || null,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', mappingId)
      .select()
      .single()
    if (error) throwSupabaseError('confirmMapping product_model_mappings', error)
    const result = fromProductMappingRow(data)
    await productMappingEventService.log({
      externalModelId: result.id,
      eventType: before?.productId && before.productId !== productId ? 'relinked' : 'linked',
      fromProductId: before?.productId || null,
      toProductId: productId,
      operatorId: confirmedBy || null,
      notes: 'Mapping confirmed in ERP',
    })
    return result
  },

  async rejectMapping(mappingId: string, confirmedBy?: string, remarks?: string) {
    const { data, error } = await supabase
      .from('product_model_mappings')
      .update({
        mapping_status: 'rejected',
        confirmed_by: confirmedBy || null,
        confirmed_at: new Date().toISOString(),
        remarks: remarks || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', mappingId)
      .select()
      .single()
    if (error) throwSupabaseError('rejectMapping product_model_mappings', error)
    const result = fromProductMappingRow(data)
    await productMappingEventService.log({
      externalModelId: result.id,
      eventType: 'rejected',
      fromProductId: result.productId || null,
      operatorId: confirmedBy || null,
      notes: remarks || 'Mapping rejected',
    })
    return result
  },
}
