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
import { useUser } from '../contexts/UserContext';

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
  const { user } = useUser();

  // UserContext 已经通过 Supabase onAuthStateChange 同步了登录状态
  // 直接用 user.type 判断，无需再次查询 Supabase，避免转圈
  if (!user) {
    const loginPage = portalType === 'admin' ? 'admin-login' : 'login';
    // 延迟跳转，避免初始化瞬间闪跳
    return (
      <AccessDeniedScreen
        message="请先登录"
        onRedirect={() => navigateTo(loginPage)}
      />
    );
  }

  const portalTypeMap: Record<string, string> = {
    admin: 'admin',
    customer: 'customer',
    supplier: 'supplier',
    manufacturer: 'supplier',
  };
  const userPortal = portalTypeMap[user.type] ?? user.type;

  if (userPortal !== portalType) {
    const denyMessage =
      portalType === 'admin' ? '此页面仅限管理员访问'
      : portalType === 'supplier' ? '此页面仅限供应商访问'
      : '此页面仅限客户访问';
    return (
      <AccessDeniedScreen
        message={denyMessage}
        onRedirect={() => navigateTo('home')}
      />
    );
  }

  return <>{children}</>;
}
