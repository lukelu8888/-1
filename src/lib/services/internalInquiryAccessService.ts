import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { getLocalAdminAuth } from '../internalAdminLocalAuth'

function buildFunctionsUrl(path: string) {
  return `${supabaseUrl}/functions/v1/make-server-880fd43b${path}`
}

export const internalInquiryAccessService = {
  async listVisible(): Promise<any[]> {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { enabled: localAdminEnabled, email: localAdminEmail, password: localAdminPassword } = getLocalAdminAuth()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    } else {
      headers.Authorization = `Bearer ${supabaseAnonKey}`
    }

    if (!session?.access_token && localAdminEnabled && localAdminEmail && localAdminPassword) {
      const { data, error } = await supabase.rpc('get_internal_visible_inquiries', {
        p_login_email: localAdminEmail,
        p_login_password: localAdminPassword,
      })

      if (!error && Array.isArray(data)) {
        return data
      }

      console.warn('⚠️ [internalInquiryAccessService] rpc get_internal_visible_inquiries failed before edge fallback:', error)
    }

    const response = await fetch(buildFunctionsUrl('/auth/internal-inquiries'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        localAdminAuth: !session?.access_token && localAdminEnabled
          ? {
              email: localAdminEmail,
              password: localAdminPassword,
            }
          : null,
      }),
    })

    const payload = await response.json().catch(() => ({}))
    const message = String(payload?.message || payload?.error || '').trim()
    if (!response.ok || payload?.success === false) {
      if (localAdminEnabled && localAdminEmail && localAdminPassword) {
        const { data, error } = await supabase.rpc('get_internal_visible_inquiries', {
          p_login_email: localAdminEmail,
          p_login_password: localAdminPassword,
        })

        if (!error && Array.isArray(data)) {
          return data
        }

        console.warn('⚠️ [internalInquiryAccessService] rpc get_internal_visible_inquiries failed after edge function fallback:', error)
      }

      throw new Error(message || 'load internal inquiries failed')
    }

    return Array.isArray(payload?.inquiries) ? payload.inquiries : []
  },
}
