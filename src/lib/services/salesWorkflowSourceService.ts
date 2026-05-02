import { contractService, inquiryService, paymentService, purchaseOrderService, quotationRequestService, quoteRequirementService, salesQuotationService, staffDirectoryService } from '../supabaseService'
import { exportServiceOrdersDb } from '../supabase-db'
import { supabase } from '../supabase'

export interface SalesWorkflowSourceSnapshot {
  inquiries: any[]
  quoteRequirements: any[]
  quotationRequests: any[]
  quotations: any[]
  contracts: any[]
  purchaseOrders: any[]
  payments: any[]
  exportServiceOrders: any[]
}

export const EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT: SalesWorkflowSourceSnapshot = {
  inquiries: [],
  quoteRequirements: [],
  quotationRequests: [],
  quotations: [],
  contracts: [],
  purchaseOrders: [],
  payments: [],
  exportServiceOrders: [],
}

export interface SalesWorkflowSourceActor {
  email?: string | null
  name?: string | null
  role?: string | null
  region?: string | null
}

const SALES_SCOPED_ROLES = new Set(['Sales_Rep', 'Sales_Assistant', 'Regional_Manager', 'Sales_Manager', 'Sales_Director', 'CEO'])
const SALES_WORKFLOW_SNAPSHOT_CACHE_PREFIX = 'sales_workflow_snapshot_v1'

function normalizeIdentityText(value?: string | null): string {
  return String(value || '').trim().toLowerCase().replace(/[\s._-]+/g, '')
}

function normalizeRegionCode(value?: string | null): string {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'NORTH AMERICA') return 'NA'
  if (normalized === 'SOUTH AMERICA') return 'SA'
  if (normalized === 'EUROPE & AFRICA' || normalized === 'EMEA') return 'EA'
  return normalized
}

function buildSnapshotCacheKey(actor?: SalesWorkflowSourceActor): string {
  const normalizedEmail = String(actor?.email || '').trim().toLowerCase() || 'anonymous'
  const normalizedName = normalizeIdentityText(actor?.name) || 'unknown'
  const normalizedRole = String(actor?.role || '').trim().toLowerCase() || 'unknown'
  const normalizedRegion = normalizeRegionCode(actor?.region) || 'all'
  return `${SALES_WORKFLOW_SNAPSHOT_CACHE_PREFIX}:${normalizedEmail}:${normalizedName}:${normalizedRole}:${normalizedRegion}`
}

function isValidSnapshot(value: any): value is SalesWorkflowSourceSnapshot {
  return Boolean(value)
    && Array.isArray(value.inquiries)
    && Array.isArray(value.quoteRequirements)
    && Array.isArray(value.quotationRequests)
    && Array.isArray(value.quotations)
    && Array.isArray(value.contracts)
    && Array.isArray(value.purchaseOrders)
    && Array.isArray(value.payments)
    && Array.isArray(value.exportServiceOrders)
}

export function hasSalesWorkflowSnapshotData(snapshot?: SalesWorkflowSourceSnapshot | null): boolean {
  if (!snapshot) return false
  return [
    snapshot.inquiries,
    snapshot.quoteRequirements,
    snapshot.quotationRequests,
    snapshot.quotations,
    snapshot.contracts,
    snapshot.purchaseOrders,
    snapshot.payments,
    snapshot.exportServiceOrders,
  ].some((rows) => Array.isArray(rows) && rows.length > 0)
}

export function readCachedSalesWorkflowSourceSnapshot(actor?: SalesWorkflowSourceActor): SalesWorkflowSourceSnapshot {
  if (typeof window === 'undefined') return EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT
  try {
    const raw = localStorage.getItem(buildSnapshotCacheKey(actor))
    const parsed = raw ? JSON.parse(raw) : null
    return isValidSnapshot(parsed) ? parsed : EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT
  } catch {
    return EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT
  }
}

function writeCachedSalesWorkflowSourceSnapshot(actor: SalesWorkflowSourceActor | undefined, snapshot: SalesWorkflowSourceSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(buildSnapshotCacheKey(actor), JSON.stringify(snapshot))
  } catch {}
}

async function resolveScopedSalesEmail(actor?: SalesWorkflowSourceActor): Promise<string> {
  const directEmail = String(actor?.email || '').trim().toLowerCase()

  const normalizedName = normalizeIdentityText(actor?.name)
  const normalizedRegion = normalizeRegionCode(actor?.region)
  if (normalizedName) {
    const matchByName = (rows: Array<{ name?: string | null; email?: string | null; region?: string | null }>) =>
      rows.find((staff) => {
        if (normalizeIdentityText(staff?.name) !== normalizedName) return false
        if (!normalizedRegion) return true
        return normalizeRegionCode(staff?.region) === normalizedRegion
      })

    const cachedStaff = staffDirectoryService.getCachedSalesStaff()
    const cachedMatch = matchByName(cachedStaff)
    const cachedEmail = String(cachedMatch?.email || '').trim().toLowerCase()
    if (cachedEmail) return cachedEmail

    const loadedStaff = await staffDirectoryService.listSalesStaffByRegion(actor?.region).catch(() => [])
    const loadedMatch = matchByName(loadedStaff)
    const loadedEmail = String(loadedMatch?.email || '').trim().toLowerCase()
    if (loadedEmail) return loadedEmail
  }

  if (directEmail) return directEmail

  const {
    data: { session },
  } = await supabase.auth.getSession()
  return String(session?.user?.email || '').trim().toLowerCase()
}

async function loadScopedQuotations(actor?: SalesWorkflowSourceActor): Promise<any[]> {
  const role = String(actor?.role || '').trim()
  const shouldScopeQuotations = SALES_SCOPED_ROLES.has(role)
  const scopedEmail = shouldScopeQuotations ? await resolveScopedSalesEmail(actor) : ''

  if (shouldScopeQuotations && scopedEmail) {
    const scopedRows = await salesQuotationService
      .getBySalesPerson(scopedEmail)
      .catch(() => [])
    if (Array.isArray(scopedRows) && scopedRows.length > 0) {
      return scopedRows
    }

    const serverRows = await salesQuotationService
      .listViaServer({ ownerEmail: scopedEmail })
      .catch(() => [])
    if (Array.isArray(serverRows) && serverRows.length > 0) {
      return serverRows
    }
  }

  return salesQuotationService.getAll().catch(() => [])
}

export async function loadSalesWorkflowSourceSnapshot(actor?: SalesWorkflowSourceActor): Promise<SalesWorkflowSourceSnapshot> {
  const [
    inquiries,
    quoteRequirements,
    quotationRequests,
    quotations,
    contracts,
    purchaseOrders,
    payments,
    exportServiceOrders,
  ] = await Promise.all([
    inquiryService.getAll().catch(() => []),
    quoteRequirementService.getAll().catch(() => []),
    quotationRequestService.getAll().catch(() => []),
    loadScopedQuotations(actor),
    contractService.getAll().catch(() => []),
    purchaseOrderService.getAll().catch(() => []),
    paymentService.getAll().catch(() => []),
    exportServiceOrdersDb.getAll().catch(() => []),
  ])

  const snapshot = {
    inquiries: Array.isArray(inquiries) ? inquiries : [],
    quoteRequirements: Array.isArray(quoteRequirements) ? quoteRequirements : [],
    quotationRequests: Array.isArray(quotationRequests) ? quotationRequests : [],
    quotations: Array.isArray(quotations) ? quotations : [],
    contracts: Array.isArray(contracts) ? contracts : [],
    purchaseOrders: Array.isArray(purchaseOrders) ? purchaseOrders : [],
    payments: Array.isArray(payments) ? payments : [],
    exportServiceOrders: Array.isArray(exportServiceOrders) ? exportServiceOrders : [],
  }
  writeCachedSalesWorkflowSourceSnapshot(actor, snapshot)
  return snapshot
}
