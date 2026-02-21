import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Factory, Truck, Clock, 
  CheckCircle, AlertTriangle, Star, Target, Filter, Download, Calendar,
  Briefcase, Search, FileText, Box, Users, Award, BarChart3, RefreshCw,
  ShoppingCart, MapPin, Layers, ArrowUpRight, ArrowDownRight, Eye, Settings,
  ClipboardCheck, ChevronRight
} from 'lucide-react';
import { BusinessType, BUSINESS_TYPE_LABELS } from '../../lib/rbac-config';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import InspectionManagement from './InspectionManagementComplete'; // 🔥 验货管理系统

interface ProcurementAnalyticsProps {
  canViewSensitive: boolean;
}

// 📊 采购KPI数据
interface ProcurementKPI {
  label: string;
  value: number;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}

// 📊 供应商数据接口
interface Supplier {
  id: string;
  name: string;
  businessTypes: string[]; // 供应商可支持的业务类型（能力范围）
  category: string;
  region: string;
  onTimeRate: number;
  qualityRate: number;
  rating: number;
  leadTime: number;
  defectRate: number;
}

// 🔥 采购订单数据接口（每个订单关联一种业务类型）
interface PurchaseOrder {
  id: string;
  supplierId: string;
  businessType: 'trading' | 'inspection' | 'agency' | 'project'; // 订单的业务类型
  category: string;
  amount: number;
  orderDate: string;
  isOnTime: boolean;
  isQualified: boolean;
  costSaving: number;
}

// 📊 月度数据接口
interface MonthlyData {
  month: string;
  trading: number;
  inspection: number;
  agency: number;
  project: number;
  total: number;
}

export default function ProcurementAnalytics({ canViewSensitive }: ProcurementAnalyticsProps) {
  // 筛选器状态
  const [timeRange, setTimeRange] = useState('year');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 验货管理视图状态
  const [showInspectionView, setShowInspectionView] = useState(false);

  // 🔥 如果显示验货管理视图，直接返回验货管理组件
  if (showInspectionView) {
    return (
      <div className="space-y-4">
        {/* 返回按钮 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowInspectionView(false)}
          className="flex items-center gap-2"
        >
          <ChevronRight className="size-4 rotate-180" />
          返回采购分析
        </Button>
        
        <InspectionManagement userRole="Procurement" />
      </div>
    );
  }

  // 🔥 时间范围系数（模拟不同时间范围的数据量）
  const timeRangeMultiplier = useMemo(() => {
    const multipliers: Record<string, number> = {
      week: 0.025,    // 1周约占全年的2.5%
      month: 0.083,   // 1月约占全年的8.3%
      quarter: 0.25,  // 1季度占全年的25%
      year: 1.0       // 全年100%
    };
    return multipliers[timeRange] || 1.0;
  }, [timeRange]);

  // 🔥 基础供应商数据（全量数据）
  const allSuppliers: Supplier[] = [
    { 
      id: 'SUP-001',
      name: '广州精英五金有限公司', 
      businessTypes: ['trading', 'project'],
      category: '门窗五金',
      region: '广东',
      onTimeRate: 96.5,
      qualityRate: 98.2,
      rating: 4.8,
      leadTime: 22,
      defectRate: 1.8
    },
    { 
      id: 'SUP-002',
      name: '深圳智能科技有限公司', 
      businessTypes: ['trading', 'agency'],
      category: '电气组件',
      region: '广东',
      onTimeRate: 94.2,
      qualityRate: 96.8,
      rating: 4.7,
      leadTime: 25,
      defectRate: 3.2
    },
    { 
      id: 'SUP-003',
      name: '福建质量检验服务公司', 
      businessTypes: ['inspection'],
      category: '质量检验',
      region: '福建',
      onTimeRate: 98.5,
      qualityRate: 99.1,
      rating: 4.9,
      leadTime: 3,
      defectRate: 0.9
    },
    { 
      id: 'SUP-004',
      name: '上海管道供应有限公司', 
      businessTypes: ['trading', 'project'],
      category: '卫浴配件',
      region: '上海',
      onTimeRate: 91.8,
      qualityRate: 94.5,
      rating: 4.5,
      leadTime: 30,
      defectRate: 5.5
    },
    { 
      id: 'SUP-005',
      name: '温州门控系统厂', 
      businessTypes: ['trading', 'agency'],
      category: '门窗五金',
      region: '浙江',
      onTimeRate: 89.5,
      qualityRate: 92.8,
      rating: 4.4,
      leadTime: 32,
      defectRate: 7.2
    },
    { 
      id: 'SUP-006',
      name: '北京物流专业公司', 
      businessTypes: ['project', 'agency'],
      category: '物流服务',
      region: '北京',
      onTimeRate: 93.2,
      qualityRate: 95.6,
      rating: 4.6,
      leadTime: 5,
      defectRate: 4.4
    },
    { 
      id: 'SUP-007',
      name: '宁波安全设备有限公司', 
      businessTypes: ['trading'],
      category: '劳保用品',
      region: '浙江',
      onTimeRate: 90.8,
      qualityRate: 93.2,
      rating: 4.5,
      leadTime: 28,
      defectRate: 6.8
    },
    { 
      id: 'SUP-008',
      name: '广州报关代理有限公司', 
      businessTypes: ['project'],
      category: '报关服务',
      region: '广东',
      onTimeRate: 95.8,
      qualityRate: 97.2,
      rating: 4.7,
      leadTime: 4,
      defectRate: 2.8
    },
    { 
      id: 'SUP-009',
      name: '杭州柜体五金厂', 
      businessTypes: ['trading', 'agency'],
      category: '柜体五金',
      region: '浙江',
      onTimeRate: 88.2,
      qualityRate: 91.5,
      rating: 4.3,
      leadTime: 35,
      defectRate: 8.5
    },
    { 
      id: 'SUP-010',
      name: '厦门货运代理有限公司', 
      businessTypes: ['project', 'agency'],
      category: '货运服务',
      region: '福建',
      onTimeRate: 92.5,
      qualityRate: 94.8,
      rating: 4.6,
      leadTime: 6,
      defectRate: 5.2
    },
    { 
      id: 'SUP-011',
      name: '成都电器配件厂', 
      businessTypes: ['trading'],
      category: '电气组件',
      region: '四川',
      onTimeRate: 93.5,
      qualityRate: 95.2,
      rating: 4.6,
      leadTime: 27,
      defectRate: 4.8
    },
    { 
      id: 'SUP-012',
      name: '苏州精密五金有限公司', 
      businessTypes: ['trading', 'project'],
      category: '柜体五金',
      region: '江苏',
      onTimeRate: 94.8,
      qualityRate: 96.5,
      rating: 4.7,
      leadTime: 24,
      defectRate: 3.5
    },
  ];

  // 🔥 基础月度数据（全年数据）
  const baseMonthlyData: MonthlyData[] = [
    { month: '1月', trading: 95000, inspection: 28500, agency: 58000, project: 32000, total: 213500 },
    { month: '2月', trading: 108000, inspection: 32000, agency: 62000, project: 35000, total: 237000 },
    { month: '3月', trading: 102000, inspection: 30000, agency: 59000, project: 33000, total: 224000 },
    { month: '4月', trading: 118000, inspection: 35500, agency: 68000, project: 38000, total: 259500 },
    { month: '5月', trading: 112000, inspection: 33000, agency: 65000, project: 36000, total: 246000 },
    { month: '6月', trading: 125000, inspection: 38000, agency: 72000, project: 42000, total: 277000 },
    { month: '7月', trading: 132000, inspection: 41000, agency: 78000, project: 45000, total: 296000 },
    { month: '8月', trading: 128000, inspection: 39500, agency: 75000, project: 43000, total: 285500 },
    { month: '9月', trading: 142000, inspection: 44000, agency: 85000, project: 48000, total: 319000 },
    { month: '10月', trading: 148000, inspection: 46000, agency: 88000, project: 51000, total: 333000 },
    { month: '11月', trading: 156000, inspection: 49000, agency: 92000, project: 54000, total: 351000 },
    { month: '12月', trading: 162000, inspection: 51000, agency: 96000, project: 57000, total: 366000 },
  ];

  // 🔥 筛选后的供应商数据（根据所有筛选条件）
  const filteredSuppliers = useMemo(() => {
    return allSuppliers.filter(supplier => {
      // 业务类型筛选
      const matchBusinessType = selectedBusinessType === 'all' || 
        supplier.businessTypes.includes(selectedBusinessType);
      
      // 产品类别筛选
      const matchCategory = selectedCategory === 'all' || 
        supplier.category === selectedCategory;
      
      // 区域筛选
      const matchRegion = selectedRegion === 'all' || 
        supplier.region === selectedRegion;
      
      // 供应商筛选
      const matchSupplier = selectedSupplier === 'all' || 
        supplier.id === selectedSupplier;
      
      // 搜索筛选
      const matchSearch = searchTerm === '' || 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchBusinessType && matchCategory && matchRegion && matchSupplier && matchSearch;
    });
  }, [selectedBusinessType, selectedCategory, selectedRegion, selectedSupplier, searchTerm]);

  // 🔥 动态计算KPI数据（根据筛选条件和时间范围）
  const dynamicKPIs = useMemo(() => {
    // 基于筛选后的供应商计算KPI
    const totalAmount = filteredSuppliers.reduce((sum, s) => sum + s.totalAmount, 0) * timeRangeMultiplier;
    const totalOrders = Math.round(filteredSuppliers.reduce((sum, s) => sum + s.orders, 0) * timeRangeMultiplier);
    const activeSuppliers = filteredSuppliers.length;
    const avgOnTimeRate = filteredSuppliers.length > 0 
      ? filteredSuppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / filteredSuppliers.length 
      : 0;
    const avgQualityRate = filteredSuppliers.length > 0
      ? filteredSuppliers.reduce((sum, s) => sum + s.qualityRate, 0) / filteredSuppliers.length
      : 0;
    const totalCostSaving = filteredSuppliers.reduce((sum, s) => sum + s.costSaving, 0) * timeRangeMultiplier;
    const avgLeadTime = filteredSuppliers.length > 0
      ? filteredSuppliers.reduce((sum, s) => sum + s.leadTime, 0) / filteredSuppliers.length
      : 0;
    const avgRating = filteredSuppliers.length > 0
      ? filteredSuppliers.reduce((sum, s) => sum + s.rating, 0) / filteredSuppliers.length
      : 0;

    return {
      totalAmount,
      totalOrders,
      activeSuppliers,
      avgOnTimeRate,
      avgQualityRate,
      totalCostSaving,
      avgLeadTime,
      avgRating
    };
  }, [filteredSuppliers, timeRangeMultiplier]);

  // 🔥 KPI卡片数据（使用动态计算的值）
  const kpiCards: ProcurementKPI[] = useMemo(() => [
    {
      label: '总采购金额',
      value: dynamicKPIs.totalAmount,
      unit: 'USD',
      change: '+18.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      description: '总采购金额'
    },
    {
      label: '采购订单数',
      value: dynamicKPIs.totalOrders,
      unit: '',
      change: '+12.3%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      description: '采购订单数'
    },
    {
      label: '活跃供应商',
      value: dynamicKPIs.activeSuppliers,
      unit: '',
      change: '+8.2%',
      trend: 'up',
      icon: Factory,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      description: '活跃供应商'
    },
    {
      label: '准时交付率',
      value: dynamicKPIs.avgOnTimeRate,
      unit: '%',
      change: '+3.2%',
      trend: 'up',
      icon: Truck,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '准时交付率'
    },
    {
      label: '成本节省',
      value: dynamicKPIs.totalCostSaving,
      unit: 'USD',
      change: '+22.4%',
      trend: 'up',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600',
      description: '成本节省'
    },
    {
      label: '质量通过率',
      value: dynamicKPIs.avgQualityRate,
      unit: '%',
      change: '+1.8%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-600',
      description: '质量通过率'
    },
    {
      label: '平均交付周期',
      value: dynamicKPIs.avgLeadTime,
      unit: '天',
      change: '-4.2%',
      trend: 'down',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-600',
      description: '平均交付周期'
    },
    {
      label: '供应商评分',
      value: dynamicKPIs.avgRating,
      unit: '/5',
      change: '+0.3',
      trend: 'up',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600',
      description: '供应商平均评分'
    },
  ], [dynamicKPIs]);

  // 🔥 月度趋势数据（根据时间范围和业务类型筛选）
  const filteredMonthlyData = useMemo(() => {
    let data = [...baseMonthlyData];
    
    // 根据时间范围筛选
    if (timeRange === 'week') {
      data = data.slice(-1); // 最近1周数据（简化为最后一个月）
    } else if (timeRange === 'month') {
      data = data.slice(-1); // 最近1月数据
    } else if (timeRange === 'quarter') {
      data = data.slice(-3); // 最近1季度数据
    }
    
    // 根据业务类型筛选（如果选择了特定业务类型，调整数据）
    if (selectedBusinessType !== 'all') {
      data = data.map(item => {
        const businessTypeValue = item[selectedBusinessType as keyof MonthlyData] as number || 0;
        return {
          ...item,
          total: businessTypeValue,
          [selectedBusinessType]: businessTypeValue
        };
      });
    }
    
    return data;
  }, [timeRange, selectedBusinessType]);

  // 🔥 按业务类型分类的采购数据（根据筛选条件动态计算）
  const procurementByBusinessType = useMemo(() => {
    const businessTypes = ['trading', 'inspection', 'agency', 'project'];
    const businessTypeLabels: Record<string, { name: string; icon: string }> = {
      trading: { name: '直接采购', icon: '🛒' },
      inspection: { name: '验货服务', icon: '🔍' },
      agency: { name: '代理服务', icon: '🤝' },
      project: { name: '一站式项目', icon: '🌟' },
    };

    return businessTypes
      .map(type => {
        const suppliersOfType = allSuppliers.filter(s => 
          s.businessTypes.includes(type) &&
          (selectedCategory === 'all' || s.category === selectedCategory) &&
          (selectedRegion === 'all' || s.region === selectedRegion)
        );
        
        const amount = suppliersOfType.reduce((sum, s) => sum + s.totalAmount, 0) * timeRangeMultiplier;
        const orders = Math.round(suppliersOfType.reduce((sum, s) => sum + s.orders, 0) * timeRangeMultiplier);
        const suppliers = suppliersOfType.length;
        const avgOnTimeRate = suppliers > 0 
          ? suppliersOfType.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers 
          : 0;
        const avgQualityRate = suppliers > 0
          ? suppliersOfType.reduce((sum, s) => sum + s.qualityRate, 0) / suppliers
          : 0;
        const costSaving = suppliersOfType.reduce((sum, s) => sum + s.costSaving, 0) * timeRangeMultiplier;
        
        return {
          type,
          name: businessTypeLabels[type].name,
          icon: businessTypeLabels[type].icon,
          amount,
          orders,
          suppliers,
          avgOrderValue: orders > 0 ? amount / orders : 0,
          onTimeRate: avgOnTimeRate,
          qualityRate: avgQualityRate,
          costSaving,
          percentage: 0 // Will be calculated below
        };
      })
      .filter(item => item.amount > 0) // Only show business types with data
      .map(item => {
        const totalAmount = businessTypes.reduce((sum, type) => {
          const suppliersOfType = allSuppliers.filter(s => 
            s.businessTypes.includes(type) &&
            (selectedCategory === 'all' || s.category === selectedCategory) &&
            (selectedRegion === 'all' || s.region === selectedRegion)
          );
          return sum + suppliersOfType.reduce((s, supplier) => s + supplier.totalAmount, 0) * timeRangeMultiplier;
        }, 0);
        
        return {
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
        };
      });
  }, [selectedCategory, selectedRegion, timeRangeMultiplier]);

  // 🔥 产品类别分布（根据筛选条件动态计算）
  const categoryDistribution = useMemo(() => {
    const categories = [...new Set(allSuppliers.map(s => s.category))];
    
    return categories
      .map(category => {
        const suppliersOfCategory = allSuppliers.filter(s => 
          s.category === category &&
          (selectedBusinessType === 'all' || s.businessTypes.includes(selectedBusinessType)) &&
          (selectedRegion === 'all' || s.region === selectedRegion)
        );
        
        const amount = suppliersOfCategory.reduce((sum, s) => sum + s.totalAmount, 0) * timeRangeMultiplier;
        const orders = Math.round(suppliersOfCategory.reduce((sum, s) => sum + s.orders, 0) * timeRangeMultiplier);
        const suppliers = suppliersOfCategory.length;
        
        return {
          name: category,
          amount,
          orders,
          suppliers,
          percentage: 0 // Will be calculated below
        };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(item => {
        const totalAmount = categories.reduce((sum, category) => {
          const suppliersOfCategory = allSuppliers.filter(s => 
            s.category === category &&
            (selectedBusinessType === 'all' || s.businessTypes.includes(selectedBusinessType)) &&
            (selectedRegion === 'all' || s.region === selectedRegion)
          );
          return sum + suppliersOfCategory.reduce((s, supplier) => s + supplier.totalAmount, 0) * timeRangeMultiplier;
        }, 0);
        
        return {
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
        };
      });
  }, [selectedBusinessType, selectedRegion, timeRangeMultiplier]);

  // 🔥 区域分布（根据筛选条件动态计算）
  const regionDistribution = useMemo(() => {
    const regions = [...new Set(allSuppliers.map(s => s.region))];
    
    return regions
      .map(region => {
        const suppliersOfRegion = allSuppliers.filter(s => 
          s.region === region &&
          (selectedBusinessType === 'all' || s.businessTypes.includes(selectedBusinessType)) &&
          (selectedCategory === 'all' || s.category === selectedCategory)
        );
        
        const amount = suppliersOfRegion.reduce((sum, s) => sum + s.totalAmount, 0) * timeRangeMultiplier;
        const suppliers = suppliersOfRegion.length;
        const avgLeadTime = suppliers > 0
          ? suppliersOfRegion.reduce((sum, s) => sum + s.leadTime, 0) / suppliers
          : 0;
        
        return {
          region,
          amount,
          suppliers,
          avgLeadTime,
          percentage: 0
        };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(item => {
        const totalAmount = regions.reduce((sum, region) => {
          const suppliersOfRegion = allSuppliers.filter(s => 
            s.region === region &&
            (selectedBusinessType === 'all' || s.businessTypes.includes(selectedBusinessType)) &&
            (selectedCategory === 'all' || s.category === selectedCategory)
          );
          return sum + suppliersOfRegion.reduce((s, supplier) => s + supplier.totalAmount, 0) * timeRangeMultiplier;
        }, 0);
        
        return {
          ...item,
          percentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
        };
      });
  }, [selectedBusinessType, selectedCategory, timeRangeMultiplier]);

  // 🔥 获取所有独特的类别列表
  const allCategories = useMemo(() => {
    return [...new Set(allSuppliers.map(s => s.category))].sort();
  }, []);

  // 🔥 获取所有独特的区域列表
  const allRegions = useMemo(() => {
    return [...new Set(allSuppliers.map(s => s.region))].sort();
  }, []);

  // 图表颜色
  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  const BUSINESS_TYPE_COLORS = {
    trading: '#DC2626',
    inspection: '#10B981',
    agency: '#8B5CF6',
    project: '#F59E0B'
  };

  // 🔥 格式化数值
  const formatNumber = (num: number, decimals: number = 0): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      {/* 🔥 验货管理快速入口 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="size-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">🔍 验货管理系统</h3>
              <p className="text-sm text-blue-100">
                采购流程核心环节 · 支持标准验货、纯验货服务、代理采购验货 · 验货标准管理 · 服务费闭环
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowInspectionView(true)}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <ClipboardCheck className="size-4 mr-2" />
            进入验货管理
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* 🔥 标题栏 - 参考业务员模块设计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            采购数据分析
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            供应商绩效与采购趋势分析
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 时间范围筛选器 */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week" className="text-xs">本周</SelectItem>
              <SelectItem value="month" className="text-xs">本月</SelectItem>
              <SelectItem value="quarter" className="text-xs">本季度</SelectItem>
              <SelectItem value="year" className="text-xs">本年</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 业务类型筛选器 */}
          <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部业务</SelectItem>
              {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((key) => {
                const type = BUSINESS_TYPE_LABELS[key];
                return (
                  <SelectItem key={key} value={key} className="text-xs">
                    {type.icon} {type.zh}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* 🔥 产品类别筛选器 */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部类别</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category} className="text-xs">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 🔥 区域筛选器 */}
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部区域</SelectItem>
              {allRegions.map((region) => (
                <SelectItem key={region} value={region} className="text-xs">
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 🔥 供应商筛选器 */}
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部供应商</SelectItem>
              {allSuppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id} className="text-xs">
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出报表
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 🔥 KPI 卡片网格 */}
      <div className="grid grid-cols-4 gap-3">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.bgColor} bg-opacity-10 p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">{kpi.label}</p>
                <p className="text-xl font-semibold text-gray-900">
                  {kpi.unit === 'USD' ? `$${formatNumber(kpi.value, 1)}` : 
                   kpi.unit === '%' ? `${kpi.value.toFixed(1)}%` :
                   kpi.unit === '/5' ? kpi.value.toFixed(1) :
                   kpi.unit === '天' ? Math.round(kpi.value) :
                   formatNumber(kpi.value)}
                  <span className="text-sm text-gray-500 ml-1">{kpi.unit !== 'USD' && kpi.unit !== '%' && kpi.unit !== '/5' ? kpi.unit : ''}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 业务类型分布卡片 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">业务类型分布</h3>
          <Badge variant="outline" className="text-xs">
            {procurementByBusinessType.length} 个业务类型
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {procurementByBusinessType.map((item, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">{item.name}</p>
                  <p className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">采购金额</span>
                  <span className="text-xs font-medium text-gray-900">${formatNumber(item.amount, 1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">订单数</span>
                  <span className="text-xs font-medium text-gray-900">{item.orders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">供应商</span>
                  <span className="text-xs font-medium text-gray-900">{item.suppliers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">准时率</span>
                  <span className="text-xs font-medium text-green-600">{item.onTimeRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 月度采购趋势图 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">月度采购趋势</h3>
          <Badge variant="outline" className="text-xs">
            {filteredMonthlyData.length} 个月数据
          </Badge>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={filteredMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#999" />
            <YAxis tick={{ fontSize: 11 }} stroke="#999" />
            <Tooltip 
              contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              formatter={(value: any) => [`$${formatNumber(value, 1)}`, '']}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {selectedBusinessType === 'all' ? (
              <>
                <Bar dataKey="trading" name="直接采购" fill={BUSINESS_TYPE_COLORS.trading} stackId="stack" />
                <Bar dataKey="inspection" name="验货服务" fill={BUSINESS_TYPE_COLORS.inspection} stackId="stack" />
                <Bar dataKey="agency" name="代理服务" fill={BUSINESS_TYPE_COLORS.agency} stackId="stack" />
                <Bar dataKey="project" name="一站式项目" fill={BUSINESS_TYPE_COLORS.project} stackId="stack" />
                <Line type="monotone" dataKey="total" name="总计" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
              </>
            ) : (
              <Bar 
                dataKey="total" 
                name={BUSINESS_TYPE_LABELS[selectedBusinessType as BusinessType]?.zh || '采购金额'} 
                fill={BUSINESS_TYPE_COLORS[selectedBusinessType as keyof typeof BUSINESS_TYPE_COLORS] || '#DC2626'} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 🔥 产品类别分布和区域分布 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 产品类别分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">产品类别分布</h3>
            <Badge variant="outline" className="text-xs">
              {categoryDistribution.length} 个类别
            </Badge>
          </div>
          <div className="space-y-3">
            {categoryDistribution.slice(0, 7).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">{item.name}</span>
                    <span className="text-xs font-semibold text-gray-900">${formatNumber(item.amount, 1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${item.percentage}%`, 
                          backgroundColor: COLORS[index % COLORS.length] 
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">订单: {item.orders}</span>
                    <span className="text-xs text-gray-500">供应商: {item.suppliers}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 区域分布 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">区域分布</h3>
            <Badge variant="outline" className="text-xs">
              {regionDistribution.length} 个区域
            </Badge>
          </div>
          <div className="space-y-3">
            {regionDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-700">{item.region}</span>
                    <span className="text-xs font-semibold text-gray-900">${formatNumber(item.amount, 1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${item.percentage}%`, 
                          backgroundColor: COLORS[index % COLORS.length] 
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-12 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500">供应商: {item.suppliers}</span>
                    <span className="text-xs text-gray-500">交付周期: {Math.round(item.avgLeadTime)}天</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 供应商绩效表格 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">供应商绩效明细</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              显示 {filteredSuppliers.length} / {allSuppliers.length} 个供应商
            </Badge>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="w-3 h-3 mr-1" />
              导出
            </Button>
          </div>
        </div>
        
        {filteredSuppliers.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-700">编号</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">供应商名称</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">业务类型</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">产品类别</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">区域</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">采购金额</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">订单数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">准时率</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">质量率</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">评分</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">交付周期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs text-gray-700">{supplier.id}</TableCell>
                    <TableCell className="text-xs font-medium text-gray-900">{supplier.name}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex gap-1 flex-wrap">
                        {supplier.businessTypes.map(type => (
                          <Badge 
                            key={type} 
                            variant="outline" 
                            className="text-xs h-5 px-1.5"
                            style={{ borderColor: BUSINESS_TYPE_COLORS[type as keyof typeof BUSINESS_TYPE_COLORS] }}
                          >
                            {BUSINESS_TYPE_LABELS[type as BusinessType]?.icon}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">{supplier.category}</TableCell>
                    <TableCell className="text-xs text-gray-700">{supplier.region}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-gray-900">
                      ${formatNumber(supplier.totalAmount * timeRangeMultiplier, 1)}
                    </TableCell>
                    <TableCell className="text-xs text-right text-gray-700">
                      {Math.round(supplier.orders * timeRangeMultiplier)}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <span className={supplier.onTimeRate >= 95 ? 'text-green-600 font-medium' : supplier.onTimeRate >= 90 ? 'text-blue-600' : 'text-orange-600'}>
                        {supplier.onTimeRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <span className={supplier.qualityRate >= 95 ? 'text-green-600 font-medium' : supplier.qualityRate >= 90 ? 'text-blue-600' : 'text-orange-600'}>
                        {supplier.qualityRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{supplier.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right text-gray-700">
                      {supplier.leadTime}天
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">没有符合筛选条件的供应商数据</p>
            <p className="text-xs text-gray-500 mt-1">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}