// 🎯 THE COSUN BM - 订单全盘（台湾大厂企业系统风格）
// 表格优先 + 高信息密度 + 功能导向 + 极简专业

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, AlertTriangle, Download, RefreshCw,
  FileText, Package, Calendar, Filter, Settings,
  Clock, AlertCircle, Eye, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computeOrderOverviewViewModel } from '../../lib/services/orderManagementOverviewService';
import { CompactDetailsPopover } from '../shared/CompactDetailsPopover';

interface OrderOverviewDashboardProps {
  pendingCounts?: {
    inquiries: number
    costInquiry: number
    quotations: number
    orders: number
    collections: number
    approvals?: number
    exportService?: number
    overview: number
  }
  snapshot?: {
    inquiries?: any[]
    quoteRequirements?: any[]
    quotationRequests?: any[]
    quotations?: any[]
    contracts?: any[]
    purchaseOrders?: any[]
    payments?: any[]
    exportServiceOrders?: any[]
  }
  onRefresh?: () => Promise<void> | void
  refreshing?: boolean
}

const hasMeaningfulDisplayValue = (value: unknown) => {
  const normalized = String(value || '').trim()
  if (!normalized) return false
  return !['n/a', 'na', 'null', 'undefined', '-'].includes(normalized.toLowerCase())
}

const displayValue = (value: unknown, fallback = '-') => (
  hasMeaningfulDisplayValue(value) ? String(value).trim() : fallback
)

export default function OrderOverviewDashboard({ pendingCounts, snapshot, onRefresh, refreshing = false }: OrderOverviewDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'performance' | 'risk'>('overview');
  const [timeRange, setTimeRange] = useState('本月');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  const livePendingCounts = pendingCounts || {
    inquiries: 0,
    costInquiry: 0,
    quotations: 0,
    orders: 0,
    collections: 0,
    approvals: 0,
    exportService: 0,
    overview: 0,
  }

  const overviewModel = React.useMemo(() => computeOrderOverviewViewModel({
    snapshot: {
      inquiries: snapshot?.inquiries || [],
      quoteRequirements: snapshot?.quoteRequirements || [],
      quotationRequests: snapshot?.quotationRequests || [],
      quotations: snapshot?.quotations || [],
      contracts: snapshot?.contracts || [],
      purchaseOrders: snapshot?.purchaseOrders || [],
      payments: snapshot?.payments || [],
      exportServiceOrders: snapshot?.exportServiceOrders || [],
    },
    pendingCounts: livePendingCounts,
  }), [livePendingCounts, snapshot])

  const regionOptions = React.useMemo(
    () => ['all', ...overviewModel.regionRows.map((item) => item.region)],
    [overviewModel.regionRows],
  )

  const filteredStageRows = React.useMemo(
    () => overviewModel.stageRows.filter((item) => selectedStage === 'all' || item.stage === selectedStage),
    [overviewModel.stageRows, selectedStage],
  )

  const filteredDistribution = React.useMemo(
    () => overviewModel.distribution.filter((item) => selectedStage === 'all' || item.stage === selectedStage),
    [overviewModel.distribution, selectedStage],
  )

  const filteredRegionRows = React.useMemo(
    () => overviewModel.regionRows.filter((item) => selectedRegion === 'all' || item.region === selectedRegion),
    [overviewModel.regionRows, selectedRegion],
  )

  const filteredCustomerRows = React.useMemo(
    () => overviewModel.customerRows.filter((item) => selectedRegion === 'all' || item.region === selectedRegion),
    [overviewModel.customerRows, selectedRegion],
  )

  const filteredModuleRanking = React.useMemo(
    () => overviewModel.moduleRanking.filter((item) => selectedStage === 'all' || item.name.includes(selectedStage)),
    [overviewModel.moduleRanking, selectedStage],
  )

  const filteredRiskRows = React.useMemo(
    () => overviewModel.riskRows.filter((item) => selectedStage === 'all' || item.type.includes(selectedStage)),
    [overviewModel.riskRows, selectedStage],
  )

  const exportRows = React.useMemo(() => {
    if (activeTab === 'funnel') {
      return filteredStageRows.map((item) => ({
        流程阶段: item.stage,
        当前单量: item.total,
        待处理: item.pending,
        待处理占比: `${item.pendingRate}%`,
        规则说明: item.note,
        状态: item.status === 'busy' ? '积压中' : item.status === 'watch' ? '处理中' : '已清空',
      }))
    }
    if (activeTab === 'performance') {
      return filteredModuleRanking.map((item, index) => ({
        排名: index + 1,
        模块: item.name,
        待处理数量: item.count,
      }))
    }
    if (activeTab === 'risk') {
      return filteredRiskRows.map((item) => ({
        风险类型: item.type,
        数量: item.count,
        责任人: item.handler,
        规则说明: item.note,
        优先级: item.priority,
      }))
    }
    return filteredCustomerRows.map((item) => ({
      客户名称: item.name,
      区域: item.region,
      询价: item.inquiries,
      报价: item.quotations,
      合同: item.contracts,
      订单: item.orders,
      待收款: item.pending,
    }))
  }, [activeTab, filteredCustomerRows, filteredModuleRanking, filteredRiskRows, filteredStageRows])

  const handleExport = React.useCallback(() => {
    if (exportRows.length === 0) return
    const headers = Object.keys(exportRows[0])
    const csv = [
      headers.join(','),
      ...exportRows.map((row) =>
        headers
          .map((header) => `"${String((row as Record<string, unknown>)[header] ?? '').replace(/"/g, '""')}"`)
          .join(','),
      ),
    ].join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `order-overview-${activeTab}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [activeTab, exportRows])

  const clearFilters = () => {
    setSelectedRegion('all')
    setSelectedStage('all')
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部操作栏 */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-bold text-gray-900">订单全盘</h2>
              <p className="text-xs text-gray-500 mt-0.5">Order Overview Dashboard</p>
            </div>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option>今日</option>
                <option>本周</option>
                <option>本月</option>
                <option>本季度</option>
                <option>本年度</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => setShowFilters((prev) => !prev)}>
              <Filter className="w-3.5 h-3.5" />
              筛选
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => void onRefresh?.()} disabled={refreshing}>
              <RefreshCw className="w-3.5 h-3.5" />
              {refreshing ? '刷新中' : '刷新'}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleExport} disabled={exportRows.length === 0}>
              <Download className="w-3.5 h-3.5" />
              导出
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 pb-3 flex flex-wrap items-center gap-3">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="all">全部流程</option>
              {overviewModel.stageRows.map((item) => (
                <option key={item.stage} value={item.stage}>{item.stage}</option>
              ))}
            </select>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            >
              <option value="all">全部区域</option>
              {regionOptions.filter((item) => item !== 'all').map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={clearFilters}>
              清空筛选
            </Button>
          </div>
        )}

        {/* 标签页 */}
        <div className="px-4 flex gap-1">
          {[
            { key: 'overview', label: '综合概览', icon: FileText },
            { key: 'funnel', label: '转化漏斗', icon: TrendingUp },
            { key: 'performance', label: '业绩分析', icon: Package },
            { key: 'risk', label: '风险预警', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        {/* 综合概览 */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            {/* KPI指标栏 */}
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: '待处理总数', value: livePendingCounts.overview, trend: '' },
                { label: '待处理询价', value: livePendingCounts.inquiries, trend: '' },
                { label: '待处理成本询报', value: livePendingCounts.costInquiry, trend: '' },
                { label: '待处理报价', value: livePendingCounts.quotations, trend: '' },
                { label: '待处理订单', value: livePendingCounts.orders, trend: '' },
                { label: '待处理收款/出口', value: `${livePendingCounts.collections + (livePendingCounts.exportService || 0)}`, trend: '' },
              ].map((kpi, idx) => (
                <div key={idx} className="border border-gray-200 rounded bg-white p-3">
                  <div className="text-xs text-gray-500 mb-1.5">{kpi.label}</div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="text-xs text-gray-400">{kpi.trend || '实时'}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 图表 + 数据表格 */}
            <div className="grid grid-cols-3 gap-4">
              {/* 趋势图 */}
              <div className="col-span-2 border border-gray-200 rounded bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                  <div className="font-medium text-sm">当前流程分布</div>
                  <div className="text-xs text-gray-500">Current Workflow Snapshot</div>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={filteredDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="stage" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '11px', 
                          borderRadius: '4px', 
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#FFF'
                        }} 
                      />
                      <Bar dataKey="total" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pending" fill="#F96302" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 区域分布表 */}
              <div className="border border-gray-200 rounded bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50">
                  <div className="font-medium text-sm">区域分布</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredRegionRows.map((region, idx) => (
                    <div key={idx} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-sm text-gray-900">{region.region}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="text-xs text-gray-500">待处理 {region.pending}</div>
                          <CompactDetailsPopover
                            align="end"
                            items={[
                              { label: '询价', value: `ING ${region.inquiries}` },
                              { label: '报价', value: `QT ${region.quotations}` },
                              { label: '合同', value: `SC ${region.contracts}` },
                              { label: '订单', value: `PO ${region.orders}` },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 客户数据表格 */}
            <div className="border border-gray-200 rounded bg-white">
              <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                <div className="font-medium text-sm">Top客户待处理明细</div>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 hover:bg-white">
                  查看全部 <ArrowUpRight className="w-3 h-3" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">客户名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">区域</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">询价</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">报价</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">合同/订单</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">待收款</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">状态</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">风险</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomerRows.map((customer, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-gray-900">{displayValue(customer.name)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{customer.region}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-900">{customer.inquiries}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-900">{customer.quotations}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-600">{customer.contracts + customer.orders}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-600">{customer.pending}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs ${
                            customer.pending > 0 ? 'text-orange-600' :
                            customer.contracts + customer.orders > 0 ? 'text-gray-900' :
                            'text-gray-500'
                          }`}>
                            {customer.pending > 0 ? '待跟进' : customer.contracts + customer.orders > 0 ? '推进中' : '观察中'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            customer.pending > 0 ? 'bg-orange-500' :
                            customer.contracts + customer.orders > 0 ? 'bg-gray-700' :
                            'bg-gray-400'
                          }`} />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-100">
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 转化漏斗 */}
        {activeTab === 'funnel' && (
          <div className="p-4">
            <div className="border border-gray-200 rounded bg-white">
              <div className="border-b border-gray-200 px-4 py-2.5">
                <div className="font-medium text-sm">全流程转化漏斗分析</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">流程阶段</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">当前单量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">待处理</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">待处理占比</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">规则说明</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStageRows.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.stage}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{item.total}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">{item.pending}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${item.pendingRate}%` }} />
                            </div>
                            <span className="font-medium text-gray-900">{item.pendingRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-sm font-medium text-gray-600">规则</span>
                            <CompactDetailsPopover align="end" items={[{ label: '说明', value: item.note }]} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${
                            item.status === 'busy' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            item.status === 'watch' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {item.status === 'busy' ? '积压中' : item.status === 'watch' ? '处理中' : '已清空'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 业绩分析 */}
        {activeTab === 'performance' && (
          <div className="p-4">
            <div className="border border-gray-200 rounded bg-white">
              <div className="border-b border-gray-200 px-4 py-2.5">
                <div className="font-medium text-sm">模块待处理排行</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">排名</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">模块</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">说明</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">待处理数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">占比</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredModuleRanking.map((module, idx) => {
                      const completion = livePendingCounts.overview > 0 ? Math.round((module.count / livePendingCounts.overview) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-center">
                            <div className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${
                              idx === 0 ? 'bg-orange-500 text-white' :
                              idx === 1 ? 'bg-orange-400 text-white' :
                              idx === 2 ? 'bg-orange-300 text-white' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {idx + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{module.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-gray-600">统一规则</span>
                              <CompactDetailsPopover items={[{ label: '说明', value: '基于统一待处理规则计算' }]} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{module.count}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${completion >= 50 ? 'bg-orange-500' : 'bg-gray-700'}`} style={{ width: `${Math.min(completion, 100)}%` }} />
                              </div>
                              <span className={`text-xs font-medium ${completion >= 50 ? 'text-orange-600' : 'text-gray-700'}`}>
                                {completion}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 风险预警 */}
        {activeTab === 'risk' && (
          <div className="p-4">
            <div className="border border-gray-200 rounded bg-white">
              <div className="border-b border-gray-200 px-4 py-2.5">
                <div className="font-medium text-sm">风险预警列表</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">风险类型</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">涉及金额</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">规则说明</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">责任人</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">优先级</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRiskRows.map((risk, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                          {risk.priority === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {risk.priority === 'high' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                          {risk.priority === 'medium' && <Clock className="w-4 h-4 text-yellow-600" />}
                          {risk.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{risk.count}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">-</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-gray-600">规则</span>
                            <CompactDetailsPopover items={[{ label: '说明', value: risk.note }]} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{risk.handler}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${
                            risk.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                            risk.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            risk.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {risk.priority === 'critical' ? '紧急' : risk.priority === 'high' ? '高' : risk.priority === 'medium' ? '中' : '低'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            处理
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
