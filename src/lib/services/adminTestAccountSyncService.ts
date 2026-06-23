import { supabase, supabaseUrl } from '../supabase'
import { getLocalAdminAuth } from '../internalAdminLocalAuth'

type EnsureAdminTestAccountInput = {
  authUserId?: string
  loginEmail: string
  loginPassword: string
  employeeId?: string
  employeeName?: string
  role?: string
  region?: string
  forcePasswordReset?: boolean
}

type EnsureAdminTestAccountResult = {
  success: boolean
  authUserId: string
  email: string
  profileEmail: string
  consistent: boolean
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
        throw new Error('测试账号同步请求超时，请重试')
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

export async function ensureAdminTestAccount(input: EnsureAdminTestAccountInput): Promise<EnsureAdminTestAccountResult> {
  const localAdminAuth = getLocalAdminAuth()
  const payload = await fetchWithAdminSessionRetry(
    '/auth/ensure-admin-test-account',
    {
      ...input,
      localAdminAuth: localAdminAuth.enabled
        ? {
            email: localAdminAuth.email,
            password: localAdminAuth.password,
          }
        : null,
    },
    '测试内部账号同步失败',
  )

  return {
    success: true,
    authUserId: String(payload.authUserId || ''),
    email: String(payload.email || '').trim().toLowerCase(),
    profileEmail: String(payload.profileEmail || '').trim().toLowerCase(),
    consistent: Boolean(payload.consistent),
  }
}
