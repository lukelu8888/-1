// 🎯 THE COSUN BM - 订单全盘（台湾大厂企业系统风格）
// 表格优先 + 高信息密度 + 功能导向 + 极简专业

import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Download, RefreshCw, 
  FileText, Receipt, Package, DollarSign, Calendar, Filter, Settings,
  Clock, CheckCircle2, XCircle, AlertCircle, Eye, ArrowUpRight, Users
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function OrderOverviewDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'performance' | 'risk'>('overview');
  const [timeRange, setTimeRange] = useState('本月');

  // 数据
  const funnelData = [
    { stage: '询价', count: 248, amount: 2850000, conversion: 100, trend: '+12%', status: 'normal' },
    { stage: '报价', count: 186, amount: 2100000, conversion: 75, trend: '+8%', status: 'normal' },
    { stage: '合同', count: 124, amount: 1980000, conversion: 67, trend: '+5%', status: 'normal' },
    { stage: '订单', count: 98, amount: 1560000, conversion: 79, trend: '+15%', status: 'good' },
    { stage: '收款', count: 76, amount: 1180000, conversion: 78, trend: '+10%', status: 'good' },
  ];

  const regionData = [
    { region: '北美', inquiries: 132, quotations: 98, contracts: 68, orders: 54, revenue: 850000, growth: '+18%' },
    { region: '欧非', inquiries: 76, quotations: 58, contracts: 38, orders: 30, revenue: 480000, growth: '+12%' },
    { region: '南美', inquiries: 40, quotations: 30, contracts: 18, orders: 14, revenue: 230000, growth: '+8%' },
  ];

  const customerData = [
    { name: 'ABC Trading Ltd.', region: '北美', orders: 24, amount: 560000, paid: 420000, pending: 140000, status: '正常', risk: 'low' },
    { name: 'Global Import Co.', region: '北美', orders: 18, amount: 420000, paid: 380000, pending: 40000, status: '正常', risk: 'low' },
    { name: 'Premium Supplies Inc.', region: '欧非', orders: 15, amount: 380000, paid: 280000, pending: 100000, status: '延迟', risk: 'medium' },
    { name: 'Euro Distribution', region: '欧非', orders: 12, amount: 290000, paid: 290000, pending: 0, status: '完成', risk: 'low' },
    { name: 'South American Trading', region: '南美', orders: 10, amount: 210000, paid: 120000, pending: 90000, status: '逾期', risk: 'high' },
    { name: 'Pacific Imports LLC', region: '北美', orders: 9, amount: 180000, paid: 180000, pending: 0, status: '完成', risk: 'low' },
    { name: 'Continental Supply', region: '欧非', orders: 8, amount: 160000, paid: 120000, pending: 40000, status: '正常', risk: 'low' },
    { name: 'Latin America Dist.', region: '南美', orders: 7, amount: 140000, paid: 70000, pending: 70000, status: '延迟', risk: 'medium' },
  ];

  const salesData = [
    { name: '张伟', region: '北美', inquiries: 58, quotations: 44, contracts: 32, orders: 28, revenue: 480000, conversion: 76, target: 500000 },
    { name: '李娜', region: '欧非', inquiries: 52, quotations: 38, contracts: 28, orders: 24, revenue: 420000, conversion: 72, target: 400000 },
    { name: '王强', region: '北美', inquiries: 48, quotations: 36, contracts: 24, orders: 20, revenue: 360000, conversion: 68, target: 380000 },
    { name: 'Maria Garcia', region: '南美', inquiries: 42, quotations: 30, contracts: 18, orders: 16, revenue: 270000, conversion: 64, target: 280000 },
    { name: 'John Smith', region: '欧非', inquiries: 38, quotations: 28, contracts: 18, orders: 14, revenue: 225000, conversion: 60, target: 250000 },
  ];

  const riskData = [
    { type: '逾期询价', count: 12, amount: 0, days: '7-15天', handler: '张伟, 李娜', priority: 'medium' },
    { type: '即将过期报价', count: 8, amount: 280000, days: '3-7天', handler: '王强, Maria', priority: 'high' },
    { type: '延迟订单', count: 5, amount: 450000, days: '5-12天', handler: 'John Smith', priority: 'high' },
    { type: '逾期应收款', count: 15, amount: 380000, days: '15-45天', handler: '财务部', priority: 'critical' },
  ];

  const trendData = [
    { week: 'W1', inquiries: 45, quotations: 32, contracts: 21, orders: 18 },
    { week: 'W2', inquiries: 52, quotations: 38, contracts: 25, orders: 20 },
    { week: 'W3', inquiries: 58, quotations: 42, contracts: 28, orders: 22 },
    { week: 'W4', inquiries: 63, quotations: 48, contracts: 32, orders: 24 },
  ];

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
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Filter className="w-3.5 h-3.5" />
              筛选
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Download className="w-3.5 h-3.5" />
              导出
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

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
                { label: '总询价', value: 248, trend: '+12%' },
                { label: '总报价', value: 186, trend: '+8%' },
                { label: '总合同', value: 124, trend: '+5%' },
                { label: '总订单', value: 98, trend: '+15%' },
                { label: '总收款', value: 76, trend: '+10%' },
                { label: '端到端转化', value: '31%', trend: '+3%' },
              ].map((kpi, idx) => (
                <div key={idx} className="border border-gray-200 rounded bg-white p-3">
                  <div className="text-xs text-gray-500 mb-1.5">{kpi.label}</div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="text-xs text-gray-500">{kpi.trend}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 图表 + 数据表格 */}
            <div className="grid grid-cols-3 gap-4">
              {/* 趋势图 */}
              <div className="col-span-2 border border-gray-200 rounded bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                  <div className="font-medium text-sm">每周业务趋势</div>
                  <div className="text-xs text-gray-500">Weekly Trend</div>
                </div>
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="week" stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                      <Tooltip 
                        contentStyle={{ 
                          fontSize: '11px', 
                          borderRadius: '4px', 
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#FFF'
                        }} 
                      />
                      <Area type="monotone" dataKey="inquiries" stroke="#9CA3AF" strokeWidth={1} fill="#F3F4F6" />
                      <Area type="monotone" dataKey="quotations" stroke="#6B7280" strokeWidth={1} fill="#E5E7EB" />
                      <Area type="monotone" dataKey="orders" stroke="#F96302" strokeWidth={2} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 区域分布表 */}
              <div className="border border-gray-200 rounded bg-white">
                <div className="border-b border-gray-200 px-4 py-2.5 bg-gray-50">
                  <div className="font-medium text-sm">区域分布</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {regionData.map((region, idx) => (
                    <div key={idx} className="px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm text-gray-900">{region.region}</div>
                        <div className="text-xs text-gray-500">{region.growth}</div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{region.orders} 订单</span>
                        <span className="font-medium text-gray-900">${(region.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 客户数据表格 */}
            <div className="border border-gray-200 rounded bg-white">
              <div className="border-b border-gray-200 px-4 py-2.5 flex items-center justify-between bg-gray-50">
                <div className="font-medium text-sm">Top客户订单明细</div>
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
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">订单数</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">订单金额</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">已收款</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">待收款</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">状态</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">风险</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerData.map((customer, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm text-gray-900">{customer.name}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{customer.region}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-900">{customer.orders}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-900">${(customer.amount / 1000).toFixed(1)}K</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-600">${(customer.paid / 1000).toFixed(1)}K</td>
                        <td className="px-4 py-2.5 text-sm text-right text-gray-600">${(customer.pending / 1000).toFixed(1)}K</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs ${
                            customer.status === '完成' ? 'text-gray-500' :
                            customer.status === '正常' ? 'text-gray-900' :
                            customer.status === '延迟' ? 'text-gray-600' :
                            'text-gray-900'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            customer.risk === 'low' ? 'bg-gray-400' :
                            customer.risk === 'medium' ? 'bg-gray-600' :
                            'bg-gray-900'
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
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">数量</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">金额</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">转化率</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">环比增长</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {funnelData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.stage}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{item.count}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">${(item.amount / 1000000).toFixed(2)}M</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${item.conversion}%` }} />
                            </div>
                            <span className="font-medium text-gray-900">{item.conversion}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{item.trend}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${
                            item.status === 'good' ? 'bg-green-100 text-green-700 border-green-200' :
                            'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {item.status === 'good' ? '优秀' : '正常'}
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
                <div className="font-medium text-sm">业务员业绩排行</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">排名</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">业务员</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">区域</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">询价</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">报价</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">合同</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">订单</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">营收</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">目标</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">转化率</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">完成度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {salesData.map((sales, idx) => {
                      const completion = Math.round((sales.revenue / sales.target) * 100);
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
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{sales.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{sales.region}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{sales.inquiries}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{sales.quotations}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{sales.contracts}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{sales.orders}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">${(sales.revenue / 1000).toFixed(0)}K</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">${(sales.target / 1000).toFixed(0)}K</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{sales.conversion}%</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${completion >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(completion, 100)}%` }} />
                              </div>
                              <span className={`text-xs font-medium ${completion >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">时间范围</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">责任人</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">优先级</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {riskData.map((risk, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                          {risk.priority === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          {risk.priority === 'high' && <AlertCircle className="w-4 h-4 text-orange-600" />}
                          {risk.priority === 'medium' && <Clock className="w-4 h-4 text-yellow-600" />}
                          {risk.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{risk.count}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                          {risk.amount > 0 ? `$${(risk.amount / 1000).toFixed(0)}K` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{risk.days}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{risk.handler}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={`text-xs ${
                            risk.priority === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                            risk.priority === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}>
                            {risk.priority === 'critical' ? '紧急' : risk.priority === 'high' ? '高' : '中'}
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