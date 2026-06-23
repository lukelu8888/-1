import { supabaseUrl } from '../supabase'

type StartEnterpriseWechatLoginResult = {
  success: boolean
  authorizeUrl: string
  state: string
}

function buildFunctionsUrl(path: string) {
  return `${supabaseUrl}/functions/v1/make-server-880fd43b${path}`
}

export async function startEnterpriseWechatLogin(): Promise<StartEnterpriseWechatLoginResult> {
  const response = await fetch(buildFunctionsUrl('/auth/enterprise-wechat/start'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok || payload?.success === false) {
    throw new Error(String(payload?.message || '企业微信登录暂不可用'))
  }

  return {
    success: true,
    authorizeUrl: String(payload.authorizeUrl || ''),
    state: String(payload.state || ''),
  }
}
