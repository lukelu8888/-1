import React, { useState, useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Package, Users, MapPin, Target,
  Filter, Download, Calendar, RefreshCw, Star, Award, Briefcase,
  ShoppingCart, Heart, Clock, CheckCircle, AlertTriangle, Percent,
  Building, TrendingUp as TrendUp, Activity, Globe, Eye, FileText,
  ArrowDownRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface RegionalAnalyticsProps {
  canViewSensitive: boolean;
  userRole: 'Sales_Manager' | 'Sales_Rep';
  userRegion: string;
  userId?: string;
}

// 📊 区域KPI数据
interface RegionalKPI {
  label: string;
  value: number;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
  target?: number;
  completion?: number;
}

export default function RegionalAnalytics({ canViewSensitive, userRole, userRegion, userId }: RegionalAnalyticsProps) {
  // 区域配置 - 必须在所有状态之前定义
  const regionConfig: Record<string, { name: string; icon: string; countries: string[] }> = {
    'NA': { name: '北美市场', icon: '🇺🇸', countries: ['美国', '加拿大', '墨西哥'] },
    'EA': { name: '欧非市场', icon: '🇪🇺', countries: ['德国', '英国', '法国', '西班牙', '南非'] },
    'SA': { name: '南美市场', icon: '🇧🇷', countries: ['巴西', '阿根廷', '智利', '哥伦比亚'] },
    'all': { name: '全球市场', icon: '🌐', countries: [] }
  };

  // 确保 currentRegion 永远不会是 undefined
  const currentRegion = regionConfig[userRegion] || regionConfig['all'];
  const isManager = userRole === 'Sales_Manager';
  
  // 筛选器状态
  const [timeRange, setTimeRange] = useState('year');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSalesRep, setSelectedSalesRep] = useState<string>(userRole === 'Sales_Rep' ? (userId || 'self') : 'all');

  // 🔥 原始数据（未经筛选）
  const baseManagerKPIs: RegionalKPI[] = [
    {
      label: '区域总营收',
      value: 5680000,
      unit: 'USD',
      change: '+28.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      description: '区域所有订单总营收',
      target: 6500000,
      completion: 87.4
    },
    {
      label: '区域订单数',
      value: 542,
      unit: '',
      change: '+24.2%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      description: '区域总订单数量',
      target: 600,
      completion: 90.3
    },
    {
      label: '活跃客户',
      value: 156,
      unit: '',
      change: '+18.5%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      description: '活跃客户总数',
      target: 180,
      completion: 86.7
    },
    {
      label: '新增客户',
      value: 28,
      unit: '',
      change: '+22.4%',
      trend: 'up',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '本期新增客户',
      target: 35,
      completion: 80.0
    },
    {
      label: '平均订单额',
      value: 10480,
      unit: 'USD',
      change: '+5.8%',
      trend: 'up',
      icon: TrendUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600',
      description: '平均每单金额',
      target: 11000,
      completion: 95.3
    },
    {
      label: '客户满意度',
      value: 4.8,
      unit: '/5',
      change: '+0.3',
      trend: 'up',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-600',
      description: '客户平均评分',
      target: 4.9,
      completion: 98.0
    },
    {
      label: '询价转化率',
      value: 68.5,
      unit: '%',
      change: '+4.2%',
      trend: 'up',
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-600',
      description: '询价到订单转化',
      target: 70,
      completion: 97.9
    },
    {
      label: '市场份额',
      value: 22.8,
      unit: '%',
      change: '+3.5%',
      trend: 'up',
      icon: Globe,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-600',
      description: '区域市场占有率',
      target: 25,
      completion: 91.2
    },
    {
      label: '团队人数',
      value: 28,
      unit: '',
      change: '+12.0%',
      trend: 'up',
      icon: Building,
      color: 'text-teal-600',
      bgColor: 'bg-teal-600',
      description: '销售团队人数',
      target: 30,
      completion: 93.3
    },
    {
      label: '人均营收',
      value: 202857,
      unit: 'USD',
      change: '+14.7%',
      trend: 'up',
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-600',
      description: '每人平均营收',
      target: 210000,
      completion: 96.6
    },
  ];

  // 🔥 业务员KPI（8个核心指标）
  const salesRepKPIs: RegionalKPI[] = [
    {
      label: '个人营收',
      value: 285000,
      unit: 'USD',
      change: '+32.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-600',
      description: '个人总营收',
      target: 320000,
      completion: 89.1
    },
    {
      label: '成交订单',
      value: 42,
      unit: '',
      change: '+28.2%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      description: '已成交订单数',
      target: 48,
      completion: 87.5
    },
    {
      label: '我的客户',
      value: 18,
      unit: '',
      change: '+20.0%',
      trend: 'up',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      description: '负责客户总数',
      target: 22,
      completion: 81.8
    },
    {
      label: '新开发客户',
      value: 5,
      unit: '',
      change: '+25.0%',
      trend: 'up',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      description: '新开发客户数',
      target: 6,
      completion: 83.3
    },
    {
      label: '平均订单额',
      value: 6786,
      unit: 'USD',
      change: '+3.4%',
      trend: 'up',
      icon: TrendUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-600',
      description: '平均单笔订单',
      target: 7000,
      completion: 96.9
    },
    {
      label: '客户满意度',
      value: 4.9,
      unit: '/5',
      change: '+0.2',
      trend: 'up',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-600',
      description: '客户评分',
      target: 4.9,
      completion: 100.0
    },
    {
      label: '转化率',
      value: 72.5,
      unit: '%',
      change: '+5.8%',
      trend: 'up',
      icon: Target,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-600',
      description: '询价转化率',
      target: 75,
      completion: 96.7
    },
    {
      label: '业绩完成率',
      value: 89.1,
      unit: '%',
      change: '+8.5%',
      trend: 'up',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'bg-teal-600',
      description: '目标达成率',
      target: 100,
      completion: 89.1
    },
  ];

  const displayKPIs = isManager ? baseManagerKPIs : salesRepKPIs;

  // 🔥 业务员排名（区域主管可见）
  const salesRepRanking = [
    { id: 'john', name: 'John Smith', revenue: 385000, orders: 58, customers: 22, newCustomers: 8, avgOrderValue: 6638, satisfaction: 4.9, conversion: 75.2, target: 420000, completion: 91.7 },
    { id: 'maria', name: 'Maria Garcia', revenue: 352000, orders: 52, customers: 20, newCustomers: 7, avgOrderValue: 6769, satisfaction: 4.8, conversion: 71.8, target: 380000, completion: 92.6 },
    { id: 'robert', name: 'Robert Johnson', revenue: 318000, orders: 48, customers: 18, newCustomers: 6, avgOrderValue: 6625, satisfaction: 4.7, conversion: 68.5, target: 350000, completion: 90.9 },
    { id: 'lisa', name: 'Lisa Anderson', revenue: 285000, orders: 42, customers: 18, newCustomers: 5, avgOrderValue: 6786, satisfaction: 4.9, conversion: 72.5, target: 320000, completion: 89.1 },
    { id: 'david', name: 'David Wilson', revenue: 268000, orders: 39, customers: 16, newCustomers: 4, avgOrderValue: 6872, satisfaction: 4.6, conversion: 65.2, target: 310000, completion: 86.5 },
  ];

  // 🔥 国家市场分析
  const countryPerformance = [
    { country: '美国', revenue: 3280000, orders: 325, customers: 95, growth: 32.5, marketShare: 25.8, avgOrderValue: 10092, satisfaction: 4.9 },
    { country: '加拿大', revenue: 1685000, orders: 148, customers: 42, growth: 28.2, marketShare: 18.5, avgOrderValue: 11385, satisfaction: 4.8 },
    { country: '墨西哥', revenue: 715000, orders: 69, customers: 19, growth: 18.5, marketShare: 12.2, avgOrderValue: 10362, satisfaction: 4.7 },
  ];

  // 🔥 业务类型分析
  const businessTypeAnalysis = [
    { type: 'trading', name: '直接采购', icon: '🛒', revenue: 2580000, orders: 285, percentage: 45.4, avgValue: 9053, growth: 28.5, profitMargin: 32.5 },
    { type: 'inspection', name: '验货服务', icon: '🔍', revenue: 852000, orders: 195, percentage: 15.0, avgValue: 4369, growth: 35.2, profitMargin: 45.8 },
    { type: 'agency', name: '代理服务', icon: '🤝', revenue: 1476000, orders: 42, percentage: 26.0, avgValue: 35143, growth: 22.8, profitMargin: 22.4 },
    { type: 'project', name: '一站式项目', icon: '🌟', revenue: 772000, orders: 20, percentage: 13.6, avgValue: 38600, growth: 42.5, profitMargin: 28.6 },
  ];

  // 🔥🔥🔥 二维交叉数据表（国家×业务类型）- 确保数据一致性
  const crossData = {
    '美国': {
      'trading': { orders: 171, revenue: 1538000 },
      'inspection': { orders: 117, revenue: 511000 },
      'agency': { orders: 25, revenue: 878000 },
      'project': { orders: 12, revenue: 353000 }
    },
    '加拿大': {
      'trading': { orders: 78, revenue: 735000 },
      'inspection': { orders: 53, revenue: 231000 },
      'agency': { orders: 11, revenue: 401000 },
      'project': { orders: 6, revenue: 318000 }
    },
    '墨西哥': {
      'trading': { orders: 36, revenue: 307000 },
      'inspection': { orders: 25, revenue: 110000 },
      'agency': { orders: 6, revenue: 197000 },
      'project': { orders: 2, revenue: 101000 }
    }
  };

  // 🔥🔥🔥 客户细分交叉数据表（客户层级×国家×业务类型）
  // 大客户150订单，中型客户200订单，小客户192订单，总计542订单
  const customerCrossData: Record<string, Record<string, Record<string, { count: number; revenue: number; orders: number }>>> = {
    '大客户': {
      '美国': {
        'trading': { count: 5, revenue: 770000, orders: 48 },
        'inspection': { count: 3, revenue: 255000, orders: 30 },
        'agency': { count: 4, revenue: 439000, orders: 18 },
        'project': { count: 3, revenue: 176000, orders: 8 }
      },
      '加拿大': {
        'trading': { count: 3, revenue: 368000, orders: 22 },
        'inspection': { count: 2, revenue: 116000, orders: 14 },
        'agency': { count: 2, revenue: 201000, orders: 8 },
        'project': { count: 2, revenue: 159000, orders: 4 }
      },
      '墨西哥': {
        'trading': { count: 2, revenue: 154000, orders: 10 },
        'inspection': { count: 1, revenue: 55000, orders: 6 },
        'agency': { count: 1, revenue: 99000, orders: 4 },
        'project': { count: 1, revenue: 51000, orders: 2 }
      }
    },
    '中型客户': {
      '美国': {
        'trading': { count: 12, revenue: 461000, orders: 65 },
        'inspection': { count: 8, revenue: 153000, orders: 45 },
        'agency': { count: 6, revenue: 263000, orders: 12 },
        'project': { count: 4, revenue: 106000, orders: 6 }
      },
      '加拿大': {
        'trading': { count: 8, revenue: 220000, orders: 30 },
        'inspection': { count: 5, revenue: 69000, orders: 21 },
        'agency': { count: 4, revenue: 120000, orders: 6 },
        'project': { count: 2, revenue: 95000, orders: 3 }
      },
      '墨西哥': {
        'trading': { count: 4, revenue: 92000, orders: 13 },
        'inspection': { count: 2, revenue: 33000, orders: 10 },
        'agency': { count: 2, revenue: 59000, orders: 3 },
        'project': { count: 1, revenue: 30000, orders: 2 }
      }
    },
    '小客户': {
      '美国': {
        'trading': { count: 28, revenue: 307000, orders: 58 },
        'inspection': { count: 20, revenue: 103000, orders: 42 },
        'agency': { count: 8, revenue: 176000, orders: 10 },
        'project': { count: 5, revenue: 71000, orders: 4 }
      },
      '加拿大': {
        'trading': { count: 18, revenue: 147000, orders: 26 },
        'inspection': { count: 12, revenue: 46000, orders: 18 },
        'agency': { count: 5, revenue: 80000, orders: 4 },
        'project': { count: 3, revenue: 64000, orders: 2 }
      },
      '墨西哥': {
        'trading': { count: 10, revenue: 61000, orders: 13 },
        'inspection': { count: 6, revenue: 22000, orders: 9 },
        'agency': { count: 3, revenue: 39000, orders: 2 },
        'project': { count: 2, revenue: 20000, orders: 1 }
      }
    }
  };

  // 🔥🔥🔥 产品类别交叉数据表（产品类别×国家×业务类型）
  // 门窗五金165订单，电气组件128订单，卫浴配件102订单，劳保用品95订单，柜体五金52订单，总计542订单
  const productCrossData: Record<string, Record<string, Record<string, { orders: number; revenue: number }>>> = {
    '门窗五金': {
      '美国': {
        'trading': { orders: 52, revenue: 466000 },
        'inspection': { orders: 35, revenue: 153000 },
        'agency': { orders: 8, revenue: 263000 },
        'project': { orders: 4, revenue: 106000 }
      },
      '加拿大': {
        'trading': { orders: 24, revenue: 223000 },
        'inspection': { orders: 16, revenue: 69000 },
        'agency': { orders: 4, revenue: 120000 },
        'project': { orders: 2, revenue: 95000 }
      },
      '墨西哥': {
        'trading': { orders: 11, revenue: 93000 },
        'inspection': { orders: 7, revenue: 33000 },
        'agency': { orders: 2, revenue: 59000 },
        'project': { orders: 1, revenue: 30000 }
      }
    },
    '电气组件': {
      '美国': {
        'trading': { orders: 41, revenue: 374000 },
        'inspection': { orders: 28, revenue: 122000 },
        'agency': { orders: 6, revenue: 211000 },
        'project': { orders: 3, revenue: 85000 }
      },
      '加拿大': {
        'trading': { orders: 19, revenue: 178000 },
        'inspection': { orders: 13, revenue: 55000 },
        'agency': { orders: 3, revenue: 96000 },
        'project': { orders: 1, revenue: 76000 }
      },
      '墨西哥': {
        'trading': { orders: 8, revenue: 74000 },
        'inspection': { orders: 6, revenue: 26000 },
        'agency': { orders: 1, revenue: 47000 },
        'project': { orders: 1, revenue: 24000 }
      }
    },
    '卫浴配': {
      '美国': {
        'trading': { orders: 33, revenue: 321000 },
        'inspection': { orders: 23, revenue: 102000 },
        'agency': { orders: 5, revenue: 175000 },
        'project': { orders: 2, revenue: 71000 }
      },
      '加拿大': {
        'trading': { orders: 15, revenue: 153000 },
        'inspection': { orders: 11, revenue: 46000 },
        'agency': { orders: 2, revenue: 80000 },
        'project': { orders: 1, revenue: 64000 }
      },
      '墨西哥': {
        'trading': { orders: 7, revenue: 64000 },
        'inspection': { orders: 5, revenue: 22000 },
        'agency': { orders: 1, revenue: 39000 },
        'project': { orders: 0, revenue: 20000 }
      }
    },
    '劳保用品': {
      '美国': {
        'trading': { orders: 28, revenue: 298000 },
        'inspection': { orders: 20, revenue: 82000 },
        'agency': { orders: 4, revenue: 140000 },
        'project': { orders: 2, revenue: 57000 }
      },
      '加拿大': {
        'trading': { orders: 13, revenue: 142000 },
        'inspection': { orders: 9, revenue: 37000 },
        'agency': { orders: 2, revenue: 64000 },
        'project': { orders: 1, revenue: 51000 }
      },
      '墨西哥': {
        'trading': { orders: 6, revenue: 60000 },
        'inspection': { orders: 4, revenue: 18000 },
        'agency': { orders: 0, revenue: 31000 },
        'project': { orders: 0, revenue: 16000 }
      }
    },
    '柜体五金': {
      '美国': {
        'trading': { orders: 17, revenue: 190000 },
        'inspection': { orders: 11, revenue: 52000 },
        'agency': { orders: 2, revenue: 89000 },
        'project': { orders: 1, revenue: 34000 }
      },
      '加拿大': {
        'trading': { orders: 7, revenue: 90000 },
        'inspection': { orders: 4, revenue: 24000 },
        'agency': { orders: 0, revenue: 41000 },
        'project': { orders: 1, revenue: 32000 }
      },
      '墨西哥': {
        'trading': { orders: 4, revenue: 39000 },
        'inspection': { orders: 3, revenue: 11000 },
        'agency': { orders: 2, revenue: 21000 },
        'project': { orders: 0, revenue: 10000 }
      }
    }
  };

  // 🔥🔥🔥 业务员交叉数据表（业务员×国家×业务类型）
  // John: 58订单, Maria: 52订单, Robert: 48订单, Lisa: 42订单, David: 39订单
  const salesRepCrossData: Record<string, Record<string, Record<string, { orders: number; revenue: number }>>> = {
    'john': {
      '美国': {
        'trading': { orders: 20, revenue: 150000 },
        'inspection': { orders: 14, revenue: 60000 },
        'agency': { orders: 3, revenue: 105000 },
        'project': { orders: 2, revenue: 42000 }
      },
      '加拿大': {
        'trading': { orders: 10, revenue: 72000 },
        'inspection': { orders: 6, revenue: 27000 },
        'agency': { orders: 1, revenue: 48000 },
        'project': { orders: 1, revenue: 38000 }
      },
      '墨西哥': {
        'trading': { orders: 4, revenue: 30000 },
        'inspection': { orders: 3, revenue: 13000 },
        'agency': { orders: 1, revenue: 23000 },
        'project': { orders: 0, revenue: 12000 }
      }
    },
    'maria': {
      '美国': {
        'trading': { orders: 18, revenue: 138000 },
        'inspection': { orders: 13, revenue: 55000 },
        'agency': { orders: 3, revenue: 96000 },
        'project': { orders: 2, revenue: 38000 }
      },
      '加拿大': {
        'trading': { orders: 9, revenue: 66000 },
        'inspection': { orders: 6, revenue: 25000 },
        'agency': { orders: 1, revenue: 44000 },
        'project': { orders: 0, revenue: 35000 }
      },
      '墨西哥': {
        'trading': { orders: 4, revenue: 27000 },
        'inspection': { orders: 2, revenue: 12000 },
        'agency': { orders: 1, revenue: 21000 },
        'project': { orders: 1, revenue: 11000 }
      }
    },
    'robert': {
      '美国': {
        'trading': { orders: 17, revenue: 126000 },
        'inspection': { orders: 12, revenue: 51000 },
        'agency': { orders: 2, revenue: 88000 },
        'project': { orders: 1, revenue: 35000 }
      },
      '加拿大': {
        'trading': { orders: 8, revenue: 60000 },
        'inspection': { orders: 5, revenue: 23000 },
        'agency': { orders: 1, revenue: 40000 },
        'project': { orders: 1, revenue: 32000 }
      },
      '墨西哥': {
        'trading': { orders: 3, revenue: 25000 },
        'inspection': { orders: 2, revenue: 11000 },
        'agency': { orders: 1, revenue: 19000 },
        'project': { orders: 0, revenue: 10000 }
      }
    },
    'lisa': {
      '美国': {
        'trading': { orders: 15, revenue: 114000 },
        'inspection': { orders: 11, revenue: 46000 },
        'agency': { orders: 2, revenue: 79000 },
        'project': { orders: 1, revenue: 32000 }
      },
      '加拿大': {
        'trading': { orders: 7, revenue: 54000 },
        'inspection': { orders: 5, revenue: 21000 },
        'agency': { orders: 0, revenue: 36000 },
        'project': { orders: 1, revenue: 29000 }
      },
      '墨西哥': {
        'trading': { orders: 3, revenue: 23000 },
        'inspection': { orders: 2, revenue: 10000 },
        'agency': { orders: 1, revenue: 17000 },
        'project': { orders: 0, revenue: 9000 }
      }
    },
    'david': {
      '美国': {
        'trading': { orders: 14, revenue: 108000 },
        'inspection': { orders: 10, revenue: 43000 },
        'agency': { orders: 1, revenue: 74000 },
        'project': { orders: 1, revenue: 30000 }
      },
      '加拿大': {
        'trading': { orders: 7, revenue: 51000 },
        'inspection': { orders: 4, revenue: 19000 },
        'agency': { orders: 1, revenue: 34000 },
        'project': { orders: 0, revenue: 27000 }
      },
      '墨西哥': {
        'trading': { orders: 3, revenue: 21000 },
        'inspection': { orders: 2, revenue: 9000 },
        'agency': { orders: 1, revenue: 16000 },
        'project': { orders: 0, revenue: 8000 }
      }
    }
  };

  // 🔥🔥🔥 月度交叉数据表（月份×国家）
  const monthlyCrossData: Record<string, Record<string, { revenue: number; orders: number; newCustomers: number }>> = {
    '1月': {
      '美国': { revenue: 246000, orders: 24, newCustomers: 1 },
      '加拿大': { revenue: 126000, orders: 12, newCustomers: 1 },
      '墨西哥': { revenue: 53000, orders: 6, newCustomers: 0 }
    },
    '2月': {
      '美国': { revenue: 265000, orders: 26, newCustomers: 2 },
      '加拿大': { revenue: 136000, orders: 13, newCustomers: 1 },
      '墨西哥': { revenue: 57000, orders: 6, newCustomers: 0 }
    },
    '3月': {
      '美国': { revenue: 256000, orders: 25, newCustomers: 1 },
      '加拿大': { revenue: 131000, orders: 12, newCustomers: 1 },
      '墨西哥': { revenue: 55000, orders: 6, newCustomers: 0 }
    },
    '4月': {
      '美国': { revenue: 284000, orders: 28, newCustomers: 2 },
      '加拿大': { revenue: 146000, orders: 14, newCustomers: 1 },
      '墨西哥': { revenue: 62000, orders: 6, newCustomers: 0 }
    },
    '5月': {
      '美国': { revenue: 276000, orders: 27, newCustomers: 1 },
      '加拿大': { revenue: 142000, orders: 13, newCustomers: 1 },
      '墨西哥': { revenue: 60000, orders: 6, newCustomers: 0 }
    },
    '6月': {
      '美国': { revenue: 315000, orders: 31, newCustomers: 2 },
      '加拿大': { revenue: 162000, orders: 15, newCustomers: 1 },
      '墨西哥': { revenue: 68000, orders: 7, newCustomers: 1 }
    },
    '7月': {
      '美国': { revenue: 334000, orders: 32, newCustomers: 2 },
      '加拿大': { revenue: 172000, orders: 17, newCustomers: 1 },
      '墨西哥': { revenue: 72000, orders: 7, newCustomers: 0 }
    },
    '8月': {
      '美国': { revenue: 325000, orders: 31, newCustomers: 2 },
      '加拿大': { revenue: 167000, orders: 16, newCustomers: 1 },
      '墨西哥': { revenue: 70000, orders: 7, newCustomers: 0 }
    },
    '9月': {
      '美国': { revenue: 361000, orders: 35, newCustomers: 2 },
      '加拿大': { revenue: 186000, orders: 17, newCustomers: 1 },
      '墨西哥': { revenue: 78000, orders: 8, newCustomers: 1 }
    },
    '10月': {
      '美国': { revenue: 390000, orders: 38, newCustomers: 3 },
      '加拿大': { revenue: 200000, orders: 19, newCustomers: 1 },
      '墨西哥': { revenue: 85000, orders: 8, newCustomers: 1 }
    }
  };

  // 🔥 客户类型分析
  const customerSegmentation = [
    { segment: '大客户', count: 15, revenue: 2840000, percentage: 50.0, avgOrderValue: 18933, orders: 150, satisfaction: 4.9, retention: 98.5 },
    { segment: '中型客户', count: 42, revenue: 1704000, percentage: 30.0, avgOrderValue: 8520, orders: 200, satisfaction: 4.8, retention: 95.2 },
    { segment: '小客户', count: 99, revenue: 1136000, percentage: 20.0, avgOrderValue: 5917, orders: 192, satisfaction: 4.7, retention: 88.5 },
  ];

  // 🔥 月度趋势
  const monthlyTrend = [
    { month: '1月', revenue: 425000, orders: 42, customers: 12, newCustomers: 2, inquiries: 68, conversion: 61.8 },
    { month: '2月', revenue: 458000, orders: 45, customers: 13, newCustomers: 3, inquiries: 72, conversion: 62.5 },
    { month: '3月', revenue: 442000, orders: 43, customers: 12, newCustomers: 2, inquiries: 70, conversion: 61.4 },
    { month: '4月', revenue: 492000, orders: 48, customers: 14, newCustomers: 3, inquiries: 76, conversion: 63.2 },
    { month: '5月', revenue: 478000, orders: 46, customers: 13, newCustomers: 2, inquiries: 74, conversion: 62.2 },
    { month: '6月', revenue: 545000, orders: 53, customers: 15, newCustomers: 4, inquiries: 82, conversion: 64.6 },
    { month: '7月', revenue: 578000, orders: 56, customers: 16, newCustomers: 3, inquiries: 86, conversion: 65.1 },
    { month: '8月', revenue: 562000, orders: 54, customers: 15, newCustomers: 3, inquiries: 84, conversion: 64.3 },
    { month: '9月', revenue: 625000, orders: 60, customers: 17, newCustomers: 4, inquiries: 92, conversion: 65.2 },
    { month: '10月', revenue: 675000, orders: 65, customers: 18, newCustomers: 5, inquiries: 98, conversion: 66.3 },
  ];

  // 🔥 产品类别表现
  const productPerformance = [
    { category: '门窗五金', revenue: 1420000, orders: 165, growth: 32.5, margin: 35.2, satisfaction: 4.9 },
    { category: '电气组件', revenue: 1136000, orders: 128, growth: 28.8, margin: 32.8, satisfaction: 4.8 },
    { category: '卫浴配', revenue: 965000, orders: 102, growth: 24.2, margin: 30.5, satisfaction: 4.7 },
    { category: '劳保用品', revenue: 852000, orders: 95, growth: 18.5, margin: 28.2, satisfaction: 4.8 },
    { category: '柜体五金', revenue: 625000, orders: 52, growth: 22.8, margin: 31.5, satisfaction: 4.7 },
  ];

  // 🔥 销售漏斗
  const salesFunnel = [
    { stage: '询价', count: 850, amount: 12750000, conversionRate: 100 },
    { stage: '报价', count: 582, amount: 8730000, conversionRate: 68.5 },
    { stage: '谈判', count: 428, amount: 6420000, conversionRate: 73.5 },
    { stage: '成交', count: 312, amount: 4680000, conversionRate: 72.9 },
  ];

  // 图表颜色
  const COLORS = ['#DC2626', '#EA580C', '#D97706', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  // 🔥🔥🔥 数据联动：根据筛选条件动态计算KPI数据
  const filteredKPIs = useMemo(() => {
    // 基础数据系数（根据时间范围）
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,  // Q3约占全年35%
      'q4': 0.40,  // Q4约占全年40%
      'ytd': 0.83, // 本年至今约83%
      'year': 1.0  // 全年100%
    };

    // 业务类型系数
    const businessTypeMultipliers: Record<string, number> = {
      'all': 1.0,
      'trading': 0.454,    // 直接采购占45.4%
      'inspection': 0.150, // 验货服务占15.0%
      'agency': 0.260,     // 代理服务占26.0%
      'project': 0.136     // 一站式项目占13.6%
    };

    // 国家系数（以北美为例）
    const countryMultipliers: Record<string, number> = {
      'all': 1.0,
      '美国': 0.578,    // 美国占57.8%
      '加拿大': 0.297,  // 加拿大占29.7%
      '墨西哥': 0.125   // 墨西哥占12.5%
    };

    const timeFactor = timeMultipliers[timeRange] || 1.0;
    const businessFactor = businessTypeMultipliers[selectedBusinessType] || 1.0;
    const countryFactor = countryMultipliers[selectedCountry] || 1.0;
    
    // 综合系数
    const overallFactor = timeFactor * businessFactor * countryFactor;

    // 对KPI数据应用系数
    return displayKPIs.map(kpi => ({
      ...kpi,
      value: kpi.unit === 'USD' || kpi.unit === '' || kpi.unit === '%' 
        ? Math.round(kpi.value * overallFactor * 100) / 100
        : kpi.value, // 满意度等评分类指标不变
      completion: kpi.completion ? Math.min(100, kpi.completion * (0.9 + overallFactor * 0.1)) : kpi.completion
    }));
  }, [timeRange, selectedBusinessType, selectedCountry, displayKPIs]);

  // 🔥🔥🔥 数据联动：筛选后的国家数据（使用交叉表）
  const filteredCountryData = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    
    const factor = timeMultipliers[timeRange];
    
    // 根据业务类型筛选计算每个国家的数据
    let data = countryPerformance.map(country => {
      let orders = 0;
      let revenue = 0;
      
      const countryData = crossData[country.country];
      
      if (selectedBusinessType === 'all') {
        // 全部业务类型：汇总该国家所有业务类型
        Object.values(countryData).forEach(business => {
          orders += business.orders;
          revenue += business.revenue;
        });
      } else {
        // 特定业务类型：只取该业务类型的数据
        orders = countryData[selectedBusinessType].orders;
        revenue = countryData[selectedBusinessType].revenue;
      }
      
      return {
        ...country,
        orders: Math.round(orders * factor),
        revenue: Math.round(revenue * factor),
        customers: Math.round(country.customers * factor),
        avgOrderValue: orders > 0 ? Math.round((revenue / orders) * factor) : 0
      };
    });
    
    // 如果选择了特定国家，只显示该国家
    if (selectedCountry !== 'all') {
      data = data.filter(c => c.country === selectedCountry);
    }
    
    return data;
  }, [selectedCountry, timeRange, selectedBusinessType]);

  // 🔥🔥🔥 数据联动：筛选后的业务类型数据（使用交叉表）
  const filteredBusinessData = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    
    const factor = timeMultipliers[timeRange];
    
    // 根据国家筛选计算每种业务类型的数据
    let data = businessTypeAnalysis.map(business => {
      let orders = 0;
      let revenue = 0;
      
      if (selectedCountry === 'all') {
        // 全部国家：汇总所有国家该业务类型的数据
        Object.values(crossData).forEach(countryData => {
          const businessData = countryData[business.type];
          orders += businessData.orders;
          revenue += businessData.revenue;
        });
      } else {
        // 特定国家：只取该国家的数据
        const businessData = crossData[selectedCountry][business.type];
        orders = businessData.orders;
        revenue = businessData.revenue;
      }
      
      return {
        ...business,
        orders: Math.round(orders * factor),
        revenue: Math.round(revenue * factor),
        avgValue: orders > 0 ? Math.round((revenue / orders)) : 0
      };
    });
    
    // 如果选择了特定业务类型，只显示该业务类型
    if (selectedBusinessType !== 'all') {
      data = data.filter(b => b.type === selectedBusinessType);
    }
    
    return data;
  }, [selectedBusinessType, timeRange, selectedCountry]);

  // 🔥🔥🔥 数据联动：筛选后的月度趋势（使用交叉表）
  const filteredMonthlyTrend = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    const businessTypeMultipliers: Record<string, number> = {
      'all': 1.0,
      'trading': 0.454,
      'inspection': 0.150,
      'agency': 0.260,
      'project': 0.136
    };
    
    const factor = timeMultipliers[timeRange] * businessTypeMultipliers[selectedBusinessType];
    
    return monthlyTrend.map(month => {
      let revenue = 0;
      let orders = 0;
      let newCustomers = 0;
      
      const monthData = monthlyCrossData[month.month];
      
      // 根据国家筛选
      const countriesToInclude = selectedCountry === 'all' ? ['美国', '加拿大', '墨西哥'] : [selectedCountry];
      
      countriesToInclude.forEach(country => {
        const data = monthData[country];
        revenue += data.revenue;
        orders += data.orders;
        newCustomers += data.newCustomers;
      });
      
      return {
        ...month,
        revenue: Math.round(revenue * factor),
        orders: Math.round(orders * factor),
        newCustomers: Math.max(1, Math.round(newCustomers * factor))
      };
    });
  }, [timeRange, selectedBusinessType, selectedCountry]);

  // 🔥🔥🔥 数据联动：筛选后的销售漏斗
  const filteredSalesFunnel = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    const businessTypeMultipliers: Record<string, number> = {
      'all': 1.0,
      'trading': 0.454,
      'inspection': 0.150,
      'agency': 0.260,
      'project': 0.136
    };
    
    const factor = timeMultipliers[timeRange] * businessTypeMultipliers[selectedBusinessType];
    
    return salesFunnel.map(stage => ({
      ...stage,
      count: Math.round(stage.count * factor),
      amount: Math.round(stage.amount * factor)
    }));
  }, [timeRange, selectedBusinessType]);

  // 🔥🔥🔥 数据联动：筛选后的业务员排名（使用交叉表）
  const filteredSalesRepRanking = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    
    const factor = timeMultipliers[timeRange];
    
    // 如果选择了特定业务员，只显示该业务员
    let filteredReps = selectedSalesRep === 'all' ? salesRepRanking : salesRepRanking.filter(rep => rep.id === selectedSalesRep);
    
    return filteredReps.map(rep => {
      let revenue = 0;
      let orders = 0;
      
      const repData = salesRepCrossData[rep.id];
      
      // 根据国家和业务类型筛选
      const countriesToInclude = selectedCountry === 'all' ? ['美国', '加拿大', '墨西哥'] : [selectedCountry];
      const businessTypesToInclude = selectedBusinessType === 'all' ? ['trading', 'inspection', 'agency', 'project'] : [selectedBusinessType];
      
      countriesToInclude.forEach(country => {
        businessTypesToInclude.forEach(businessType => {
          const data = repData[country][businessType];
          revenue += data.revenue;
          orders += data.orders;
        });
      });
      
      return {
        ...rep,
        revenue: Math.round(revenue * factor),
        orders: Math.round(orders * factor),
        customers: Math.round(rep.customers * factor),
        newCustomers: Math.max(1, Math.round(rep.newCustomers * factor)),
        avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
        target: Math.round(rep.target * factor)
      };
    });
  }, [timeRange, selectedBusinessType, selectedCountry, selectedSalesRep]);

  // 🔥🔥🔥 数据联动：筛选后的客户细分（使用交叉表）
  const filteredCustomerSegmentation = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    
    const factor = timeMultipliers[timeRange];
    
    return customerSegmentation.map(segment => {
      let count = 0;
      let revenue = 0;
      let orders = 0;
      
      const segmentData = customerCrossData[segment.segment];
      
      // 根据国家和业务类型筛选
      const countriesToInclude = selectedCountry === 'all' ? ['美国', '加拿大', '墨西哥'] : [selectedCountry];
      const businessTypesToInclude = selectedBusinessType === 'all' ? ['trading', 'inspection', 'agency', 'project'] : [selectedBusinessType];
      
      countriesToInclude.forEach(country => {
        businessTypesToInclude.forEach(businessType => {
          const data = segmentData[country][businessType];
          count += data.count;
          revenue += data.revenue;
          orders += data.orders;
        });
      });
      
      return {
        ...segment,
        count: Math.max(1, Math.round(count * factor)),
        revenue: Math.round(revenue * factor),
        orders: Math.round(orders * factor),
        avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0
      };
    });
  }, [timeRange, selectedBusinessType, selectedCountry]);

  // 🔥🔥🔥 数据联动：筛选后的产品表现（使用交叉表）
  const filteredProductPerformance = useMemo(() => {
    const timeMultipliers: Record<string, number> = {
      'q3': 0.35,
      'q4': 0.40,
      'ytd': 0.83,
      'year': 1.0
    };
    
    const factor = timeMultipliers[timeRange];
    
    return productPerformance.map(product => {
      let revenue = 0;
      let orders = 0;
      
      const productData = productCrossData[product.category];
      
      // 根据国家和业务类型筛选
      const countriesToInclude = selectedCountry === 'all' ? ['美国', '加拿大', '墨西哥'] : [selectedCountry];
      const businessTypesToInclude = selectedBusinessType === 'all' ? ['trading', 'inspection', 'agency', 'project'] : [selectedBusinessType];
      
      countriesToInclude.forEach(country => {
        businessTypesToInclude.forEach(businessType => {
          const data = productData[country][businessType];
          revenue += data.revenue;
          orders += data.orders;
        });
      });
      
      return {
        ...product,
        revenue: Math.round(revenue * factor),
        orders: Math.round(orders * factor)
      };
    });
  }, [timeRange, selectedBusinessType, selectedCountry]);

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">{currentRegion.icon}</span>
            {isManager ? '区域主管数据中心' : '业务员业绩中心'} - {currentRegion.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isManager ? '区域整体业绩分析与团队管理' : '个人业绩追踪与客户管理'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 🔥 时间范围筛选器 */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q3" className="text-xs">Q3累计</SelectItem>
              <SelectItem value="q4" className="text-xs">Q4累计</SelectItem>
              <SelectItem value="ytd" className="text-xs">本年至今</SelectItem>
              <SelectItem value="year" className="text-xs">全年</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 业务类型筛选器 */}
          <Select value={selectedBusinessType} onValueChange={setSelectedBusinessType}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部业务</SelectItem>
              <SelectItem value="trading" className="text-xs">🛒 直接采购</SelectItem>
              <SelectItem value="inspection" className="text-xs">🔍 验货服务</SelectItem>
              <SelectItem value="agency" className="text-xs">🤝 代理服务</SelectItem>
              <SelectItem value="project" className="text-xs">🌟 一站式项目</SelectItem>
            </SelectContent>
          </Select>

          {/* 🔥 国家筛选器 */}
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">全部国家</SelectItem>
              {currentRegion.countries.map((country) => (
                <SelectItem key={country} value={country} className="text-xs">{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isManager && (
            <Select value={selectedSalesRep} onValueChange={setSelectedSalesRep}>
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">全部业务员</SelectItem>
                {salesRepRanking.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id} className="text-xs">{rep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

      {/* 🔥 核心KPI卡片 */}
      <div className={`grid ${isManager ? 'grid-cols-10' : 'grid-cols-8'} gap-3`}>
        {filteredKPIs.map((kpi) => {
          const IconComponent = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className={`${kpi.bgColor} w-8 h-8 rounded flex items-center justify-center`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className={`flex items-center gap-0.5 text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span className="font-semibold">{kpi.change}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-1" title={kpi.description}>{kpi.label}</p>
              <p className="text-base font-bold text-gray-900">
                {kpi.unit === 'USD' ? `$${kpi.value >= 1000000 ? (kpi.value / 1000000).toFixed(2) + 'M' : (kpi.value / 1000).toFixed(0) + 'K'}` : 
                 kpi.unit === '%' ? `${kpi.value.toFixed(1)}%` :
                 kpi.unit === '/5' ? kpi.value.toFixed(1) :
                 kpi.value.toLocaleString()}
                {kpi.unit === '/5' && <span className="text-xs font-normal text-gray-500 ml-0.5">/5</span>}
              </p>
              {kpi.completion && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-500">完成率</span>
                    <span className={`font-semibold ${kpi.completion >= 95 ? 'text-green-600' : kpi.completion >= 85 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {kpi.completion.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${kpi.completion >= 95 ? 'bg-green-600' : kpi.completion >= 85 ? 'bg-blue-600' : 'bg-orange-600'}`}
                      style={{ width: `${Math.min(kpi.completion, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🔥 区域主管专属：业务员排名 */}
      {isManager && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-600" />
                团队业绩排名
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">区域所有业务员业绩对比</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-700 w-[50px]">排名</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700">姓名</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">营收</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">订单数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">客户数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">新客户</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">均单价</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">满意度</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">转化率</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">目标完成率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesRepRanking.map((rep, index) => (
                  <TableRow key={rep.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-gray-900">{rep.name}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-gray-900">${(rep.revenue / 1000).toFixed(0)}K</TableCell>
                    <TableCell className="text-xs text-center text-gray-700">{rep.orders}</TableCell>
                    <TableCell className="text-xs text-center text-gray-700">{rep.customers}</TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className="bg-green-100 text-green-700 h-5 px-2">{rep.newCustomers}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right text-gray-700">${rep.avgOrderValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{rep.satisfaction}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className="bg-blue-100 text-blue-700 h-5 px-2">{rep.conversion}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className={`h-5 px-2 ${rep.completion >= 95 ? 'bg-green-100 text-green-700' : rep.completion >= 85 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {rep.completion.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 🔥 国家市场分析 + 业务类型分析 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 国家市场分析 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                国家市场分析
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{currentRegion.name}细分市场</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-700">国家</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">营收</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">订单数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">客户数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">增长率</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">市场份额</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">均单价</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">满意度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCountryData.map((country) => (
                  <TableRow key={country.country} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-semibold text-gray-900">{country.country}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-gray-900">${(country.revenue / 1000000).toFixed(2)}M</TableCell>
                    <TableCell className="text-xs text-center text-gray-700">{country.orders}</TableCell>
                    <TableCell className="text-xs text-center text-gray-700">{country.customers}</TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className="bg-green-100 text-green-700 h-5 px-2">+{country.growth}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className="bg-purple-100 text-purple-700 h-5 px-2">{country.marketShare}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right text-gray-700">${country.avgOrderValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{country.satisfaction}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 业务类型分析 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                业务类型分析
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">四大业务板块表现</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold text-gray-700">业务类型</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">营收</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">占比</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">订单数</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-right">均单价</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">增长率</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-700 text-center">利润率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinessData.map((business) => (
                  <TableRow key={business.type} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{business.icon}</span>
                        <span className="text-xs font-semibold text-gray-900">{business.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-bold text-gray-900">${(business.revenue / 1000000).toFixed(2)}M</TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge variant="outline" className="h-5 px-2">{business.percentage.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center text-gray-700">{business.orders}</TableCell>
                    <TableCell className="text-xs text-right text-gray-700">${business.avgValue.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className="bg-green-100 text-green-700 h-5 px-2">+{business.growth}%</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <Badge className={`h-5 px-2 ${business.profitMargin >= 40 ? 'bg-green-100 text-green-700' : business.profitMargin >= 25 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {business.profitMargin}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 🔥 月度趋势 + 客户细分 + 产品表现 */}
      <div className="grid grid-cols-3 gap-3">
        {/* 月度趋势图 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">月度趋势</h3>
              <p className="text-xs text-gray-500 mt-0.5">营收与订单</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={filteredMonthlyTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area yAxisId="left" type="monotone" dataKey="revenue" fill="url(#colorRevenue)" stroke="#DC2626" name="营收" />
              <Bar yAxisId="right" dataKey="orders" fill="#3B82F6" name="订单数" />
              <Line yAxisId="right" type="monotone" dataKey="newCustomers" stroke="#10B981" strokeWidth={2} name="新客户" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 客户细分 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                客户细分
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">客户层级分析</p>
            </div>
          </div>
          <div className="space-y-2">
            {filteredCustomerSegmentation.map((segment) => (
              <div key={segment.segment} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-900">{segment.segment}</span>
                    <p className="text-xs text-gray-500">{segment.count} 个客户</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(segment.revenue / 1000000).toFixed(2)}M</p>
                    <p className="text-xs text-gray-500">{segment.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">订单数</p>
                    <p className="text-xs font-semibold text-gray-900">{segment.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">均单价</p>
                    <p className="text-xs font-semibold text-gray-900">${(segment.avgOrderValue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">满意度</p>
                    <p className="text-xs font-semibold text-pink-600">{segment.satisfaction}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">留存率</p>
                    <p className="text-xs font-semibold text-green-600">{segment.retention}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 产品表现 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                产品表现
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">热销类别TOP5</p>
            </div>
          </div>
          <div className="space-y-2">
            {filteredProductPerformance.map((product, index) => (
              <div key={product.category} className="border border-gray-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{product.category}</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 h-4 px-1.5 text-xs">+{product.growth}%</Badge>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">营收</p>
                    <p className="text-xs font-bold text-gray-900">${(product.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">订单</p>
                    <p className="text-xs font-semibold text-gray-900">{product.orders}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">利润率</p>
                    <p className="text-xs font-semibold text-green-600">{product.margin}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">评分</p>
                    <p className="text-xs font-semibold text-pink-600">{product.satisfaction}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 🔥 销售漏斗 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-600" />
              销售漏斗分析
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">从询价到成交的转化路径</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {filteredSalesFunnel.map((stage, index) => (
            <div key={stage.stage} className="relative">
              <div className={`border-2 rounded-lg p-4 text-center ${
                index === 0 ? 'border-blue-300 bg-blue-50' :
                index === 1 ? 'border-purple-300 bg-purple-50' :
                index === 2 ? 'border-orange-300 bg-orange-50' :
                'border-green-300 bg-green-50'
              }`}>
                <p className="text-sm font-bold text-gray-900 mb-1">{stage.stage}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stage.count}</p>
                <p className="text-xs text-gray-600 mb-2">${(stage.amount / 1000000).toFixed(2)}M</p>
                <Badge className={`h-5 px-2 text-xs ${
                  stage.conversionRate >= 70 ? 'bg-green-100 text-green-700' :
                  stage.conversionRate >= 65 ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  转化率: {stage.conversionRate.toFixed(1)}%
                </Badge>
              </div>
              {index < salesFunnel.length - 1 && (
                <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 text-gray-400">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}