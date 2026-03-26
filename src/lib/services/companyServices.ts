import { supabase } from '../supabase'

function handleError(error: any, context: string) {
  if (error?.name === 'AbortError') {
    return null
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
}

const COSUN_TENANT_ID_COMPANIES = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9'

function fromCompanyRow(r: any) {
  if (!r) return null
  return {
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
    partyType: r.party_type,
    tenantId: r.tenant_id,
  }
}

export const companyService = {
  async getCustomers() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'customer')
      .is('deleted_at', null)
      .order('code', { ascending: true })
    if (error) return handleError(error, 'getCustomers companies')
    return (data || []).map(fromCompanyRow)
  },

  async getSuppliers() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .order('code', { ascending: true })
    if (error) return handleError(error, 'getSuppliers companies')
    return (data || []).map(fromCompanyRow)
  },

  async searchSuppliers(keyword: string) {
    if (!keyword.trim()) return this.getSuppliers()
    const kw = `%${keyword.trim()}%`
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .or(`name.ilike.${kw},name_en.ilike.${kw},code.ilike.${kw},main_email.ilike.${kw},supplier_category.ilike.${kw}`)
      .order('code', { ascending: true })
    if (error) return handleError(error, 'searchSuppliers companies')
    return (data || []).map(fromCompanyRow)
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('main_email', email)
      .is('deleted_at', null)
      .single()
    if (error) return null
    return fromCompanyRow(data)
  },
}
