import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar, BarChart3, 
  Filter, Download, RefreshCw, Globe, MapPin, UserCog, Layers, Lock, 
  AlertTriangle, Eye, Shield, FileText, Factory, ShoppingCart, MessageSquare,
  Target, Clock, AlertCircle, ChevronRight, Briefcase, CheckCircle, Star,
  Percent, Heart, FileSearch
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { canViewSensitiveField, getDataFilter, ROLE_LABELS, BusinessType, BUSINESS_TYPE_LABELS } from '../../lib/rbac-config';
import { getRoleAnalyticsConfig, KPI_METADATA, KPIType } from '../../lib/role-analytics-config';
import { getBusinessTypeKPIs, getBusinessTypeChartData, BUSINESS_TYPE_INSIGHTS } from '../../lib/business-type-analytics';
import { Alert, AlertDescription } from '../ui/alert';
import BusinessTypeView from './BusinessTypeView'; // 🔥 业务类型专属视图
// ❌ 已禁用：暂时注释，可能是 Vite 缓存问题
// import ProcurementAnalytics from './ProcurementAnalytics'; // 🔥 采购专属分析
import CEOAnalyticsPro from './CEOAnalyticsPro'; // 🔥 CEO战略分析（专业版）
import CFOAnalytics from './CFOAnalytics'; // 🔥 CFO财务分析
import RegionalAnalytics from './RegionalAnalytics'; // 🔥 区域分析（主管/业务员）
import FinanceAnalytics from './FinanceAnalytics'; // 🔥 财务分析

// 🔥 区域配置数据
const REGION_CONFIG = {
  'NA': {
    name: 'North America',
    label: '北美',
    countries: ['United States', 'Canada', 'Mexico'],
    currency: 'USD',
    categories: ['Door Hardware', 'Cabinet Hardware', 'Window Hardware', 'Sliding Systems']
  },
  'SA': {
    name: 'South America', 
    label: '南美',
    countries: ['Brazil', 'Argentina', 'Chile', 'Colombia'],
    currency: 'USD',
    categories: ['Bathroom Fixtures', 'Door Accessories', 'Window Fittings', 'Safety Equipment']
  },
  'EMEA': {
    name: 'Europe & Africa',
    label: '欧非',
    countries: ['Germany', 'UK', 'France', 'Spain', 'South Africa'],
    currency: 'EUR',
    categories: ['Electrical Components', 'Plumbing Supplies', 'Building Hardware', 'Industrial Tools']
  }
};

// 🔥 业务员数据
const SALES_REPS = [
  { id: 'all', name: 'All Sales Reps', region: 'all' },
  { id: 'john', name: 'John Smith', region: 'NA' },
  { id: 'maria', name: 'Maria Garcia', region: 'NA' },
  { id: 'carlos', name: 'Carlos Rodriguez', region: 'SA' },
  { id: 'ana', name: 'Ana Silva', region: 'SA' },
  { id: 'hans', name: 'Hans Mueller', region: 'EMEA' },
  { id: 'pierre', name: 'Pierre Dubois', region: 'EMEA' },
];

// 🔥 客户数据（按区域分类）
const CUSTOMERS_BY_REGION = {
  'NA': ['ABC Trading Ltd.', 'HomeStyle Inc.', 'BuildMart Co.', 'Elite Supplies'],
  'SA': ['Brasil Imports SA', 'ArgentCo Trading', 'Chilean Builders', 'Colombia Supplies'],
  'EMEA': ['European Hardware GmbH', 'UK Building Supplies', 'French Trading Co.', 'African Imports Ltd.']
};

// 🔥 供应商数据
const SUPPLIERS = [
  'Guangzhou Hardware Factory',
  'Shenzhen Electric Co.',
  'Fujian Building Materials',
  'Shanghai Plumbing Supplies',
  'Wenzhou Door Systems',
];

// 🔥 图标组件映射
const IconMap: Record<string, React.ComponentType<any>> = {
  DollarSign,
  Package,
  Users,
  TrendingUp,
  FileText,
  Factory,
  ShoppingCart,
  MessageSquare,
  Target,
  Clock,
  AlertCircle,
};

export default function AdminDataAnalyticsNew() {
  const { currentUser } = useAuth();
  
  // 🔥 筛选状态
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all'); // 🔥 业务类型筛选
  const [timeRange, setTimeRange] = useState<string>('year');
  const [viewType, setViewType] = useState<string>('revenue');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // 🔥 获取用户数据过滤规则
  const dataFilter = currentUser ? getDataFilter(currentUser) : { type: 'none' as const };
  
  // 🔥 获取角色专属配置
  const roleConfig = currentUser ? getRoleAnalyticsConfig(currentUser.role) : null;

  // 🔥 检查用户权限
  const canViewProfitMargin = currentUser ? canViewSensitiveField(currentUser, 'profit_margin') : false;
  const canViewCostPrice = currentUser ? canViewSensitiveField(currentUser, 'cost_price') : false;

  // 🔥 当用户切换时，重置筛选器并根据权限设置初始区域
  React.useEffect(() => {
    if (!currentUser) return;
    
    if (dataFilter.type === 'region' && currentUser.region && currentUser.region !== 'all') {
      setSelectedRegion(currentUser.region);
    } else if (dataFilter.type === 'all') {
      setSelectedRegion('all');
    }
    
    setSelectedCountry('all');
    setSelectedSalesRep('all');
    setSelectedCustomer('all');
    setShowSensitiveData(false);
  }, [currentUser, dataFilter.type]);

  // 🔥 动态获取当前区域的配置
  const currentRegionConfig = useMemo(() => {
    if (selectedRegion === 'all') return null;
    return REGION_CONFIG[selectedRegion as keyof typeof REGION_CONFIG];
  }, [selectedRegion]);

  // 🔥 动态获取可选区域（根据用户权限）
  const availableRegions = useMemo(() => {
    if (!currentUser) return [];
    
    if (dataFilter.type === 'all') {
      return Object.keys(REGION_CONFIG);
    }
    
    if (dataFilter.type === 'region' && currentUser.region && currentUser.region !== 'all') {
      return [currentUser.region];
    }
    
    return [];
  }, [currentUser, dataFilter]);

  // 🔥 动态获取可选国家列表
  const availableCountries = useMemo(() => {
    if (selectedRegion === 'all') return [];
    return REGION_CONFIG[selectedRegion as keyof typeof REGION_CONFIG]?.countries || [];
  }, [selectedRegion]);

  // 🔥 动态获取可选客户列表
  const availableCustomers = useMemo(() => {
    if (selectedRegion === 'all') {
      return ['All Customers', ...Object.values(CUSTOMERS_BY_REGION).flat()];
    }
    return ['All Customers', ...(CUSTOMERS_BY_REGION[selectedRegion as keyof typeof CUSTOMERS_BY_REGION] || [])];
  }, [selectedRegion]);

  // 🔥 动态获取可选业务员列表（根据用户权限）
  const availableSalesReps = useMemo(() => {
    if (!currentUser) return SALES_REPS;
    
    if (currentUser.role === 'Sales_Rep') {
      return SALES_REPS.filter(rep => rep.id === 'all' || rep.id === currentUser.id);
    }
    
    if (currentUser.role === 'Sales_Manager') {
      if (selectedRegion === 'all') {
        return SALES_REPS.filter(rep => rep.region === 'all' || rep.region === currentUser.region);
      }
      return SALES_REPS.filter(rep => rep.region === 'all' || rep.region === selectedRegion);
    }
    
    if (selectedRegion === 'all') {
      return SALES_REPS;
    }
    return SALES_REPS.filter(rep => rep.region === 'all' || rep.region === selectedRegion);
  }, [currentUser, selectedRegion]);

  // 🔥 当区域改变时，重置依赖筛选器
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setSelectedCountry('all');
    setSelectedCustomer('all');
    setSelectedSalesRep('all');
  };

  // 🔥 模拟数据 - 根据角色返回不同的KPI值
  const getKPIValue = (kpiType: KPIType): number => {
    const mockData: Record<KPIType, number> = {
      revenue: 632000,
      orders: 121,
      customers: 45,
      avg_order_value: 5200,
      profit_margin: 28.5,
      cost: 452000,
      receivables: 284000,
      payables: 165000,
      suppliers: 28,
      purchase_orders: 89,
      inquiries: 156,
      quotations: 98,
      conversion_rate: 62.8,
      pending_payment: 142000,
      pending_approval: 12,
    };
    return mockData[kpiType];
  };

  // 🔥 动态生成KPI卡片数据
  const kpiCards = useMemo(() => {
    if (!roleConfig) return [];
    
    return roleConfig.kpis.map(kpiType => {
      const metadata = KPI_METADATA[kpiType];
      const value = getKPIValue(kpiType);
      const change = Math.random() > 0.2 ? `+${(Math.random() * 30).toFixed(1)}%` : `-${(Math.random() * 10).toFixed(1)}%`;
      const trend = change.startsWith('+') ? 'up' : 'down';
      
      return {
        type: kpiType,
        label: metadata.label,
        value: metadata.formatter(value, currentRegionConfig?.currency),
        rawValue: value,
        change,
        trend,
        icon: metadata.icon,
        color: metadata.color,
      };
    });
  }, [roleConfig, currentRegionConfig]);

  // 🔥 图表数据
  const monthlyData = [
    { month: 'Jan', revenue: 45000, orders: 8, customers: 5, purchase: 32000, receivable: 28000, payable: 15000 },
    { month: 'Feb', revenue: 52000, orders: 10, customers: 6, purchase: 38000, receivable: 32000, payable: 18000 },
    { month: 'Mar', revenue: 48000, orders: 9, customers: 5, purchase: 35000, receivable: 30000, payable: 16000 },
    { month: 'Apr', revenue: 61000, orders: 12, customers: 7, purchase: 42000, receivable: 38000, payable: 22000 },
    { month: 'May', revenue: 55000, orders: 11, customers: 6, purchase: 39000, receivable: 34000, payable: 19000 },
    { month: 'Jun', revenue: 67000, orders: 13, customers: 8, purchase: 48000, receivable: 42000, payable: 25000 },
    { month: 'Jul', revenue: 72000, orders: 14, customers: 8, purchase: 52000, receivable: 45000, payable: 28000 },
    { month: 'Aug', revenue: 69000, orders: 13, customers: 7, purchase: 50000, receivable: 43000, payable: 26000 },
    { month: 'Sep', revenue: 78000, orders: 15, customers: 9, purchase: 56000, receivable: 48000, payable: 30000 },
    { month: 'Oct', revenue: 85000, orders: 16, customers: 10, purchase: 62000, receivable: 52000, payable: 34000 },
  ];

  // 🔥 询价漏斗数据（业务员专用）
  const inquiryFunnelData = [
    { name: 'Inquiries', value: 156, fill: '#3B82F6' },
    { name: 'Quotations', value: 98, fill: '#8B5CF6' },
    { name: 'Contracts', value: 62, fill: '#10B981' },
    { name: 'Orders', value: 45, fill: '#F59E0B' },
  ];

  // 🔥 供应商排名数据（采购专用）
  const supplierRankingData = SUPPLIERS.map((name, idx) => ({
    name,
    orders: [45, 38, 32, 28, 22][idx],
    amount: [285, 198, 176, 142, 118][idx],
  }));

  // 🔥 团队业绩数据（主管专用）
  const teamPerformanceData = SALES_REPS.filter(rep => rep.id !== 'all' && rep.region === (currentUser?.region || 'NA')).map((rep, idx) => ({
    name: rep.name,
    revenue: [285, 198, 176][idx] || 100,
    orders: [45, 38, 32][idx] || 20,
  }));

  // 🔥 产品分类数据
  const categoryData = useMemo(() => {
    const categories = currentRegionConfig?.categories || ['Door Hardware', 'Cabinet Hardware', 'Window Hardware', 'Sliding Systems'];
    
    return categories.map((name, index) => ({
      name,
      value: [285000, 198000, 142000, 112000][index] || 100000,
      orders: [45, 38, 28, 22][index] || 20,
    }));
  }, [currentRegionConfig]);

  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#CA8A04'];

  // 🔥 生成数据过滤规则描述
  const getDataFilterDescription = () => {
    if (dataFilter.type === 'all') return '可以查看所有数据（全局视图）';
    if (dataFilter.type === 'region' && dataFilter.region) {
      return `只能查看 ${REGION_CONFIG[dataFilter.region as keyof typeof REGION_CONFIG]?.label || dataFilter.region} 区域的数据`;
    }
    if (dataFilter.type === 'team') return '只能查看自己团队的数据';
    if (dataFilter.type === 'own') return '只能查看自己的数据（客户、订单等）';
    return '无数据访问权限';
  };

  if (!currentUser || !roleConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-6">
      {/* 🔥 标题栏 */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-600" />
            <h2 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>{roleConfig.dashboardTitle}</h2>
            <Badge variant="outline" className="h-5 px-2 text-xs">{roleConfig.description}</Badge>
            {/* 用户信息 */}
            <div className="flex items-center gap-2 ml-4">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-700">{currentUser.avatar}</span>
                <span className="text-xs font-medium text-gray-900">{currentUser.name}</span>
              </div>
              <Badge className="h-5 px-2 text-xs bg-blue-100 text-blue-700 border-blue-300">
                {ROLE_LABELS[currentUser.role].zh}
              </Badge>
              {currentUser.region && currentUser.region !== 'all' && (
                <Badge variant="outline" className="h-5 px-2 text-xs">
                  {REGION_CONFIG[currentUser.region as keyof typeof REGION_CONFIG]?.label || currentUser.region}区
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {roleConfig.features.canExport && (
              <>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  刷新
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  导出
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 CEO战略分析 - 完整独立视图 */}
      {/* 已禁用：CEO现在使用通用视图 */}
      {/* {currentUser.role === 'CEO' && (
        <CEOAnalyticsPro 
          canViewSensitive={canViewProfitMargin || canViewCostPrice}
        />
      )} */}

      {/* 🔥 CFO财务分析 - 完整独立视图 */}
      {currentUser.role === 'CFO' && (
        <CFOAnalytics 
          canViewSensitive={canViewProfitMargin || canViewCostPrice}
        />
      )}

      {/* 🔥 区域分析 - 完整独立视图（主管/业务员） */}
      {(currentUser.role === 'Sales_Manager' || currentUser.role === 'Sales_Rep') && (
        <RegionalAnalytics 
          canViewSensitive={canViewProfitMargin || canViewCostPrice}
          userRole={currentUser.role}
          userRegion={currentUser.region || 'NA'}
          userId={currentUser.id}
        />
      )}

      {/* 🔥 财务分析 - 完整独立视图 */}
      {currentUser.role === 'Finance' && (
        <FinanceAnalytics 
          canViewSensitive={canViewProfitMargin || canViewCostPrice}
          userRegion={currentUser.region}
        />
      )}

      {/* 🔥 采购分析 - 完整独立视图 - 已禁用（可能是 Vite 缓存问题） */}
      {/* {currentUser.role === 'Procurement' && (
        <ProcurementAnalytics 
          canViewSensitive={canViewProfitMargin || canViewCostPrice}
        />
      )} */}

      {/* 🔥 CEO/Admin/Marketing_Ops 通用数据分析视图 */}
      {(currentUser.role === 'CEO' || currentUser.role === 'Admin' || currentUser.role === 'Marketing_Ops') && (
        <>
          {/* 🔥 筛选器栏 */}
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              
              {/* 时间范围 */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">YTD 2024</SelectItem>
                </SelectContent>
              </Select>

              {/* 区域筛选 */}
              {roleConfig?.features.canViewAllRegions && (
                <Select value={selectedRegion} onValueChange={handleRegionChange}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue placeholder="区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全球</SelectItem>
                    {availableRegions.map(region => (
                      <SelectItem key={region} value={region}>
                        {REGION_CONFIG[region as keyof typeof REGION_CONFIG]?.label || region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* 🔥 KPI卡片网格 */}
          <div className="grid grid-cols-4 gap-3">
            {kpiCards.map((kpi, index) => {
              const Icon = IconMap[kpi.icon] || DollarSign;
              const isPositive = kpi.trend === 'up';
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${kpi.color === 'green' ? 'bg-green-50' : kpi.color === 'blue' ? 'bg-blue-50' : kpi.color === 'purple' ? 'bg-purple-50' : 'bg-orange-50'} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.color === 'green' ? 'text-green-600' : kpi.color === 'blue' ? 'text-blue-600' : kpi.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                    </div>
                    <Badge 
                      variant={isPositive ? 'default' : 'destructive'}
                      className="h-5 px-2 text-xs"
                    >
                      {kpi.change}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🔥 全球区域业绩对比图 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#F96302]" />
                <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>全球区域业绩对比</h3>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { region: '北美', revenue: 5680000, orders: 485 },
                { region: '欧非', revenue: 4285000, orders: 398 },
                { region: '南美', revenue: 2885000, orders: 365 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="revenue" fill="#F96302" name="营收 (USD)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" name="订单量" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}