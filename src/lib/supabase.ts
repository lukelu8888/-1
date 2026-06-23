import { createClient } from '@supabase/supabase-js'
import { isCurrentLocalDevHost } from './localDevHost'

// 优先读取环境变量，fallback 到硬编码值（本地开发）
export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://oaavirpytvemskjooeyg.supabase.co'
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hYXZpcnB5dHZlbXNram9vZXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODc2NjUsImV4cCI6MjA4Nzg2MzY2NX0.AgKVC_Z_UmMLJs_j8XwVKnAMZhwPJjOLd0V7z0xQ5-I'

const shouldUseSupabaseDevProxy = () => {
  if (import.meta.env.VITE_USE_SUPABASE_DEV_PROXY !== 'true') return false
  return isCurrentLocalDevHost()
}

const buildProxyAwareSupabaseFetch = (): typeof fetch => {
  const nativeFetch = globalThis.fetch.bind(globalThis)
  const authBase = `${supabaseUrl}/auth/v1`
  const restBase = `${supabaseUrl}/rest/v1`
  const shouldRetryDirect = (error: unknown) => {
    const message = String((error as any)?.message || error || '').toLowerCase()
    return (
      (error as any)?.name === 'TypeError' ||
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('load failed') ||
      message.includes('connection refused') ||
      message.includes('err_connection_refused')
    )
  }
  const shouldRetryDirectFromResponse = (response: Response) => response.status >= 500

  return async (input, init) => {
    if (!shouldUseSupabaseDevProxy()) {
      return nativeFetch(input, init)
    }

    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (requestUrl.startsWith(authBase)) {
      try {
        const response = await nativeFetch(requestUrl.replace(authBase, '/__supabase_auth__'), init)
        if (shouldRetryDirectFromResponse(response)) {
          console.warn('[Supabase] auth proxy returned 5xx, retrying direct request.', response.status)
          return nativeFetch(requestUrl, init)
        }
        return response
      } catch (error) {
        if (!shouldRetryDirect(error)) throw error
        console.warn('[Supabase] auth proxy fetch failed, retrying direct request.', error)
        return nativeFetch(requestUrl, init)
      }
    }

    if (requestUrl.startsWith(restBase)) {
      try {
        const response = await nativeFetch(requestUrl.replace(restBase, '/__supabase_rest__'), init)
        if (shouldRetryDirectFromResponse(response)) {
          console.warn('[Supabase] REST proxy returned 5xx, retrying direct request.', response.status)
          return nativeFetch(requestUrl, init)
        }
        return response
      } catch (error) {
        if (!shouldRetryDirect(error)) throw error
        console.warn('[Supabase] REST proxy fetch failed, retrying direct request.', error)
        return nativeFetch(requestUrl, init)
      }
    }

    return nativeFetch(input, init)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'cosun_supabase_auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    fetch: buildProxyAwareSupabaseFetch(),
  },
})
