import { supabase } from '../supabase'
import {
  DEFAULT_TEMPLATE_BINDING_FLOW_CODE,
  templateBindingResolutionCache,
} from './templateCenterService'

type TemplateBindingResolution = {
  template_id: string | null
  template_version_id: string | null
  template_snapshot: Record<string, any>
  document_data_snapshot: Record<string, any>
  templateId: string | null
  templateVersionId: string | null
  templateSnapshot: Record<string, any>
  documentDataSnapshot: Record<string, any>
}

type DependencyBag = {
  buildSupabaseError: (
    context: string,
    error: any,
    options?: {
      removedColumns?: string[]
      adjustedProfitRate?: boolean
    },
  ) => Error
  throwSupabaseError: (context: string, error: any) => never
  extractMissingColumn: (error: any) => string | null
  extractCheckConstraintColumn: (error: any, table: string) => string | null
  shouldDowngradeProfitRate: (error: any, payload: Record<string, any>, adjustedProfitRate: boolean) => boolean
  toUUIDOrNull: (id: string | null | undefined) => string | null
  toRegionCode: (region: string | null | undefined) => string | null
  sanitizePersistedInquiryProducts: (value: unknown) => any[]
}

const documentTemplateVersionCache = new Map<string, any>()
const missingColumnCache = new Map<string, Set<string>>()

export function applyKnownMissingColumns(table: string, payload: Record<string, any>, removedColumns: string[]) {
  const cachedColumns = missingColumnCache.get(table)
  if (!cachedColumns) return
  for (const column of cachedColumns) {
    if (Object.prototype.hasOwnProperty.call(payload, column)) {
      delete payload[column]
      if (!removedColumns.includes(column)) {
        removedColumns.push(column)
      }
    }
  }
}

export function rememberMissingColumn(table: string, column: string) {
  const next = missingColumnCache.get(table) ?? new Set<string>()
  next.add(column)
  missingColumnCache.set(table, next)
}

export function hasKnownMissingColumn(table: string, column: string) {
  return missingColumnCache.get(table)?.has(column) ?? false
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function mergeTemplateBusinessData(templateValue: any, businessValue: any, path: string[] = []): any {
  if (businessValue === undefined || businessValue === null) {
    return templateValue
  }
  if (templateValue === undefined || templateValue === null) {
    return businessValue
  }

  const pathKey = path.join('.')

  if (pathKey === 'templateSettings.productTableColumns' && Array.isArray(templateValue)) {
    return templateValue
  }

  if (Array.isArray(businessValue)) {
    return businessValue
  }

  if (isPlainObject(templateValue) && isPlainObject(businessValue)) {
    const merged: Record<string, any> = { ...templateValue }
    for (const key of Object.keys(businessValue)) {
      merged[key] = mergeTemplateBusinessData(templateValue[key], businessValue[key], [...path, key])
    }
    return merged
  }

  if (typeof businessValue === 'string') {
    return businessValue.trim() ? businessValue : templateValue
  }

  return businessValue
}

async function getDocumentTemplateVersionDetails(versionId: string | null | undefined, deps: DependencyBag) {
  const normalizedVersionId = String(versionId || '').trim()
  if (!normalizedVersionId) return null

  const cached = documentTemplateVersionCache.get(normalizedVersionId)
  if (cached) return cached

  const { data, error } = await supabase
    .from('document_template_versions')
    .select(`
      id,
      version_no,
      version_label,
      status,
      schema_json,
      layout_json,
      style_tokens,
      sample_data,
      renderer_component,
      published_at
    `)
    .eq('id', normalizedVersionId)
    .maybeSingle()

  if (error) {
    throw deps.buildSupabaseError(`read document_template_version ${normalizedVersionId}`, error)
  }

  if (data?.id) {
    documentTemplateVersionCache.set(normalizedVersionId, data)
  }

  return data || null
}

export function isUuidLike(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '').trim(),
  )
}

function isMissingRpcFunctionError(error: any, functionName: string): boolean {
  const message = String(error?.message || '')
  return (
    error?.code === 'PGRST202' ||
    message.includes(`Could not find the function public.${functionName}`) ||
    message.includes(`Could not find the function ${functionName}`)
  )
}

function isInquiryNumberConflictError(error: any): boolean {
  const message = String(error?.message || '')
  return (
    error?.code === '23505' &&
    message.includes('inquiries_inquiry_number_tenant_key')
  )
}

export async function withSupabaseTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

async function getExistingInquiryRowById(id: string): Promise<any | null> {
  const normalizedId = String(id || '').trim()
  if (!normalizedId) return null

  try {
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('inquiries')
        .select('*')
        .eq('id', normalizedId)
        .maybeSingle(),
      8000,
      'Existing inquiry lookup timed out',
    )
    if (error) return null
    return data || null
  } catch {
    return null
  }
}

function buildInquiryNumberPrefix(regionCode: string, dateValue?: unknown): string {
  const rawDate = String(dateValue || '').trim()
  const parsedDate = rawDate ? new Date(rawDate) : new Date()
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  const yy = String(safeDate.getFullYear()).slice(-2)
  const mm = String(safeDate.getMonth() + 1).padStart(2, '0')
  const dd = String(safeDate.getDate()).padStart(2, '0')
  return `ING-${String(regionCode || 'NA').toUpperCase()}-${yy}${mm}${dd}-`
}

function isTransientInquiryAllocationError(error: any): boolean {
  const message = String(error?.message || error || '').toLowerCase()
  return (
    error?.name === 'AbortError' ||
    message.includes('signal is aborted') ||
    message.includes('request aborted') ||
    message.includes('timed out')
  )
}

function buildLocalFallbackInquiryNumber(prefix: string): string {
  const now = Date.now()
  const suffix = Number(String(now).slice(-4))
  const safeSuffix = Number.isFinite(suffix) && suffix > 0 ? suffix : Math.floor(Math.random() * 9000) + 1000
  return `${prefix}${String(safeSuffix).padStart(4, '0')}`
}

export async function allocateNextClientInquiryNumber(
  regionCode: string,
  dateValue?: unknown,
  customerId?: string | null,
  deps?: DependencyBag,
): Promise<string> {
  const normalizedRegionCode = String(regionCode || 'NA').toUpperCase()
  const prefix = buildInquiryNumberPrefix(normalizedRegionCode, dateValue)

  try {
    const { data, error } = await withSupabaseTimeout(
      supabase.rpc('next_inquiry_number', {
        p_region_code: normalizedRegionCode,
        p_customer_id: customerId ?? null,
      }),
      8000,
      'Inquiry number allocation request timed out',
    )

    if (!error && String(data || '').trim()) {
      return String(data).trim()
    }

    if (error && !isMissingRpcFunctionError(error, 'next_inquiry_number')) {
      console.warn('[Supabase] next_inquiry_number RPC unavailable, falling back to prefix scan.', error)
    }
  } catch (error) {
    console.warn('[Supabase] inquiry number RPC allocation failed, falling back to prefix scan.', error)
  }

  let data: any = null
  let error: any = null
  try {
    const result = await withSupabaseTimeout(
      supabase
        .from('inquiries')
        .select('inquiry_number')
        .like('inquiry_number', `${prefix}%`)
        .order('inquiry_number', { ascending: false })
        .limit(20),
      8000,
      'Inquiry number allocation request timed out',
    )
    data = result.data
    error = result.error
  } catch (scanError) {
    if (isTransientInquiryAllocationError(scanError)) {
      console.warn('[Supabase] inquiry number prefix scan timed out, using local fallback number.', scanError)
      return buildLocalFallbackInquiryNumber(prefix)
    }
    throw scanError
  }

  if (error) {
    if (isTransientInquiryAllocationError(error)) {
      console.warn('[Supabase] inquiry number prefix scan interrupted, using local fallback number.', error)
      return buildLocalFallbackInquiryNumber(prefix)
    }
    deps?.throwSupabaseError('allocateNextClientInquiryNumber inquiries', error)
    throw error
  }

  let maxSuffix = 0
  for (const row of data || []) {
    const inquiryNumber = String((row as any)?.inquiry_number || '')
    if (!inquiryNumber.startsWith(prefix)) continue
    const suffix = Number.parseInt(inquiryNumber.slice(prefix.length), 10)
    if (Number.isFinite(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix
    }
  }

  return `${prefix}${String(maxSuffix + 1).padStart(4, '0')}`
}

export async function insertInquiryWithServerAssignedNumber(
  payload: Record<string, any>,
  context: string,
  deps: DependencyBag,
): Promise<any> {
  const workingPayload: Record<string, any> = {
    ...payload,
    id: isUuidLike(String(payload.id || '').trim()) ? payload.id : crypto.randomUUID(),
    inquiry_number: null,
  }

  const removedColumns: string[] = []
  applyKnownMissingColumns('inquiries', workingPayload, removedColumns)

  for (let attempt = 0; attempt < 8; attempt++) {
    const allocatedInquiryNumber = await allocateNextClientInquiryNumber(
      String(workingPayload.region_code || 'NA'),
      workingPayload.date,
      null,
      deps,
    )
    workingPayload.inquiry_number = allocatedInquiryNumber
    if ((workingPayload.document_data_snapshot || null) && typeof workingPayload.document_data_snapshot === 'object') {
      workingPayload.document_data_snapshot = {
        ...workingPayload.document_data_snapshot,
        inquiryNo: allocatedInquiryNumber,
      }
    }

    let data: any = null
    let error: any = null
    try {
      const result = await withSupabaseTimeout(
        supabase
          .from('inquiries')
          .insert(workingPayload)
          .select()
          .single(),
        20000,
        'Inquiry create request timed out',
      )
      data = result.data
      error = result.error
    } catch (requestError) {
      if (isTransientInquiryAllocationError(requestError)) {
        console.warn(`[Supabase] ${context}: insert interrupted, retrying.`, requestError)
        continue
      }
      throw requestError
    }

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      return data
    }

    const missingColumn = deps.extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn]
      rememberMissingColumn('inquiries', missingColumn)
      removedColumns.push(missingColumn)
      continue
    }

    if (error.code === '23505' && String(error.message || '').includes('inquiries_pkey')) {
      const existing = await getExistingInquiryRowById(String(workingPayload.id || ''))
      if (existing) {
        return existing
      }
      continue
    }

    if (error.code === '23505' && String(error.message || '').includes('inquiries_inquiry_number_tenant_key')) {
      continue
    }

    deps.throwSupabaseError(context, error)
  }

  throw new Error(`${context} failed: exceeded retry budget`)
}

export async function resolveBusinessDocumentTemplateBinding(
  input: any,
  options: {
    documentCode: string
    nodeCode: string
    businessData: Record<string, any>
  },
  deps: DependencyBag,
): Promise<TemplateBindingResolution> {
  const cacheKey = `${options.documentCode}:${options.nodeCode}`
  const existingTemplateId = input.templateId || input.template_id || null
  const existingTemplateVersionId = input.templateVersionId || input.template_version_id || null
  const existingTemplateSnapshot = input.templateSnapshot || input.template_snapshot || null
  const existingDocumentSnapshot = input.documentDataSnapshot || input.document_data_snapshot || null

  if (existingTemplateSnapshot?.pendingResolution === true && existingTemplateId && existingTemplateVersionId) {
    return {
      template_id: existingTemplateId,
      template_version_id: existingTemplateVersionId,
      template_snapshot: existingTemplateSnapshot || {},
      document_data_snapshot: existingDocumentSnapshot || options.businessData,
      templateId: existingTemplateId,
      templateVersionId: existingTemplateVersionId,
      templateSnapshot: existingTemplateSnapshot || {},
      documentDataSnapshot: existingDocumentSnapshot || options.businessData,
    }
  }

  if (existingTemplateId && existingTemplateVersionId) {
    return {
      template_id: existingTemplateId,
      template_version_id: existingTemplateVersionId,
      template_snapshot: existingTemplateSnapshot || {},
      document_data_snapshot: existingDocumentSnapshot || options.businessData,
      templateId: existingTemplateId,
      templateVersionId: existingTemplateVersionId,
      templateSnapshot: existingTemplateSnapshot || {},
      documentDataSnapshot: existingDocumentSnapshot || options.businessData,
    }
  }

  const cachedBinding = templateBindingResolutionCache.get(cacheKey)
  if (cachedBinding) {
    return {
      ...cachedBinding,
      document_data_snapshot: existingDocumentSnapshot || options.businessData,
      documentDataSnapshot: existingDocumentSnapshot || options.businessData,
    }
  }

  const { data: bindingRow, error: bindingError } = await supabase
    .from('document_template_bindings')
    .select(`
      template_id,
      template_version_id,
      document_templates!inner (
        id,
        template_code,
        document_code,
        template_name_cn,
        template_name_en,
        business_stage,
        renderer_type,
        status
      ),
      document_template_versions!inner (
        id,
        version_no,
        version_label,
        status,
        schema_json,
        layout_json,
        style_tokens,
        sample_data,
        renderer_component,
        published_at
      )
    `)
    .eq('document_code', options.documentCode)
    .eq('node_code', options.nodeCode)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (bindingError) {
    throw deps.buildSupabaseError(`resolve template binding ${options.documentCode}/${options.nodeCode}`, bindingError)
  }

  let resolvedBindingRow: any = bindingRow
  if (!resolvedBindingRow) {
    const { data: templateRow, error: templateError } = await supabase
      .from('document_templates')
      .select(`
        id,
        template_code,
        document_code,
        template_name_cn,
        template_name_en,
        business_stage,
        renderer_type,
        status,
        current_version_id
      `)
      .eq('document_code', options.documentCode)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (templateError) {
      throw deps.buildSupabaseError(`resolve template fallback template ${options.documentCode}/${options.nodeCode}`, templateError)
    }

    if (!templateRow?.id || !templateRow.current_version_id) {
      throw new Error(`Missing template binding for ${options.documentCode}/${options.nodeCode}`)
    }

    const { data: versionRow, error: versionError } = await supabase
      .from('document_template_versions')
      .select(`
        id,
        version_no,
        version_label,
        status,
        schema_json,
        layout_json,
        style_tokens,
        sample_data,
        renderer_component,
        published_at
      `)
      .eq('id', templateRow.current_version_id)
      .maybeSingle()

    if (versionError) {
      throw deps.buildSupabaseError(`resolve template fallback version ${options.documentCode}/${options.nodeCode}`, versionError)
    }

    if (!versionRow?.id) {
      throw new Error(`Missing template version for ${options.documentCode}/${options.nodeCode}`)
    }

    const { error: upsertBindingError } = await supabase
      .from('document_template_bindings')
      .upsert({
        flow_code: DEFAULT_TEMPLATE_BINDING_FLOW_CODE,
        node_code: options.nodeCode,
        document_code: options.documentCode,
        template_id: templateRow.id,
        template_version_id: versionRow.id,
        is_default: true,
      }, { onConflict: 'flow_code,node_code,document_code,template_version_id' })

    if (upsertBindingError) {
      throw deps.buildSupabaseError(`upsert template binding ${options.documentCode}/${options.nodeCode}`, upsertBindingError)
    }

    resolvedBindingRow = {
      template_id: templateRow.id,
      template_version_id: versionRow.id,
      document_templates: templateRow,
      document_template_versions: versionRow,
    }
  }

  const templateMeta = Array.isArray((resolvedBindingRow as any).document_templates)
    ? (resolvedBindingRow as any).document_templates[0]
    : (resolvedBindingRow as any).document_templates
  const versionMeta = Array.isArray((resolvedBindingRow as any).document_template_versions)
    ? (resolvedBindingRow as any).document_template_versions[0]
    : (resolvedBindingRow as any).document_template_versions

  const resolvedDocumentData = mergeTemplateBusinessData(
    versionMeta?.sample_data || {},
    existingDocumentSnapshot || options.businessData,
  )

  const resolved = {
    template_id: resolvedBindingRow.template_id,
    template_version_id: resolvedBindingRow.template_version_id,
    template_snapshot: {
      template: templateMeta || null,
      version: versionMeta || null,
    },
    document_data_snapshot: resolvedDocumentData,
    templateId: resolvedBindingRow.template_id,
    templateVersionId: resolvedBindingRow.template_version_id,
    templateSnapshot: {
      template: templateMeta || null,
      version: versionMeta || null,
    },
    documentDataSnapshot: resolvedDocumentData,
  }
  templateBindingResolutionCache.set(cacheKey, {
    ...resolved,
    document_data_snapshot: resolvedDocumentData,
    documentDataSnapshot: resolvedDocumentData,
  })
  return resolved
}

export async function enrichInquiryRowWithTemplateData(row: any, deps: DependencyBag) {
  if (!row) return row

  let workingRow = row
  const rawInquiryNumber = String(workingRow.inquiry_number || '').trim()
  if (!rawInquiryNumber || isUuidLike(rawInquiryNumber)) {
    try {
      const repairedInquiryNumber = await allocateNextClientInquiryNumber(
        String(workingRow.region_code || 'NA'),
        workingRow.date || workingRow.created_at,
        null,
        deps,
      )
      const nextDocumentSnapshot =
        workingRow.document_data_snapshot && typeof workingRow.document_data_snapshot === 'object'
          ? {
              ...workingRow.document_data_snapshot,
              inquiryNo: repairedInquiryNumber,
            }
          : { inquiryNo: repairedInquiryNumber }

      const { error: repairError } = await supabase
        .from('inquiries')
        .update({
          inquiry_number: repairedInquiryNumber,
          document_data_snapshot: nextDocumentSnapshot,
        })
        .eq('id', workingRow.id)

      if (!repairError) {
        workingRow = {
          ...workingRow,
          inquiry_number: repairedInquiryNumber,
          document_data_snapshot: nextDocumentSnapshot,
        }
      }
    } catch (error) {
      console.warn('[Supabase] enrichInquiryRowWithTemplateData: inquiry number repair skipped.', error)
    }
  }

  try {
    const currentBinding = await resolveBusinessDocumentTemplateBinding(workingRow, {
      documentCode: 'ING',
      nodeCode: 'ing-create',
      businessData: workingRow.document_data_snapshot || workingRow,
    }, deps)

    if (currentBinding.template_version_id) {
      workingRow = {
        ...workingRow,
        template_id: currentBinding.template_id || workingRow.template_id || null,
        template_version_id: currentBinding.template_version_id,
        template_snapshot: currentBinding.template_snapshot || workingRow.template_snapshot || {},
        document_data_snapshot: currentBinding.document_data_snapshot || workingRow.document_data_snapshot || {},
      }
    }
  } catch (error) {
    console.warn('[Supabase] enrichInquiryRowWithTemplateData: template binding fallback unavailable.', error)
  }

  const templateVersionId = String(workingRow.template_version_id || '').trim()
  const currentVersion = workingRow.template_snapshot?.version || null

  const needsVersionHydration =
    !!templateVersionId &&
    (
      !currentVersion ||
      currentVersion.sample_data === undefined ||
      currentVersion.layout_json === undefined
    )

  const resolvedVersion = needsVersionHydration
    ? await getDocumentTemplateVersionDetails(templateVersionId, deps)
    : currentVersion

  const mergedDocumentData = mergeTemplateBusinessData(
    resolvedVersion?.sample_data || {},
    workingRow.document_data_snapshot || {},
  )

  return {
    ...workingRow,
    template_snapshot: resolvedVersion
      ? {
          ...(workingRow.template_snapshot || {}),
          version: {
            ...(workingRow.template_snapshot?.version || {}),
            ...resolvedVersion,
          },
        }
      : (workingRow.template_snapshot || {}),
    document_data_snapshot: mergedDocumentData,
  }
}

export async function enrichInquiryRowsWithTemplateData(rows: any[] | null | undefined, deps: DependencyBag) {
  if (!Array.isArray(rows) || rows.length === 0) return rows || []
  return Promise.all(rows.map((row) => enrichInquiryRowWithTemplateData(row, deps)))
}

export async function upsertWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  onConflict: string,
  context: string,
  deps: DependencyBag,
) {
  const payload: Record<string, any> = { ...row }
  const removedColumns: string[] = []
  applyKnownMissingColumns(table, payload, removedColumns)
  let adjustedProfitRate = false
  for (let i = 0; i < 12; i++) {
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict })
      .select()
      .single()
    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      if (adjustedProfitRate) {
        console.warn(`[Supabase] ${context}: profit_rate downgraded to decimal for old schema compatibility`)
      }
      return { data, error: null }
    }
    const missingColumn = deps.extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      rememberMissingColumn(table, missingColumn)
      removedColumns.push(missingColumn)
      continue
    }
    const checkColumn = deps.extractCheckConstraintColumn(error, table)
    if (checkColumn && Object.prototype.hasOwnProperty.call(payload, checkColumn)) {
      console.warn(`[Supabase] ${context}: CHECK constraint on "${checkColumn}" — dropping column for this attempt only`)
      delete payload[checkColumn]
      removedColumns.push(checkColumn)
      continue
    }
    if (String(error?.code || '') === '23502') {
      const nullMsg = String(error?.message || '')
      const nullMatch = nullMsg.match(/null value in column "([^"]+)"/)
      if (nullMatch) {
        const nullCol = nullMatch[1]
        if (Object.prototype.hasOwnProperty.call(payload, nullCol) && payload[nullCol] == null) {
          console.warn(`[Supabase] ${context}: NOT NULL violation on "${nullCol}" — dropping null column`)
          delete payload[nullCol]
          removedColumns.push(nullCol)
          continue
        }
      }
    }
    if (deps.shouldDowngradeProfitRate(error, payload, adjustedProfitRate)) {
      payload.profit_rate = Number((Number(payload.profit_rate) / 100).toFixed(6))
      adjustedProfitRate = true
      continue
    }
    return {
      data: null,
      error: deps.buildSupabaseError(context, error, { removedColumns, adjustedProfitRate }),
    }
  }
  return {
    data: null,
    error: deps.buildSupabaseError(context, { message: `${context}: too many schema fallback retries` }, { removedColumns, adjustedProfitRate }),
  }
}

export async function updateWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  applyFilters: (query: any) => any,
  context: string,
  deps: DependencyBag,
) {
  const payload: Record<string, any> = { ...row }
  const removedColumns: string[] = []
  applyKnownMissingColumns(table, payload, removedColumns)

  for (let i = 0; i < 12; i++) {
    const { error } = await applyFilters(
      supabase.from(table).update(payload),
    )

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      return { error: null }
    }

    const missingColumn = deps.extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      rememberMissingColumn(table, missingColumn)
      removedColumns.push(missingColumn)
      continue
    }

    return { error: deps.buildSupabaseError(context, error, { removedColumns }) }
  }

  return { error: new Error(`${context} failed: exceeded schema fallback retry budget`) }
}

export async function upsertWithoutSelectWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  onConflict: string,
  context: string,
  deps: DependencyBag,
) {
  const payload: Record<string, any> = { ...row }
  const removedColumns: string[] = []
  applyKnownMissingColumns(table, payload, removedColumns)

  for (let i = 0; i < 12; i++) {
    const { error } = await supabase
      .from(table)
      .upsert(payload, { onConflict })

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      return { error: null }
    }

    const missingColumn = deps.extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      rememberMissingColumn(table, missingColumn)
      removedColumns.push(missingColumn)
      continue
    }

    return { error: deps.buildSupabaseError(context, error, { removedColumns }) }
  }

  return { error: new Error(`${context} failed: exceeded schema fallback retry budget`) }
}
