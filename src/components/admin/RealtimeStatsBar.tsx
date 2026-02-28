/**
 * RealtimeStatsBar - Admin 首页实时数据统计卡片组
 * 数据来自 Supabase，支持 Realtime 自动刷新
 */
import React from 'react';
import { FileText, Package, DollarSign, ClipboardCheck, Bell, TrendingUp, RefreshCw } from 'lucide-react';
import { useSupabaseStats } from '../../hooks/useSupabaseStats';
import { useAuth } from '../../hooks/useAuth';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, sub, color, loading }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-gray-900 tabular-nums">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  );
}

export function RealtimeStatsBar() {
  const { currentUser } = useAuth();
  const { stats, refresh } = useSupabaseStats(currentUser?.email);

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-2">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-gray-700">实时业务概览</h2>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            实时
          </span>
        </div>
        <div className="flex items-center gap-2">
          {stats.lastUpdated && (
            <span className="text-xs text-gray-400">
              更新于 {stats.lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => void refresh()}
            className="p-1 rounded text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${stats.loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="询价单"
          value={stats.totalInquiries}
          sub={stats.pendingInquiries > 0 ? `${stats.pendingInquiries} 待处理` : '全部已处理'}
          color="bg-blue-50"
          loading={stats.loading}
        />
        <StatCard
          icon={<ClipboardCheck className="w-5 h-5 text-purple-600" />}
          label="销售报价"
          value={stats.totalQuotations}
          sub={stats.pendingApprovalQuotations > 0 ? `${stats.pendingApprovalQuotations} 待审批` : '无待审批'}
          color="bg-purple-50"
          loading={stats.loading}
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-indigo-600" />}
          label="销售合同"
          value={stats.totalContracts}
          sub={`${stats.activeContracts} 进行中`}
          color="bg-indigo-50"
          loading={stats.loading}
        />
        <StatCard
          icon={<Package className="w-5 h-5 text-orange-600" />}
          label="订单"
          value={stats.totalOrders}
          sub={`${stats.activeOrders} 活跃中`}
          color="bg-orange-50"
          loading={stats.loading}
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-green-600" />}
          label="应收账款"
          value={formatAmount(stats.unpaidARAmount)}
          sub={`${stats.unpaidAR} 笔未收款`}
          color="bg-green-50"
          loading={stats.loading}
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-red-500" />}
          label="待办 & 通知"
          value={stats.pendingApprovals + stats.unreadNotifications}
          sub={`${stats.pendingApprovals} 审批 / ${stats.unreadNotifications} 通知`}
          color="bg-red-50"
          loading={stats.loading}
        />
      </div>
    </div>
  );
}
