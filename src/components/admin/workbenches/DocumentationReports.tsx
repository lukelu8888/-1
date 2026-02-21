import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, Download, Filter,
  Users, FileCheck, Clock, AlertTriangle, CheckCircle2, Globe,
  Award, Target, Zap, Activity, DollarSign, Package, MapPin,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
         AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
         Legend, ResponsiveContainer, RadarChart, PolarGrid, 
         PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface DocumentationReportsProps {
  onBack: () => void;
}

// 时间范围选项
const TIME_RANGES = [
  { id: 'today', label: '今日', days: 1 },
  { id: 'week', label: '本周', days: 7 },
  { id: 'month', label: '本月', days: 30 },
  { id: 'quarter', label: '本季度', days: 90 },
  { id: 'year', label: '本年', days: 365 },
];

// 区域市场
const REGIONS = [
  { id: 'all', label: '全部区域' },
  { id: 'NA', label: '北美市场' },
  { id: 'SA', label: '南美市场' },
  { id: 'EU', label: '欧非市场' },
];

// 业务阶段
const BUSINESS_STAGES = [
  { id: 'all', label: '全部阶段' },
  { id: 'sales_contract', label: '销售合同' },
  { id: 'shipping', label: '发货通知' },
  { id: 'customs', label: '报关报检' },
  { id: 'logistics', label: '物流追踪' },
  { id: 'payment', label: '收款核销' },
];

// 核心KPI数据
const KPI_DATA = {
  totalOrders: { value: 1248, change: 12.5, trend: 'up' },
  completionRate: { value: 87.3, change: 3.2, trend: 'up' },
  overdueCount: { value: 23, change: -5.1, trend: 'down' },
  avgProcessTime: { value: 4.2, change: -8.3, trend: 'down' },
  totalValue: { value: 5680000, change: 18.7, trend: 'up' },
  activeStaff: { value: 48, change: 0, trend: 'stable' },
};

// 订单量趋势数据（近30天）
const ORDER_TREND_DATA = [
  { date: '12/01', orders: 42, completed: 38, overdue: 4 },
  { date: '12/03', orders: 38, completed: 35, overdue: 3 },
  { date: '12/05', orders: 45, completed: 41, overdue: 4 },
  { date: '12/07', orders: 51, completed: 47, overdue: 4 },
  { date: '12/09', orders: 48, completed: 44, overdue: 4 },
  { date: '12/11', orders: 53, completed: 50, overdue: 3 },
  { date: '12/13', orders: 49, completed: 46, overdue: 3 },
  { date: '12/15', orders: 55, completed: 52, overdue: 3 },
  { date: '12/17', orders: 52, completed: 48, overdue: 4 },
  { date: '12/19', orders: 58, completed: 55, overdue: 3 },
  { date: '12/21', orders: 61, completed: 58, overdue: 3 },
  { date: '12/23', orders: 56, completed: 53, overdue: 3 },
];

// 单证类型完成情况
const DOCUMENT_COMPLETION_DATA = [
  { name: '销售合同', completed: 245, pending: 15, overdue: 5, rate: 92.1 },
  { name: '商业发票', completed: 238, pending: 18, overdue: 9, rate: 89.4 },
  { name: '装箱单', completed: 242, pending: 12, overdue: 11, rate: 91.0 },
  { name: '提单', completed: 228, pending: 25, overdue: 12, rate: 86.0 },
  { name: '报关单', completed: 235, pending: 20, overdue: 10, rate: 88.7 },
  { name: '产地证', completed: 220, pending: 28, overdue: 17, rate: 83.0 },
  { name: '保险单', completed: 232, pending: 22, overdue: 11, rate: 87.5 },
  { name: '检验证书', completed: 215, pending: 30, overdue: 20, rate: 81.1 },
  { name: '受益人证明', completed: 225, pending: 25, overdue: 15, rate: 84.9 },
  { name: '装运通知', completed: 240, pending: 15, overdue: 10, rate: 90.6 },
  { name: '退税申报', completed: 210, pending: 35, overdue: 20, rate: 79.2 },
  { name: '核销单', completed: 205, pending: 38, overdue: 22, rate: 77.4 },
  { name: '许可证', completed: 195, pending: 42, overdue: 28, rate: 73.6 },
];

// 区域市场分布
const REGION_DISTRIBUTION = [
  { name: '北美', value: 485, rate: 38.8, color: '#3B82F6' },
  { name: '南美', value: 362, rate: 29.0, color: '#10B981' },
  { name: '欧非', value: 401, rate: 32.2, color: '#F59E0B' },
];

// 业务员绩效数据
const STAFF_PERFORMANCE = [
  { name: '张伟', orders: 85, completed: 78, rate: 91.8, avgTime: 3.8, quality: 96 },
  { name: '李娜', orders: 78, completed: 72, rate: 92.3, avgTime: 3.5, quality: 98 },
  { name: '王强', orders: 72, completed: 65, rate: 90.3, avgTime: 4.1, quality: 94 },
  { name: '刘芳', orders: 68, completed: 60, rate: 88.2, avgTime: 4.5, quality: 92 },
  { name: '陈军', orders: 65, completed: 58, rate: 89.2, avgTime: 4.2, quality: 93 },
  { name: '赵敏', orders: 62, completed: 56, rate: 90.3, avgTime: 3.9, quality: 95 },
  { name: '孙丽', orders: 58, completed: 52, rate: 89.7, avgTime: 4.0, quality: 94 },
  { name: '周涛', orders: 55, completed: 48, rate: 87.3, avgTime: 4.6, quality: 91 },
];

// 业务阶段分布
const STAGE_DISTRIBUTION = [
  { stage: '销售合同', count: 125, rate: 25.1 },
  { stage: '发货通知', count: 98, rate: 19.7 },
  { stage: '报关报检', count: 112, rate: 22.5 },
  { stage: '物流追踪', count: 85, rate: 17.1 },
  { stage: '收款核销', count: 78, rate: 15.6 },
];

// 处理时效分析
const PROCESSING_TIME_DATA = [
  { range: '< 2天', count: 245, percentage: 39.2 },
  { range: '2-4天', count: 198, percentage: 31.6 },
  { range: '4-7天', count: 112, percentage: 17.9 },
  { range: '7-14天', count: 52, percentage: 8.3 },
  { range: '> 14天', count: 19, percentage: 3.0 },
];

// 质量评分雷达图数据
const QUALITY_RADAR_DATA = [
  { dimension: '完成率', value: 87, fullMark: 100 },
  { dimension: '时效性', value: 82, fullMark: 100 },
  { dimension: '准确性', value: 94, fullMark: 100 },
  { dimension: '合规性', value: 91, fullMark: 100 },
  { dimension: '响应速度', value: 88, fullMark: 100 },
  { dimension: '客户满意度', value: 93, fullMark: 100 },
];

export function DocumentationReports({ onBack }: DocumentationReportsProps) {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [activeMetric, setActiveMetric] = useState<'completion' | 'time' | 'quality'>('completion');

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // 格式化货币
  const formatCurrency = (num: number) => {
    return `$${formatNumber(num)}`;
  };

  // 渲染趋势图标
  const renderTrendIcon = (trend: string, size = 'h-4 w-4') => {
    if (trend === 'up') return <ArrowUpRight className={`${size} text-green-600`} />;
    if (trend === 'down') return <ArrowDownRight className={`${size} text-red-600`} />;
    return <Minus className={`${size} text-gray-400`} />;
  };

  // 渲染变化百分比
  const renderChange = (change: number, inverse = false) => {
    const isPositive = inverse ? change < 0 : change > 0;
    const color = isPositive ? 'text-green-600' : change === 0 ? 'text-gray-400' : 'text-red-600';
    const sign = change > 0 ? '+' : '';
    return (
      <span className={`text-xs font-medium ${color}`}>
        {sign}{change.toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 🔥 顶部控制栏 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">报表分析中心</h2>
            <p className="text-xs text-gray-500 mt-0.5">B2B Export Documentation Analytics Dashboard</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 时间范围选择 */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              {TIME_RANGES.map(range => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-all ${
                    timeRange === range.id
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={timeRange === range.id ? { color: '#F96302' } : {}}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* 区域筛选 */}
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
            >
              {REGIONS.map(region => (
                <option key={region.id} value={region.id}>{region.label}</option>
              ))}
            </select>

            {/* 导出按钮 */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">
              <Download className="h-3.5 w-3.5" />
              导出报表
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 核心KPI看板 */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { 
            key: 'totalOrders', 
            label: '订单总数', 
            icon: Package, 
            color: 'blue',
            format: (v: number) => v.toString()
          },
          { 
            key: 'completionRate', 
            label: '完成率', 
            icon: CheckCircle2, 
            color: 'green',
            format: (v: number) => `${v}%`
          },
          { 
            key: 'overdueCount', 
            label: '超期预警', 
            icon: AlertTriangle, 
            color: 'red',
            format: (v: number) => v.toString(),
            inverse: true
          },
          { 
            key: 'avgProcessTime', 
            label: '平均时效', 
            icon: Clock, 
            color: 'purple',
            format: (v: number) => `${v}天`,
            inverse: true
          },
          { 
            key: 'totalValue', 
            label: '订单总额', 
            icon: DollarSign, 
            color: 'orange',
            format: formatCurrency
          },
          { 
            key: 'activeStaff', 
            label: '在岗人员', 
            icon: Users, 
            color: 'cyan',
            format: (v: number) => v.toString()
          },
        ].map(kpi => {
          const data = KPI_DATA[kpi.key as keyof typeof KPI_DATA];
          const Icon = kpi.icon;
          const colorMap: any = {
            blue: 'bg-blue-50 border-blue-200 text-blue-600',
            green: 'bg-green-50 border-green-200 text-green-600',
            red: 'bg-red-50 border-red-200 text-red-600',
            purple: 'bg-purple-50 border-purple-200 text-purple-600',
            orange: 'bg-orange-50 border-orange-200 text-orange-600',
            cyan: 'bg-cyan-50 border-cyan-200 text-cyan-600',
          };

          return (
            <div key={kpi.key} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg border ${colorMap[kpi.color]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                {renderTrendIcon(data.trend, 'h-3.5 w-3.5')}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">
                {kpi.format(data.value)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{kpi.label}</span>
                {renderChange(data.change, kpi.inverse)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 主图表区域 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 订单量趋势图 */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">订单量趋势分析</h3>
              <p className="text-xs text-gray-500 mt-0.5">Order Volume Trend Analysis</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600">订单总数</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">已完成</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-600">超期</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={ORDER_TREND_DATA}>
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '11px', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} 
              />
              <Area type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
              <Area type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              <Line type="monotone" dataKey="overdue" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 区域市场分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">区域市场分布</h3>
            <p className="text-xs text-gray-500 mt-0.5">Regional Distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={REGION_DISTRIBUTION}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {REGION_DISTRIBUTION.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  fontSize: '11px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {REGION_DISTRIBUTION.map(region => (
              <div key={region.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: region.color }}></div>
                  <span className="text-xs text-gray-700">{region.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900">{region.value}</span>
                  <span className="text-xs text-gray-500">({region.rate}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 单证完成情况详细表格 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">单证完成情况统计</h3>
            <p className="text-xs text-gray-500 mt-0.5">Document Completion Statistics (13 Types)</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
              <Filter className="h-3 w-3" />
              筛选
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-700">单证类型</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">已完成</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">处理中</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">超期</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700">完成率</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">进度条</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENT_COMPLETION_DATA.map((doc, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-medium text-gray-900">{doc.name}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                      {doc.completed}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                      {doc.pending}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 bg-red-100 text-red-700 rounded font-medium">
                      {doc.overdue}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-bold ${
                      doc.rate >= 90 ? 'text-green-600' :
                      doc.rate >= 80 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {doc.rate}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            doc.rate >= 90 ? 'bg-green-500' :
                            doc.rate >= 80 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${doc.rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔥 业务员绩效与质量分析 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 业务员绩效排行榜 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">业务员绩效排行</h3>
              <p className="text-xs text-gray-500 mt-0.5">Staff Performance Ranking</p>
            </div>
            <Award className="h-4 w-4 text-yellow-500" />
          </div>
          
          <div className="space-y-2">
            {STAFF_PERFORMANCE.slice(0, 8).map((staff, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-700' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">{staff.name}</span>
                    <span className="text-xs font-bold text-gray-700">{staff.rate}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>订单: {staff.orders}</span>
                    <span>·</span>
                    <span>时效: {staff.avgTime}天</span>
                    <span>·</span>
                    <span>质量: {staff.quality}分</span>
                  </div>
                </div>

                <div className="flex-shrink-0 w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${staff.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 质量评分雷达图 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">综合质量评分</h3>
            <p className="text-xs text-gray-500 mt-0.5">Quality Score Analysis</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={QUALITY_RADAR_DATA}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar 
                name="评分" 
                dataKey="value" 
                stroke="#F96302" 
                fill="#F96302" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '11px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔥 处理时效分析与业务阶段分布 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 处理时效分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">处理时效分析</h3>
            <p className="text-xs text-gray-500 mt-0.5">Processing Time Distribution</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={PROCESSING_TIME_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis dataKey="range" type="category" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={60} />
              <Tooltip 
                contentStyle={{ 
                  fontSize: '11px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px'
                }} 
              />
              <Bar dataKey="count" fill="#F96302" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 业务阶段分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">业务阶段分布</h3>
            <p className="text-xs text-gray-500 mt-0.5">Business Stage Distribution</p>
          </div>
          <div className="space-y-3">
            {STAGE_DISTRIBUTION.map((stage, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{stage.count}</span>
                    <span className="text-xs text-gray-500">({stage.rate}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all"
                    style={{ width: `${stage.rate * 4}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
