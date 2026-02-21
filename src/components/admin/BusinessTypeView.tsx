import React, { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, CheckCircle, Star, AlertTriangle, Clock, DollarSign, Package, FileSearch, ShoppingCart, Factory, Layers, Target, Percent, Heart } from 'lucide-react';
import { BusinessType, BUSINESS_TYPE_LABELS } from '../../lib/rbac-config';
import { getBusinessTypeKPIs, getBusinessTypeChartData, BUSINESS_TYPE_INSIGHTS } from '../../lib/business-type-analytics';

interface BusinessTypeViewProps {
  businessType: BusinessType;
  canViewSensitive: boolean;
  currency?: string;
}

// 图标映射
const BusinessIconMap: Record<string, React.ComponentType<any>> = {
  DollarSign, Package, FileSearch, CheckCircle, Clock, Star, AlertTriangle,
  ShoppingCart, Factory, Layers, Target, Percent, Heart, TrendingUp
};

const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04', '#10B981', '#3B82F6'];

export default function BusinessTypeView({ businessType, canViewSensitive, currency = 'USD' }: BusinessTypeViewProps) {
  // 获取业务类型专属KPI
  const kpis = useMemo(() => 
    getBusinessTypeKPIs(businessType, canViewSensitive), 
    [businessType, canViewSensitive]
  );

  // 获取业务类型专属图表数据
  const chartData = useMemo(() => 
    getBusinessTypeChartData(businessType), 
    [businessType]
  );

  // 获取业务洞察
  const insights = BUSINESS_TYPE_INSIGHTS[businessType];
  const typeConfig = BUSINESS_TYPE_LABELS[businessType];

  // 格式化数值
  const formatValue = (value: number, unit?: string) => {
    if (!unit) return value.toString();
    if (unit === 'USD' || unit === 'EUR') return `$${(value / 1000).toFixed(1)}K`;
    if (unit === '%') return `${value.toFixed(1)}%`;
    if (unit === 'hours' || unit === 'days' || unit === 'services') return `${value} ${unit}`;
    if (unit === 'x') return `${value.toFixed(1)}x`;
    return `${value} ${unit}`;
  };

  return (
    <div className="space-y-3">
      {/* 业务类型标题 */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeConfig.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>{typeConfig.zh} - {typeConfig.en}</h3>
              <p className="text-xs text-gray-600 mt-0.5">{typeConfig.description}</p>
            </div>
          </div>
          <Badge className={`h-6 px-3 text-xs bg-${typeConfig.color}-100 text-${typeConfig.color}-700 border-${typeConfig.color}-300`}>
            {insights.title}
          </Badge>
        </div>
      </div>

      {/* KPI卡片 */}
      <div className="grid grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const IconComponent = BusinessIconMap[kpi.icon] || DollarSign;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={kpi.type} className="bg-white border border-gray-200 rounded-lg p-3.5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.color} w-9 h-9 rounded flex items-center justify-center`}>
                  <IconComponent className="w-4.5 h-4.5 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span style={{ fontWeight: 600 }}>{kpi.change}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1" title={kpi.description}>{kpi.label}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatValue(kpi.value, kpi.unit)}
              </p>
            </div>
          );
        })}
      </div>

      {/* 图表区域 - 根据业务类型显示不同内容 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 左侧大图：趋势图 */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
              {businessType === 'trading' && 'Revenue & Orders Trend'}
              {businessType === 'inspection' && 'Inspection Trend & Pass Rate'}
              {businessType === 'agency' && 'Orders & Commission Trend'}
              {businessType === 'project' && 'Project Revenue & Completion'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {businessType === 'trading' && '营收与订单趋势分析'}
              {businessType === 'inspection' && '验货次数与通过率趋势'}
              {businessType === 'agency' && '订单量与佣金趋势'}
              {businessType === 'project' && '项目收入与完成率'}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData.monthlyTrend}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB' }} />
              
              {businessType === 'trading' && (
                <>
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} fill="url(#colorPrimary)" name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Orders" />
                </>
              )}
              {businessType === 'inspection' && (
                <>
                  <Bar yAxisId="left" dataKey="inspections" fill="#10B981" radius={[4, 4, 0, 0]} name="Inspections" />
                  <Line yAxisId="right" type="monotone" dataKey="passRate" stroke="#DC2626" strokeWidth={2} name="Pass Rate (%)" />
                </>
              )}
              {businessType === 'agency' && (
                <>
                  <Bar yAxisId="left" dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} name="Commission ($)" />
                </>
              )}
              {businessType === 'project' && (
                <>
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} fill="url(#colorPrimary)" name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="completion" stroke="#10B981" strokeWidth={2} name="On-Time (%)" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 右侧小图：分类饼图 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
              {businessType === 'trading' && 'Product Categories'}
              {businessType === 'inspection' && 'Inspection Types'}
              {businessType === 'agency' && 'Service Types'}
              {businessType === 'project' && 'Project Types'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {businessType === 'trading' && '产品分类占比'}
              {businessType === 'inspection' && '验货类型分布'}
              {businessType === 'agency' && '服务类型占比'}
              {businessType === 'project' && '项目类型分布'}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={
                  businessType === 'trading' ? chartData.productCategories :
                  businessType === 'inspection' ? chartData.inspectionTypes :
                  businessType === 'agency' ? chartData.serviceTypes :
                  chartData.projectTypes
                }
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                fill="#8884d8"
                dataKey={businessType === 'trading' || businessType === 'agency' ? 'value' : businessType === 'inspection' ? 'value' : 'count'}
                paddingAngle={2}
              >
                {(businessType === 'trading' ? chartData.productCategories :
                  businessType === 'inspection' ? chartData.inspectionTypes :
                  businessType === 'agency' ? chartData.serviceTypes :
                  chartData.projectTypes).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5 max-h-[110px] overflow-y-auto">
            {(businessType === 'trading' ? chartData.productCategories :
              businessType === 'inspection' ? chartData.inspectionTypes :
              businessType === 'agency' ? chartData.serviceTypes :
              chartData.projectTypes).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-gray-700 truncate">{item.name}</span>
                </div>
                <div className="ml-2 text-right">
                  {businessType === 'trading' && <p className="font-semibold text-gray-900">${(item.value / 1000).toFixed(0)}K</p>}
                  {businessType === 'inspection' && <p className="font-semibold text-gray-900">{item.value} ({item.percentage.toFixed(1)}%)</p>}
                  {businessType === 'agency' && <p className="font-semibold text-gray-900">${(item.commission / 1000).toFixed(0)}K</p>}
                  {businessType === 'project' && <p className="font-semibold text-gray-900">{item.count}个</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 数据表格区域 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 表格1 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
              {businessType === 'trading' && 'Top Products'}
              {businessType === 'inspection' && 'Defect Categories'}
              {businessType === 'agency' && 'Top Suppliers'}
              {businessType === 'project' && 'Service Breakdown'}
            </h3>
            <Badge variant="outline" className="h-5 px-2 text-xs">YTD</Badge>
          </div>
          <div className="space-y-2">
            {businessType === 'trading' && chartData.topProducts.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between py-2 px-2.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-red-600">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.units} units</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-semibold text-gray-900">${(item.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-600">+{item.growth}%</p>
                </div>
              </div>
            ))}
            {businessType === 'inspection' && chartData.defectCategories.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between py-2 px-2.5 bg-gray-50 rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.count} cases</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-semibold text-orange-600">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            {businessType === 'agency' && chartData.topSuppliers.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between py-2 px-2.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-cyan-600">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-semibold text-gray-900">${(item.value / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-600">{item.performance.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            {businessType === 'project' && chartData.serviceBreakdown.map((item, idx) => (
              <div key={item.service} className="flex items-center justify-between py-2 px-2.5 bg-gray-50 rounded">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">{item.service}</p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-semibold text-gray-900">${(item.revenue / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 表格2：Top Clients */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>Top Clients</h3>
            <Badge variant="outline" className="h-5 px-2 text-xs">YTD</Badge>
          </div>
          <div className="space-y-2">
            {chartData.topClients.map((client, idx) => (
              <div key={client.name} className="flex items-center justify-between py-2 px-2.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{client.name}</p>
                    <p className="text-xs text-gray-500">
                      {businessType === 'trading' && `${client.revenue / 1000}K revenue`}
                      {businessType === 'inspection' && `${client.inspections} inspections`}
                      {businessType === 'agency' && `${client.orders} orders`}
                      {businessType === 'project' && `${client.projects} projects`}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-semibold text-gray-900">
                    ${(
                      businessType === 'trading' ? client.revenue :
                      businessType === 'inspection' ? client.revenue :
                      businessType === 'agency' ? client.commission :
                      client.revenue
                    ) / 1000}K
                  </p>
                  <p className="text-xs text-green-600">
                    {businessType === 'trading' && `${client.growth}%`}
                    {businessType === 'inspection' && `${client.satisfaction}%`}
                    {businessType === 'agency' && `${client.retention}%`}
                    {businessType === 'project' && `${client.satisfaction}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 表格3：业务洞察 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>Business Insights</h3>
            <Badge className="h-5 px-2 text-xs bg-purple-600 border-0">AI分析</Badge>
          </div>
          <div className="space-y-3">
            {/* 优势 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-semibold text-gray-700">优势</span>
              </div>
              {insights.strengths.slice(0, 2).map((strength, idx) => (
                <p key={idx} className="text-xs text-gray-600 mb-1 pl-5">• {strength}</p>
              ))}
            </div>
            {/* 机会 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Star className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-semibold text-gray-700">机会</span>
              </div>
              {insights.opportunities.slice(0, 2).map((opp, idx) => (
                <p key={idx} className="text-xs text-gray-600 mb-1 pl-5">• {opp}</p>
              ))}
            </div>
            {/* 建议 */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-gray-700">建议</span>
              </div>
              {insights.recommendations.slice(0, 2).map((rec, idx) => (
                <p key={idx} className="text-xs text-gray-600 mb-1 pl-5">• {rec}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 额外图表行 */}
      {businessType === 'project' && (
        <div className="grid grid-cols-2 gap-3">
          {/* 项目阶段分布 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>Project Stages</h3>
              <p className="text-xs text-gray-500 mt-0.5">项目阶段分布</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.projectStages} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Projects">
                  {chartData.projectStages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
