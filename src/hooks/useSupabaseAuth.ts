/**
 * useSupabaseAuth
 * 替换现有的双身份系统（cosun_auth_user + cosun_current_user）
 * 统一通过 Supabase Auth 管理登录状态
 */
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── 登出 ──────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  // 清理旧的 localStorage keys（兼容旧系统）；不清除 remember keys，它们是跨会话记忆
  const keysToRemove = [
    'cosun_api_token', 'cosun_backend_user', 'cosun_auth_user',
    'cosun_current_user', 'cosun_user_session', 'cosun_session_expiry',
    'cosun_remember_user', // 旧版共享 key，统一废弃
  ]
  keysToRemove.forEach(k => localStorage.removeItem(k))
}

// ── 获取用户 Profile ───────────────────────────────────────────
export async function fetchProfile(userId: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.warn('[useSupabaseAuth] fetchProfile error:', error.message)
    return null
  }
  return data
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
    }
    localStorage.setItem('cosun_current_user', JSON.stringify(rbacUser))
    // 触发 userChanged 事件，让所有监听器更新
    window.dispatchEvent(new CustomEvent('userChanged', { detail: rbacUser }))
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
