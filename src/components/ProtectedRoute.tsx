/**
 * ProtectedRoute - 路由保护组件
 *
 * 根据 Supabase Auth 会话状态决定是否允许访问受保护页面。
 * - 未登录 → 重定向到对应登录页
 * - 错误门户（admin 访问 customer 页，等）→ 重定向到首页
 * - 会话加载中 → 显示 Loading
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../contexts/RouterContext';

type PortalType = 'admin' | 'customer' | 'supplier';

interface ProtectedRouteProps {
  /** 当前页面需要的门户类型 */
  portalType: PortalType;
  children: React.ReactNode;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">验证登录状态...</p>
      </div>
    </div>
  );
}

function AccessDeniedScreen({ message, onRedirect }: { message: string; onRedirect: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRedirect, 2000);
    return () => clearTimeout(timer);
  }, [onRedirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-3 max-w-sm p-6 bg-white rounded-xl shadow">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-red-600 text-xl">🚫</span>
        </div>
        <p className="text-gray-700 font-medium">{message}</p>
        <p className="text-xs text-gray-400">正在跳转...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ portalType, children }: ProtectedRouteProps) {
  const { navigateTo } = useRouter();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied' | 'unauthenticated'>('loading');
  const [denyMessage, setDenyMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        // 最多等 6 秒，防止永久转圈
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 6000));
        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (!mounted) return;

        // 超时
        if (result === null) {
          setStatus('unauthenticated');
          return;
        }

        const { data: { session } } = result as Awaited<typeof sessionPromise>;

        if (!session) {
          if (mounted) setStatus('unauthenticated');
          return;
        }

        // 优先从 user_metadata 读（无需额外网络请求），fallback 到 user_profiles
        const metaRole = session.user.user_metadata?.portal_role as string | undefined;
        if (metaRole) {
          if (!mounted) return;
          if (metaRole === portalType) {
            setStatus('allowed');
          } else {
            setDenyMessage(
              portalType === 'admin' ? '此页面仅限管理员访问'
              : portalType === 'supplier' ? '此页面仅限供应商访问'
              : '此页面仅限客户访问'
            );
            setStatus('denied');
          }
          return;
        }

        // fallback：从 user_profiles 获取 portal_role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('portal_role')
          .eq('id', session.user.id)
          .single();

        if (!mounted) return;

        const userPortal = (profile?.portal_role || '') as string;
        if (userPortal === portalType) {
          setStatus('allowed');
        } else {
          setDenyMessage(
            portalType === 'admin' ? '此页面仅限管理员访问'
            : portalType === 'supplier' ? '此页面仅限供应商访问'
            : '此页面仅限客户访问'
          );
          setStatus('denied');
        }
      } catch {
        if (mounted) setStatus('unauthenticated');
      }
    };

    void check();

    // 监听 Auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && mounted) {
        setStatus('unauthenticated');
      } else if (session && mounted && status === 'loading') {
        void check();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [portalType]);

  if (status === 'loading') return <LoadingScreen />;

  if (status === 'unauthenticated') {
    // 未登录 → 跳到对应登录页
    const loginPage = portalType === 'admin' ? 'admin-login' : 'login';
    return (
      <AccessDeniedScreen
        message="请先登录"
        onRedirect={() => navigateTo(loginPage)}
      />
    );
  }

  if (status === 'denied') {
    return (
      <AccessDeniedScreen
        message={denyMessage}
        onRedirect={() => navigateTo('home')}
      />
    );
  }

  return <>{children}</>;
}
