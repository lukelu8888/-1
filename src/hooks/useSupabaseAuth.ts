/**
 * useSupabaseAuth
 * 替换现有的双身份系统（cosun_auth_user + cosun_current_user）
 * 统一通过 Supabase Auth 管理登录状态
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseAnonKey } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

export interface SupabaseProfile {
  id: string
  email: string
  name: string
  portal_role: 'admin' | 'customer' | 'supplier'
  rbac_role: string | null
  region: string | null
  company: string | null
  phone: string | null
}

export interface AuthState {
  session: Session | null
  user: User | null
  profile: SupabaseProfile | null
  loading: boolean
  error: string | null
}

// ── 登录 ──────────────────────────────────────────────────────
function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    }),
  ])
}

function shouldUseProxyAuth() {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function isRetriableNetworkError(error: any) {
  return (
    error?.message === 'Supabase auth SDK timed out' ||
    error?.message === 'Profile fetch timed out' ||
    error?.message === 'Profile proxy fetch timed out' ||
    error?.message === 'Login request timed out. Please try again.' ||
    error?.message === 'Load failed' ||
    error?.message === 'Failed to fetch'
  )
}

async function directPasswordSignIn(email: string, password: string) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(`/__supabase_auth__/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload?.msg || payload?.error_description || payload?.error || 'Login failed')
    }

    const { access_token, refresh_token } = payload ?? {}
    if (!access_token || !refresh_token) {
      throw new Error('Login response missing session token')
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })
    if (error) throw error
    return data
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Login request timed out. Please try again.')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function fetchProfileViaProxy(userId: string): Promise<SupabaseProfile | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      `/__supabase_rest__/user_profiles?select=*&id=eq.${encodeURIComponent(userId)}`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
        },
        signal: controller.signal,
      }
    )

    if (!response.ok) {
      throw new Error(`Profile fetch failed with status ${response.status}`)
    }

    const data = await response.json().catch(() => [])
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('Profile proxy fetch timed out')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await promiseWithTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      8000,
      'Supabase auth SDK timed out',
    )
    if (error) throw error
    return data
  } catch (error: any) {
    if (shouldUseProxyAuth() && isRetriableNetworkError(error)) {
      console.warn('[useSupabaseAuth] signInWithEmail falling back to proxy auth:', error?.message || error)
      return directPasswordSignIn(email, password)
    }
    throw error
  }
}

// ── 登出 ──────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  // 清理所有会话相关 keys（不清除 remember keys）
  const keysToRemove = [
    'cosun_api_token', 'cosun_backend_user', 'cosun_auth_user',
    'cosun_current_user', 'cosun_user_session', 'cosun_session_expiry',
    'cosun_remember_user',
  ]
  keysToRemove.forEach(k => localStorage.removeItem(k))
}

// ── 获取用户 Profile ───────────────────────────────────────────
export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  try {
    const { data, error } = await promiseWithTimeout(
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      5000,
      'Profile fetch timed out',
    )
    if (error) throw error
    return data
  } catch (error: any) {
    const message = String(error?.message || error || '')
    if (
      error?.name === 'AbortError' ||
      message.includes('timed out') ||
      isRetriableNetworkError(error)
    ) {
      if (shouldUseProxyAuth() && isRetriableNetworkError(error)) {
        try {
          return await fetchProfileViaProxy(userId)
        } catch {
          return null
        }
      }
      return null
    }
    if (shouldUseProxyAuth() && isRetriableNetworkError(error)) {
      try {
        return await fetchProfileViaProxy(userId)
      } catch {
        return null
      }
    }
    return null
  }
}

// ── 主 Hook ────────────────────────────────────────────────────
export function useSupabaseAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  const loadProfile = useCallback(async (userId: string) => {
    const profile = await fetchProfile(userId)
    setState(prev => ({ ...prev, profile, loading: false }))
    // 同步到旧系统 localStorage（向后兼容，让现有组件不需要立刻改动）
    if (profile) syncToLegacyStorage(profile)
    return profile
  }, [])

  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({ ...prev, session, user: session?.user ?? null }))
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // 监听 Auth 状态变化（登录/登出/token 刷新）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState(prev => ({ ...prev, session, user: session?.user ?? null }))

        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id)
          window.dispatchEvent(new CustomEvent('supabaseAuthChanged', {
            detail: { event, user: session.user }
          }))
        }

        if (event === 'SIGNED_OUT') {
          setState(prev => ({ ...prev, profile: null, loading: false }))
          window.dispatchEvent(new CustomEvent('supabaseAuthChanged', {
            detail: { event, user: null }
          }))
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          // token 刷新时静默更新，不重新加载 profile
          setState(prev => ({ ...prev, loading: false }))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const data = await signInWithEmail(email, password)
      // onAuthStateChange 会自动触发 loadProfile
      return data
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }))
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await signOut()
    } finally {
      setState({ session: null, user: null, profile: null, loading: false, error: null })
    }
  }, [])

  return { ...state, login, logout, loadProfile }
}

// ── 向后兼容：同步到旧 localStorage keys ──────────────────────
function syncToLegacyStorage(profile: SupabaseProfile) {
  // cosun_auth_user（UserContext 读取）
  const authUser = {
    email: profile.email,
    type: profile.portal_role === 'admin' ? 'admin'
        : profile.portal_role === 'supplier' ? 'supplier'
        : 'customer',
    id: profile.id,
    name: profile.name,
    role: profile.rbac_role ?? undefined,
    userRole: profile.rbac_role ?? undefined,
    region: profile.region ?? undefined,
  }
  localStorage.setItem('cosun_auth_user', JSON.stringify(authUser))

  // cosun_current_user（RBAC 系统读取）
  if (profile.portal_role === 'admin') {
    const rbacUser = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.rbac_role ?? 'Admin',
      region: profile.region ?? 'all',
      type: 'admin',
    }
    localStorage.setItem('cosun_current_user', JSON.stringify(rbacUser))
    window.dispatchEvent(new CustomEvent('userChanged', { detail: rbacUser }))
  } else {
    // 非 admin 登录时，必须清除旧的 admin cosun_current_user，防止数据隔离系统误判
    localStorage.removeItem('cosun_current_user')
    window.dispatchEvent(new CustomEvent('userChanged', { detail: {
      email: profile.email,
      type: profile.portal_role,
      role: profile.portal_role,
      region: profile.region ?? 'all',
    }}))
  }

  // cosun_backend_user（backend-auth.ts 读取）
  const backendUser = {
    id: profile.id,
    email: profile.email,
    username: profile.name,
    portal_role: profile.portal_role,
    rbac_role: profile.rbac_role,
    region: profile.region,
  }
  localStorage.setItem('cosun_backend_user', JSON.stringify(backendUser))
}
