/**
 * useSupabaseStats - Admin Dashboard 实时统计数据
 *
 * 从 Supabase 实时获取核心业务指标，并通过 Realtime 自动更新。
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ErpStats {
  // 询价
  totalInquiries: number;
  pendingInquiries: number;
  // 销售报价单
  totalQuotations: number;
  pendingApprovalQuotations: number;
  // 销售合同
  totalContracts: number;
  activeContracts: number;
  // 订单
  totalOrders: number;
  activeOrders: number;
  // 应收账款
  totalAR: number;
  unpaidAR: number;
  totalARAmount: number;
  unpaidARAmount: number;
  // 审批待办
  pendingApprovals: number;
  // 通知
  unreadNotifications: number;
  // 加载状态
  loading: boolean;
  lastUpdated: Date | null;
}

const defaultStats: ErpStats = {
  totalInquiries: 0,
  pendingInquiries: 0,
  totalQuotations: 0,
  pendingApprovalQuotations: 0,
  totalContracts: 0,
  activeContracts: 0,
  totalOrders: 0,
  activeOrders: 0,
  totalAR: 0,
  unpaidAR: 0,
  totalARAmount: 0,
  unpaidARAmount: 0,
  pendingApprovals: 0,
  unreadNotifications: 0,
  loading: true,
  lastUpdated: null,
};

export function useSupabaseStats(userEmail?: string) {
  const [stats, setStats] = useState<ErpStats>(defaultStats);

  const fetchStats = useCallback(async () => {
    try {
      // 并行查询所有统计数据
      const [
        inquiriesRes,
        quotationsRes,
        contractsRes,
        ordersRes,
        arRes,
        approvalsRes,
        notificationsRes,
      ] = await Promise.allSettled([
        // 询价总数 & 待处理
        supabase.from('inquiries').select('id, status', { count: 'exact' }),
        // 销售报价单
        supabase.from('sales_quotations').select('id, approval_status', { count: 'exact' }),
        // 销售合同
        supabase.from('sales_contracts').select('id, status', { count: 'exact' }),
        // 订单
        supabase.from('orders').select('id, status', { count: 'exact' }),
        // 应收账款
        supabase.from('accounts_receivable').select('id, status, total_amount, remaining_amount', { count: 'exact' }),
        // 审批待办（当前用户）
        userEmail
          ? supabase.from('approval_records').select('id', { count: 'exact' }).eq('status', 'pending')
          : Promise.resolve({ data: [], count: 0, error: null }),
        // 未读通知（当前用户）
        userEmail
          ? supabase.from('notifications').select('id', { count: 'exact' }).eq('recipient_email', userEmail).eq('is_read', false)
          : Promise.resolve({ data: [], count: 0, error: null }),
      ]);

      const getResult = (r: PromiseSettledResult<any>) =>
        r.status === 'fulfilled' ? r.value : { data: [], count: 0, error: null };

      const inquiries = getResult(inquiriesRes);
      const quotations = getResult(quotationsRes);
      const contracts = getResult(contractsRes);
      const orders = getResult(ordersRes);
      const ar = getResult(arRes);
      const approvals = getResult(approvalsRes);
      const notifications = getResult(notificationsRes);

      const inquiryData = inquiries.data || [];
      const quotationData = quotations.data || [];
      const contractData = contracts.data || [];
      const orderData = orders.data || [];
      const arData = ar.data || [];

      const totalARAmount = arData.reduce((sum: number, r: any) => sum + (r.total_amount || 0), 0);
      const unpaidARAmount = arData
        .filter((r: any) => r.status !== 'paid')
        .reduce((sum: number, r: any) => sum + (r.remaining_amount || 0), 0);

      setStats({
        totalInquiries: inquiries.count || inquiryData.length,
        pendingInquiries: inquiryData.filter((r: any) => r.status === 'pending').length,
        totalQuotations: quotations.count || quotationData.length,
        pendingApprovalQuotations: quotationData.filter((r: any) =>
          r.approval_status === 'pending_approval'
        ).length,
        totalContracts: contracts.count || contractData.length,
        activeContracts: contractData.filter((r: any) =>
          ['approved', 'pending_supervisor', 'pending_director', 'sent_to_customer'].includes(r.status)
        ).length,
        totalOrders: orders.count || orderData.length,
        activeOrders: orderData.filter((r: any) =>
          !['Delivered', 'Cancelled', 'completed'].includes(r.status)
        ).length,
        totalAR: ar.count || arData.length,
        unpaidAR: arData.filter((r: any) => r.status !== 'paid').length,
        totalARAmount,
        unpaidARAmount,
        pendingApprovals: approvals.count || 0,
        unreadNotifications: notifications.count || 0,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.warn('[useSupabaseStats] fetch failed:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [userEmail]);

  useEffect(() => {
    void fetchStats();

    // Realtime 订阅关键表，有变化时刷新统计
    const tables = ['inquiries', 'sales_quotations', 'sales_contracts', 'orders', 'accounts_receivable', 'approval_records'];
    const channels = tables.map(table =>
      supabase
        .channel(`stats_${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          void fetchStats();
        })
        .subscribe()
    );

    // 每60秒自动刷新一次
    const interval = setInterval(() => void fetchStats(), 60_000);

    return () => {
      channels.forEach(ch => void supabase.removeChannel(ch));
      clearInterval(interval);
    };
  }, [fetchStats]);

  return { stats, refresh: fetchStats };
}
