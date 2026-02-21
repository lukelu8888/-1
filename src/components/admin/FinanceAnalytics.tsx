import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Receipt, 
  Filter, Download, Calendar, RefreshCw, AlertTriangle, CheckCircle,
  Clock, FileText, Users, Activity, Search, MapPin, Percent,
  ArrowUpRight, ArrowDownRight, Building, Package
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface FinanceAnalyticsProps {
  canViewSensitive: boolean;
  userRegion?: string;
}

// 📊 财务KPI数据
interface FinanceKPI {
  label: string;
  value: number;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  alert?: 'normal' | 'warning' | 'urgent';
}

export default function FinanceAnalytics({ canViewSensitive, userRegion }: FinanceAnalyticsProps) {
  // 筛选器状态
  const [timeRange, setTimeRange] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState<string>(userRegion || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 财务核心KPI（8个关键指标）
  const financeKPIs: FinanceKPI[] = [
    {
      label: '应收账款总额',
      value: 2845000,
      unit: 'USD',
      change: '+12.5%',
      trend: 'up',
      icon: Receipt,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-600',
      description: '待收款项总额',
      alert: 'warning'
    },
    {
      label: '应付账款总额',
      value: 1680000,
      unit: 'USD',
      change: '+8.4%',
      trend: 'up',
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-600',
      description: '待付款项总额',
      alert: 'normal'
    },
    {
      label: '逾期应收款',
      value: 595000,
      unit: 'USD',
      change: '+15.2%',
      trend: 'up',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      description: '已逾期待收款',
      alert: 'urgent'
    },
    {
      label: '逾期应付款',
      value: 84000,
      unit: 'USD',
      change: '-12.5%',
      trend: 'down',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '已逾期待付款',
      alert: 'normal'
    },
    {
      label: '本月回款',
      value: 1248000,
      unit: 'USD',
      change: '+28.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '本月实际回款',
      alert: 'normal'
    },
    {
      label: '本月付款',
      value: 856000,
      unit: 'USD',
      change: '+18.2%',
      trend: 'up',
      icon: Wallet,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600',
      description: '本月实际付款',
      alert: 'normal'
    },
    {
      label: '平均收账周期',
      value: 45,
      unit: '天',
      change: '-3天',
      trend: 'down',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      description: '平均回款天数',
      alert: 'normal'
    },
    {
      label: '回款完成率',
      value: 92.8,
      unit: '%',
      change: '+5.2%',
      trend: 'up',
      icon: Percent,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      description: '回款计划完成率',
      alert: 'normal'
    },
  ];

  // 🔥 应收账款明细（TOP 20客户）
  const receivableDetails = [
    { id: 'INV-2024-1001', customer: 'ABC Trading Ltd.', region: '北美', amount: 125000, dueDate: '2024-12-15', overdueDays: 0, status: 'pending', contact: 'John Smith', phone: '+1-555-0101', category: '未逾期' },
    { id: 'INV-2024-0985', customer: 'HomeStyle Inc.', region: '北美', amount: 98500, dueDate: '2024-12-20', overdueDays: 0, status: 'pending', contact: 'Sarah Johnson', phone: '+1-555-0102', category: '未逾期' },
    { id: 'INV-2024-0952', customer: 'BuildMart Co.', region: '北美', amount: 85000, dueDate: '2024-11-25', overdueDays: 8, status: 'overdue', contact: 'Michael Brown', phone: '+1-555-0103', category: '逾期1-30天' },
    { id: 'INV-2024-0938', customer: 'European Hardware GmbH', region: '欧非', amount: 128000, dueDate: '2024-12-10', overdueDays: 0, status: 'pending', contact: 'Hans Mueller', phone: '+49-30-12345', category: '未逾期' },
    { id: 'INV-2024-0925', customer: 'UK Building Supplies', region: '欧非', amount: 95000, dueDate: '2024-11-18', overdueDays: 15, status: 'overdue', contact: 'James Wilson', phone: '+44-20-7946', category: '逾期1-30天' },
    { id: 'INV-2024-0912', customer: 'Brasil Imports SA', region: '南美', amount: 75000, dueDate: '2024-11-10', overdueDays: 23, status: 'overdue', contact: 'Carlos Silva', phone: '+55-11-9876', category: '逾期1-30天' },
    { id: 'INV-2024-0898', customer: 'ArgentCo Trading', region: '南美', amount: 68000, dueDate: '2024-10-28', overdueDays: 36, status: 'overdue', contact: 'Maria Garcia', phone: '+54-11-4567', category: '逾期31-60天' },
    { id: 'INV-2024-0885', customer: 'Elite Supplies', region: '北美', amount: 112000, dueDate: '2024-12-25', overdueDays: 0, status: 'pending', contact: 'David Lee', phone: '+1-555-0104', category: '未逾期' },
    { id: 'INV-2024-0872', customer: 'French Trading Co.', region: '欧非', amount: 88500, dueDate: '2024-11-05', overdueDays: 28, status: 'overdue', contact: 'Pierre Dubois', phone: '+33-1-4567', category: '逾期1-30天' },
    { id: 'INV-2024-0859', customer: 'Chilean Builders', region: '南美', amount: 58000, dueDate: '2024-10-15', overdueDays: 49, status: 'overdue', contact: 'Ana Rodriguez', phone: '+56-2-8765', category: '逾期31-60天' },
    { id: 'INV-2024-0846', customer: 'African Imports Ltd.', region: '欧非', amount: 92000, dueDate: '2024-12-05', overdueDays: 0, status: 'pending', contact: 'Ahmed Hassan', phone: '+27-11-7654', category: '未逾期' },
    { id: 'INV-2024-0833', customer: 'Colombia Supplies', region: '南美', amount: 48000, dueDate: '2024-10-05', overdueDays: 59, status: 'overdue', contact: 'Luis Martinez', phone: '+57-1-3456', category: '逾期31-60天' },
    { id: 'INV-2024-0820', customer: 'ABC Trading Ltd.', region: '北美', amount: 65000, dueDate: '2024-09-20', overdueDays: 74, status: 'overdue', contact: 'John Smith', phone: '+1-555-0101', category: '逾期61-90天' },
    { id: 'INV-2024-0807', customer: 'HomeStyle Inc.', region: '北美', amount: 52000, dueDate: '2024-12-30', overdueDays: 0, status: 'pending', contact: 'Sarah Johnson', phone: '+1-555-0102', category: '未逾期' },
    { id: 'INV-2024-0794', customer: 'BuildMart Co.', region: '北美', amount: 78000, dueDate: '2024-11-12', overdueDays: 21, status: 'overdue', contact: 'Michael Brown', phone: '+1-555-0103', category: '逾期1-30天' },
    { id: 'INV-2024-0781', customer: 'European Hardware GmbH', region: '欧非', amount: 105000, dueDate: '2024-08-25', overdueDays: 100, status: 'overdue', contact: 'Hans Mueller', phone: '+49-30-12345', category: '逾期90天以上' },
    { id: 'INV-2024-0768', customer: 'UK Building Supplies', region: '欧非', amount: 42000, dueDate: '2024-09-10', overdueDays: 84, status: 'overdue', contact: 'James Wilson', phone: '+44-20-7946', category: '逾期61-90天' },
    { id: 'INV-2024-0755', customer: 'Brasil Imports SA', region: '南美', amount: 38000, dueDate: '2024-08-15', overdueDays: 110, status: 'overdue', contact: 'Carlos Silva', phone: '+55-11-9876', category: '逾期90天以上' },
    { id: 'INV-2024-0742', customer: 'Elite Supplies', region: '北美', amount: 95000, dueDate: '2024-12-18', overdueDays: 0, status: 'pending', contact: 'David Lee', phone: '+1-555-0104', category: '未逾期' },
    { id: 'INV-2024-0729', customer: 'French Trading Co.', region: '欧非', amount: 55000, dueDate: '2024-11-28', overdueDays: 5, status: 'overdue', contact: 'Pierre Dubois', phone: '+33-1-4567', category: '逾期1-30天' },
  ];

  // 🔥 应付账款明细（TOP 15供应商）
  const payableDetails = [
    { id: 'BILL-2024-1001', supplier: '广州精英五金有限公司', region: '广东', amount: 125000, dueDate: '2024-12-20', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0995', supplier: '深圳智能科技有限公司', region: '广东', amount: 98000, dueDate: '2024-12-15', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0988', supplier: '福建质量检验服务公司', region: '福建', amount: 45000, dueDate: '2024-12-08', overdueDays: 0, status: 'pending', priority: 'high', category: '到期7天内' },
    { id: 'BILL-2024-0982', supplier: '上海管道供应有限公司', region: '上海', amount: 88000, dueDate: '2024-12-25', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0976', supplier: '温州门控系统厂', region: '浙江', amount: 62000, dueDate: '2024-12-05', overdueDays: 0, status: 'pending', priority: 'high', category: '到期7天内' },
    { id: 'BILL-2024-0970', supplier: '北京物流专业公司', region: '北京', amount: 38000, dueDate: '2024-12-03', overdueDays: 0, status: 'pending', priority: 'urgent', category: '到期即付' },
    { id: 'BILL-2024-0964', supplier: '宁波安全设备有限公司', region: '浙江', amount: 55000, dueDate: '2024-12-02', overdueDays: 0, status: 'pending', priority: 'urgent', category: '到期即付' },
    { id: 'BILL-2024-0958', supplier: '广州报关代理有限公司', region: '广东', amount: 28000, dueDate: '2024-12-01', overdueDays: 0, status: 'pending', priority: 'urgent', category: '到期即付' },
    { id: 'BILL-2024-0952', supplier: '杭州柜体五金厂', region: '浙江', amount: 42000, dueDate: '2024-11-25', overdueDays: 8, status: 'overdue', priority: 'urgent', category: '已逾期' },
    { id: 'BILL-2024-0946', supplier: '厦门货运代理有限公司', region: '福建', amount: 32000, dueDate: '2024-11-28', overdueDays: 5, status: 'overdue', priority: 'urgent', category: '已逾期' },
    { id: 'BILL-2024-0940', supplier: '广州精英五金有限公司', region: '广东', amount: 105000, dueDate: '2024-12-28', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0934', supplier: '深圳智能科技有限公司', region: '广东', amount: 72000, dueDate: '2024-12-22', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0928', supplier: '福建质量检验服务公司', region: '福建', amount: 35000, dueDate: '2024-12-12', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
    { id: 'BILL-2024-0922', supplier: '上海管道供应有限公司', region: '上海', amount: 68000, dueDate: '2024-11-20', overdueDays: 13, status: 'overdue', priority: 'urgent', category: '已逾期' },
    { id: 'BILL-2024-0916', supplier: '温州门控系统厂', region: '浙江', amount: 48000, dueDate: '2024-12-18', overdueDays: 0, status: 'pending', priority: 'normal', category: '未到期' },
  ];

  // 🔥 应收账款账龄分析
  const receivableAging = [
    { category: '未逾期', amount: 1568000, percentage: 55.1, count: 185, risk: 'low' },
    { category: '逾期1-30天', amount: 682000, percentage: 24.0, count: 78, risk: 'low' },
    { category: '逾期31-60天', amount: 398000, percentage: 14.0, count: 42, risk: 'medium' },
    { category: '逾期61-90天', amount: 142000, percentage: 5.0, count: 15, risk: 'high' },
    { category: '逾期90天以上', amount: 55000, percentage: 1.9, count: 6, risk: 'critical' },
  ];

  // 🔥 应付账款优先级分析
  const payablePriority = [
    { category: '未到期', amount: 924000, percentage: 55.0, count: 125, priority: 'normal' },
    { category: '到期7天内', amount: 420000, percentage: 25.0, count: 58, priority: 'medium' },
    { category: '到期即付', amount: 252000, percentage: 15.0, count: 35, priority: 'high' },
    { category: '已逾期', amount: 84000, percentage: 5.0, count: 12, priority: 'urgent' },
  ];

  // 🔥 月度回款趋势
  const monthlyCollection = [
    { month: '1月', plan: 950000, actual: 885000, completion: 93.2, overdue: 65000 },
    { month: '2月', plan: 1020000, actual: 965000, completion: 94.6, overdue: 55000 },
    { month: '3月', plan: 980000, actual: 925000, completion: 94.4, overdue: 55000 },
    { month: '4月', plan: 1085000, actual: 1025000, completion: 94.5, overdue: 60000 },
    { month: '5月', plan: 1050000, actual: 995000, completion: 94.8, overdue: 55000 },
    { month: '6月', plan: 1198000, actual: 1135000, completion: 94.7, overdue: 63000 },
    { month: '7月', plan: 1272000, actual: 1205000, completion: 94.7, overdue: 67000 },
    { month: '8月', plan: 1235000, actual: 1168000, completion: 94.6, overdue: 67000 },
    { month: '9月', plan: 1372000, actual: 1285000, completion: 93.7, overdue: 87000 },
    { month: '10月', plan: 1485000, actual: 1398000, completion: 94.1, overdue: 87000 },
    { month: '11月', plan: 1342000, actual: 1248000, completion: 93.0, overdue: 94000 },
    { month: '12月', plan: 1340000, actual: 0, completion: 0, overdue: 0 },
  ].filter(m => m.month !== '12月');

  // 🔥 月度付款趋势
  const monthlyPayment = [
    { month: '1月', plan: 685000, actual: 665000, completion: 97.1, overdue: 20000 },
    { month: '2月', plan: 728000, actual: 712000, completion: 97.8, overdue: 16000 },
    { month: '3月', plan: 705000, actual: 688000, completion: 97.6, overdue: 17000 },
    { month: '4月', plan: 782000, actual: 765000, completion: 97.8, overdue: 17000 },
    { month: '5月', plan: 758000, actual: 742000, completion: 97.9, overdue: 16000 },
    { month: '6月', plan: 864000, actual: 848000, completion: 98.1, overdue: 16000 },
    { month: '7月', plan: 918000, actual: 902000, completion: 98.3, overdue: 16000 },
    { month: '8月', plan: 891000, actual: 875000, completion: 98.2, overdue: 16000 },
    { month: '9月', plan: 990000, actual: 968000, completion: 97.8, overdue: 22000 },
    { month: '10月', plan: 1071000, actual: 1048000, completion: 97.9, overdue: 23000 },
    { month: '11月', plan: 968000, actual: 856000, completion: 88.4, overdue: 112000 },
  ];

  // 筛选后的应收账款
  const filteredReceivables = useMemo(() => {
    return receivableDetails.filter(item => {
      const matchRegion = selectedRegion === 'all' || item.region === selectedRegion;
      const matchType = selectedType === 'all' || 
        (selectedType === 'overdue' && item.status === 'overdue') ||
        (selectedType === 'pending' && item.status === 'pending');
      const matchSearch = searchTerm === '' || 
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchRegion && matchType && matchSearch;
    });
  }, [selectedRegion, selectedType, searchTerm]);

  // 筛选后的应付账款
  const filteredPayables = useMemo(() => {
    return payableDetails.filter(item => {
      const matchRegion = selectedRegion === 'all' || item.region === selectedRegion;
      const matchType = selectedType === 'all' || 
        (selectedType === 'urgent' && item.priority === 'urgent') ||
        (selectedType === 'overdue' && item.status === 'overdue');
      const matchSearch = searchTerm === '' || 
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchRegion && matchType && matchSearch;
    });
  }, [selectedRegion, selectedType, searchTerm]);

  // 图表颜色
  const AGING_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626'
  };

  const PRIORITY_COLORS = {
    normal: '#3B82F6',
    medium: '#F59E0B',
    high: '#EF4444',
    urgent: '#DC2626'
  };

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">财务管理中心</h2>
          <p className="text-sm text-gray-600 mt-1">应收应付账款管理与回款监控</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出账款报表
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 🔥 财务KPI卡片（8个核心指标） */}
      <div className="grid grid-cols-8 gap-3">
        {financeKPIs.map((kpi) => {
          const IconComponent = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={kpi.label} className={`bg-white border-2 rounded-lg p-3 hover:shadow-lg transition-all ${
              kpi.alert === 'urgent' ? 'border-red-300' :
              kpi.alert === 'warning' ? 'border-orange-300' :
              'border-gray-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.bgColor} w-8 h-8 rounded flex items-center justify-center`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${
                  (kpi.trend === 'up' && !kpi.label.includes('逾期')) || 
                  (kpi.trend === 'down' && (kpi.label.includes('逾期') || kpi.label.includes('周期')))
                  ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  <span className="font-semibold">{kpi.change}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1" title={kpi.description}>{kpi.label}</p>
              <p className="text-base font-bold text-gray-900">
                {kpi.unit === 'USD' ? `$${(kpi.value / 1000000).toFixed(2)}M` : 
                 kpi.unit === '%' ? `${kpi.value.toFixed(1)}%` :
                 kpi.unit === '天' ? `${kpi.value}天` :
                 kpi.value.toLocaleString()}
              </p>
              {kpi.alert && kpi.alert !== 'normal' && (
                <Badge className={`h-4 px-1.5 text-xs mt-1 ${
                  kpi.alert === 'urgent' ? 'bg-red-100 text-red-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {kpi.alert === 'urgent' ? '紧急' : '警告'}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔥 筛选器面板 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-xs font-semibold text-gray-700">筛选条件</span>
          </div>

          {/* 区域筛选 */}
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="h-8 w-[120px] text-xs border-gray-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部区域</SelectItem>
                <SelectItem value="北美" className="text-xs">北美</SelectItem>
                <SelectItem value="欧非" className="text-xs">欧非</SelectItem>
                <SelectItem value="南美" className="text-xs">南美</SelectItem>
                <SelectItem value="广东" className="text-xs">广东</SelectItem>
                <SelectItem value="浙江" className="text-xs">浙江</SelectItem>
                <SelectItem value="上海" className="text-xs">上海</SelectItem>
                <SelectItem value="福建" className="text-xs">福建</SelectItem>
                <SelectItem value="北京" className="text-xs">北京</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-8 w-[140px] text-xs border-gray-300 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部状态</SelectItem>
                <SelectItem value="pending" className="text-xs">待收款</SelectItem>
                <SelectItem value="overdue" className="text-xs">已逾期</SelectItem>
                <SelectItem value="urgent" className="text-xs">紧急付款</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[250px]">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="搜索客户、供应商、发票号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs border-gray-300"
              />
            </div>
          </div>

          {/* 清除筛选 */}
          {(selectedRegion !== 'all' || selectedType !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-xs text-gray-600 hover:text-gray-900"
              onClick={() => {
                setSelectedRegion('all');
                setSelectedType('all');
                setSearchTerm('');
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      </div>

      {/* 🔥 应收应付账款账龄 + 月度趋势 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 应收账款账龄 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                应收账款账龄
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">总计: $2.85M</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={receivableAging}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                fill="#8884d8"
                dataKey="amount"
                paddingAngle={2}
              >
                {receivableAging.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AGING_COLORS[entry.risk as keyof typeof AGING_COLORS]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {receivableAging.map((item) => (
              <div key={item.category} className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AGING_COLORS[item.risk as keyof typeof AGING_COLORS] }} />
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{item.count}笔</span>
                  <span className="font-semibold text-gray-900">${(item.amount / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 应付账款优先级 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-pink-600" />
                应付账款优先级
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">总计: $1.68M</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={payablePriority}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="#9CA3AF" angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Bar dataKey="amount" fill="#EC4899" radius={[4, 4, 0, 0]}>
                {payablePriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {payablePriority.map((item) => (
              <div key={item.category} className={`flex items-center justify-between py-1 px-2 rounded text-xs ${
                item.priority === 'urgent' ? 'bg-red-50' :
                item.priority === 'high' ? 'bg-orange-50' :
                'bg-gray-50'
              }`}>
                <span className="text-gray-700">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{item.count}笔</span>
                  <Badge className={`h-4 px-1.5 text-xs ${
                    item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                    item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    ${(item.amount / 1000).toFixed(0)}K
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 月度回款完成率 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-600" />
                回款完成率
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">月度完成情况</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={monthlyCollection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="plan" fill="#94A3B8" name="计划回款" />
              <Bar dataKey="actual" fill="#10B981" name="实际回款" />
              <Line type="monotone" dataKey="completion" stroke="#DC2626" strokeWidth={2} name="完成率%" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔥 应收账款明细表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              应收账款明细
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">显示 {filteredReceivables.length} 条记录</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-700">发票号</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">客户名称</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">区域</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">金额</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">到期日</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">账龄</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">状态</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">联系人</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">电话</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs font-mono text-gray-600">{item.id}</TableCell>
                  <TableCell className="text-xs font-semibold text-gray-900">{item.customer}</TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge variant="outline" className="h-5 px-2">📍 {item.region}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold text-gray-900">${item.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-center text-gray-700">{item.dueDate}</TableCell>
                  <TableCell className="text-xs text-center">
                    {item.overdueDays > 0 ? (
                      <Badge className="bg-red-100 text-red-700 h-5 px-2">逾期{item.overdueDays}天</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 h-5 px-2">未逾期</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className={`h-5 px-2 ${
                      item.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.status === 'overdue' ? '已逾期' : '待收款'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-700">{item.contact}</TableCell>
                  <TableCell className="text-xs text-gray-600">{item.phone}</TableCell>
                  <TableCell className="text-xs text-center">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      催收
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔥 应付账款明细表 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-pink-600" />
              应付账款明细
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">显示 {filteredPayables.length} 条记录</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold text-gray-700">账单号</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700">供应商名称</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">区域</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-right">金额</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">到期日</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">状态</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">优先级</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayables.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell className="text-xs font-mono text-gray-600">{item.id}</TableCell>
                  <TableCell className="text-xs font-semibold text-gray-900">{item.supplier}</TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge variant="outline" className="h-5 px-2">📍 {item.region}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold text-gray-900">${item.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-center text-gray-700">{item.dueDate}</TableCell>
                  <TableCell className="text-xs text-center">
                    {item.overdueDays > 0 ? (
                      <Badge className="bg-red-100 text-red-700 h-5 px-2">逾期{item.overdueDays}天</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 h-5 px-2">{item.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className={`h-5 px-2 ${
                      item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.priority === 'urgent' ? '紧急' : item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '普通'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-6 px-2 text-xs ${item.priority === 'urgent' ? 'text-red-600 hover:text-red-700' : ''}`}
                    >
                      {item.priority === 'urgent' ? '立即付款' : '查看'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
