import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { isCurrentLocalDevHost } from '../localDevHost'
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
const TEMPLATE_BINDING_CACHE_TTL_MS = 5 * 1000

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

function shouldUseSupabaseProxy() {
  return isCurrentLocalDevHost()
}

function shouldRetryDirectSupabaseRequest(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    (error as any)?.name === 'TypeError' ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('connection refused') ||
    message.includes('err_connection_refused')
  )
}

function isAbortLikeError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    (error as any)?.name === 'AbortError' ||
    message.includes('signal is aborted') ||
    message.includes('request aborted')
  )
}

function shouldRetryDirectSupabaseResponse(response: Response) {
  return response.status >= 500
}

function readSupabaseAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('cosun_supabase_auth')
    const parsed = raw ? JSON.parse(raw) : null
    return String(
      parsed?.access_token ||
      parsed?.currentSession?.access_token ||
      parsed?.session?.access_token ||
      parsed?.data?.session?.access_token ||
      '',
    ).trim() || null
  } catch {
    return null
  }
}

function readSupabaseRefreshTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('cosun_supabase_auth')
    const parsed = raw ? JSON.parse(raw) : null
    return String(
      parsed?.refresh_token ||
      parsed?.currentSession?.refresh_token ||
      parsed?.session?.refresh_token ||
      parsed?.data?.session?.refresh_token ||
      '',
    ).trim() || null
  } catch {
    return null
  }
}

async function resolveValidSupabaseAccessToken(options: { forceRefresh?: boolean } = {}): Promise<string | null> {
  const cachedAccessToken = readSupabaseAccessTokenFromStorage()
  const refreshToken = readSupabaseRefreshTokenFromStorage()
  const shouldUseProxy = shouldUseSupabaseProxy()
  const forceRefresh = options.forceRefresh === true
  let sessionAccessToken: string | null = null

  if (shouldUseProxy) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      sessionAccessToken = String(session?.access_token || '').trim() || null
      if (sessionAccessToken && !forceRefresh) {
        return sessionAccessToken
      }
      const {
        data: refreshed,
        error: refreshError,
      } = await supabase.auth.refreshSession()
      if (!refreshError) {
        const refreshedAccessToken = String(refreshed?.session?.access_token || '').trim()
        if (refreshedAccessToken) {
          return refreshedAccessToken
        }
      }
      if (sessionAccessToken && !forceRefresh) {
        return sessionAccessToken
      }
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.warn('[Supabase] failed to read current session token for REST fallback, using cached token if available.', error)
      }
    }
  }

  if (!refreshToken) {
    return forceRefresh ? sessionAccessToken : (sessionAccessToken || cachedAccessToken)
  }

  const proxyAuthBase = '/__supabase_auth__'
  const directAuthBase = `${supabaseUrl}/auth/v1`
  const authBase = shouldUseProxy ? proxyAuthBase : directAuthBase

  try {
    const requestInit: RequestInit = {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
    let response: Response
    try {
      response = await fetch(`${authBase}/token?grant_type=refresh_token`, requestInit)
      if (shouldUseProxy && shouldRetryDirectSupabaseResponse(response)) {
        console.warn('[Supabase] auth proxy refresh returned 5xx, retrying direct refresh request.', response.status)
        response = await fetch(`${directAuthBase}/token?grant_type=refresh_token`, requestInit)
      }
    } catch (error) {
      if (!(shouldUseProxy && shouldRetryDirectSupabaseRequest(error))) {
        throw error
      }
      console.warn('[Supabase] auth proxy refresh failed, retrying direct refresh request.', error)
      response = await fetch(`${directAuthBase}/token?grant_type=refresh_token`, requestInit)
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = formatUnknownError(payload, `Auth refresh failed with status ${response.status}`)
      throw new Error(message)
    }

    const nextAccessToken = String(payload?.access_token || '').trim()
    const nextRefreshToken = String(payload?.refresh_token || '').trim()
    if (!nextAccessToken || !nextRefreshToken) {
      return forceRefresh ? null : cachedAccessToken
    }

    try {
      await supabase.auth.setSession({
        access_token: nextAccessToken,
        refresh_token: nextRefreshToken,
      })
    } catch {
      // Ignore setSession failures here; the returned token can still be used for REST fallback.
    }

    return nextAccessToken
  } catch (error) {
    console.warn('[Supabase] refresh token for REST fallback failed.', error)
    return forceRefresh ? sessionAccessToken : (sessionAccessToken || cachedAccessToken)
  }
}

async function ensureSupabaseClientSessionReady(options: { forceRefresh?: boolean } = {}): Promise<boolean> {
  if (typeof window === 'undefined') return true
  const refreshToken = readSupabaseRefreshTokenFromStorage()
  const accessToken = await resolveValidSupabaseAccessToken(options)
  if (!accessToken || !refreshToken) return false
  try {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    return true
  } catch (error) {
    console.warn('[Supabase] failed to restore client session before inquiry create.', error)
    return false
  }
}

export function formatUnknownError(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message || fallback
  }
  if (typeof error === 'string') {
    return error.trim() || fallback
  }
  if (error && typeof error === 'object') {
    const candidate = error as Record<string, any>
    const message = String(
      candidate.message ||
      candidate.error_description ||
      candidate.error ||
      candidate.details ||
      candidate.hint ||
      '',
    ).trim()
    if (message) return message
    try {
      return JSON.stringify(candidate)
    } catch {
      return fallback
    }
  }
  return fallback
}

function toRuntimeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    const message = formatUnknownError(error, fallback)
    if (message === error.message) {
      return error
    }
    return new Error(message)
  }
  return new Error(formatUnknownError(error, fallback))
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
  const message = [
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    (() => {
      try {
        return error && typeof error === 'object' ? JSON.stringify(error) : String(error || '')
      } catch {
        return String(error || '')
      }
    })(),
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()
  return (
    (error?.code === '23505' && message.includes('inquiries_inquiry_number_tenant_key')) ||
    (error?.code === '409' && message.includes('inquiries_inquiry_number_tenant_key')) ||
    (error?.status === 409 && message.includes('inquiries_inquiry_number_tenant_key')) ||
    (message.includes('409') && message.includes('inquiries_inquiry_number_tenant_key')) ||
    (message.includes('duplicate key') && message.includes('inquiries_inquiry_number_tenant_key'))
  )
}

function isInquiryPrimaryKeyConflictError(error: any): boolean {
  const message = [
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    (() => {
      try {
        return error && typeof error === 'object' ? JSON.stringify(error) : String(error || '')
      } catch {
        return String(error || '')
      }
    })(),
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  return (
    (error?.code === '23505' && message.includes('inquiries_pkey')) ||
    (error?.code === '409' && message.includes('inquiries_pkey')) ||
    (error?.status === 409 && message.includes('inquiries_pkey')) ||
    (message.includes('409') && message.includes('inquiries_pkey')) ||
    (message.includes('duplicate key') && message.includes('inquiries_pkey'))
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

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function waitForExistingInquiryRowById(
  id: string,
  attempts = 3,
  delayMs = 250,
): Promise<any | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const existing = await getExistingInquiryRowById(id)
    if (existing) {
      return existing
    }
    if (attempt < attempts - 1) {
      await delay(delayMs)
    }
  }
  return null
}

async function insertInquiryRowViaRest(
  payload: Record<string, any>,
  context: string,
): Promise<any | null> {
  if (typeof window === 'undefined') return null
  const normalizedId = String(payload?.id || '').trim()
  if (!normalizedId) {
    throw new Error(`${context} REST upsert failed: missing inquiry id`)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 20000)

  try {
    const useProxy = shouldUseSupabaseProxy()
    const proxyRestBase = '/__supabase_rest__'
    const directRestBase = `${supabaseUrl}/rest/v1`
    const restBase = useProxy ? proxyRestBase : directRestBase
    const requestOnce = async (forceRefresh = false) => {
      const accessToken = await resolveValidSupabaseAccessToken({ forceRefresh })
      const requestInit: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates, return=representation',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
      let response: Response
      try {
        response = await fetch(`${restBase}/inquiries?on_conflict=id`, requestInit)
        if (useProxy && shouldRetryDirectSupabaseResponse(response)) {
          console.warn(`[Supabase] ${context}: REST proxy insert returned 5xx, retrying direct request.`, response.status)
          response = await fetch(`${directRestBase}/inquiries?on_conflict=id`, requestInit)
        }
      } catch (error) {
        if (!(useProxy && shouldRetryDirectSupabaseRequest(error))) {
          throw error
        }
        console.warn(`[Supabase] ${context}: REST proxy insert failed, retrying direct request.`, error)
        response = await fetch(`${directRestBase}/inquiries?on_conflict=id`, requestInit)
      }
      const rawText = await response.text()
      const parsed = rawText ? JSON.parse(rawText) : null
      return { response, rawText, parsed }
    }

    let { response, rawText, parsed } = await requestOnce(false)
    const parsedMessage = formatUnknownError(parsed || rawText || response.statusText || response.status)

    if (response.status === 401 && parsedMessage.toLowerCase().includes('jwt expired')) {
      ;({ response, rawText, parsed } = await requestOnce(true))
    }

    if (!response.ok) {
      throw new Error(
        `${context} REST upsert failed: ${formatUnknownError(parsed || rawText || response.statusText || response.status)}`,
      )
    }

    if (Array.isArray(parsed)) {
      return parsed[0] || null
    }

    return parsed || null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function loadInquiryNumberRowsViaRest(prefix: string): Promise<Array<{ inquiry_number?: string | null }>> {
  if (typeof window === 'undefined') return []

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 12000)

  try {
    const useProxy = shouldUseSupabaseProxy()
    const proxyRestBase = '/__supabase_rest__'
    const directRestBase = `${supabaseUrl}/rest/v1`
    const restBase = useProxy ? proxyRestBase : directRestBase
    const query = new URLSearchParams({
      select: 'inquiry_number',
      inquiry_number: `like.${prefix}%`,
      order: 'inquiry_number.desc',
      limit: '200',
    })
    const requestOnce = async (forceRefresh = false) => {
      const accessToken = await resolveValidSupabaseAccessToken({ forceRefresh })
      const requestInit: RequestInit = {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
        },
        signal: controller.signal,
      }
      let response: Response
      try {
        response = await fetch(`${restBase}/inquiries?${query.toString()}`, requestInit)
        if (useProxy && shouldRetryDirectSupabaseResponse(response)) {
          console.warn('[Supabase] inquiry number REST proxy scan returned 5xx, retrying direct request.', response.status)
          response = await fetch(`${directRestBase}/inquiries?${query.toString()}`, requestInit)
        }
      } catch (error) {
        if (!(useProxy && shouldRetryDirectSupabaseRequest(error))) {
          throw error
        }
        console.warn('[Supabase] inquiry number REST proxy scan failed, retrying direct request.', error)
        response = await fetch(`${directRestBase}/inquiries?${query.toString()}`, requestInit)
      }
      const rawText = await response.text()
      const parsed = rawText ? JSON.parse(rawText) : []
      return { response, rawText, parsed }
    }

    let { response, rawText, parsed } = await requestOnce(false)
    const parsedMessage = formatUnknownError(parsed || rawText || response.statusText || response.status)
    if (response.status === 401 && parsedMessage.toLowerCase().includes('jwt expired')) {
      ;({ response, rawText, parsed } = await requestOnce(true))
    }

    if (!response.ok) {
      throw new Error(`Inquiry number REST scan failed: ${formatUnknownError(parsed || rawText || response.statusText || response.status)}`)
    }

    return Array.isArray(parsed) ? parsed : []
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export function buildInquiryNumberPrefix(regionCode: string, dateValue?: unknown): string {
  const rawDate = String(dateValue || '').trim()
  const parsedDate = rawDate ? new Date(rawDate) : new Date()
  const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate
  const yy = String(safeDate.getFullYear()).slice(-2)
  const mm = String(safeDate.getMonth() + 1).padStart(2, '0')
  const dd = String(safeDate.getDate()).padStart(2, '0')
  return `ING-${String(regionCode || 'NA').toUpperCase()}-${yy}${mm}${dd}-`
}

function buildInquiryNumberRegionPattern(regionCode: string): string {
  return `ING-${String(regionCode || 'NA').toUpperCase()}-`
}

export function isTransientSupabaseRequestError(error: any): boolean {
  const message = [
    error?.name,
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    error?.cause?.message,
    (() => {
      try {
        return error && typeof error === 'object' ? JSON.stringify(error) : String(error || '')
      } catch {
        return String(error || '')
      }
    })(),
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

function isSupabaseAuthTokenError(error: any): boolean {
  const message = [
    error?.name,
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    error?.cause?.message,
    (() => {
      try {
        return error && typeof error === 'object' ? JSON.stringify(error) : String(error || '')
      } catch {
        return String(error || '')
      }
    })(),
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  return (
    message.includes('jwt expired') ||
    message.includes('invalid jwt') ||
    message.includes('token has expired') ||
    message.includes('401') ||
    message.includes('unauthorized')
  )
}

function isSupabasePermissionDeniedError(error: any): boolean {
  const message = [
    error?.name,
    error?.message,
    error?.details,
    error?.hint,
    error?.error,
    error?.error_description,
    error?.cause?.message,
    (() => {
      try {
        return error && typeof error === 'object' ? JSON.stringify(error) : String(error || '')
      } catch {
        return String(error || '')
      }
    })(),
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase()

  return (
    message.includes('permission denied for table inquiries') ||
    message.includes('new row violates row-level security policy') ||
    message.includes('row-level security') ||
    message.includes('42501')
  )
}

export function buildLocalFallbackInquiryNumber(prefix: string, regionCode: string): string {
  const normalizedRegionCode = String(regionCode || 'NA').trim().toUpperCase() || 'NA'
  const storageKey = `ing_local_fallback_counter_v4:${prefix}`
  const legacyStorageKeyV3 = `ing_local_fallback_counter_v3:${normalizedRegionCode}`
  const legacyStorageKeyV2 = `ing_local_fallback_counter_v2:${prefix}`
  const legacyStorageKeyV1 = `ing_local_fallback_counter:${prefix}`
  let nextSuffix = 1

  if (typeof window !== 'undefined') {
    try {
      const stored = Number.parseInt(String(window.localStorage.getItem(storageKey) || '0'), 10)
      const legacyStoredV2 = Number.parseInt(String(window.localStorage.getItem(legacyStorageKeyV2) || '0'), 10)
      const legacyStoredV1 = Number.parseInt(String(window.localStorage.getItem(legacyStorageKeyV1) || '0'), 10)
      const seededCounter =
        Number.isFinite(stored) && stored > 0 && stored < 9000
          ? stored
          : (
              Number.isFinite(legacyStoredV2) && legacyStoredV2 > 0 && legacyStoredV2 < 9000
                ? legacyStoredV2
                : (Number.isFinite(legacyStoredV1) && legacyStoredV1 > 0 && legacyStoredV1 < 9000 ? legacyStoredV1 : 0)
            )
      nextSuffix = seededCounter > 0 ? seededCounter + 1 : 1
      window.localStorage.setItem(storageKey, String(nextSuffix))
      window.localStorage.removeItem(legacyStorageKeyV3)
      window.localStorage.removeItem(legacyStorageKeyV2)
      window.localStorage.removeItem(legacyStorageKeyV1)
    } catch {
      nextSuffix = 1
    }
  }

  return `${prefix}${String(nextSuffix).padStart(4, '0')}`
}

export async function allocateNextClientInquiryNumber(
  regionCode: string,
  dateValue?: unknown,
  customerId?: string | null,
  deps?: DependencyBag,
): Promise<string> {
  const normalizedRegionCode = String(regionCode || 'NA').toUpperCase()
  const prefix = buildInquiryNumberPrefix(normalizedRegionCode, dateValue)
  const shouldPreferLocalFallback = shouldUseSupabaseProxy()

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
    if (error && shouldPreferLocalFallback) {
      console.warn('[Supabase] using local inquiry number fallback in localhost/proxy mode after RPC miss.', error)
      return buildLocalFallbackInquiryNumber(prefix, normalizedRegionCode)
    }
  } catch (error) {
    console.warn('[Supabase] inquiry number RPC allocation failed, falling back to prefix scan.', error)
    if (shouldPreferLocalFallback) {
      console.warn('[Supabase] using local inquiry number fallback in localhost/proxy mode after RPC abort.', error)
      return buildLocalFallbackInquiryNumber(prefix, normalizedRegionCode)
    }
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
        .limit(200),
      8000,
      'Inquiry number allocation request timed out',
    )
    data = result.data
    error = result.error
  } catch (scanError) {
    if (isTransientSupabaseRequestError(scanError)) {
      console.warn('[Supabase] inquiry number prefix scan timed out, using local fallback number.', scanError)
      return buildLocalFallbackInquiryNumber(prefix, normalizedRegionCode)
    }
    throw scanError
  }

  if (error) {
    if (isTransientSupabaseRequestError(error)) {
      console.warn('[Supabase] inquiry number prefix scan interrupted, trying REST scan before local fallback.', error)
      try {
        data = await loadInquiryNumberRowsViaRest(prefix)
        error = null
      } catch (restScanError) {
        console.warn('[Supabase] inquiry number REST scan interrupted, using local fallback number.', restScanError)
        return buildLocalFallbackInquiryNumber(prefix, normalizedRegionCode)
      }
    } else {
      deps?.throwSupabaseError('allocateNextClientInquiryNumber inquiries', error)
      throw error
    }
  }

  let maxSuffix = 0
  for (const row of data || []) {
    const inquiryNumber = String((row as any)?.inquiry_number || '')
    if (!inquiryNumber.startsWith(prefix)) continue
    const suffix = Number.parseInt(inquiryNumber.split('-').pop() || '', 10)
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
  let lastTransientError: Error | null = null
  let localSequenceFloor = 0
  const shouldPreferRestInsert = shouldUseSupabaseProxy()
  const allowRestFallbackAfterSdkAbort = !shouldPreferRestInsert
  const buildNextInquiryNumberFromFloor = (nextFloor: number) => {
    const prefix = buildInquiryNumberPrefix(String(workingPayload.region_code || 'NA'), workingPayload.date)
    return `${prefix}${String(Math.max(nextFloor, 1)).padStart(4, '0')}`
  }
  const extractInquirySuffix = (value: unknown) => {
    const suffix = Number.parseInt(String(value || '').split('-').pop() || '', 10)
    return Number.isFinite(suffix) ? suffix : 0
  }

  const maxAttempts = shouldPreferRestInsert ? 3 : 8

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let allocatedInquiryNumber = await allocateNextClientInquiryNumber(
      String(workingPayload.region_code || 'NA'),
      workingPayload.date,
      null,
      deps,
    )
    const allocatedSuffix = extractInquirySuffix(allocatedInquiryNumber)
    if (localSequenceFloor > 0 && allocatedSuffix < localSequenceFloor) {
      allocatedInquiryNumber = buildNextInquiryNumberFromFloor(localSequenceFloor)
    }
    workingPayload.inquiry_number = allocatedInquiryNumber
    if ((workingPayload.document_data_snapshot || null) && typeof workingPayload.document_data_snapshot === 'object') {
      workingPayload.document_data_snapshot = {
        ...workingPayload.document_data_snapshot,
        inquiryNo: allocatedInquiryNumber,
      }
    }

    if (shouldPreferRestInsert) {
      try {
        const restInserted = await insertInquiryRowViaRest(workingPayload, `${context} (proxy-first)`)
        if (restInserted) {
          if (removedColumns.length > 0) {
            console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
          }
          return restInserted
        }
      } catch (restError) {
        if (isInquiryPrimaryKeyConflictError(restError)) {
          const existing = await waitForExistingInquiryRowById(String(workingPayload.id || ''))
          if (existing) {
            console.warn(`[Supabase] ${context}: proxy-first REST insert hit primary key conflict, returning existing inquiry row.`, restError)
            return existing
          }
        }
        if (isInquiryNumberConflictError(restError)) {
          localSequenceFloor = Math.max(localSequenceFloor, extractInquirySuffix(workingPayload.inquiry_number) + 1)
          lastTransientError = toRuntimeError(
            restError,
            `${context} retrying after inquiry number conflict`,
          )
          console.warn(`[Supabase] ${context}: proxy-first REST insert hit inquiry number conflict, bumping sequence floor.`, restError)
          continue
        }
        if (isTransientSupabaseRequestError(restError)) {
          lastTransientError = toRuntimeError(restError, `${context} REST insert fallback failed`)
          console.warn(`[Supabase] ${context}: proxy-first REST insert interrupted, falling back to SDK insert.`, restError)
        }
        else if (isSupabaseAuthTokenError(restError)) {
          console.warn(`[Supabase] ${context}: proxy-first REST insert auth failed (JWT expired). Session needs re-login.`, restError)
          throw restError
        }
        else if (isSupabasePermissionDeniedError(restError)) {
          lastTransientError = toRuntimeError(restError, `${context} REST permission denied, falling back to SDK insert`)
          console.warn(`[Supabase] ${context}: proxy-first REST insert permission denied, falling back to SDK insert.`, restError)
        }
        else {
          throw restError
        }
      }
    }

    let data: any = null
    let error: any = null
    try {
      if (shouldPreferRestInsert) {
        await ensureSupabaseClientSessionReady({ forceRefresh: attempt > 0 })
      }
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
      if (isTransientSupabaseRequestError(requestError)) {
        lastTransientError = toRuntimeError(requestError, `${context} interrupted`)
        console.warn(
          `[Supabase] ${context}: insert interrupted, ${
            allowRestFallbackAfterSdkAbort ? 'trying REST fallback before retry.' : 'retrying SDK insert without REST fallback in localhost/proxy mode.'
          }`,
          requestError,
        )
        const existing = await getExistingInquiryRowById(String(workingPayload.id || ''))
        if (existing) {
          return existing
        }
        if (allowRestFallbackAfterSdkAbort) {
          try {
            const restInserted = await insertInquiryRowViaRest(workingPayload, context)
            if (restInserted) {
              return restInserted
            }
          } catch (restError) {
            if (isInquiryPrimaryKeyConflictError(restError)) {
              const existing = await waitForExistingInquiryRowById(String(workingPayload.id || ''))
              if (existing) {
                console.warn(`[Supabase] ${context}: REST insert hit primary key conflict, returning existing inquiry row.`, restError)
                return existing
              }
            }
            if (isInquiryNumberConflictError(restError)) {
              localSequenceFloor = Math.max(localSequenceFloor, extractInquirySuffix(workingPayload.inquiry_number) + 1)
              lastTransientError = toRuntimeError(
                restError,
                `${context} retrying after inquiry number conflict`,
              )
              console.warn(`[Supabase] ${context}: REST insert hit inquiry number conflict, bumping sequence floor.`, restError)
              continue
            }
            lastTransientError = toRuntimeError(restError, `${context} REST insert fallback failed`)
            console.warn(`[Supabase] ${context}: REST insert fallback failed, retrying.`, restError)
          }
        }
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

    if (isTransientSupabaseRequestError(error)) {
      lastTransientError = toRuntimeError(error, `${context} interrupted`)
      console.warn(
        `[Supabase] ${context}: insert returned transient abort, ${
          allowRestFallbackAfterSdkAbort ? 'trying REST fallback before retry.' : 'retrying SDK insert without REST fallback in localhost/proxy mode.'
        }`,
        error,
      )
      const existing = await getExistingInquiryRowById(String(workingPayload.id || ''))
      if (existing) {
        return existing
      }
      if (allowRestFallbackAfterSdkAbort) {
        try {
          const restInserted = await insertInquiryRowViaRest(workingPayload, context)
          if (restInserted) {
            return restInserted
          }
        } catch (restError) {
          if (isInquiryPrimaryKeyConflictError(restError)) {
            const existing = await waitForExistingInquiryRowById(String(workingPayload.id || ''))
            if (existing) {
              console.warn(`[Supabase] ${context}: REST insert hit primary key conflict after transient abort, returning existing inquiry row.`, restError)
              return existing
            }
          }
          if (isInquiryNumberConflictError(restError)) {
            localSequenceFloor = Math.max(localSequenceFloor, extractInquirySuffix(workingPayload.inquiry_number) + 1)
            lastTransientError = toRuntimeError(
              restError,
              `${context} retrying after inquiry number conflict`,
            )
            console.warn(`[Supabase] ${context}: REST insert hit inquiry number conflict after transient abort, bumping sequence floor.`, restError)
            continue
          }
          lastTransientError = toRuntimeError(restError, `${context} REST insert fallback failed`)
          console.warn(`[Supabase] ${context}: REST insert fallback failed after transient abort.`, restError)
        }
      }
      continue
    }

    const missingColumn = deps.extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(workingPayload, missingColumn)) {
      delete workingPayload[missingColumn]
      rememberMissingColumn('inquiries', missingColumn)
      removedColumns.push(missingColumn)
      continue
    }

    if (error.code === '23505' && String(error.message || '').includes('inquiries_pkey')) {
      const existing = await waitForExistingInquiryRowById(String(workingPayload.id || ''))
      if (existing) {
        return existing
      }
      continue
    }

    if (isInquiryNumberConflictError(error)) {
      localSequenceFloor = Math.max(localSequenceFloor, extractInquirySuffix(workingPayload.inquiry_number) + 1)
      if (attempt >= 1) {
        lastTransientError = new Error(`${context} deferred after repeated inquiry number conflicts`)
        break
      }
      continue
    }

    deps.throwSupabaseError(context, error)
  }

  if (lastTransientError) {
    throw lastTransientError
  }

  throw new Error(`${context} failed: exceeded retry budget`)
}

export async function updateInquiryRowViaRest(
  id: string,
  payload: Record<string, any>,
  context: string,
): Promise<any | null> {
  if (typeof window === 'undefined') return null

  const normalizedId = String(id || '').trim()
  if (!normalizedId) {
    throw new Error(`${context} failed: missing inquiry id`)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 20000)

  try {
    const accessToken = await resolveValidSupabaseAccessToken()
    const restBase = shouldUseSupabaseProxy() ? '/__supabase_rest__' : `${supabaseUrl}/rest/v1`
    const response = await fetch(
      `${restBase}/inquiries?id=eq.${encodeURIComponent(normalizedId)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    )

    const rawText = await response.text()
    const parsed = rawText ? JSON.parse(rawText) : null

    if (!response.ok) {
      throw new Error(
        `${context} REST update failed: ${formatUnknownError(parsed || rawText || response.statusText || response.status)}`,
      )
    }

    if (Array.isArray(parsed)) {
      return parsed[0] || null
    }

    return parsed || null
  } finally {
    window.clearTimeout(timeoutId)
  }
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
  const cachedBindingFetchedAt = Number((cachedBinding as any)?.__fetchedAt || 0)
  if (cachedBinding && (Date.now() - cachedBindingFetchedAt) < TEMPLATE_BINDING_CACHE_TTL_MS) {
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
    __fetchedAt: Date.now(),
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
