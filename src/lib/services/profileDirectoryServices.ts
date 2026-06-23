import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { getStoredPortalRole, isStoredStaffPortalRole } from '../../utils/dataIsolation'
import { adminOrganizationSnapshotService } from './adminOrganizationSnapshotService'
import {
  hasLegacyAdminRosterArtifacts,
  normalizeAdminRosterAccounts,
  normalizeAdminRosterContacts,
  validateAdminRoster,
} from './adminRosterNormalizer'
import {
  inferRegionCode,
  resolvePermissionRoleCode,
} from '../../components/admin/admin-organization-profile/roleMappingEngine'

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

function isAbortLikeError(error: unknown) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    (error as any)?.name === 'AbortError' ||
    message.includes('signal is aborted') ||
    message.includes('request aborted')
  )
}

const LOCAL_ADMIN_AUTH_STORAGE_KEY = 'cosun_admin_local_auth'
const LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY = 'cosun_admin_local_auth_email'
const LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY = 'cosun_admin_local_auth_password'

function buildFunctionsUrl(path: string) {
  return `${supabaseUrl}/functions/v1/make-server-880fd43b${path}`
}

function canUsePrivilegedStaffDirectoryLookup() {
  if (typeof window === 'undefined') return false
  const portalRole = getStoredPortalRole()
  if (portalRole === 'admin' || portalRole === 'staff') return true
  if (portalRole === 'customer' || portalRole === 'supplier') return false
  return isStoredStaffPortalRole()
}

async function loadStaffDirectoryViaFunction(region?: string | null): Promise<StaffDirectoryProfile[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const localAdminEnabled = typeof window !== 'undefined' && localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true'
  const localAdminEmail = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY) || '' : ''
  const localAdminPassword = typeof window !== 'undefined' ? sessionStorage.getItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY) || '' : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch(buildFunctionsUrl('/auth/staff-directory'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      region: region || '',
      localAdminAuth: localAdminEnabled
        ? {
            email: localAdminEmail,
            password: localAdminPassword,
          }
        : null,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  const message = String(payload?.message || payload?.msg || payload?.error_description || payload?.error || '').trim()
  if (!response.ok || payload?.success === false) {
    throw new Error(message || 'load staff directory failed')
  }

  return Array.isArray(payload?.staff)
    ? payload.staff.map(fromStaffProfileRow).filter(Boolean) as StaffDirectoryProfile[]
    : []
}

async function saveAdminOrganizationViaFunction(profile: Record<string, any>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const localAdminEnabled = typeof window !== 'undefined' && localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true'
  const localAdminEmail = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY) || '' : ''
  const localAdminPassword = typeof window !== 'undefined' ? sessionStorage.getItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY) || '' : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch(buildFunctionsUrl('/auth/save-admin-organization'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      profile,
      localAdminAuth: localAdminEnabled
        ? {
            email: localAdminEmail,
            password: localAdminPassword,
          }
        : null,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  const message = String(payload?.message || payload?.msg || payload?.error_description || payload?.error || '').trim()
  if (!response.ok || payload?.success === false) {
    throw new Error(message || 'save admin organization profile failed')
  }

  return payload
}

async function reconcileAdminOrganizationRosterViaFunction(profile: Record<string, any>) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const localAdminEnabled = typeof window !== 'undefined' && localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true'
  const localAdminEmail = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY) || '' : ''
  const localAdminPassword = typeof window !== 'undefined' ? sessionStorage.getItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY) || '' : ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
  }

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  const response = await fetch(buildFunctionsUrl('/auth/reconcile-admin-roster'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      profile,
      localAdminAuth: localAdminEnabled
        ? {
            email: localAdminEmail,
            password: localAdminPassword,
          }
        : null,
    }),
  })

  const payload = await response.json().catch(() => ({}))
  const message = String(payload?.message || payload?.msg || payload?.error_description || payload?.error || '').trim()
  if (!response.ok || payload?.success === false) {
    throw new Error(message || 'reconcile admin organization roster failed')
  }

  return payload
}

function isAdminIdentityConflictError(error: unknown) {
  const normalizedError = String((error as any)?.message || error || '').toLowerCase()
  return normalizedError.includes('identities_provider_id_provider_unique')
    || normalizedError.includes('duplicate key value violates unique constraint "identities_provider_id_provider_unique"')
}

async function saveAdminOrganizationViaRpc(payload: Record<string, any>) {
  const { data, error } = await supabase.rpc('save_admin_organization_snapshot', {
    p_payload: payload,
  })

  if (error) {
    throw buildSupabaseError('save admin organization profile rpc', error)
  }

  return data
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

const SHARED_ROLE_UI_PREFERENCE_NAMESPACE = '__shared_role_ui_preferences'

const toSharedRolePreferenceScopeKey = (scope: string) => String(scope || '').trim() || 'default'

export const sharedRoleUiPreferenceService = {
  async get(scope: string, key: string): Promise<Record<string, any> | null> {
    const scopeKey = toSharedRolePreferenceScopeKey(scope)
    const { data, error } = await supabase
      .from('admin_organizations')
      .select('document_defaults')
      .eq('id', 'admin-org-001')
      .maybeSingle()

    if (error) throw buildSupabaseError(`load shared role ui preference ${scopeKey}/${key}`, error)

    const documentDefaults = asObject((data as any)?.document_defaults)
    const sharedRolePreferences = asObject(documentDefaults?.[SHARED_ROLE_UI_PREFERENCE_NAMESPACE])
    const scopedPreferences = asObject(sharedRolePreferences?.[scopeKey])
    return asObject(scopedPreferences?.[key]) || null
  },

  async save(scope: string, key: string, value: Record<string, any>): Promise<Record<string, any>> {
    const scopeKey = toSharedRolePreferenceScopeKey(scope)
    const { data: profileRow, error: loadError } = await supabase
      .from('admin_organizations')
      .select('document_defaults')
      .eq('id', 'admin-org-001')
      .maybeSingle()

    if (loadError) throw buildSupabaseError(`load current shared role ui preferences ${scopeKey}/${key}`, loadError)

    const documentDefaults = asObject((profileRow as any)?.document_defaults)
    const sharedRolePreferences = asObject(documentDefaults?.[SHARED_ROLE_UI_PREFERENCE_NAMESPACE])
    const scopedPreferences = asObject(sharedRolePreferences?.[scopeKey])
    const nextDocumentDefaults = {
      ...documentDefaults,
      [SHARED_ROLE_UI_PREFERENCE_NAMESPACE]: {
        ...sharedRolePreferences,
        [scopeKey]: {
          ...scopedPreferences,
          [key]: value,
        },
      },
    }

    const { error: updateError } = await supabase
      .from('admin_organizations')
      .update({
        document_defaults: nextDocumentDefaults,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'admin-org-001')

    if (updateError) throw buildSupabaseError(`save shared role ui preference ${scopeKey}/${key}`, updateError)

    return value
  },
}

export type StaffDirectoryProfile = {
  id: string
  email: string
  name: string
  portalRole: string
  rbacRole: string
  region: string
}

export type ExternalPortalDirectoryEntry = {
  id: string
  email: string
  name: string
  portalRole: 'customer' | 'supplier'
  company: string
  phone: string
  region: string
}

type AdminOrganizationSupabaseRecord = {
  id?: string | null
  name_cn?: string | null
  name_en?: string | null
  description_cn?: string | null
  description_en?: string | null
  phone?: string | null
  email?: string | null
  contact_person?: string | null
  website?: string | null
  address_cn?: string | null
  address_en?: string | null
  tax_id?: string | null
  default_currency?: string | null
  timezone?: string | null
  logo_url?: string | null
  rmb_bank?: Record<string, any> | null
  usd_bank?: Record<string, any> | null
  private_bank?: Record<string, any> | null
  internal_contacts?: any[] | null
  internal_accounts?: any[] | null
  document_defaults?: Record<string, any> | null
}

const STAFF_DIRECTORY_CACHE_KEY = 'cosun_staff_directory_cache_v1'

const STAFF_DIRECTORY_FALLBACK_ROWS: StaffDirectoryProfile[] = [
  { id: 'fallback-regional-manager-na', email: 'salesmanager-na@cosunchina.com', name: '刘建国', portalRole: 'admin', rbacRole: 'Regional_Manager', region: 'NA' },
  { id: 'fallback-sales-rep-na', email: 'sales01-na@cosunchina.com', name: '马里奥', portalRole: 'admin', rbacRole: 'Sales_Rep', region: 'NA' },
  { id: 'fallback-sales-rep-na-2', email: 'sales02-na@cosunchina.com', name: '艾青', portalRole: 'admin', rbacRole: 'Sales_Rep', region: 'NA' },
  { id: 'fallback-regional-manager-sa', email: 'salesmanager-sa@cosunchina.com', name: '陈明华', portalRole: 'admin', rbacRole: 'Regional_Manager', region: 'SA' },
  { id: 'fallback-sales-rep-sa', email: 'sales01-sa@cosunchina.com', name: '安娜', portalRole: 'admin', rbacRole: 'Sales_Rep', region: 'SA' },
  { id: 'fallback-regional-manager-ea', email: 'salesmanager-ea@cosunchina.com', name: '赵国强', portalRole: 'admin', rbacRole: 'Regional_Manager', region: 'EA' },
  { id: 'fallback-sales-rep-ea', email: 'sales02-ea@cosunchina.com', name: '艾玛', portalRole: 'admin', rbacRole: 'Sales_Rep', region: 'EA' },
]

const normalizeStaffRegionCode = (region?: string | null): 'NA' | 'SA' | 'EA' | 'all' | '' => {
  const value = String(region || '').trim().toLowerCase()
  if (!value) return ''
  if (value === 'all') return 'all'
  if (['na', 'north america', 'north_america', 'north-america', '北美'].includes(value)) return 'NA'
  if (['sa', 'south america', 'south_america', 'south-america', '南美'].includes(value)) return 'SA'
  if (['ea', 'emea', 'europe & africa', 'europe_africa', 'europe-africa', '欧非'].includes(value)) return 'EA'
  return ''
}

const fromStaffProfileRow = (row: any): StaffDirectoryProfile | null => {
  if (!row) return null
  const email = String(row.email || '').trim().toLowerCase()
  if (!email) return null
  return {
    id: String(row.id || ''),
    email,
    name: String(row.name || email.split('@')[0] || ''),
    portalRole: String(row.portal_role || ''),
    rbacRole: String(row.rbac_role || ''),
    region: normalizeStaffRegionCode(row.region) || String(row.region || ''),
  }
}

const persistStaffDirectoryCache = (rows: StaffDirectoryProfile[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STAFF_DIRECTORY_CACHE_KEY, JSON.stringify(rows))
  } catch {
    // ignore cache failures
  }
}

const fromAdminOrganizationProfile = (profile: any): StaffDirectoryProfile[] => {
  if (!profile) return []

  const contacts = Array.isArray(profile.internalContacts) ? profile.internalContacts : []
  const accounts = normalizeAdminRosterAccounts(Array.isArray(profile.internalAccounts) ? profile.internalAccounts : [])
  const contactById = new Map<string, any>()
  const contactByEmail = new Map<string, any>()

  contacts.forEach((contact) => {
    const id = String(contact?.id || '').trim()
    const email = String(contact?.email || '').trim().toLowerCase()
    if (id) contactById.set(id, contact)
    if (email) contactByEmail.set(email, contact)
  })

  return accounts
    .filter((account) => String(account?.accountStatus || 'active').trim().toLowerCase() !== 'deleted')
    .filter((account) => String(account?.canLogin ?? true) !== 'false')
    .map((account) => {
      const email = String(account?.loginEmail || '').trim().toLowerCase()
      if (!email) return null

      const linkedContact = contactById.get(String(account?.employeeId || '').trim())
        || contactByEmail.get(email)
      const resolvedDepartment = String(linkedContact?.department || account?.department || '').trim()
      const resolvedRegion = inferRegionCode(account?.region || linkedContact?.region, resolvedDepartment)
      const resolvedRole = resolvePermissionRoleCode(
        account?.role,
        linkedContact?.title,
        resolvedDepartment,
        resolvedRegion,
      )

      return {
        id: String(account?.authUserId || account?.id || email),
        email,
        name: String(linkedContact?.name || account?.username || email.split('@')[0] || ''),
        portalRole: 'admin',
        rbacRole: resolvedRole || String(account?.role || ''),
        region: normalizeStaffRegionCode(resolvedRegion) || String(resolvedRegion || ''),
      } satisfies StaffDirectoryProfile
    })
    .filter(Boolean) as StaffDirectoryProfile[]
}

const loadAdminOrganizationStaffProfiles = async (): Promise<StaffDirectoryProfile[]> => {
  const snapshotRows = fromAdminOrganizationProfile(adminOrganizationSnapshotService.latest()?.payload)

  try {
    const profile = await adminOrganizationService.get()
    return mergeStaffDirectoryProfiles(fromAdminOrganizationProfile(profile), snapshotRows)
  } catch (error) {
    if (!isAbortLikeError(error)) {
      console.warn('[staffDirectoryService] admin organization staff fallback:', error)
    }
    return snapshotRows
  }
}

const mergeStaffDirectoryProfiles = (...groups: StaffDirectoryProfile[][]): StaffDirectoryProfile[] => {
  const merged = new Map<string, StaffDirectoryProfile>()
  groups.flat().forEach((row) => {
    if (!row?.email) return
    merged.set(String(row.email).trim().toLowerCase(), row)
  })
  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name))
}

const filterStaffDirectoryByRegion = (rows: StaffDirectoryProfile[], region?: string | null): StaffDirectoryProfile[] => {
  const normalizedRegion = normalizeStaffRegionCode(region)
  if (!normalizedRegion || normalizedRegion === 'all') return rows
  return rows.filter((row) => normalizeStaffRegionCode(row.region) === normalizedRegion)
}

export const staffDirectoryService = {
  getCachedSalesStaff(): StaffDirectoryProfile[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STAFF_DIRECTORY_CACHE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed.map(fromStaffProfileRow).filter(Boolean) as StaffDirectoryProfile[] : []
    } catch {
      return []
    }
  },

  async listSalesStaffByRegion(region?: string | null): Promise<StaffDirectoryProfile[]> {
    const adminOrgRows = await loadAdminOrganizationStaffProfiles()
    const cachedRows = mergeStaffDirectoryProfiles(this.getCachedSalesStaff(), adminOrgRows, STAFF_DIRECTORY_FALLBACK_ROWS)
    if (!canUsePrivilegedStaffDirectoryLookup()) {
      return filterStaffDirectoryByRegion(cachedRows, region)
    }
    try {
      const rows = mergeStaffDirectoryProfiles(
        await loadStaffDirectoryViaFunction(region),
        adminOrgRows,
        STAFF_DIRECTORY_FALLBACK_ROWS,
      )
      persistStaffDirectoryCache(rows)
      return filterStaffDirectoryByRegion(rows, region)
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.warn('[staffDirectoryService] function staff directory fallback:', error)
      }
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id,email,name,portal_role,rbac_role,region')
        .in('rbac_role', ['CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Finance', 'Procurement', 'Documentation_Officer', 'Marketing_Ops', 'Admin'])
        .order('name', { ascending: true })

      if (error) throw buildSupabaseError('list sales staff by region', error)

      const rows = mergeStaffDirectoryProfiles(
        (data || []).map(fromStaffProfileRow).filter(Boolean) as StaffDirectoryProfile[],
        adminOrgRows,
        STAFF_DIRECTORY_FALLBACK_ROWS,
      )

      persistStaffDirectoryCache(rows)
      return filterStaffDirectoryByRegion(rows, region)
    } catch (error) {
      if (!isAbortLikeError(error)) {
        console.warn('[staffDirectoryService] listSalesStaffByRegion fallback:', error)
      }
      return filterStaffDirectoryByRegion(cachedRows, region)
    }
  },

  async findRegionalManagerByRegion(region?: string | null): Promise<StaffDirectoryProfile | null> {
    const normalizedRegion = normalizeStaffRegionCode(region)
    if (!normalizedRegion || normalizedRegion === 'all') return null
    const staff = await this.listSalesStaffByRegion(normalizedRegion)
    return staff.find((row) => row.rbacRole === 'Regional_Manager' && normalizeStaffRegionCode(row.region) === normalizedRegion) || null
  },

  async listSalesRepsByRegion(region?: string | null): Promise<StaffDirectoryProfile[]> {
    const normalizedRegion = normalizeStaffRegionCode(region)
    if (!normalizedRegion || normalizedRegion === 'all') return []
    const staff = await this.listSalesStaffByRegion(normalizedRegion)
    return staff.filter((row) => row.rbacRole === 'Sales_Rep' && normalizeStaffRegionCode(row.region) === normalizedRegion)
  },
}

const fromExternalPortalDirectoryRow = (row: any): ExternalPortalDirectoryEntry | null => {
  if (!row) return null
  const portalRole = String(row.portal_role || '').trim().toLowerCase()
  if (portalRole !== 'customer' && portalRole !== 'supplier') return null
  const email = String(row.email || '').trim().toLowerCase()
  if (!email) return null
  return {
    id: String(row.id || email),
    email,
    name: String(row.name || email.split('@')[0] || ''),
    portalRole,
    company: String(row.company || ''),
    phone: String(row.phone || ''),
    region: normalizeStaffRegionCode(row.region) || String(row.region || ''),
  }
}

export const externalPortalDirectoryService = {
  async listByPortalRole(portalRole: 'customer' | 'supplier'): Promise<ExternalPortalDirectoryEntry[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id,email,name,portal_role,company,phone,region')
      .eq('portal_role', portalRole)

    if (error) throw buildSupabaseError(`list external portal users ${portalRole}`, error)

    return Array.isArray(data)
      ? data.map(fromExternalPortalDirectoryRow).filter(Boolean) as ExternalPortalDirectoryEntry[]
      : []
  },

  async listAll(): Promise<ExternalPortalDirectoryEntry[]> {
    const [customers, suppliers] = await Promise.all([
      this.listByPortalRole('customer'),
      this.listByPortalRole('supplier'),
    ])
    return [...customers, ...suppliers]
  },
}

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function mapAdminOrganizationRow(row: AdminOrganizationSupabaseRecord | null) {
  if (!row) return null
  const internalContacts = normalizeAdminRosterContacts(asArray(row.internal_contacts))
  const internalAccounts = normalizeAdminRosterAccounts(asArray(row.internal_accounts))
  return {
    id: row.id || 'admin-org-001',
    nameCN: row.name_cn || '',
    nameEN: row.name_en || '',
    descriptionCN: row.description_cn || '',
    descriptionEN: row.description_en || '',
    phone: row.phone || '',
    email: row.email || '',
    contactPerson: row.contact_person || '',
    website: row.website || '',
    addressCN: row.address_cn || '',
    addressEN: row.address_en || '',
    taxId: row.tax_id || '',
    defaultCurrency: row.default_currency || '',
    timezone: row.timezone || '',
    logoUrl: row.logo_url || null,
    bankRMB: asObject(row.rmb_bank),
    bankUSD: asObject(row.usd_bank),
    bankPrivate: asObject(row.private_bank),
    internalContacts,
    internalAccounts,
    documentDefaults: asObject(row.document_defaults),
  }
}

export const adminOrganizationService = {
  async get() {
    const { data, error } = await supabase
      .from('admin_organizations')
      .select(`
        id,
        name_cn,
        name_en,
        description_cn,
        description_en,
        phone,
        email,
        contact_person,
        website,
        address_cn,
        address_en,
        tax_id,
        default_currency,
        timezone,
        logo_url,
        rmb_bank,
        usd_bank,
        private_bank,
        internal_contacts,
        internal_accounts,
        document_defaults
      `)
      .eq('id', 'admin-org-001')
      .maybeSingle()

    if (error) throw buildSupabaseError('load admin organization profile', error)
    return mapAdminOrganizationRow(data as AdminOrganizationSupabaseRecord | null)
  },

  async save(profile: Record<string, any>) {
    const internalContacts = normalizeAdminRosterContacts(profile.internalContacts || [])
    const internalAccounts = normalizeAdminRosterAccounts(profile.internalAccounts || [])
    const validationErrors = validateAdminRoster(internalContacts, internalAccounts)
    if (validationErrors.length > 0) {
      throw new Error(`admin roster validation failed: ${validationErrors.join('; ')}`)
    }
    const shouldDropLegacyArtifacts = hasLegacyAdminRosterArtifacts(internalContacts, internalAccounts)
    const payload = {
      id: profile.id || 'admin-org-001',
      name_cn: profile.nameCN || '',
      name_en: profile.nameEN || '',
      description_cn: profile.descriptionCN || '',
      description_en: profile.descriptionEN || '',
      phone: profile.phone || '',
      email: profile.email || '',
      contact_person: profile.contactPerson || '',
      website: profile.website || '',
      address_cn: profile.addressCN || '',
      address_en: profile.addressEN || '',
      tax_id: profile.taxId || '',
      default_currency: profile.defaultCurrency || '',
      timezone: profile.timezone || '',
      logo_url: profile.logoUrl || null,
      rmb_bank: profile.bankRMB || {},
      usd_bank: profile.bankUSD || {},
      private_bank: profile.bankPrivate || {},
      internal_contacts: shouldDropLegacyArtifacts ? [] : internalContacts,
      internal_accounts: shouldDropLegacyArtifacts ? [] : internalAccounts,
      document_defaults: profile.documentDefaults || {},
      updated_at: new Date().toISOString(),
    }

    const tryReconcileRoster = async (sourceError: unknown) => {
      if (!payload.internal_accounts?.length) {
        throw sourceError
      }
      try {
        await reconcileAdminOrganizationRosterViaFunction(payload)
      } catch (reconcileError) {
        throw buildSupabaseError('save admin organization profile', reconcileError || sourceError)
      }
    }

    // Prefer the database RPC first because it is faster and more reliable than
    // the edge-function path for large roster payloads.
    try {
      await saveAdminOrganizationViaRpc(payload)
    } catch (rpcError) {
      if (isAdminIdentityConflictError(rpcError)) {
        await tryReconcileRoster(rpcError)
      } else {
        try {
          const { error: directError } = await supabase
            .from('admin_organizations')
            .upsert(payload, { onConflict: 'id' })

          if (directError) {
            throw directError
          }
        } catch (directError) {
          if (isAdminIdentityConflictError(directError)) {
            await tryReconcileRoster(directError)
          } else {
            try {
              await saveAdminOrganizationViaFunction(payload)
            } catch (functionError) {
              if (isAdminIdentityConflictError(functionError)) {
                await tryReconcileRoster(functionError)
              } else {
                throw buildSupabaseError('save admin organization profile', functionError || directError || rpcError)
              }
            }
          }
        }
      }
    }

    adminOrganizationSnapshotService.save('manual_save', {
      ...profile,
      internalContacts,
      internalAccounts,
    })
    return profile
  },
}
