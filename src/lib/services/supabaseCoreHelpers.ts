export function handleError(error: any, context: string) {
  if (error?.name === 'AbortError') {
    return null
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
}

export function buildSupabaseError(
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

export function throwSupabaseError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : buildSupabaseError(context, error))
}

export function extractMissingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the ['"]([^'"]+)['"] column/i)
  return match?.[1] || null
}

export function extractCheckConstraintColumn(error: any, table: string): string | null {
  const code = String(error?.code || '')
  const message = String(error?.message || '')
  if (code !== '23514' && !message.toLowerCase().includes('check constraint')) return null
  const constraintMatch = message.match(/check constraint "([^"]+)"/i)
  if (!constraintMatch) return null
  const constraintName = constraintMatch[1]
  const prefix = table + '_'
  const suffix = '_check'
  let col = constraintName
  if (col.startsWith(prefix)) col = col.slice(prefix.length)
  if (col.endsWith(suffix)) col = col.slice(0, col.length - suffix.length)
  return col || null
}

export function isMissingColumnError(error: any, column: string): boolean {
  const message = String(error?.message || '')
  return (
    (error as any)?.code === '42703' ||
    message.includes(column) ||
    message.includes(`accounts_receivable.${column}`) ||
    extractMissingColumn(error) === column
  )
}

export function matchesCustomerEmailFallback(row: Record<string, any> | null | undefined, email: string): boolean {
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

export function shouldDowngradeProfitRate(error: any, payload: Record<string, any>, adjustedProfitRate: boolean) {
  if (adjustedProfitRate) return false
  if (!Object.prototype.hasOwnProperty.call(payload, 'profit_rate')) return false
  const profitRate = Number(payload.profit_rate)
  if (!Number.isFinite(profitRate) || profitRate <= 1) return false
  const message = String(error?.message || '')
  return /numeric field overflow|value overflows numeric format/i.test(message)
}

export function normalizeProfitRatePercent(value: any): number {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return 0
  if (raw !== 0 && Math.abs(raw) <= 1) return raw * 100
  return raw
}

export function normalizeProfitRateForStorage(input: any, totalProfit?: any, totalCost?: any): number {
  const raw = Number(input)
  if (!Number.isFinite(raw)) return 0

  const numericTotalProfit = Number(totalProfit)
  const numericTotalCost = Number(totalCost)
  const derivedRatio = Number.isFinite(numericTotalProfit) && Number.isFinite(numericTotalCost) && numericTotalCost > 0
    ? numericTotalProfit / numericTotalCost
    : null
  const derivedPercent = derivedRatio == null ? null : derivedRatio * 100

  if (derivedPercent != null && Math.abs(raw - derivedPercent) < 0.0001) {
    return Number(derivedRatio!.toFixed(6))
  }
  if (derivedRatio != null && Math.abs(raw - derivedRatio) < 0.0001) {
    return Number(derivedRatio.toFixed(6))
  }

  return Math.abs(raw) >= 1 ? Number((raw / 100).toFixed(6)) : raw
}

export const REGION_NAME_TO_CODE: Record<string, string> = {
  'North America': 'NA', 'north america': 'NA', 'north-america': 'NA',
  'South America': 'SA', 'south america': 'SA', 'south-america': 'SA',
  'Europe & Africa': 'EA', 'europe & africa': 'EA', 'EMEA': 'EA', 'emea': 'EA',
  'NA': 'NA', 'SA': 'SA', 'EA': 'EA',
}

export const REGION_CODE_TO_NAME: Record<string, string> = {
  'NA': 'North America',
  'SA': 'South America',
  'EA': 'Europe & Africa',
}

export function toRegionCode(region: string | null | undefined): string | null {
  if (!region) return null
  return REGION_NAME_TO_CODE[region] || region
}

export function fromRegionCode(code: string | null | undefined): string | null {
  if (!code) return null
  return code
}

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const rand = Math.floor(Math.random() * 16)
    const value = ch === 'x' ? rand : ((rand & 0x3) | 0x8)
    return value.toString(16)
  })
}

export function toUUID(id: string | null | undefined): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return safeRandomUUID()
}

export function toUUIDOrNull(id: string | null | undefined): string | null {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return null
}

export function toIsoDate(v: any): string | null {
  if (!v) return null
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/')
    return `${y}-${m}-${d}`
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0]
  return String(v)
}
