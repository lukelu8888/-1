import { supabase } from './supabase'
import {
  buildProcurementRequestNotes,
  DEFAULT_DOWNSTREAM_VISIBILITY,
  extractProcurementRequestContext,
  mergeCustomerInfoWithProcurementContext,
  parseProcurementRequestNotes,
} from '../utils/procurementRequestContext'
import { aggregateInquiryOemFromProducts } from '../types/oem'

// ============================================================
// 通用错误处理
// ============================================================
function handleError(error: any, context: string) {
  if (error?.name === 'AbortError') {
    return null
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
}

function throwSupabaseError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : buildSupabaseError(context, error))
}

function buildSupabaseError(
  context: string,
  error: any,
  options: {
    removedColumns?: string[]
    adjustedProfitRate?: boolean
  } = {},
) {
  const details: string[] = []
  const rawMessage = String(error?.message || error || 'Unknown Supabase error').trim()
  if (rawMessage) details.push(rawMessage)
  if (options.removedColumns?.length) {
    details.push(`schema fallback removed columns: ${options.removedColumns.join(', ')}`)
  }
  if (options.adjustedProfitRate) {
    details.push('profit_rate auto-converted from percent to decimal for old schema')
  }
  return new Error(`${context} failed${details.length ? `: ${details.join(' | ')}` : ''}`)
}

function extractMissingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the ['"]([^'"]+)['"] column/i)
  return match?.[1] || null
}

function isMissingColumnError(error: any, column: string): boolean {
  const message = String(error?.message || '')
  return (
    (error as any)?.code === '42703' ||
    message.includes(column) ||
    message.includes(`accounts_receivable.${column}`) ||
    extractMissingColumn(error) === column
  )
}

function matchesCustomerEmailFallback(row: Record<string, any> | null | undefined, email: string): boolean {
  if (!row || !email) return false
  const normalizedEmail = email.trim().toLowerCase()
  const candidates = [
    row.customer_email,
    row.customerEmail,
    row.email,
    row.customer?.email,
    row.customer?.customer_email,
    row.contact_email,
    row.bill_to_email,
    row.billing_email,
  ]

  return candidates.some((candidate) => String(candidate || '').trim().toLowerCase() === normalizedEmail)
}

function shouldDowngradeProfitRate(error: any, payload: Record<string, any>, adjustedProfitRate: boolean) {
  if (adjustedProfitRate) return false
  if (!Object.prototype.hasOwnProperty.call(payload, 'profit_rate')) return false
  const profitRate = Number(payload.profit_rate)
  if (!Number.isFinite(profitRate) || profitRate <= 1) return false
  const message = String(error?.message || '')
  return /numeric field overflow|value overflows numeric format/i.test(message)
}

function normalizeProfitRatePercent(value: any): number {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return 0
  if (raw !== 0 && Math.abs(raw) <= 1) return raw * 100
  return raw
}

function normalizeProfitRateForStorage(input: any, totalProfit?: any, totalCost?: any): number {
  const raw = Number(input)
  if (!Number.isFinite(raw)) return 0

  const numericTotalProfit = Number(totalProfit)
  const numericTotalCost = Number(totalCost)
  const derivedRatio = Number.isFinite(numericTotalProfit) && Number.isFinite(numericTotalCost) && numericTotalCost > 0
    ? numericTotalProfit / numericTotalCost
    : null
  const derivedPercent = derivedRatio == null ? null : derivedRatio * 100

  // 优先用 totals 判断当前值是“百分比”还是“decimal ratio”。
  if (derivedPercent != null && Math.abs(raw - derivedPercent) < 0.0001) {
    return Number(derivedRatio!.toFixed(6))
  }
  if (derivedRatio != null && Math.abs(raw - derivedRatio) < 0.0001) {
    return Number(derivedRatio.toFixed(6))
  }

  // 无法判定时兼容旧库：>= 1 视为百分比（18 => 0.18），< 1 视为旧 decimal。
  return Math.abs(raw) >= 1 ? Number((raw / 100).toFixed(6)) : raw
}

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

const DEFAULT_TEMPLATE_BINDING_FLOW_CODE = 'inq_qr_xj_bj_qt_sc_cg'
const templateBindingResolutionCache = new Map<string, TemplateBindingResolution>()
const missingColumnCache = new Map<string, Set<string>>()
const TEMPLATE_DEFAULT_NODE_BINDINGS: Record<string, string[]> = {
  ing: ['ing-create'],
  qt: ['qt-create'],
  qr: ['qr-create'],
  xj: ['xj-create'],
  sc: ['sc-create'],
  cg: ['cg-create'],
  bj: ['bj-review'],
}

function applyKnownMissingColumns(table: string, payload: Record<string, any>, removedColumns: string[]) {
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

function rememberMissingColumn(table: string, column: string) {
  const next = missingColumnCache.get(table) ?? new Set<string>()
  next.add(column)
  missingColumnCache.set(table, next)
}

function hasKnownMissingColumn(table: string, column: string) {
  return missingColumnCache.get(table)?.has(column) ?? false
}

function isUuidLike(value: unknown): boolean {
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

async function insertInquiryWithClientAllocatedNumber(
  basePayload: Record<string, any>,
  removedColumns: string[],
): Promise<any> {
  const payload = { ...basePayload }
  let currentId = isUuidLike(payload.id) ? String(payload.id) : crypto.randomUUID()

  for (let i = 0; i < 20; i++) {
    const inquiryNumber = await allocateNextClientInquiryNumber(
      String(payload.region_code || 'NA'),
      payload.date,
    )
    const insertPayload: Record<string, any> = {
      ...payload,
      id: currentId,
      inquiry_number: inquiryNumber,
    }
    applyKnownMissingColumns('inquiries', insertPayload, removedColumns)

    const result = await withSupabaseTimeout(
      supabase
        .from('inquiries')
        .insert(insertPayload)
        .select()
        .single(),
      12000,
      'Inquiry fallback insert request timed out',
    )

    if (!result.error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] client inquiry insert fallback removed columns: ${removedColumns.join(', ')}`)
      }
      return result.data
    }

    const missingColumn = extractMissingColumn(result.error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      rememberMissingColumn('inquiries', missingColumn)
      if (!removedColumns.includes(missingColumn)) removedColumns.push(missingColumn)
      continue
    }

    if (isInquiryNumberConflictError(result.error)) {
      continue
    }

    if (result.error?.code === '23505' && String(result.error?.message || '').includes('inquiries_pkey')) {
      currentId = crypto.randomUUID()
      continue
    }

    throwSupabaseError('insert inquiry (client fallback)', result.error)
  }

  throw new Error('insert inquiry (client fallback) failed: exceeded retry budget')
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

async function allocateNextClientInquiryNumber(regionCode: string, dateValue?: unknown): Promise<string> {
  const prefix = buildInquiryNumberPrefix(regionCode, dateValue)
  const { data, error } = await withSupabaseTimeout(
    supabase
      .from('inquiries')
      .select('inquiry_number')
      .like('inquiry_number', `${prefix}%`),
    12000,
    'Inquiry number allocation request timed out',
  )

  if (error) {
    throwSupabaseError('allocateNextClientInquiryNumber inquiries', error)
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

async function createInquiryAtomicallyViaRpc(
  payload: Record<string, any>,
  context: string,
): Promise<any> {
  const rpcPayload = {
    ...payload,
    id: isUuidLike(String(payload.id || '').trim()) ? payload.id : crypto.randomUUID(),
    inquiry_number: null,
  }

  const { data, error } = await withSupabaseTimeout(
    supabase.rpc('create_inquiry_atomic', { p_payload: rpcPayload }),
    20000,
    'Inquiry number allocation request timed out',
  )

  if (error) {
    throwSupabaseError(context, error)
  }

  return data
}

async function insertInquiryWithServerAssignedNumber(
  payload: Record<string, any>,
  context: string,
): Promise<any> {
  const workingPayload: Record<string, any> = {
    ...payload,
    id: isUuidLike(String(payload.id || '').trim()) ? payload.id : crypto.randomUUID(),
    inquiry_number: null,
  }

  const removedColumns: string[] = []
  applyKnownMissingColumns('inquiries', workingPayload, removedColumns)

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('inquiries')
        .insert(workingPayload)
        .select()
        .single(),
      20000,
      'Inquiry create request timed out',
    )

    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      return data
    }

    const missingColumn = extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn]
      rememberMissingColumn('inquiries', missingColumn)
      removedColumns.push(missingColumn)
      continue
    }

    if (error.code === '23505' && String(error.message || '').includes('inquiries_pkey')) {
      workingPayload.id = crypto.randomUUID()
      continue
    }

    if (error.code === '23505' && String(error.message || '').includes('inquiries_inquiry_number_tenant_key')) {
      workingPayload.inquiry_number = null
      continue
    }

    throwSupabaseError(context, error)
  }

  throw new Error(`${context} failed: exceeded retry budget`)
}

export const uiPreferenceService = {
  async get(key: string): Promise<Record<string, any> | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw buildSupabaseError('load ui preference session', sessionError)
    const userId = session?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('user_profiles')
      .select('ui_preferences')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw buildSupabaseError(`load ui preference ${key}`, error)

    const preferences = (data as any)?.ui_preferences || {}
    return preferences[key] || null
  },

  async save(key: string, value: Record<string, any>): Promise<Record<string, any>> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw buildSupabaseError('save ui preference session', sessionError)
    const userId = session?.user?.id
    if (!userId) throw new Error('Not authenticated')

    const { data: profileRow, error: loadError } = await supabase
      .from('user_profiles')
      .select('ui_preferences')
      .eq('id', userId)
      .maybeSingle()

    if (loadError) throw buildSupabaseError(`load current ui preferences ${key}`, loadError)

    const nextPreferences = {
      ...(((profileRow as any)?.ui_preferences || {}) as Record<string, any>),
      [key]: value,
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ui_preferences: nextPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) throw buildSupabaseError(`save ui preference ${key}`, updateError)

    return value
  },
}

async function resolveBusinessDocumentTemplateBinding(input: any, options: {
  documentCode: string
  nodeCode: string
  businessData: Record<string, any>
}): Promise<TemplateBindingResolution> {
  const cacheKey = `${options.documentCode}:${options.nodeCode}`
  const existingTemplateId = input.templateId || input.template_id || null
  const existingTemplateVersionId = input.templateVersionId || input.template_version_id || null
  const existingTemplateSnapshot = input.templateSnapshot || input.template_snapshot || null
  const existingDocumentSnapshot = input.documentDataSnapshot || input.document_data_snapshot || null

  if (existingTemplateSnapshot?.pendingResolution === true) {
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
    throw buildSupabaseError(`resolve template binding ${options.documentCode}/${options.nodeCode}`, bindingError)
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
      throw buildSupabaseError(`resolve template fallback template ${options.documentCode}/${options.nodeCode}`, templateError)
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
        renderer_component,
        published_at
      `)
      .eq('id', templateRow.current_version_id)
      .maybeSingle()

    if (versionError) {
      throw buildSupabaseError(`resolve template fallback version ${options.documentCode}/${options.nodeCode}`, versionError)
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
      throw buildSupabaseError(`upsert template binding ${options.documentCode}/${options.nodeCode}`, upsertBindingError)
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

  const resolved = {
    template_id: resolvedBindingRow.template_id,
    template_version_id: resolvedBindingRow.template_version_id,
    template_snapshot: {
      template: templateMeta || null,
      version: versionMeta || null,
    },
    document_data_snapshot: options.businessData,
    templateId: resolvedBindingRow.template_id,
    templateVersionId: resolvedBindingRow.template_version_id,
    templateSnapshot: {
      template: templateMeta || null,
      version: versionMeta || null,
    },
    documentDataSnapshot: options.businessData,
  }
  templateBindingResolutionCache.set(cacheKey, {
    ...resolved,
    document_data_snapshot: existingDocumentSnapshot || options.businessData,
    documentDataSnapshot: existingDocumentSnapshot || options.businessData,
  })
  return resolved
}

async function withSupabaseTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ])
}

async function upsertWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  onConflict: string,
  context: string,
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
    const missingColumn = extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      rememberMissingColumn(table, missingColumn)
      removedColumns.push(missingColumn)
      continue
    }
    if (shouldDowngradeProfitRate(error, payload, adjustedProfitRate)) {
      payload.profit_rate = Number((Number(payload.profit_rate) / 100).toFixed(6))
      adjustedProfitRate = true
      continue
    }
    return {
      data: null,
      error: buildSupabaseError(context, error, { removedColumns, adjustedProfitRate }),
    }
  }
  return {
    data: null,
    error: buildSupabaseError(context, { message: `${context}: too many schema fallback retries` }, { removedColumns, adjustedProfitRate }),
  }
}

// ============================================================
// 销售合同
// ============================================================
export const contractService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_contracts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll contracts', error)
    return data
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('sales_contracts')
      .select('*')
      .or(`customer_email.eq.${email},sales_person.eq.${email}`)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByEmail contracts', error)
    return data
  },

  async upsert(contract: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(contract, {
      documentCode: 'SC',
      nodeCode: 'sc-create',
      businessData: contract.documentDataSnapshot || contract.document_data_snapshot || contract,
    })
    const row = toContractRow({ ...contract, ...templateBinding })
    const { data, error } = await supabase
      .from('sales_contracts')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) throwSupabaseError('upsert contract', error)
    return fromContractRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('sales_contracts')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throwSupabaseError('updateStatus contract', error)
    return fromContractRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sales_contracts')
      .delete()
      .eq('id', id)
    if (error) throwSupabaseError('delete contract', error)
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sales_contracts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_contracts' }, callback)
      .subscribe()
  },
}

// ============================================================
// 订单
// ============================================================
export const orderService = {
  async getAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll orders')
    return data
  },

  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByCustomerEmail orders')
    return data
  },

  async upsert(order: any) {
    const row = toOrderRow(order)
    const { data, error } = await supabase
      .from('orders')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert order')
    return fromOrderRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus order')
    return fromOrderRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) return handleError(error, 'delete order')
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
      .subscribe()
  },
}

// ============================================================
// 应收账款
// ============================================================
export const arService = {
  async getAll() {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll AR')
    return data
  },

  async getByEmail(email: string) {
    // This schema is missing `customer_email` in local/dev for at least one tenant.
    // Querying it directly creates noisy 400s in the browser console, so use a
    // row scan + client-side match instead.
    rememberMissingColumn('accounts_receivable', 'customer_email')
    const { data: allRows, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return handleError(error, 'getByEmail AR fallback')
    }

    return (allRows || []).filter((row: any) => matchesCustomerEmailFallback(row, email))
  },

  async upsert(ar: any) {
    const row = toARRow(ar)
    const { data, error } = await upsertWithSchemaFallback(
      'accounts_receivable',
      row,
      'id',
      'upsert AR',
    )
    if (error) return handleError(error, 'upsert AR')
    return fromARRow(data)
  },

  async updateByOrderNumber(orderNumber: string, update: Record<string, any>) {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('order_number', orderNumber)
      .select()
      .single()
    if (error) return handleError(error, 'updateByOrderNumber AR')
    return fromARRow(data)
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('ar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_receivable' }, callback)
      .subscribe()
  },
}

// ============================================================
// 审批记录
// ============================================================
export const approvalService = {
  async getPending(approverEmail: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .eq('approver_email', approverEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getPending approvals')
    return data
  },

  async upsert(record: any) {
    const { data, error } = await supabase
      .from('approval_records')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert approval')
    return data
  },

  async updateStatus(id: string, status: 'approved' | 'rejected', notes?: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus approval')
    return data
  },

  async deleteByTargetId(targetId: string) {
    const { error } = await supabase
      .from('approval_records')
      .delete()
      .eq('target_id', targetId)
    if (error) return handleError(error, 'deleteByTargetId approval')
    return true
  },

  subscribeToChanges(approverEmail: string, callback: (payload: any) => void) {
    return supabase
      .channel(`approval_changes_${approverEmail}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_records',
        filter: `approver_email=eq.${approverEmail}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 通知
// ============================================================
export const notificationService = {
  async getForUser(email: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_email', email)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return handleError(error, 'getForUser notifications')
    return data
  },

  async send(notification: { recipient_email: string; type: string; title: string; message?: string; data?: any }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    if (error) return handleError(error, 'send notification')
    return data
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) return handleError(error, 'markRead notification')
    return true
  },

  subscribeToUser(email: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${email}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_email=eq.${email}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 销售报价单（SalesQuotation QT）
// ============================================================
export const salesQuotationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll salesQuotations', error)
    return (data || []).map(fromSalesQuotationRow)
  },

  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByCustomerEmail salesQuotations', error)
    return (data || []).map(fromSalesQuotationRow)
  },

  async getBySalesPerson(email: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('sales_person', email)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getBySalesPerson salesQuotations', error)
    return (data || []).map(fromSalesQuotationRow)
  },

  async getByQrNumber(qrNumber: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('qr_number', qrNumber)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getByQrNumber salesQuotations', error)
    return (data || []).map(fromSalesQuotationRow)
  },

  async upsert(quotation: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(quotation, {
      documentCode: 'QT',
      nodeCode: 'qt-create',
      businessData: quotation.documentDataSnapshot || quotation.document_data_snapshot || quotation,
    })
    const row = toSalesQuotationRow({ ...quotation, ...templateBinding })
    const { data, error } = await upsertWithSchemaFallback(
      'sales_quotations',
      row,
      'id',
      'upsert salesQuotation',
    )
    if (error) throw (error instanceof Error ? error : buildSupabaseError('upsert salesQuotation', error))
    return fromSalesQuotationRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .update({ approval_status: status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throwSupabaseError('updateStatus salesQuotation', error)
    return fromSalesQuotationRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('sales_quotations').delete().eq('id', id)
    if (error) throwSupabaseError('delete salesQuotation', error)
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sales_quotations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_quotations' }, callback)
      .subscribe()
  },
}

// ============================================================
// 通知（Notifications）
// ============================================================
export const notificationSupabaseService = {
  async getForUser(email: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_email', email)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return handleError(error, 'getForUser notifications')
    return (data || []).map(fromNotificationRow)
  },

  async send(notification: {
    recipient_email: string
    type: string
    title: string
    message?: string
    related_id?: string
    related_type?: string
    sender?: string
    metadata?: any
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
        created_at_ms: Date.now(),
      })
      .select()
      .single()
    if (error) return handleError(error, 'send notification')
    return fromNotificationRow(data)
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) return handleError(error, 'markRead notification')
    return true
  },

  async markAllRead(recipientEmail: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_email', recipientEmail)
    if (error) return handleError(error, 'markAllRead notifications')
    return true
  },

  async delete(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) return handleError(error, 'delete notification')
    return true
  },

  async deleteAll(recipientEmail: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_email', recipientEmail)
    if (error) return handleError(error, 'deleteAll notifications')
    return true
  },

  subscribeToUser(email: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_v2_${email.replace('@', '_').replace('.', '_')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_email=eq.${email}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 编号生成（DB 原子递增，并发安全）
// ============================================================
export async function nextInquiryNumber(regionCode: string = 'NA', customerId?: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_inquiry_number', {
    p_region_code: regionCode,
    p_customer_id: customerId ?? null,
  })
  if (error) {
    console.error('[Supabase] next_inquiry_number RPC failed:', error.message)
    throw new Error(`Failed to generate inquiry number: ${error.message}`)
  }
  return data as string
}

export async function nextInternalModelNo(regionCode: string = 'NA'): Promise<string> {
  const { data, error } = await supabase.rpc('next_internal_model_no', {
    p_region_code: regionCode,
  })
  if (error) {
    console.error('[Supabase] next_internal_model_no RPC failed:', error.message)
    throw new Error(`Failed to generate internal model number: ${error.message}`)
  }
  return data as string
}

function toProductMasterRow(product: any) {
  return {
    id: product.id || undefined,
    internal_model_no: product.internalModelNo || product.modelNo || product.internal_model_no || product.model_no,
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

export const productMasterService = {
  async getAll() {
    const { data, error } = await supabase
      .from('product_master')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll product_master', error)
    return (data || []).map(fromProductMasterRow)
  },

  async getByInternalModelNo(internalModelNo: string) {
    const { data, error } = await supabase
      .from('product_master')
      .select('*')
      .eq('internal_model_no', internalModelNo)
      .maybeSingle()
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
    const { data, error } = await supabase
      .from('product_master')
      .insert(row)
      .select()
      .single()
    if (error) throwSupabaseError('create product_master', error)
    return fromProductMasterRow(data)
  },

  async upsert(product: any) {
    const row = toProductMasterRow(product)
    const { data, error } = await supabase
      .from('product_master')
      .upsert(row, { onConflict: 'internal_model_no' })
      .select()
      .single()
    if (error) throwSupabaseError('upsert product_master', error)
    return fromProductMasterRow(data)
  },
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

function sanitizePersistedInquiryProducts(products: any[] = []) {
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
    const { data, error } = await supabase
      .from('product_mapping_events')
      .insert(row)
      .select()
      .single()
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
    const { data, error } = await supabase
      .from('product_model_mappings')
      .select('*')
      .eq('id', mappingId)
      .maybeSingle()
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
    const { data, error } = await supabase
      .from('product_model_mappings')
      .insert(row)
      .select()
      .single()
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
    const { data, error } = await supabase
      .from('product_model_mappings')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
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

// ============================================================
// 询价单（Inquiries）
// ============================================================
export const inquiryService = {
  async loadAllSortedRows() {
    if (hasKnownMissingColumn('inquiries', 'created_at')) {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
      if (error) throwSupabaseError('loadAllSortedRows inquiries fallback', error)
      return data || []
    }

    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingColumnError(error, 'created_at')) {
        rememberMissingColumn('inquiries', 'created_at')
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from('inquiries')
          .select('*')
        if (fallbackError) throwSupabaseError('loadAllSortedRows inquiries fallback', fallbackError)
        return fallbackRows || []
      }
      throwSupabaseError('loadAllSortedRows inquiries', error)
    }

    return data || []
  },

  async getAll() {
    const rows = await this.loadAllSortedRows()
    return rows.map(fromInquiryRow)
  },

  async getSubmitted() {
    const rows = await this.loadAllSortedRows()
    return rows.filter((row: any) => row?.is_submitted === true).map(fromInquiryRow)
  },

  async getByUserEmail(email: string) {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return []

    if (hasKnownMissingColumn('inquiries', 'user_email')) {
      const rows = await this.loadAllSortedRows()
      return rows
        .filter((row: any) => {
          const inquiry = fromInquiryRow(row)
          const rowUserEmail = String(row?.user_email || '').trim().toLowerCase()
          const buyerEmail = String(inquiry?.buyerInfo?.email || '').trim().toLowerCase()
          return rowUserEmail === normalizedEmail || buyerEmail === normalizedEmail
        })
        .map(fromInquiryRow)
    }

    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingColumnError(error, 'user_email') || isMissingColumnError(error, 'created_at')) {
        if (isMissingColumnError(error, 'user_email')) {
          rememberMissingColumn('inquiries', 'user_email')
          console.warn('[Supabase] getByUserEmail inquiries fallback: user_email column unavailable, loading filtered rows in memory')
        }
        if (isMissingColumnError(error, 'created_at')) {
          rememberMissingColumn('inquiries', 'created_at')
        }
        const rows = await this.loadAllSortedRows()
        return rows
          .filter((row: any) => {
            const inquiry = fromInquiryRow(row)
            const rowUserEmail = String(row?.user_email || '').trim().toLowerCase()
            const buyerEmail = String(inquiry?.buyerInfo?.email || '').trim().toLowerCase()
            return rowUserEmail === normalizedEmail || buyerEmail === normalizedEmail
          })
          .map(fromInquiryRow)
      }
      throwSupabaseError('getByUserEmail inquiries', error)
    }

    return (data || []).map(fromInquiryRow)
  },

  async getByCompanyId(companyId: string) {
    const normalizedCompanyId = String(companyId || '').trim()
    if (!normalizedCompanyId) return []

    if (hasKnownMissingColumn('inquiries', 'company_id')) {
      const rows = await this.loadAllSortedRows()
      return rows
        .filter((row: any) => String(row?.company_id || '').trim() === normalizedCompanyId)
        .map(fromInquiryRow)
    }

    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingColumnError(error, 'company_id') || isMissingColumnError(error, 'created_at')) {
        if (isMissingColumnError(error, 'company_id')) {
          rememberMissingColumn('inquiries', 'company_id')
          console.warn('[Supabase] getByCompanyId inquiries fallback: company_id column unavailable, loading filtered rows in memory')
        }
        if (isMissingColumnError(error, 'created_at')) {
          rememberMissingColumn('inquiries', 'created_at')
        }
        const rows = await this.loadAllSortedRows()
        return rows
          .filter((row: any) => String(row?.company_id || '').trim() === normalizedCompanyId)
          .map(fromInquiryRow)
      }
      throwSupabaseError('getByCompanyId inquiries', error)
    }

    return (data || []).map(fromInquiryRow)
  },

  async getByBuyerCompany(companyName: string) {
    const normalizedName = String(companyName || '').trim()
    if (!normalizedName) return []

    if (hasKnownMissingColumn('inquiries', 'buyer_company')) {
      const rows = await this.loadAllSortedRows()
      return rows
        .filter((row: any) => {
          const inquiry = fromInquiryRow(row)
          return String(row?.buyer_company || inquiry?.buyerInfo?.companyName || '').trim() === normalizedName
        })
        .map(fromInquiryRow)
    }

    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('buyer_company', normalizedName)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingColumnError(error, 'buyer_company') || isMissingColumnError(error, 'created_at')) {
        if (isMissingColumnError(error, 'buyer_company')) {
          rememberMissingColumn('inquiries', 'buyer_company')
          console.warn('[Supabase] getByBuyerCompany inquiries fallback: buyer_company column unavailable, loading filtered rows in memory')
        }
        if (isMissingColumnError(error, 'created_at')) {
          rememberMissingColumn('inquiries', 'created_at')
        }
        const rows = await this.loadAllSortedRows()
        return rows
          .filter((row: any) => {
            const inquiry = fromInquiryRow(row)
            return String(row?.buyer_company || inquiry?.buyerInfo?.companyName || '').trim() === normalizedName
          })
          .map(fromInquiryRow)
      }
      throwSupabaseError('getByBuyerCompany inquiries', error)
    }

    return (data || []).map(fromInquiryRow)
  },

  async createAtomic(inquiry: any) {
    let templateBinding: Record<string, any> = {}
    try {
      templateBinding = await withSupabaseTimeout(
        resolveBusinessDocumentTemplateBinding(inquiry, {
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

    const row = toInquiryRow({ ...inquiry, ...templateBinding })
    const payload: Record<string, any> = {
      ...row,
      inquiry_number: null,
    }
    const fallbackData = await insertInquiryWithServerAssignedNumber(payload, 'createAtomic inquiry')
    return fromInquiryRow(fallbackData)
  },

  async upsert(inquiry: any) {
    let templateBinding: Record<string, any> = {}
    try {
      templateBinding = await withSupabaseTimeout(
        resolveBusinessDocumentTemplateBinding(inquiry, {
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
    const row = toInquiryRow({ ...inquiry, ...templateBinding })
    const payload: Record<string, any> = { ...row }
    const removedColumns: string[] = []
    applyKnownMissingColumns('inquiries', payload, removedColumns)
    let data: any = null
    let error: any = null

    for (let i = 0; i < 12; i++) {
      const result = await withSupabaseTimeout(
        supabase
          .from('inquiries')
          .upsert(payload, { onConflict: 'id', ignoreDuplicates: false })
          .select()
          .single(),
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
      const missingColumn = extractMissingColumn(error)
      if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
        delete payload[missingColumn]
        rememberMissingColumn('inquiries', missingColumn)
        removedColumns.push(missingColumn)
        continue
      }
      break
    }
    if (!error) return fromInquiryRow(data)

    if (error.code === '23505') {
      console.warn('[Supabase] inquiry_number conflict during upsert, retrying with server-side insert allocation...')
      const atomicPayload: Record<string, any> = {
        ...payload,
        inquiry_number: null,
      }
      const fallbackData = await insertInquiryWithServerAssignedNumber(atomicPayload, 'upsert inquiry (retry)')
      return fromInquiryRow(fallbackData)
    }
    throwSupabaseError('upsert inquiry', error)
  },

  async update(id: string, inquiry: any) {
    const row = toInquiryRow({ ...inquiry, id })
    row.id = id

    const { data, error } = await supabase
      .from('inquiries')
      .update({
        inquiry_number: row.inquiry_number,
        date: row.date,
        user_email: row.user_email,
        company_id: row.company_id,
        region_code: row.region_code,
        status: row.status,
        is_submitted: row.is_submitted,
        total_price: row.total_price,
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
      .single()
    if (error) throwSupabaseError('update inquiry', error)
    return fromInquiryRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throwSupabaseError('updateStatus inquiry', error)
    return fromInquiryRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('inquiries').delete().eq('id', id)
    if (error) throwSupabaseError('delete inquiry', error)
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('inquiries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, callback)
      .subscribe()
  },
}

// ============================================================
// 数据格式转换（camelCase ↔ snake_case）
// ============================================================
function toContractRow(c: any) {
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
    : null);
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
    sales_person: c.salesPerson || '',
    sales_person_name: c.salesPersonName || null,
    supervisor: c.supervisor || null,
    region: c.region || null,
    products: c.products || [],
    total_amount: c.totalAmount || 0,
    currency: c.currency || 'USD',
    trade_terms: c.tradeTerms || null,
    payment_terms: c.paymentTerms || null,
    deposit_percentage: c.depositPercentage || 30,
    deposit_amount: c.depositAmount || 0,
    balance_percentage: c.balancePercentage || 70,
    balance_amount: c.balanceAmount || 0,
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
    salesPerson: r.sales_person,
    salesPersonName: r.sales_person_name,
    supervisor: r.supervisor,
    region: r.region,
    products: r.products || [],
    totalAmount: r.total_amount,
    currency: r.currency,
    tradeTerms: r.trade_terms,
    paymentTerms: r.payment_terms,
    depositPercentage: r.deposit_percentage,
    depositAmount: r.deposit_amount,
    balancePercentage: r.balance_percentage,
    balanceAmount: r.balance_amount,
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

// SalesQuotation 转换
function toSalesQuotationRow(q: any) {
  const uuid = toUUID(q.id)
  const createdBy = toUUIDOrNull(q.createdBy || q.created_by || null)
  const customerResponseValue =
    q.customerResponse == null
      ? null
      : (typeof q.customerResponse === 'string'
          ? q.customerResponse
          : JSON.stringify(q.customerResponse));
  const profitRateValue = normalizeProfitRateForStorage(
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
    sales_person: q.salesPerson || '',
    sales_person_name: q.salesPersonName || null,
    items: q.items || [],
    total_cost: q.totalCost || 0,
    total_price: q.totalPrice || 0,
    total_amount: q.totalPrice || 0,
    total_profit: q.totalProfit || 0,
    profit_rate: profitRateValue,
    currency: q.currency || 'USD',
    payment_terms: q.paymentTerms || null,
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
    // 兼容当前线上表结构：使用 customer_response（text/json 文本）
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

function fromSalesQuotationRow(r: any) {
  if (!r) return null
  let parsedCustomerResponse: any = null;
  const responseRaw = r.customer_response_data ?? r.customer_response;
  if (responseRaw != null) {
    if (typeof responseRaw === 'string') {
      try {
        parsedCustomerResponse = JSON.parse(responseRaw);
      } catch {
        parsedCustomerResponse = responseRaw;
      }
    } else {
      parsedCustomerResponse = responseRaw;
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
    salesPerson: r.sales_person,
    salesPersonName: r.sales_person_name,
    items: r.items || [],
    totalCost: r.total_cost || 0,
    totalPrice: r.total_price || r.total_amount || 0,
    totalProfit: r.total_profit || 0,
    profitRate: normalizeProfitRatePercent(r.profit_rate || 0),
    currency: r.currency || 'USD',
    paymentTerms: r.payment_terms,
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
    globalDefaults: r.pricing_defaults || null, // 兼容旧组件字段名
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

// Notification 转换
function fromNotificationRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message || '',
    relatedId: r.related_id || r.reference_id,
    relatedType: r.related_type || r.reference_type,
    recipient: r.recipient_email,
    sender: r.sender,
    read: r.is_read || false,
    createdAt: r.created_at_ms || new Date(r.created_at).getTime(),
    metadata: r.metadata,
  }
}

// ============================================================
// 通用区域转换工具（所有表共用）
// DB 统一存 region_code (NA/SA/EA)，前端可能传全名或代码
// ============================================================
export const REGION_NAME_TO_CODE: Record<string, string> = {
  'North America': 'NA', 'north america': 'NA', 'north-america': 'NA',
  'South America': 'SA', 'south america': 'SA', 'south-america': 'SA',
  'Europe & Africa': 'EA', 'europe & africa': 'EA', 'EMEA': 'EA', 'emea': 'EA',
  'NA': 'NA', 'SA': 'SA', 'EA': 'EA',
};

export const REGION_CODE_TO_NAME: Record<string, string> = {
  'NA': 'North America',
  'SA': 'South America',
  'EA': 'Europe & Africa',
};

/** 前端 region 值 → DB region_code */
export function toRegionCode(region: string | null | undefined): string | null {
  if (!region) return null;
  return REGION_NAME_TO_CODE[region] || region;
}

/** DB region_code → 前端 region 值（保持代码格式，不转全名） */
export function fromRegionCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code; // 前端统一用代码（NA/SA/EA）
}

/** 安全生成 UUID（若传入的 id 不是 UUID 格式则重新生成） */
export function toUUID(id: string | null | undefined): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return crypto.randomUUID();
}

/** UUID 或 null（用于可空的 uuid 外键列） */
export function toUUIDOrNull(id: string | null | undefined): string | null {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return null;
}

/** 日期转 ISO 格式 YYYY-MM-DD */
export function toIsoDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0];
  return String(v);
}

// (salesQuotationService defined above at line ~283, kept there with full methods)

// ============================================================
// supplier_xjs 服务
// ============================================================
// COSUN 单租户固定 ID（对标 Supabase tenants 表）
const COSUN_TENANT_ID = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9';

function toXJRow(x: any) {
  // 严格对标 supplier_xjs 表实际列（Supabase-first）
  // NOT NULL: id, tenant_id, xj_number, supplier_code, supplier_name,
  //           supplier_email, products, status, created_by
  const xjNumber = x.xjNumber || x.xj_number || x.supplierXjNo || x.supplier_xj_no || '';
  const projectExecutionBaseline = x.documentRenderMeta?.projectExecutionBaseline || (x.projectRevisionId
    ? {
        projectId: x.projectId || null,
        projectCode: x.projectCode || null,
        projectName: x.projectName || null,
        projectRevisionId: x.projectRevisionId || null,
        projectRevisionCode: x.projectRevisionCode || null,
        projectRevisionStatus: x.projectRevisionStatus || null,
        finalRevisionId: x.finalRevisionId || null,
        finalQuotationId: x.finalQuotationId || null,
        finalQuotationNumber: x.finalQuotationNumber || null,
      }
    : null);
  return {
    id: toUUID(x.id),
    tenant_id: x.tenant_id || COSUN_TENANT_ID,               // NOT NULL，固定单租户
    xj_number: xjNumber,                                      // NOT NULL，唯一约束键
    supplier_xj_no: x.supplierXjNo || x.supplier_xj_no || null,
    supplier_quotation_no: x.supplierQuotationNo || x.supplier_quotation_no || null,
    source_qr_number: x.sourceQRNumber || x.source_qr_number || null,
    source_inquiry_id: toUUIDOrNull(x.sourceInquiryId || x.source_inquiry_id),
    source_inquiry_number: x.sourceInquiryNumber || x.source_inquiry_number || null,
    requirement_no: x.requirementNo || x.requirement_no || null,
    source_ref: x.sourceRef || x.source_ref || null,
    region_code: toRegionCode(x.region || x.region_code),
    customer_name: x.customerName || x.customer_name || null,
    customer_region: x.customerRegion || x.customer_region || null,
    supplier_company_id: toUUIDOrNull(x.supplierCompanyId || x.supplier_company_id),
    supplier_code: x.supplierCode || x.supplier_code || '',
    supplier_name: x.supplierName || x.supplier_name || '',
    supplier_contact: x.supplierContact || x.supplier_contact || null,
    supplier_email: x.supplierEmail || x.supplier_email || '',
    products: x.products || [],
    product_name: x.productName || x.product_name || null,
    model_no: x.modelNo || x.model_no || null,
    specification: x.specification || null,
    quantity: x.quantity ?? null,
    unit: x.unit || null,
    target_price: x.targetPrice ?? x.target_price ?? null,
    currency: x.currency || 'USD',
    expected_date: toIsoDate(x.expectedDate || x.expected_date),
    quotation_deadline: toIsoDate(x.quotationDeadline || x.quotation_deadline),
    due_date: toIsoDate(x.dueDate || x.due_date || x.quotationDeadline || x.quotation_deadline),
    priority: x.priority || 'normal',                         // DB default 是 'normal'
    status: x.status || 'pending',
    quotes: x.quotes || [],
    document_data: x.documentData || x.document_data || null,
    remarks: x.remarks || null,
    created_by: x.createdBy || x.created_by || '',
    source_doc_id: toUUIDOrNull(x.sourceDocId || x.source_doc_id),
    sales_contract_id: toUUIDOrNull(x.salesContractId || x.sales_contract_id),
    root_sales_contract_id: toUUIDOrNull(x.rootSalesContractId || x.root_sales_contract_id),
    display_number: x.displayNumber || x.display_number || xjNumber || null,
    template_id: x.templateId || x.template_id || null,
    template_version_id: x.templateVersionId || x.template_version_id || null,
    template_snapshot: x.templateSnapshot || x.template_snapshot || {},
    document_data_snapshot: x.documentDataSnapshot || x.document_data_snapshot || {},
    document_render_meta: {
      ...(x.documentRenderMeta || x.document_render_meta || {}),
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  };
}

function fromXJRow(r: any) {
  if (!r) return null;
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null;
  return {
    id: r.id,
    tenantId: r.tenant_id,
    xjNumber: r.xj_number,
    supplierXjNo: r.supplier_xj_no,
    supplierQuotationNo: r.supplier_quotation_no,
    sourceQRNumber: r.source_qr_number,
    sourceInquiryId: r.source_inquiry_id,
    sourceInquiryNumber: r.source_inquiry_number,
    requirementNo: r.requirement_no,
    sourceRef: r.source_ref,
    region: fromRegionCode(r.region_code),
    customerName: r.customer_name,
    customerRegion: r.customer_region,
    projectId: projectExecutionBaseline?.projectId || null,
    projectCode: projectExecutionBaseline?.projectCode || null,
    projectName: projectExecutionBaseline?.projectName || null,
    projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
    projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
    finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
    finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
    finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,
    supplierCompanyId: r.supplier_company_id,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierContact: r.supplier_contact,
    supplierEmail: r.supplier_email,
    products: r.products || [],
    productName: r.product_name,
    modelNo: r.model_no,
    specification: r.specification,
    quantity: r.quantity,
    unit: r.unit,
    targetPrice: r.target_price,
    currency: r.currency,
    expectedDate: r.expected_date,
    quotationDeadline: r.quotation_deadline,
    dueDate: r.due_date,
    priority: r.priority,
    status: r.status,
    quotes: r.quotes || [],
    documentData: r.document_data,
    remarks: r.remarks,
    createdBy: r.created_by,
    sourceDocId: r.source_doc_id,
    salesContractId: r.sales_contract_id,
    rootSalesContractId: r.root_sales_contract_id,
    displayNumber: r.display_number,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdDate: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const xjService = {
  async getAll() {
    const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) throwSupabaseError('getAll supplier_xjs', error);
    return (data || []).map(fromXJRow);
  },
  async getByEmail(email: string) {
    const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).or(`supplier_email.eq.${email},created_by.eq.${email}`).order('created_at', { ascending: false });
    if (error) throwSupabaseError('getByEmail supplier_xjs', error);
    return (data || []).map(fromXJRow);
  },
  async upsert(x: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(x, {
      documentCode: 'XJ',
      nodeCode: 'xj-create',
      businessData: x.documentDataSnapshot || x.document_data_snapshot || x,
    })
    const row = toXJRow({ ...x, ...templateBinding });
    // onConflict 同时覆盖 id 和 (tenant_id, xj_number) 两个唯一约束
    const { data, error } = await supabase
      .from('supplier_xjs')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      // 若 id 冲突策略未命中（xj_number 唯一约束触发），尝试按 xj_number 更新
      if (error.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('supplier_xjs')
          .update(row)
          .eq('xj_number', row.xj_number)
          .eq('tenant_id', row.tenant_id)
          .select()
          .single();
        if (updateError) throwSupabaseError('upsert supplier_xj (update fallback)', updateError);
        return fromXJRow(updated);
      }
      throwSupabaseError('upsert supplier_xj', error);
    }
    return fromXJRow(data);
  },
  async delete(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const currentEmail = String(session?.user?.email || '').trim().toLowerCase();
    if (currentEmail) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('portal_role, rbac_role')
        .eq('id', session?.user?.id || '')
        .maybeSingle();
      const portalRole = String((profile as any)?.portal_role || '').toLowerCase();
      if (portalRole === 'supplier') {
        throwSupabaseError('delete supplier_xj forbidden', new Error('supplier cannot delete supplier_xjs'));
      }
    }
    const operatorEmail = session?.user?.email || null;
    const { error } = await supabase
      .from('supplier_xjs')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: operatorEmail,
        deleted_reason: 'manual-delete-ui',
      })
      .eq('id', id);
    if (error) throwSupabaseError('delete supplier_xj', error);
  },
};

// ============================================================
// quotation_requests 服务
// ============================================================
function toQRRow(q: any) {
  const commercialTerms = {
    expectedQuoteDate: q.expectedQuoteDate || q.expected_quote_date || null,
    deliveryDate: q.deliveryDate || q.delivery_date || null,
    tradeTerms: q.tradeTerms || q.trade_terms || null,
    paymentTerms: q.paymentTerms || q.payment_terms || null,
    targetCostRange: q.targetCostRange || q.target_cost_range || null,
    qualityRequirements: q.qualityRequirements || q.quality_requirements || null,
    packagingRequirements: q.packagingRequirements || q.packaging_requirements || null,
    remarks: q.remarks || null,
  }
  const notes = q.notes || buildProcurementRequestNotes(commercialTerms) || null
  return {
    id: toUUID(q.id),
    request_number: q.requestNumber || q.request_number || '',
    region_code: toRegionCode(q.region || q.region_code),
    source_inquiry_id: q.sourceInquiryId || q.source_inquiry_id || null,
    source_inquiry_number: q.sourceInquiryNumber || q.source_inquiry_number || '',
    customer_name: q.customerName || q.customer_name || '',
    customer_email: q.customerEmail || q.customer_email || null,
    customer_company: q.customerCompany || q.customer_company || null,
    products: q.items || q.products || [],
    status: q.status || 'pending',
    assigned_to: q.assignedTo || q.assigned_to || null,
    requested_by: q.requestedBy || q.requested_by || null,
    requested_by_name: q.requestedByName || q.requested_by_name || null,
    request_date: toIsoDate(q.requestDate || q.request_date),
    expected_quote_date: toIsoDate(q.expectedQuoteDate || q.expected_quote_date),
    urgency: q.urgency || 'medium',
    xj_ids: q.xjIds || q.xj_ids || [],
    xj_count: q.xjCount || q.xj_count || 0,
    priority: q.priority || 'medium',
    notes,
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || {},
    document_render_meta: q.documentRenderMeta || q.document_render_meta || {},
  };
}

function fromQRRow(r: any) {
  if (!r) return null;
  const notesTerms = parseProcurementRequestNotes(r.notes);
  return {
    id: r.id,
    requestNumber: r.request_number,
    region: fromRegionCode(r.region_code),
    sourceInquiryId: r.source_inquiry_id,
    sourceInquiryNumber: r.source_inquiry_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    items: r.products || [],
    status: r.status,
    assignedTo: r.assigned_to,
    requestedBy: r.requested_by,
    requestedByName: r.requested_by_name,
    requestDate: r.request_date,
    expectedQuoteDate: r.expected_quote_date || notesTerms.expectedQuoteDate || '',
    urgency: r.urgency || 'medium',
    xjIds: r.xj_ids || [],
    xjCount: r.xj_count || 0,
    priority: r.priority,
    notes: r.notes,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    deliveryDate: notesTerms.deliveryDate || null,
    tradeTerms: notesTerms.tradeTerms || null,
    paymentTerms: notesTerms.paymentTerms || null,
    targetCostRange: notesTerms.targetCostRange || null,
    qualityRequirements: notesTerms.qualityRequirements || null,
    packagingRequirements: notesTerms.packagingRequirements || null,
    remarks: notesTerms.remarks || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const quotationRequestService = {
  async getAll() {
    const { data, error } = await supabase.from('quotation_requests').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) throwSupabaseError('getAll quotation_requests', error);
    return (data || []).map(fromQRRow);
  },
  async upsert(q: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(q, {
      documentCode: 'QR',
      nodeCode: 'qr-create',
      businessData: q.documentDataSnapshot || q.document_data_snapshot || q,
    })
    const row = toQRRow({ ...q, ...templateBinding });
    const { data, error } = await supabase.from('quotation_requests').upsert(row, { onConflict: 'id' }).select().single();
    if (error) throwSupabaseError('upsert quotation_request', error);
    return fromQRRow(data);
  },
  async delete(id: string) {
    const { error } = await supabase.from('quotation_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throwSupabaseError('delete quotation_request', error);
  },
};

// Inquiry 转换（使用顶部统一工具函数）
function toInquiryRow(i: any) {
  // createdAt 可能是毫秒数字或 ISO 字符串，统一转为 ISO 字符串
  const toIso = (v: any) => {
    if (!v) return new Date().toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();
    return String(v);
  };
  // region 存代码（NA/SA/EA），不存全名
  const regionCode = toRegionCode(i.region);
  // id：如果前端传的是询价编号（ING-格式），生成新 UUID；否则直接用
  const id = (i.id && i.id.startsWith('ING-'))
    ? crypto.randomUUID()
    : (i.id || crypto.randomUUID());
  const documentRenderMeta = {
    ...(i.documentRenderMeta || i.document_render_meta || {}),
    oemModule: i.oem || i.documentRenderMeta?.oemModule || i.document_render_meta?.oemModule || null,
  };
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
    message: i.message || null,
    buyer_info: i.buyerInfo || null,
    shipping_info: i.shippingInfo || null,
    container_info: i.containerInfo || null,
    products: sanitizePersistedInquiryProducts(i.products || []),
    created_at: toIso(i.createdAt),
    submitted_at: i.submittedAt ? toIso(i.submittedAt) : null,
    template_id: i.templateId || i.template_id || null,
    template_version_id: i.templateVersionId || i.template_version_id || null,
    template_snapshot: i.templateSnapshot || i.template_snapshot || {},
    document_data_snapshot: i.documentDataSnapshot || i.document_data_snapshot || {},
    document_render_meta: documentRenderMeta,
  }
}

function fromInquiryRow(r: any) {
  if (!r) return null
  const oem = r.document_render_meta?.oemModule || r.document_data_snapshot?.oem || null
  return {
    id: r.id,
    inquiryNumber: r.inquiry_number,
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
    containerInfo: r.container_info,
    products: r.products || [],
    oem: oem || undefined,
    assignedTo: r.assigned_to || null,
    salesRepEmail: r.assigned_to || null,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
  }
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
    return {
      modules: [] as any[],
      files: [] as any[],
      mappings: [] as any[],
    }
  }

  const { data: moduleRows, error: moduleError } = await supabase
    .from('inquiry_oem_modules')
    .select('*')
    .in('inquiry_id', ids)

  if (moduleError) throwSupabaseError('fetchInquiryOemCollections inquiry_oem_modules', moduleError)

  const moduleIds = (moduleRows || []).map((row: any) => row.id).filter(Boolean)
  if (moduleIds.length === 0) {
    return {
      modules: moduleRows || [],
      files: [] as any[],
      mappings: [] as any[],
    }
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

// ============================================================
// payments 服务
// ============================================================
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

// ============================================================
// purchase_orders 服务
// ============================================================
function toPORow(p: any) {
  return {
    id: toUUID(p.id),
    po_number: p.poNumber || p.po_number || '',
    requirement_no: p.requirementNo || p.requirement_no || null,
    xj_number: p.xjNumber || p.xj_number || null,
    supplier_code: p.supplierCode || p.supplier_code || '',
    supplier_name: p.supplierName || p.supplier_name || '',
    supplier_email: p.supplierEmail || p.supplier_email || '',
    region_code: toRegionCode(p.region || p.region_code),
    items: p.items || p.products || [],
    total_amount: p.totalAmount || p.total_amount || 0,
    currency: p.currency || 'USD',
    payment_terms: p.paymentTerms || p.payment_terms || null,
    delivery_terms: p.deliveryTerms || p.delivery_terms || null,
    expected_delivery_date: toIsoDate(p.expectedDeliveryDate || p.expected_delivery_date),
    status: p.status || 'draft',
    notes: p.notes || null,
    created_by: p.createdBy || p.created_by || null,
    cg_number: p.cgNumber || p.cg_number || p.poNumber || p.po_number || null,
    template_id: p.templateId || p.template_id || null,
    template_version_id: p.templateVersionId || p.template_version_id || null,
    template_snapshot: p.templateSnapshot || p.template_snapshot || {},
    document_data_snapshot: p.documentDataSnapshot || p.document_data_snapshot || {},
    document_render_meta: p.documentRenderMeta || p.document_render_meta || {},
  }
}

function fromPORow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    poNumber: r.po_number,
    requirementNo: r.requirement_no,
    xjNumber: r.xj_number,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierEmail: r.supplier_email,
    region: fromRegionCode(r.region_code),
    items: r.items || [],
    totalAmount: r.total_amount || 0,
    currency: r.currency || 'USD',
    paymentTerms: r.payment_terms,
    deliveryTerms: r.delivery_terms,
    expectedDeliveryDate: r.expected_delivery_date,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    cgNumber: r.cg_number || r.po_number,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const purchaseOrderService = {
  async getAll() {
    const { data, error } = await supabase.from('purchase_orders').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll purchase_orders', error)
    return (data || []).map(fromPORow)
  },
  async upsert(p: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(p, {
      documentCode: 'CG',
      nodeCode: 'cg-create',
      businessData: p.documentDataSnapshot || p.document_data_snapshot || p,
    })
    const row = toPORow({ ...p, ...templateBinding })
    const { data, error } = await supabase.from('purchase_orders').upsert(row, { onConflict: 'id' }).select().single()
    if (error) throwSupabaseError('upsert purchase_order', error)
    return fromPORow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throwSupabaseError('delete purchase_order', error)
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('purchase_orders_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, callback).subscribe()
  },
}

// ============================================================
// quote_requirements 服务
// ============================================================
function toPRRow(p: any) {
  // DB 列类型对照（quote_requirements）：
  //   id uuid, requirement_no text, source_inquiry_number text,
  //   region text, urgency text, required_date date, items jsonb,
  //   status text, notes text, created_by uuid(!), assigned_to text,
  //   qr_number text, display_number text, customer_info jsonb
  const reqNo = p.requirementNo || p.requirementNumber || p.requirement_no || p.qr_number || '';

  // created_by 是 uuid 类型，只接受合法 UUID（Supabase user.id）
  // 如果前端传的是 email 字符串，直接丢弃，由 RLS / DB default 填充
  const createdByRaw = p.createdBy || p.created_by || null;
  const createdBy = (createdByRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdByRaw))
    ? createdByRaw : null;

  // required_date 是 date 类型，只传 YYYY-MM-DD
  const rawDate = p.requiredDate || p.required_date || null;
  const requiredDate = rawDate ? String(rawDate).split('T')[0] : null;
  const context = extractProcurementRequestContext(p);
  const commercialTerms = {
    ...(context.commercialTerms || {}),
    ...(p.commercialTerms || {}),
    expectedQuoteDate: p.expectedQuoteDate || p.expected_quote_date || context.commercialTerms?.expectedQuoteDate || null,
    deliveryDate: p.deliveryDate || p.delivery_date || context.commercialTerms?.deliveryDate || null,
    tradeTerms: p.tradeTerms || p.trade_terms || context.commercialTerms?.tradeTerms || null,
    paymentTerms: p.paymentTerms || p.payment_terms || context.commercialTerms?.paymentTerms || null,
    targetCostRange: p.targetCostRange || p.target_cost_range || context.commercialTerms?.targetCostRange || null,
    qualityRequirements: p.qualityRequirements || p.quality_requirements || context.commercialTerms?.qualityRequirements || null,
    packagingRequirements: p.packagingRequirements || p.packaging_requirements || context.commercialTerms?.packagingRequirements || null,
    remarks: p.remarks || context.commercialTerms?.remarks || null,
  };
  const customerInfo = mergeCustomerInfoWithProcurementContext(
    p.customer || p.customer_info || null,
    {
      customerRequirements: p.customerRequirements || context.customerRequirements || null,
      commercialTerms,
      downstreamVisibility: p.downstreamVisibility || context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
    },
  );

  return {
    id: toUUID(p.id),                          // toUUID 会对非 UUID 生成新随机 UUID
    requirement_no: reqNo,
    source_inquiry_number: p.sourceInquiryNumber || p.source_inquiry_number || null,
    source_so_number: p.sourceSoNumber || p.source_so_number || null,
    region: p.region || null,
    urgency: p.urgency || 'medium',
    required_date: requiredDate,
    items: (p.items || p.products || []).map((item: any) => ({
      ...item,
      // 写入时确保每个 item 有合法 UUID，Supabase 即为唯一数据源，无需前端兜底
      id: (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)))
        ? item.id
        : crypto.randomUUID(),
    })),
    status: (['pending','in_progress','completed','cancelled','partial','processing','submitted','quoted','draft'].includes(p.status) ? p.status : 'pending'),
    notes: p.notes || p.specialRequirements || p.special_requirements || commercialTerms.remarks || null,
    purchaser_feedback: p.purchaserFeedback || p.purchaser_feedback || null,
    pushed_to_quotation: p.pushedToQuotation ?? p.pushed_to_quotation ?? false,
    pushed_to_quotation_at: p.pushedToQuotationDate || p.pushed_to_quotation_at || null,
    pushed_by: p.pushedBy || p.pushed_by || null,
    quotation_number: p.quotationNumber || p.quotation_number || null,
    created_by: createdBy,
    assigned_to: p.assignedTo || p.assigned_to || null,
    qr_number: reqNo || null,
    display_number: reqNo || null,
    customer_info: customerInfo,
    template_id: p.templateId || p.template_id || null,
    template_version_id: p.templateVersionId || p.template_version_id || null,
    template_snapshot: p.templateSnapshot || p.template_snapshot || {},
    document_data_snapshot: p.documentDataSnapshot || p.document_data_snapshot || {},
    document_render_meta: p.documentRenderMeta || p.document_render_meta || {},
  }
}

function fromPRRow(r: any) {
  if (!r) return null
  const customerInfo = r.customer_info || null
  const context = extractProcurementRequestContext({ customer_info: customerInfo })
  return {
    id: r.id,
    requirementNo: r.requirement_no || r.qr_number || '',
    requirementNumber: r.requirement_no || r.qr_number || '',
    sourceInquiryNumber: r.source_inquiry_number,
    sourceSoNumber: r.source_so_number,
    region: r.region,
    urgency: r.urgency || 'medium',
    requiredDate: r.required_date,
    items: r.items || [],
    status: r.status || 'pending',
    notes: r.notes,
    specialRequirements: r.notes,
    expectedQuoteDate: context.commercialTerms?.expectedQuoteDate || null,
    deliveryDate: context.commercialTerms?.deliveryDate || null,
    tradeTerms: context.commercialTerms?.tradeTerms || null,
    paymentTerms: context.commercialTerms?.paymentTerms || null,
    targetCostRange: context.commercialTerms?.targetCostRange || null,
    qualityRequirements: context.commercialTerms?.qualityRequirements || null,
    packagingRequirements: context.commercialTerms?.packagingRequirements || null,
    remarks: context.commercialTerms?.remarks || r.notes || null,
    commercialTerms: context.commercialTerms || null,
    customerRequirements: context.customerRequirements || null,
    downstreamVisibility: context.downstreamVisibility || DEFAULT_DOWNSTREAM_VISIBILITY,
    purchaserFeedback: r.purchaser_feedback || null,
    pushedToQuotation: r.pushed_to_quotation || false,
    pushedToQuotationDate: r.pushed_to_quotation_at || null,
    pushedBy: r.pushed_by || null,
    quotationNumber: r.quotation_number || null,
    createdBy: r.created_by,   // uuid，不是 email
    assignedTo: r.assigned_to,
    createdDate: r.created_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: customerInfo || null,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  }
}

export const quoteRequirementService = {
  async getAll() {
    const { data, error } = await supabase.from('quote_requirements').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll quote_requirements', error)
    return (data || []).map(fromPRRow)
  },
  async upsert(p: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(p, {
      documentCode: 'QR',
      nodeCode: 'qr-create',
      businessData: p.documentDataSnapshot || p.document_data_snapshot || p,
    })
    const row = toPRRow({ ...p, ...templateBinding })
    const { data, error } = await upsertWithSchemaFallback(
      'quote_requirements',
      row,
      'id',
      'upsert quote_requirement',
    )
    if (error) throwSupabaseError('upsert quote_requirement', error)
    return fromPRRow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('quote_requirements').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throwSupabaseError('delete quote_requirement', error)
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('quote_requirements_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'quote_requirements' }, callback).subscribe()
  },
}

// ============================================================
// document template center 服务
// ============================================================
const DOCUMENT_TEMPLATE_CENTER_CONFIG: Record<string, {
  templateCode: string
  documentCode: string
  templateNameCn: string
  templateNameEn: string
  businessStage: string
  description: string
  rendererComponent: string
}> = {
  ing: {
    templateCode: 'tpl_ing',
    documentCode: 'ING',
    templateNameCn: '客户询价单',
    templateNameEn: 'Customer Inquiry',
    businessStage: 'source',
    description: '客户原始询价源头',
    rendererComponent: 'src/components/documents/templates/CustomerInquiryDocument.tsx',
  },
  qt: {
    templateCode: 'tpl_qt',
    documentCode: 'QT',
    templateNameCn: '销售报价单',
    templateNameEn: 'Sales Quotation',
    businessStage: 'sales-quotation',
    description: '业务员对客户报价',
    rendererComponent: 'src/components/documents/templates/QuotationDocument.tsx',
  },
  qr: {
    templateCode: 'tpl_qr',
    documentCode: 'QR',
    templateNameCn: '报价请求单',
    templateNameEn: 'Quote Requirement',
    businessStage: 'internal-cost-request',
    description: '业务员向采购员发起的报价请求',
    rendererComponent: 'src/components/documents/templates/QuoteRequirementDocument.tsx',
  },
  xj: {
    templateCode: 'tpl_xj',
    documentCode: 'XJ',
    templateNameCn: '采购询价单',
    templateNameEn: 'Supplier Inquiry',
    businessStage: 'supplier-inquiry',
    description: '采购员向供应商询价',
    rendererComponent: 'src/components/documents/templates/XJDocument.tsx',
  },
  bj: {
    templateCode: 'tpl_bj',
    documentCode: 'BJ',
    templateNameCn: '供应商报价单',
    templateNameEn: 'Supplier Quotation',
    businessStage: 'supplier-quotation',
    description: '供应商对采购询价的正式报价',
    rendererComponent: 'src/components/documents/templates/SupplierQuotationDocument.tsx',
  },
  pi: {
    templateCode: 'tpl_pi',
    documentCode: 'PI',
    templateNameCn: '形式发票',
    templateNameEn: 'Proforma Invoice',
    businessStage: 'pre-invoice',
    description: '正式订单前的形式发票',
    rendererComponent: 'src/components/documents/templates/ProformaInvoiceDocument.tsx',
  },
  sc: {
    templateCode: 'tpl_sc',
    documentCode: 'SC',
    templateNameCn: '销售合同',
    templateNameEn: 'Sales Contract',
    businessStage: 'sales-contract',
    description: '客户成交合同',
    rendererComponent: 'src/components/documents/templates/SalesContractDocument.tsx',
  },
  cg: {
    templateCode: 'tpl_cg',
    documentCode: 'CG',
    templateNameCn: '采购合同',
    templateNameEn: 'Purchase Contract',
    businessStage: 'purchase-contract',
    description: '公司与供应商采购合同',
    rendererComponent: 'src/components/documents/templates/PurchaseOrderDocument.tsx',
  },
  ci: {
    templateCode: 'tpl_ci',
    documentCode: 'CI',
    templateNameCn: '商业发票',
    templateNameEn: 'Commercial Invoice',
    businessStage: 'shipping-docs',
    description: '出口报关和结汇用的商业发票',
    rendererComponent: 'src/components/documents/templates/CommercialInvoiceDocument.tsx',
  },
  pl: {
    templateCode: 'tpl_pl',
    documentCode: 'PL',
    templateNameCn: '装箱单',
    templateNameEn: 'Packing List',
    businessStage: 'shipping-docs',
    description: '出口货物的详细包装清单',
    rendererComponent: 'src/components/documents/templates/PackingListDocument.tsx',
  },
  soa: {
    templateCode: 'tpl_soa',
    documentCode: 'SOA',
    templateNameCn: '账户对账单',
    templateNameEn: 'Statement of Account',
    businessStage: 'finance-reconciliation',
    description: '客户账户往来对账单',
    rendererComponent: 'src/components/documents/templates/StatementOfAccountDocument.tsx',
  },
}

function normalizeTemplateCenterKey(templateKey: string) {
  const normalized = String(templateKey || '').trim().toLowerCase()
  if (!normalized) return normalized
  return normalized
}

function formatTemplateCenterTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toTemplateCenterVersionRecord(row: any) {
  const styleTokens = row.style_tokens || {}
  const editorMeta = styleTokens.editorMeta || {}
  return {
    id: row.id,
    templateId: row.template_id,
    versionNo: row.version_no,
    version: row.version_label || `v${row.version_no}.0.0`,
    status: row.status === 'published' ? 'published' : 'draft',
    savedAt: formatTemplateCenterTime(row.updated_at || row.created_at || row.published_at),
    savedBy: editorMeta.savedBy || 'Template Center',
    note: row.change_summary || '',
    data: row.sample_data || {},
    layout: row.layout_json || {},
    textOverrides: styleTokens.textOverrides || null,
    publishedAt: row.published_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

async function ensureDocumentTemplate(templateKey: string) {
  const normalizedTemplateKey = normalizeTemplateCenterKey(templateKey)
  const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
  if (!config) {
    throw new Error(`Unknown template key: ${templateKey}`)
  }

  const payload = {
    template_code: config.templateCode,
    document_code: config.documentCode,
    template_name_cn: config.templateNameCn,
    template_name_en: config.templateNameEn,
    business_stage: config.businessStage,
    renderer_type: 'legacy-react',
    status: 'published',
    description: config.description,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('document_templates')
    .upsert(payload, { onConflict: 'template_code' })
    .select('*')
    .single()

  if (error) {
    throw buildSupabaseError('ensure document_template', error)
  }

  return data
}

export const templateCenterService = {
  async getVersionHistory(templateKey: string) {
    try {
      const template = await ensureDocumentTemplate(templateKey)
      const { data, error } = await supabase
        .from('document_template_versions')
        .select('*')
        .eq('template_id', template.id)
        .order('version_no', { ascending: false })

      if (error) throw buildSupabaseError('get document_template_versions', error)
      return (data || []).map(toTemplateCenterVersionRecord)
    } catch (error) {
      throwSupabaseError(`getVersionHistory ${templateKey}`, error)
    }
  },

  async saveVersion(input: {
    templateKey: string
    version: string
    status: 'draft' | 'published'
    note: string
    savedBy: string
    data: Record<string, any>
    layout: Record<string, any>
    textOverrides?: Record<string, any> | null
  }) {
    try {
      const normalizedTemplateKey = normalizeTemplateCenterKey(input.templateKey)
      const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
      if (!config) throw new Error(`Unknown template key: ${input.templateKey}`)

      const template = await ensureDocumentTemplate(normalizedTemplateKey)
      const { data: latestVersionRow, error: latestVersionError } = await supabase
        .from('document_template_versions')
        .select('version_no')
        .eq('template_id', template.id)
        .order('version_no', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestVersionError) {
        throw buildSupabaseError('read latest document_template_version', latestVersionError)
      }

      const versionNo = Number(latestVersionRow?.version_no || 0) + 1
      const nowIso = new Date().toISOString()
      const { data: insertedVersion, error: insertError } = await supabase
        .from('document_template_versions')
        .insert({
          template_id: template.id,
          version_no: versionNo,
          version_label: input.version,
          status: input.status,
          schema_json: {
            mode: 'template-center-workspace',
            documentCode: config.documentCode,
          },
          layout_json: input.layout || {},
          style_tokens: {
            textOverrides: input.textOverrides || null,
            editorMeta: {
              savedBy: input.savedBy,
              savedAt: nowIso,
            },
          },
          sample_data: input.data || {},
          renderer_component: config.rendererComponent,
          change_summary: input.note || '',
          published_at: input.status === 'published' ? nowIso : null,
        })
        .select('*')
        .single()

      if (insertError) {
        throw buildSupabaseError('insert document_template_version', insertError)
      }

      const templateUpdatePayload: Record<string, any> = {
        status: input.status === 'published' ? 'published' : 'draft',
        updated_at: nowIso,
      }
      if (input.status === 'published') {
        templateUpdatePayload.current_version_id = insertedVersion.id
      }

      const { error: templateUpdateError } = await supabase
        .from('document_templates')
        .update(templateUpdatePayload)
        .eq('id', template.id)

      if (templateUpdateError) {
        throw buildSupabaseError('update document_templates current_version', templateUpdateError)
      }

      if (input.status === 'published') {
        const targetNodeCodes = TEMPLATE_DEFAULT_NODE_BINDINGS[normalizedTemplateKey] || []
        for (const nodeCode of targetNodeCodes) {
          const { error: resetBindingError } = await supabase
            .from('document_template_bindings')
            .update({
              is_default: false,
              updated_at: nowIso,
            })
            .eq('flow_code', DEFAULT_TEMPLATE_BINDING_FLOW_CODE)
            .eq('document_code', config.documentCode)
            .eq('node_code', nodeCode)

          if (resetBindingError) {
            throw buildSupabaseError(`reset template binding ${config.documentCode}/${nodeCode}`, resetBindingError)
          }

          const { error: bindingUpsertError } = await supabase
            .from('document_template_bindings')
            .upsert({
              flow_code: DEFAULT_TEMPLATE_BINDING_FLOW_CODE,
              node_code: nodeCode,
              document_code: config.documentCode,
              template_id: template.id,
              template_version_id: insertedVersion.id,
              is_default: true,
              updated_at: nowIso,
            }, { onConflict: 'flow_code,node_code,document_code,template_version_id' })

          if (bindingUpsertError) {
            throw buildSupabaseError(`publish template binding ${config.documentCode}/${nodeCode}`, bindingUpsertError)
          }

          templateBindingResolutionCache.delete(`${config.documentCode}:${nodeCode}`)
        }
      }

      const { error: logError } = await supabase
        .from('document_template_publish_logs')
        .insert({
          template_id: template.id,
          template_version_id: insertedVersion.id,
          action: input.status === 'published' ? 'publish' : 'save_draft',
          notes: input.note || null,
        })

      if (logError) {
        console.warn('[Supabase] save document_template_publish_logs:', logError?.message || logError)
      }

      return toTemplateCenterVersionRecord(insertedVersion)
    } catch (error) {
      throwSupabaseError(`saveVersion ${input.templateKey}`, error)
    }
  },
}

// ============================================================
// approval_records 服务（扩展版）
// ============================================================
export const approvalRecordService = {
  async getAll() {
    const { data, error } = await supabase.from('approval_records').select('*').order('created_at', { ascending: false })
    if (error) throwSupabaseError('getAll approval_records', error)
    return (data || []).map(fromApprovalRow)
  },
  async getForApprover(email: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .or(`current_approver.eq.${email},submitted_by.eq.${email},actor_email.eq.${email}`)
      .order('created_at', { ascending: false })
    if (error) throwSupabaseError('getForApprover approval_records', error)
    return (data || []).map(fromApprovalRow)
  },
  async upsert(record: any) {
    const docId = record.relatedDocumentId || record.related_document_id || ''
    const submitter = record.submittedBy || record.submitted_by || ''
    const submitterRole = record.submittedByRole || record.submitted_by_role || ''
    const statusVal = record.status || 'pending'
    const row = {
      id: toUUID(record.id),
      // 新字段（业务流程）
      type: record.type || 'qt',
      related_document_id: docId,
      related_document_type: record.relatedDocumentType || record.related_document_type || '',
      related_document: record.relatedDocument || record.related_document || null,
      submitted_by: submitter,
      submitted_by_name: record.submittedByName || record.submitted_by_name || '',
      submitted_by_role: submitterRole,
      submitted_at: record.submittedAt || record.submitted_at || new Date().toISOString(),
      region: toRegionCode(record.region),
      current_approver: record.currentApprover || record.current_approver || '',
      current_approver_role: record.currentApproverRole || record.current_approver_role || '',
      next_approver: record.nextApprover || record.next_approver || null,
      next_approver_role: record.nextApproverRole || record.next_approver_role || null,
      requires_director_approval: record.requiresDirectorApproval ?? record.requires_director_approval ?? false,
      status: statusVal,
      urgency: record.urgency || 'normal',
      amount: record.amount || 0,
      currency: record.currency || 'USD',
      customer_name: record.customerName || record.customer_name || '',
      customer_email: record.customerEmail || record.customer_email || '',
      product_summary: record.productSummary || record.product_summary || '',
      approval_history: record.approvalHistory || record.approval_history || [],
      deadline: record.deadline || null,
      // 兼容旧字段（DB 原始列，保持同步）
      entity_type: record.type || 'qt',
      entity_id: docId,
      entity_number: docId,
      action: statusVal,
      actor_email: submitter,
      actor_role: submitterRole,
      status_before: record.previousStatus || null,
      status_after: statusVal,
    }
    const { data, error } = await supabase.from('approval_records').upsert(row, { onConflict: 'id' }).select().single()
    if (error) throwSupabaseError('upsert approval_record', error)
    return fromApprovalRow(data)
  },
  async updateStatus(id: string, status: string, history: any[]) {
    const { data, error } = await supabase.from('approval_records').update({ status, approval_history: history, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throwSupabaseError('updateStatus approval_record', error)
    return fromApprovalRow(data)
  },
  subscribeToChanges(email: string, callback: (payload: any) => void) {
    return supabase.channel(`approval_records_${email}`).on('postgres_changes', { event: '*', schema: 'public', table: 'approval_records' }, callback).subscribe()
  },
}

function fromApprovalRow(r: any) {
  if (!r) return null
  // 兼容新旧两套字段名
  return {
    id: r.id,
    type: r.type || r.entity_type || 'qt',
    relatedDocumentId: r.related_document_id || r.entity_id || '',
    relatedDocumentType: r.related_document_type || r.entity_type || '',
    relatedDocument: r.related_document || null,
    submittedBy: r.submitted_by || r.actor_email || '',
    submittedByName: r.submitted_by_name || '',
    submittedByRole: r.submitted_by_role || r.actor_role || '',
    submittedAt: r.submitted_at || r.created_at || '',
    region: r.region || '',
    currentApprover: r.current_approver || '',
    currentApproverRole: r.current_approver_role || '',
    nextApprover: r.next_approver || null,
    nextApproverRole: r.next_approver_role || null,
    requiresDirectorApproval: r.requires_director_approval || false,
    status: r.status || r.status_after || 'pending',
    urgency: r.urgency || 'normal',
    amount: r.amount || 0,
    currency: r.currency || 'USD',
    customerName: r.customer_name || '',
    customerEmail: r.customer_email || '',
    productSummary: r.product_summary || '',
    approvalHistory: r.approval_history || [],
    deadline: r.deadline || '',
    expiresIn: 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ============================================================
// supplier_quotations 服务
// ============================================================
function toSQRow(q: any) {
  const sourceItems = (Array.isArray(q.items) && q.items.length > 0)
    ? q.items
    : (Array.isArray(q.products) ? q.products : []);
  const normalizedProducts = sourceItems.map((it: any) => {
    const qty = Number(it?.quantity ?? 0);
    const unitPriceRaw = it?.unitPrice ?? it?.price ?? null;
    const unitPrice = unitPriceRaw != null && Number.isFinite(Number(unitPriceRaw))
      ? Number(unitPriceRaw)
      : null;
    const amountRaw = it?.amount ?? it?.lineAmount ?? null;
    const amount = amountRaw != null && Number.isFinite(Number(amountRaw))
      ? Number(amountRaw)
      : (unitPrice != null && qty > 0 ? unitPrice * qty : null);
    return {
      ...it,
      quantity: qty,
      unitPrice,
      amount,
    };
  });
  const projectExecutionBaseline = q.documentRenderMeta?.projectExecutionBaseline || (q.projectRevisionId
    ? {
        projectId: q.projectId || null,
        projectCode: q.projectCode || null,
        projectName: q.projectName || null,
        projectRevisionId: q.projectRevisionId || null,
        projectRevisionCode: q.projectRevisionCode || null,
        projectRevisionStatus: q.projectRevisionStatus || null,
        finalRevisionId: q.finalRevisionId || null,
        finalQuotationId: q.finalQuotationId || null,
        finalQuotationNumber: q.finalQuotationNumber || null,
        quotationRole: q.quotationRole || null,
      }
    : null);

  return {
    id: toUUID(q.id),
    // BJ 编号：quotationNo / quotationNumber / bjNumber 三者取一
    quotation_number: q.quotationNumber || q.quotationNo || q.bj_number || q.quotation_number || null,
    bj_number:        q.bjNumber || q.quotationNo || q.quotationNumber || q.bj_number || null,
    display_number:   q.displayNumber || q.display_number || null,
    supplier_code:    q.supplierCode || q.supplier_code || null,
    supplier_name:    q.supplierName || q.supplier_name || null,
    supplier_email:   q.supplierEmail || q.supplier_email || '',
    supplier_company: q.supplierCompany || q.supplier_company || null,
    // XJ 溯源
    source_xj_number: q.sourceXJNumber || q.sourceXJ || q.xjNumber || q.source_xj_number || null,
    source_xj_id:     toUUIDOrNull(q.sourceXJId || q.xjId || q.source_xj_id),
    // QR 溯源
    source_qr_number: q.sourceQR || q.sourceQRNumber || q.source_qr_number || null,
    region_code:      q.regionCode || q.region_code || null,
    products:         normalizedProducts,
    total_amount:     q.totalAmount || q.total_amount || 0,
    currency:         q.currency || 'CNY',
    quotation_date:   q.quotationDate || q.quotation_date || null,
    valid_until:      q.validUntil || q.valid_until || null,
    payment_terms:    q.paymentTerms || q.payment_terms || null,
    delivery_terms:   q.deliveryTerms || q.delivery_terms || null,
    status:           q.status || 'draft',
    notes:            q.notes || q.generalRemarks || null,
    created_by:       q.createdBy || q.created_by || null,
    source_doc_id:              toUUIDOrNull(q.sourceDocId || q.source_doc_id),
    sales_contract_id:          toUUIDOrNull(q.salesContractId || q.sales_contract_id),
    root_sales_contract_id:     toUUIDOrNull(q.rootSalesContractId || q.root_sales_contract_id),
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || q.documentData || q.document_data || {},
    document_render_meta: {
      ...(q.documentRenderMeta || q.document_render_meta || {}),
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  };
}

function fromSQRow(r: any) {
  if (!r) return null;
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null;
  return {
    id: r.id,
    quotationNo: r.quotation_number || r.bj_number || r.display_number || '',
    quotationNumber: r.quotation_number,
    sourceXJ: r.source_xj_number,
    sourceQR: r.source_qr_number,
    quotationDate: r.quotation_date,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierEmail: r.supplier_email,
    supplierCompany: r.supplier_company,
    sourceXJNumber: r.source_xj_number,
    xjNumber: r.source_xj_number,       // 向后兼容
    sourceXJId: r.source_xj_id,
    xjId: r.source_xj_id,               // 向后兼容
    regionCode: r.region_code,
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
    products: r.products || [],
    items: r.products || [],
    totalAmount: r.total_amount || 0,
    currency: r.currency || 'CNY',
    validUntil: r.valid_until,
    paymentTerms: r.payment_terms,
    deliveryTerms: r.delivery_terms,
    submittedDate: r.updated_at || r.created_at,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    bjNumber: r.bj_number,
    displayNumber: r.display_number,
    sourceDocId: r.source_doc_id,
    salesContractId: r.sales_contract_id,
    rootSalesContractId: r.root_sales_contract_id,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  };
}

export const supplierQuotationService = {
  async getAll() {
    let { data, error } = await supabase
      .from('supplier_quotations')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    // 兼容旧环境：若 deleted_at 列不存在，则降级为不带 deleted_at 过滤
    if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
      const retry = await supabase
        .from('supplier_quotations')
        .select('*')
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }
    if (error) return handleError(error, 'getAll supplier_quotations');
    return (data || []).map(fromSQRow);
  },
  async getBySupplierEmail(email: string) {
    const normalized = String(email || '').trim().toLowerCase();
    const bySupplierEmail = `supplier_email.ilike.%${normalized}%`;
    const byCreatedBy = `created_by.ilike.%${normalized}%`;
    const bySupplierCode = `supplier_code.ilike.%${normalized}%`;

    let { data, error } = await supabase
      .from('supplier_quotations')
      .select('*')
      .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    // 兼容旧环境：若 deleted_at 列不存在，则降级为不带 deleted_at 过滤
    if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
      const retry = await supabase
        .from('supplier_quotations')
        .select('*')
        .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }
    if (error) return handleError(error, 'getBySupplierEmail supplier_quotations');
    return (data || []).map(fromSQRow);
  },
  async upsert(q: any) {
    const templateBinding = await resolveBusinessDocumentTemplateBinding(q, {
      documentCode: 'BJ',
      nodeCode: 'bj-review',
      businessData: q.documentDataSnapshot || q.document_data_snapshot || q.documentData || q.document_data || q,
    })
    const row = toSQRow({ ...q, ...templateBinding });
    const { data, error } = await supabase.from('supplier_quotations').upsert(row, { onConflict: 'id' }).select().single();
    if (error) throwSupabaseError('upsert supplier_quotation', error);
    return fromSQRow(data);
  },
  async delete(id: string) {
    const { error } = await supabase.from('supplier_quotations').delete().eq('id', id);
    if (error) return handleError(error, 'delete supplier_quotation');
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('supplier_quotations_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_quotations' }, callback).subscribe();
  },
};

// ─── companies 表（供应商 / 客户统一主档）───────────────────────────────────
const COSUN_TENANT_ID_COMPANIES = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9';

function fromCompanyRow(r: any) {
  if (!r) return null;
  return {
    // 与前端 Supplier interface 保持字段对齐
    id: r.id,
    code: r.code || '',
    name: r.name || '',
    nameEn: r.name_en || '',
    level: (r.supplier_level || 'C') as 'A' | 'B' | 'C',
    category: r.supplier_category || r.industry || '',
    region: r.region || '',
    businessTypes: r.business_types || [],
    contact: r.notes?.replace(/^联系人：/, '') || '',
    phone: r.main_phone || '',
    email: r.main_email || '',
    address: r.address || '',
    certifications: r.certifications || [],
    cooperationYears: r.cooperation_years || 0,
    onTimeRate: Number(r.on_time_rate) || 0,
    qualityRate: Number(r.quality_rate) || 0,
    status: (r.status || 'active') as 'active' | 'inactive' | 'suspended',
    capacity: r.production_capacity || '',
    logoUrl: r.logo_url || undefined,
    // 额外字段（companies 表有但 Supplier interface 无）
    partyType: r.party_type,
    tenantId: r.tenant_id,
  };
}

export const companyService = {
  /** 获取所有客户（party_type = customer） */
  async getCustomers() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'customer')
      .is('deleted_at', null)
      .order('code', { ascending: true });
    if (error) return handleError(error, 'getCustomers companies');
    return (data || []).map(fromCompanyRow);
  },
  /** 获取所有供应商（party_type = supplier） */
  async getSuppliers() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .order('code', { ascending: true });
    if (error) return handleError(error, 'getSuppliers companies');
    return (data || []).map(fromCompanyRow);
  },
  /** 按关键词搜索供应商（名称/code/email/类别） */
  async searchSuppliers(keyword: string) {
    if (!keyword.trim()) return this.getSuppliers();
    const kw = `%${keyword.trim()}%`;
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .or(`name.ilike.${kw},name_en.ilike.${kw},code.ilike.${kw},main_email.ilike.${kw},supplier_category.ilike.${kw}`)
      .order('code', { ascending: true });
    if (error) return handleError(error, 'searchSuppliers companies');
    return (data || []).map(fromCompanyRow);
  },
  /** 按 email 精确查找 */
  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('main_email', email)
      .is('deleted_at', null)
      .single();
    if (error) return null;
    return fromCompanyRow(data);
  },
};
