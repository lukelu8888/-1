import { getLocalAdminAuth } from '../internalAdminLocalAuth'
import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'

function buildFunctionsUrl(path: string) {
  return `${supabaseUrl}/functions/v1/make-server-880fd43b${path}`
}

export const internalInquiryAssignmentService = {
  async assignToSalesRep(input: { inquiryId?: string; inquiryNumber?: string; salesRepEmail: string; salesRepName?: string }) {
    const inquiryId = String(input?.inquiryId || '').trim()
    const inquiryNumber = String(input?.inquiryNumber || '').trim()
    const salesRepEmail = String(input?.salesRepEmail || '').trim().toLowerCase()
    const salesRepName = String(input?.salesRepName || '').trim()

    if (!inquiryId && !inquiryNumber) {
      throw new Error('缺少询价标识')
    }
    if (!salesRepEmail) {
      throw new Error('缺少业务员邮箱')
    }

    const { data: rpcInquiry, error: rpcError } = await supabase.rpc('assign_internal_inquiry_to_sales_rep', {
      p_inquiry_id: inquiryId || null,
      p_inquiry_number: inquiryNumber || null,
      p_sales_rep_email: salesRepEmail,
      p_owner_name: salesRepName || null,
    })

    if (!rpcError && rpcInquiry) {
      const routedInquiryId = String((rpcInquiry as any)?.id || '').trim()
      if (routedInquiryId) {
        try {
          await supabase.rpc('sync_ing_routing_artifacts', {
            p_inquiry_id: routedInquiryId,
          })
        } catch {
          // Best-effort routing sync should not block a successful assignment.
        }
      }
      return rpcInquiry
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { enabled: localAdminEnabled, email: localAdminEmail, password: localAdminPassword } = getLocalAdminAuth()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: session?.access_token
        ? `Bearer ${session.access_token}`
        : `Bearer ${supabaseAnonKey}`,
    }

    const response = await fetch(buildFunctionsUrl('/auth/assign-internal-inquiry'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inquiryId,
        inquiryNumber,
        salesRepEmail,
        salesRepName,
        localAdminAuth: localAdminEnabled
          ? {
              email: localAdminEmail,
              password: localAdminPassword,
            }
          : null,
      }),
    })

    const rawText = await response.text().catch(() => '')
    let payload: any = {}
    if (rawText) {
      try {
        payload = JSON.parse(rawText)
      } catch {
        payload = { message: rawText }
      }
    }
    const message = String(payload?.message || payload?.error || rpcError?.message || '').trim()
    if (!response.ok || payload?.success === false) {
      throw new Error(message || '分配业务员失败')
    }

    return payload?.inquiry || null
  },
}
