import { supabase } from '../supabase'

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

type CustomerOrganizationSupabaseRecord = {
  id?: string | null
  auth_user_id?: string | null
  company_name?: string | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  mobile?: string | null
  address?: string | null
  website?: string | null
  business_type?: string | null
  logo_url?: string | null
}

type CustomerPortalProfileSupabaseRecord = {
  id?: string | null
  auth_user_id?: string | null
  display_name?: string | null
  login_email?: string | null
  portal_role?: string | null
  avatar_url?: string | null
}

type SupplierOrganizationSupabaseRecord = {
  id?: string | null
  auth_user_id?: string | null
  name_cn?: string | null
  name_en?: string | null
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  contact_person?: string | null
  logo_url?: string | null
}

type SupplierPortalProfileSupabaseRecord = {
  id?: string | null
  auth_user_id?: string | null
  display_name?: string | null
  login_email?: string | null
  portal_role?: string | null
  role_label?: string | null
  avatar_url?: string | null
}

function mapCustomerOrganizationRow(row: CustomerOrganizationSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    authUserId: row.auth_user_id || '',
    companyName: row.company_name || '',
    contactPerson: row.contact_person || '',
    email: row.email || '',
    phone: row.phone || '',
    mobile: row.mobile || '',
    address: row.address || '',
    website: row.website || '',
    businessType: row.business_type || 'Importer',
    logoUrl: row.logo_url || null,
  }
}

function mapCustomerPortalProfileRow(row: CustomerPortalProfileSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    authUserId: row.auth_user_id || '',
    displayName: row.display_name || '',
    loginEmail: row.login_email || '',
    portalRole: row.portal_role || 'customer',
    avatarUrl: row.avatar_url || null,
  }
}

function mapSupplierOrganizationRow(row: SupplierOrganizationSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    authUserId: row.auth_user_id || '',
    nameCN: row.name_cn || '',
    nameEN: row.name_en || '',
    description: row.description || '',
    phone: row.phone || '',
    address: row.address || '',
    website: row.website || '',
    contactPerson: row.contact_person || '',
    logoUrl: row.logo_url || null,
  }
}

function mapSupplierPortalProfileRow(row: SupplierPortalProfileSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    authUserId: row.auth_user_id || '',
    displayName: row.display_name || '',
    loginEmail: row.login_email || '',
    portalRole: row.portal_role || 'supplier',
    roleLabel: row.role_label || 'Supplier',
    avatarUrl: row.avatar_url || null,
  }
}

export const customerOrganizationService = {
  async getByAuthUser(authUserId: string) {
    const { data, error } = await supabase
      .from('customer_organizations')
      .select('id, auth_user_id, company_name, contact_person, email, phone, mobile, address, website, business_type, logo_url')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw buildSupabaseError('load customer organization profile', error)
    return mapCustomerOrganizationRow(data as CustomerOrganizationSupabaseRecord | null)
  },

  async saveByAuthUser(authUserId: string, profile: Record<string, any>) {
    const payload = {
      auth_user_id: authUserId,
      company_name: profile.companyName || '',
      contact_person: profile.contactPerson || '',
      email: profile.email || '',
      phone: profile.phone || '',
      mobile: profile.mobile || '',
      address: profile.address || '',
      website: profile.website || '',
      business_type: profile.businessType || 'Importer',
      logo_url: profile.logoUrl || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('customer_organizations')
      .upsert(payload, { onConflict: 'auth_user_id' })

    if (error) throw buildSupabaseError('save customer organization profile', error)
    return profile
  },
}

export const customerPortalProfileService = {
  async getByAuthUser(authUserId: string) {
    const { data, error } = await supabase
      .from('customer_portal_profiles')
      .select('id, auth_user_id, display_name, login_email, portal_role, avatar_url')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw buildSupabaseError('load customer portal profile', error)
    return mapCustomerPortalProfileRow(data as CustomerPortalProfileSupabaseRecord | null)
  },

  async saveByAuthUser(authUserId: string, profile: Record<string, any>) {
    const payload = {
      auth_user_id: authUserId,
      display_name: profile.displayName || '',
      login_email: profile.loginEmail || '',
      portal_role: profile.portalRole || 'customer',
      avatar_url: profile.avatarUrl || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('customer_portal_profiles')
      .upsert(payload, { onConflict: 'auth_user_id' })

    if (error) throw buildSupabaseError('save customer portal profile', error)
    return profile
  },
}

export const supplierOrganizationService = {
  async getByAuthUser(authUserId: string) {
    const { data, error } = await supabase
      .from('supplier_organizations')
      .select('id, auth_user_id, name_cn, name_en, description, phone, address, website, contact_person, logo_url')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw buildSupabaseError('load supplier organization profile', error)
    return mapSupplierOrganizationRow(data as SupplierOrganizationSupabaseRecord | null)
  },

  async saveByAuthUser(authUserId: string, profile: Record<string, any>) {
    const payload = {
      auth_user_id: authUserId,
      name_cn: profile.nameCN || profile.name || '',
      name_en: profile.nameEN || '',
      description: profile.description || '',
      phone: profile.phone || '',
      address: profile.address || '',
      website: profile.website || '',
      contact_person: profile.contactPerson || '',
      logo_url: profile.logoUrl || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('supplier_organizations')
      .upsert(payload, { onConflict: 'auth_user_id' })

    if (error) throw buildSupabaseError('save supplier organization profile', error)
    return profile
  },
}

export const supplierPortalProfileService = {
  async getByAuthUser(authUserId: string) {
    const { data, error } = await supabase
      .from('supplier_portal_profiles')
      .select('id, auth_user_id, display_name, login_email, portal_role, role_label, avatar_url')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error) throw buildSupabaseError('load supplier portal profile', error)
    return mapSupplierPortalProfileRow(data as SupplierPortalProfileSupabaseRecord | null)
  },

  async saveByAuthUser(authUserId: string, profile: Record<string, any>) {
    const payload = {
      auth_user_id: authUserId,
      display_name: profile.displayName || '',
      login_email: profile.loginEmail || '',
      portal_role: profile.portalRole || 'supplier',
      role_label: profile.roleLabel || 'Supplier',
      avatar_url: profile.avatarUrl || null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('supplier_portal_profiles')
      .upsert(payload, { onConflict: 'auth_user_id' })

    if (error) throw buildSupabaseError('save supplier portal profile', error)
    return profile
  },
}
