const CUSTOMER_PORTAL_QUOTATION_CACHE_PREFIX = 'customer_portal_quotations:'
const CUSTOMER_PORTAL_QUOTATION_CACHE_TTL_MS = 5 * 60 * 1000

function buildQuotationCacheKey(email?: string | null) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  return normalizedEmail ? `${CUSTOMER_PORTAL_QUOTATION_CACHE_PREFIX}${normalizedEmail}` : ''
}

export function readCustomerQuotationCache(email?: string | null): any[] {
  if (typeof window === 'undefined') return []
  const key = buildQuotationCacheKey(email)
  if (!key) return []

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const cachedAt = Number(parsed?.cachedAt || 0)
    const rows = Array.isArray(parsed?.rows) ? parsed.rows : []
    if (!cachedAt || Date.now() - cachedAt > CUSTOMER_PORTAL_QUOTATION_CACHE_TTL_MS) {
      return rows
    }
    return rows
  } catch {
    return []
  }
}

export function writeCustomerQuotationCache(email?: string | null, rows: any[] = []) {
  if (typeof window === 'undefined') return
  const key = buildQuotationCacheKey(email)
  if (!key) return

  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        cachedAt: Date.now(),
        rows: Array.isArray(rows) ? rows : [],
      }),
    )
  } catch {
    // Ignore cache failures to avoid blocking customer workflows.
  }
}
