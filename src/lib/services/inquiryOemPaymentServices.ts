import { aggregateInquiryOemFromProducts } from '../../types/oem'
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

function handleError(error: any, context: string) {
  if (error?.name === 'AbortError') {
    return null
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
}

function toUUID(id: string | null | undefined): string {
  const s = String(id || '').trim()
  if (s === '') return crypto.randomUUID()
  return s
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function toInquiryOemModuleRow(inquiryId: string, oem: any, options: { productId?: string | null; productName?: string | null } = {}) {
  return {
    inquiry_id: inquiryId,
    product_id: options.productId || null,
    product_name: options.productName || null,
    enabled: Boolean(oem?.enabled),
    overall_requirement_note: oem?.overallRequirementNote || '',
    tooling_cost_involved: Boolean(oem?.tooling?.toolingCostInvolved),
    first_order_quantity: oem?.tooling?.firstOrderQuantity || null,
    annual_quantity: oem?.tooling?.annualQuantity || null,
    quantity_within_three_years: oem?.tooling?.quantityWithinThreeYears || null,
    mold_lifetime: oem?.tooling?.moldLifetime || null,
    forwarding_owner_department: oem?.forwardingControl?.ownerDepartment || 'Procurement Department',
    customer_selectable_forwarding: false,
    replace_customer_identity: true,
    replace_part_numbers_with_internal_model_sku: true,
    hide_customer_identity_in_factory_docs: true,
    factory_facing_owner_department: oem?.anonymizationPolicy?.factoryFacingOwnerDepartment || 'Procurement Department',
    anonymization_status: oem?.internalProcessing?.anonymizationStatus || 'pending',
    replacement_version_status: oem?.internalProcessing?.replacementVersionStatus || 'pending',
    factory_forwarding_status: oem?.internalProcessing?.factoryForwardingStatus || 'internal_hold',
  }
}

function fromInquiryOemModuleRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    productId: row.product_id || null,
    productName: row.product_name || '',
    enabled: Boolean(row.enabled),
    overallRequirementNote: row.overall_requirement_note || '',
    tooling: {
      toolingCostInvolved: Boolean(row.tooling_cost_involved),
      firstOrderQuantity: row.first_order_quantity || '',
      annualQuantity: row.annual_quantity || '',
      quantityWithinThreeYears: row.quantity_within_three_years || '',
      moldLifetime: row.mold_lifetime || '',
    },
    forwardingControl: {
      customerSelectable: false,
      ownerDepartment: row.forwarding_owner_department || 'Procurement Department',
    },
    anonymizationPolicy: {
      replaceCustomerIdentity: true,
      replacePartNumbersWithInternalModelSku: true,
      hideCustomerIdentityInFactoryDocs: true,
      factoryFacingOwnerDepartment: row.factory_facing_owner_department || 'Procurement Department',
    },
    internalProcessing: {
      anonymizationStatus: row.anonymization_status || 'pending',
      replacementVersionStatus: row.replacement_version_status || 'pending',
      factoryForwardingStatus: row.factory_forwarding_status || 'internal_hold',
    },
    files: [],
    partNumberMappings: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toInquiryOemFileRows(moduleId: string, files: any[] = []) {
  return files.map((file) => ({
    inquiry_oem_module_id: moduleId,
    source_product_id: file.sourceProductId || null,
    source_product_name: file.sourceProductName || null,
    source_file_uid: file.id || null,
    file_name: file.fileName || '',
    file_type: file.fileType || null,
    file_size: Number(file.fileSize || 0),
    description: file.description || '',
    customer_part_number: file.customerPartNumber || null,
    internal_model_number: file.internalModelNumber || null,
    internal_sku: file.internalSku || null,
    anonymization_status: file.anonymizationStatus || 'pending',
    upload_status: file.uploadStatus || 'local',
    storage_bucket: file.storageBucket || null,
    storage_path: file.storagePath || null,
    storage_url: file.storageUrl || null,
    uploaded_at: file.uploadedAt || null,
    file_last_modified: Number(file.lastModified || 0) || null,
  }))
}

function fromInquiryOemFileRow(row: any) {
  return {
    id: row.source_file_uid || row.id,
    sourceProductId: row.source_product_id || undefined,
    sourceProductName: row.source_product_name || undefined,
    fileName: row.file_name,
    fileType: row.file_type || '',
    fileSize: Number(row.file_size || 0),
    lastModified: Number(row.file_last_modified || 0),
    description: row.description || '',
    customerPartNumber: row.customer_part_number || '',
    internalModelNumber: row.internal_model_number || '',
    internalSku: row.internal_sku || '',
    anonymizationStatus: row.anonymization_status || 'pending',
    uploadStatus: row.upload_status || 'local',
    storageBucket: row.storage_bucket || undefined,
    storagePath: row.storage_path || undefined,
    storageUrl: row.storage_url || undefined,
    uploadedAt: row.uploaded_at || undefined,
    fileObject: null,
    sensitivityLevel: 'normal',
    processingState: 'raw',
    deliveryScope: 'sales_only',
  }
}

function toInquiryOemPartMappingRows(moduleId: string, mappings: any[] = []) {
  return mappings.map((mapping) => ({
    inquiry_oem_module_id: moduleId,
    source_product_id: mapping.sourceProductId || null,
    source_product_name: mapping.sourceProductName || null,
    source_mapping_uid: mapping.id || null,
    source_file_uid: mapping.sourceFileId || null,
    customer_part_number: mapping.customerPartNumber || '',
    internal_model_number: mapping.internalModelNumber || '',
    internal_sku: mapping.internalSku || '',
    mapping_status: mapping.status || 'pending_internal_assignment',
  }))
}

function fromInquiryOemPartMappingRow(row: any) {
  return {
    id: row.source_mapping_uid || row.id,
    sourceProductId: row.source_product_id || undefined,
    sourceProductName: row.source_product_name || undefined,
    sourceFileId: row.source_file_uid || '',
    customerPartNumber: row.customer_part_number || '',
    internalModelNumber: row.internal_model_number || '',
    internalSku: row.internal_sku || '',
    status: row.mapping_status || 'pending_internal_assignment',
  }
}

async function fetchInquiryOemCollections(inquiryIds: string[]) {
  const ids = Array.from(new Set((inquiryIds || []).filter(Boolean)))
  if (ids.length === 0) {
    return { modules: [] as any[], files: [] as any[], mappings: [] as any[] }
  }

  const { data: moduleRows, error: moduleError } = await supabase
    .from('inquiry_oem_modules')
    .select('*')
    .in('inquiry_id', ids)
  if (moduleError) throwSupabaseError('fetchInquiryOemCollections inquiry_oem_modules', moduleError)

  const moduleIds = (moduleRows || []).map((row: any) => row.id).filter(Boolean)
  if (moduleIds.length === 0) {
    return { modules: moduleRows || [], files: [] as any[], mappings: [] as any[] }
  }

  const [{ data: fileRows, error: fileError }, { data: mappingRows, error: mappingError }] = await Promise.all([
    supabase.from('inquiry_oem_files').select('*').in('inquiry_oem_module_id', moduleIds),
    supabase.from('inquiry_oem_part_mappings').select('*').in('inquiry_oem_module_id', moduleIds),
  ])

  if (fileError) throwSupabaseError('fetchInquiryOemCollections inquiry_oem_files', fileError)
  if (mappingError) throwSupabaseError('fetchInquiryOemCollections inquiry_oem_part_mappings', mappingError)

  return {
    modules: moduleRows || [],
    files: fileRows || [],
    mappings: mappingRows || [],
  }
}

function buildInquiryOemAggregateMap(moduleRows: any[], fileRows: any[], mappingRows: any[]) {
  const aggregateMap = new Map<string, any>()
  const moduleIdToInquiryId = new Map<string, string>()

  for (const row of moduleRows || []) {
    const module = fromInquiryOemModuleRow(row)
    if (!module || module.productId) continue
    aggregateMap.set(module.inquiryId, module)
    moduleIdToInquiryId.set(module.id, module.inquiryId)
  }

  for (const row of fileRows || []) {
    const inquiryId = moduleIdToInquiryId.get(row.inquiry_oem_module_id)
    if (!inquiryId) continue
    const module = aggregateMap.get(inquiryId)
    if (!module) continue
    module.files.push(fromInquiryOemFileRow(row))
  }

  for (const row of mappingRows || []) {
    const inquiryId = moduleIdToInquiryId.get(row.inquiry_oem_module_id)
    if (!inquiryId) continue
    const module = aggregateMap.get(inquiryId)
    if (!module) continue
    module.partNumberMappings.push(fromInquiryOemPartMappingRow(row))
  }

  return aggregateMap
}

function buildInquiryOemProductMap(moduleRows: any[], fileRows: any[], mappingRows: any[]) {
  const inquiryProductMap = new Map<string, Map<string, any>>()
  const moduleIdToLocation = new Map<string, { inquiryId: string; productId: string }>()

  for (const row of moduleRows || []) {
    const module = fromInquiryOemModuleRow(row)
    if (!module || !module.productId) continue
    const productMap = inquiryProductMap.get(module.inquiryId) || new Map<string, any>()
    productMap.set(module.productId, module)
    inquiryProductMap.set(module.inquiryId, productMap)
    moduleIdToLocation.set(module.id, { inquiryId: module.inquiryId, productId: module.productId })
  }

  for (const row of fileRows || []) {
    const location = moduleIdToLocation.get(row.inquiry_oem_module_id)
    if (!location) continue
    const module = inquiryProductMap.get(location.inquiryId)?.get(location.productId)
    if (!module) continue
    module.files.push(fromInquiryOemFileRow(row))
  }

  for (const row of mappingRows || []) {
    const location = moduleIdToLocation.get(row.inquiry_oem_module_id)
    if (!location) continue
    const module = inquiryProductMap.get(location.inquiryId)?.get(location.productId)
    if (!module) continue
    module.partNumberMappings.push(fromInquiryOemPartMappingRow(row))
  }

  return inquiryProductMap
}

async function upsertInquiryOemModuleRecord(inquiryId: string, oem: any, options: { productId?: string | null; productName?: string | null } = {}) {
  const productId = options.productId || null
  let query = supabase
    .from('inquiry_oem_modules')
    .select('id')
    .eq('inquiry_id', inquiryId)

  query = productId ? query.eq('product_id', productId) : query.is('product_id', null)

  const { data: existingRow, error: findError } = await query.maybeSingle()
  if (findError) throwSupabaseError('upsertInquiryOemModuleRecord find inquiry_oem_modules', findError)

  const moduleRow = toInquiryOemModuleRow(inquiryId, oem, options)
  if (existingRow?.id) {
    const { data, error } = await supabase
      .from('inquiry_oem_modules')
      .update(moduleRow)
      .eq('id', existingRow.id)
      .select()
      .single()
    if (error) throwSupabaseError('upsertInquiryOemModuleRecord update inquiry_oem_modules', error)
    return data
  }

  const { data, error } = await supabase
    .from('inquiry_oem_modules')
    .insert(moduleRow)
    .select()
    .single()
  if (error) throwSupabaseError('upsertInquiryOemModuleRecord insert inquiry_oem_modules', error)
  return data
}

async function replaceInquiryOemModuleChildren(moduleId: string, oem: any) {
  const { error: deleteFilesError } = await supabase
    .from('inquiry_oem_files')
    .delete()
    .eq('inquiry_oem_module_id', moduleId)
  if (deleteFilesError) throwSupabaseError('replaceInquiryOemModuleChildren delete inquiry_oem_files', deleteFilesError)

  const { error: deleteMappingsError } = await supabase
    .from('inquiry_oem_part_mappings')
    .delete()
    .eq('inquiry_oem_module_id', moduleId)
  if (deleteMappingsError) throwSupabaseError('replaceInquiryOemModuleChildren delete inquiry_oem_part_mappings', deleteMappingsError)

  const fileRows = toInquiryOemFileRows(moduleId, oem.files || [])
  if (fileRows.length > 0) {
    const { error: fileError } = await supabase.from('inquiry_oem_files').insert(fileRows)
    if (fileError) throwSupabaseError('replaceInquiryOemModuleChildren insert inquiry_oem_files', fileError)
  }

  const mappingRows = toInquiryOemPartMappingRows(moduleId, oem.partNumberMappings || [])
  if (mappingRows.length > 0) {
    const { error: mappingError } = await supabase.from('inquiry_oem_part_mappings').insert(mappingRows)
    if (mappingError) throwSupabaseError('replaceInquiryOemModuleChildren insert inquiry_oem_part_mappings', mappingError)
  }
}

export const inquiryOemService = {
  async getByInquiryIds(inquiryIds: string[]) {
    const ids = Array.from(new Set((inquiryIds || []).filter(Boolean)))
    if (ids.length === 0) return new Map<string, any>()

    const { modules, files, mappings } = await fetchInquiryOemCollections(ids)
    return buildInquiryOemAggregateMap(modules, files, mappings)
  },

  async getProductMapByInquiryIds(inquiryIds: string[]) {
    const ids = Array.from(new Set((inquiryIds || []).filter(Boolean)))
    if (ids.length === 0) return new Map<string, Map<string, any>>()

    const { modules, files, mappings } = await fetchInquiryOemCollections(ids)
    return buildInquiryOemProductMap(modules, files, mappings)
  },

  async upsertByInquiryId(inquiryId: string, oem: any) {
    if (!inquiryId || !oem) return null

    const savedModule = await upsertInquiryOemModuleRecord(inquiryId, oem, { productId: null, productName: null })
    await replaceInquiryOemModuleChildren(savedModule.id, oem)

    const map = await this.getByInquiryIds([inquiryId])
    return map.get(inquiryId) || null
  },

  async replaceProductModulesByInquiryId(inquiryId: string, products: any[] = []) {
    if (!inquiryId) return new Map<string, any>()

    const normalizedProducts = Array.isArray(products) ? products : []
    const oemProducts = normalizedProducts.filter((product) => Boolean(product?.id && product?.oem?.enabled))
    const activeProductIds = new Set(oemProducts.map((product) => String(product.id)))

    const { data: existingRows, error: existingError } = await supabase
      .from('inquiry_oem_modules')
      .select('id, product_id')
      .eq('inquiry_id', inquiryId)
      .not('product_id', 'is', null)
    if (existingError) throwSupabaseError('replaceProductModulesByInquiryId query inquiry_oem_modules', existingError)

    const staleRowIds = (existingRows || [])
      .filter((row: any) => !activeProductIds.has(String(row.product_id || '')))
      .map((row: any) => row.id)

    if (staleRowIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('inquiry_oem_modules')
        .delete()
        .in('id', staleRowIds)
      if (deleteError) throwSupabaseError('replaceProductModulesByInquiryId delete inquiry_oem_modules', deleteError)
    }

    for (const product of oemProducts) {
      const productId = String(product.id)
      const productName = String(product.productName || '')
      const savedModule = await upsertInquiryOemModuleRecord(inquiryId, product.oem, { productId, productName })
      await replaceInquiryOemModuleChildren(savedModule.id, {
        ...product.oem,
        files: (product.oem?.files || []).map((file: any) => ({
          ...file,
          sourceProductId: productId,
          sourceProductName: productName,
        })),
        partNumberMappings: (product.oem?.partNumberMappings || []).map((mapping: any) => ({
          ...mapping,
          sourceProductId: productId,
          sourceProductName: productName,
        })),
      })
    }

    const productMapByInquiry = await this.getProductMapByInquiryIds([inquiryId])
    return productMapByInquiry.get(inquiryId) || new Map<string, any>()
  },

  async buildAggregateFromProductModules(inquiryId: string, products: any[] = []) {
    const productMapByInquiry = await this.getProductMapByInquiryIds([inquiryId])
    const productMap = productMapByInquiry.get(inquiryId) || new Map<string, any>()
    const enrichedProducts = (products || []).map((product) => ({
      ...product,
      oem: productMap.get(String(product.id || '')) || product.oem,
    }))
    return aggregateInquiryOemFromProducts(enrichedProducts)
  },
}

function toInquiryOemFactoryDispatchRow(inquiryId: string, dispatch: any) {
  return {
    inquiry_id: inquiryId,
    dispatch_status: dispatch?.releasedAt ? 'released_to_factory' : 'generated',
    owner_department: dispatch?.payload?.ownerDepartment || 'Procurement Department',
    generated_at: dispatch?.generatedAt || new Date().toISOString(),
    released_at: dispatch?.releasedAt || null,
    payload: dispatch?.payload || {},
  }
}

function fromInquiryOemFactoryDispatchRow(row: any) {
  if (!row) return null
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    dispatchStatus: row.dispatch_status || 'generated',
    generatedAt: row.generated_at,
    releasedAt: row.released_at,
    payload: row.payload || {},
    ownerDepartment: row.owner_department || 'Procurement Department',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const inquiryOemFactoryDispatchService = {
  async getByInquiryIds(inquiryIds: string[]) {
    const ids = Array.from(new Set((inquiryIds || []).filter(Boolean)))
    if (ids.length === 0) return new Map<string, any>()

    const { data, error } = await supabase
      .from('inquiry_oem_factory_dispatches')
      .select('*')
      .in('inquiry_id', ids)
    if (error) throwSupabaseError('getByInquiryIds inquiry_oem_factory_dispatches', error)

    const map = new Map<string, any>()
    for (const row of data || []) {
      const record = fromInquiryOemFactoryDispatchRow(row)
      if (!record) continue
      map.set(record.inquiryId, record)
    }
    return map
  },

  async upsertByInquiryId(inquiryId: string, dispatch: any) {
    if (!inquiryId || !dispatch?.payload) return null

    const { data, error } = await supabase
      .from('inquiry_oem_factory_dispatches')
      .upsert(toInquiryOemFactoryDispatchRow(inquiryId, dispatch), { onConflict: 'inquiry_id' })
      .select()
      .single()
    if (error) throwSupabaseError('upsertByInquiryId inquiry_oem_factory_dispatches', error)
    return fromInquiryOemFactoryDispatchRow(data)
  },
}

function toPaymentRow(p: any) {
  return {
    id: toUUID(p.id),
    payment_number: p.paymentNumber || p.payment_number || '',
    order_number: p.orderNumber || p.order_number || null,
    contract_number: p.contractNumber || p.contract_number || null,
    customer_name: p.customerName || p.customer_name || '',
    customer_email: p.customerEmail || p.customer_email || '',
    amount: p.amount || 0,
    currency: p.currency || 'USD',
    payment_type: p.paymentType || p.payment_type || 'deposit',
    payment_method: p.paymentMethod || p.payment_method || null,
    status: p.status || 'pending',
    due_date: toIsoDate(p.dueDate || p.due_date),
    paid_date: toIsoDate(p.paidDate || p.paid_date),
    bank_info: p.bankInfo || p.bank_info || null,
    attachment_url: p.attachmentUrl || p.attachment_url || null,
    notes: p.notes || null,
    created_by: p.createdBy || p.created_by || null,
  }
}

function fromPaymentRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    paymentNumber: r.payment_number,
    orderNumber: r.order_number,
    contractNumber: r.contract_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    amount: r.amount || 0,
    currency: r.currency || 'USD',
    paymentType: r.payment_type,
    paymentMethod: r.payment_method,
    status: r.status,
    dueDate: r.due_date,
    paidDate: r.paid_date,
    bankInfo: r.bank_info,
    attachmentUrl: r.attachment_url,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const paymentService = {
  async getAll() {
    const { data, error } = await supabase.from('payments').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll payments')
    return (data || []).map(fromPaymentRow)
  },
  async getByEmail(email: string) {
    const { data, error } = await supabase.from('payments').select('*').is('deleted_at', null).eq('customer_email', email).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByEmail payments')
    return (data || []).map(fromPaymentRow)
  },
  async upsert(p: any) {
    const row = toPaymentRow(p)
    const { data, error } = await supabase.from('payments').upsert(row, { onConflict: 'id' }).select().single()
    if (error) return handleError(error, 'upsert payment')
    return fromPaymentRow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('payments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return handleError(error, 'delete payment')
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('payments_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback).subscribe()
  },
}
