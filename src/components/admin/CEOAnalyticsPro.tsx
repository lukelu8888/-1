import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Users, Package, 
  Filter, Download, Calendar, RefreshCw, AlertTriangle, CheckCircle,
  Globe, Building, Zap, Award, Activity, BarChart3, Eye, Shield
} from 'lucide-react';

interface CEOAnalyticsProProps {
  canViewSensitive: boolean;
}

export default function CEOAnalyticsPro({ canViewSensitive }: CEOAnalyticsProProps) {
  const [timeRange, setTimeRange] = useState('ytd');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // 🔥 CEO核心战略KPI
  const strategicKPIs = [
    {
      label: '全球总营收',
      value: 12850000,
      unit: 'USD',
      change: '+18.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: '全球客户数',
      value: 342,
      unit: '家',
      change: '+23.4%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: '年度订单量',
      value: 1248,
      unit: '单',
      change: '+15.2%',
      trend: 'up' as const,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: '净利润率',
      value: 28.3,
      unit: '%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // 🔥 区域业绩对比
  const regionalPerformance = [
    { region: '北美', revenue: 5680000, orders: 485, customers: 142, growth: 22.5 },
    { region: '欧非', revenue: 4285000, orders: 398, customers: 118, growth: 18.3 },
    { region: '南美', revenue: 2885000, orders: 365, customers: 82, growth: 12.8 }
  ];

  // 🔥 月度趋势
  const monthlyTrend = [
    { month: '1月', revenue: 985000, orders: 95, customers: 28 },
    { month: '2月', revenue: 1024000, orders: 98, customers: 31 },
    { month: '3月', revenue: 1098000, orders: 105, customers: 29 },
    { month: '4月', revenue: 1145000, orders: 112, customers: 33 },
    { month: '5月', revenue: 1065000, orders: 103, customers: 27 },
    { month: '6月', revenue: 1189000, orders: 115, customers: 35 },
    { month: '7月', revenue: 1076000, orders: 104, customers: 30 },
    { month: '8月', revenue: 1124000, orders: 108, customers: 32 },
    { month: '9月', revenue: 1156000, orders: 110, customers: 28 },
    { month: '10月', revenue: 1068000, orders: 102, customers: 26 },
    { month: '11月', revenue: 1092000, orders: 106, customers: 29 },
    { month: '12月', revenue: 828000, orders: 90, customers: 24 }
  ];

  return (
    <div className="space-y-6">
      {/* 🔥 顶部筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q3">Q3 2024</SelectItem>
                    <SelectItem value="q4">Q4 2024</SelectItem>
                    <SelectItem value="ytd">YTD 2024</SelectItem>
                    <SelectItem value="year">Full Year 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-500" />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全球</SelectItem>
                    <SelectItem value="NA">北美</SelectItem>
                    <SelectItem value="EMEA">欧非</SelectItem>
                    <SelectItem value="SA">南美</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 🔥 战略KPI卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {strategicKPIs.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                    {kpi.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {kpi.unit === 'USD' ? `$${(kpi.value / 1000000).toFixed(2)}M` : 
                     kpi.unit === '%' ? `${kpi.value}%` :
                     kpi.value.toLocaleString()}
                    {kpi.unit !== 'USD' && kpi.unit !== '%' && <span className="text-sm text-gray-500 ml-1">{kpi.unit}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 🔥 区域业绩对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#F96302]" />
            全球区域业绩对比
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionalPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#F96302" name="营收 (USD)" />
              <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" name="订单量" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 🔥 月度趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#F96302]" />
            月度营收趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" fill="#F9630220" stroke="#F96302" name="营收" />
              <Line type="monotone" dataKey="orders" stroke="#3B82F6" name="订单量" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 🔥 敏感数据提示 */}
      {!canViewSensitive && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">部分敏感财务数据已隐藏</p>
                <p className="text-xs text-amber-700 mt-1">您当前的角色权限无法查看成本价和利润率详情</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
