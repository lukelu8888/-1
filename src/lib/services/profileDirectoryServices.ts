import { supabase } from '../supabase'

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
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
    const cachedRows = mergeStaffDirectoryProfiles(this.getCachedSalesStaff(), STAFF_DIRECTORY_FALLBACK_ROWS)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id,email,name,portal_role,rbac_role,region')
        .in('rbac_role', ['CEO', 'CFO', 'Sales_Director', 'Regional_Manager', 'Sales_Manager', 'Sales_Rep', 'Finance', 'Procurement', 'Documentation_Officer', 'Marketing_Ops', 'Admin'])
        .order('name', { ascending: true })

      if (error) throw buildSupabaseError('list sales staff by region', error)

      const rows = mergeStaffDirectoryProfiles(
        (data || []).map(fromStaffProfileRow).filter(Boolean) as StaffDirectoryProfile[],
        STAFF_DIRECTORY_FALLBACK_ROWS,
      )

      persistStaffDirectoryCache(rows)
      return filterStaffDirectoryByRegion(rows, region)
    } catch (error) {
      console.warn('[staffDirectoryService] listSalesStaffByRegion fallback:', error)
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
    internalContacts: asArray(row.internal_contacts),
    internalAccounts: asArray(row.internal_accounts),
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
      internal_contacts: profile.internalContacts || [],
      internal_accounts: profile.internalAccounts || [],
      document_defaults: profile.documentDefaults || {},
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('admin_organizations')
      .upsert(payload, { onConflict: 'id' })

    if (error) throw buildSupabaseError('save admin organization profile', error)
    return profile
  },
}
