import { supabase, supabaseUrl } from '../supabase'

type SendAdminEmailInviteInput = {
  authUserId?: string
  loginEmail: string
  employeeId?: string
  employeeName?: string
  role?: string
  region?: string
}

type SendAdminEmailInviteResult = {
  success: boolean
  authUserId: string
  loginEmail: string
  invitedAt: string
  inviteExpiresAt: string
  inviteUrl: string
  deliveryMode: 'invite' | 'magiclink'
}

function buildFunctionsUrl(path: string) {
  return `${supabaseUrl}/functions/v1/make-server-880fd43b${path}`
}

async function fetchWithAdminSessionRetry(path: string, body: unknown, fallbackMessage: string) {
  const execute = async (token: string) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 12000)
    try {
      return await fetch(buildFunctionsUrl(path), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('正式激活请求超时，请重试')
      }
      throw error
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('当前会话缺少认证令牌，请重新登录后再试')
  }

  let response = await execute(session.access_token)
  let payload = await response.json().catch(() => ({}))
  let message = String(payload?.message || payload?.msg || payload?.error_description || payload?.error || '').trim()

  const shouldRefresh =
    response.status === 401 ||
    message.toLowerCase().includes('invalid jwt') ||
    message.toLowerCase().includes('jwt')

  if (shouldRefresh) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed.session?.access_token) {
      throw new Error('管理员会话已过期，请重新登录后再试')
    }
    response = await execute(refreshed.session.access_token)
    payload = await response.json().catch(() => ({}))
    message = String(payload?.message || payload?.msg || payload?.error_description || payload?.error || '').trim()
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(message || fallbackMessage)
  }

  return payload
}

export async function sendAdminEmailInvite(input: SendAdminEmailInviteInput): Promise<SendAdminEmailInviteResult> {
  const payload = await fetchWithAdminSessionRetry('/auth/send-admin-email-invite', input, '正式邮箱邀请发送失败')

  return {
    success: true,
    authUserId: String(payload.authUserId || ''),
    loginEmail: String(payload.loginEmail || '').trim().toLowerCase(),
    invitedAt: String(payload.invitedAt || ''),
    inviteExpiresAt: String(payload.inviteExpiresAt || ''),
    inviteUrl: String(payload.inviteUrl || ''),
    deliveryMode: payload.deliveryMode === 'magiclink' ? 'magiclink' : 'invite',
  }
}
