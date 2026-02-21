import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  Target, TrendingUp, TrendingDown, Award, Users, DollarSign,
  Calendar, Activity, Sparkles, RefreshCw, Download, Plus, Eye,
  BarChart3, LineChart as LineChartIcon, CheckCircle2, AlertTriangle,
  Zap, Map, ClipboardList, Layers, Percent, ArrowRight, Clock, Flag,
  Rocket, Brain, Lightbulb, FileText, Play, CheckSquare, Shield,
  TrendingUpIcon, Edit3, Save, X, Check
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';

interface SalesForecastingTargetsProMaxEditableProps {
  userRole?: string;
}

// 🔥 定义目标数据结构
interface TargetData {
  annualTarget: number;
  annualAchieved: number;
  quarterTarget: number;
  quarterAchieved: number;
  monthTarget: number;
  monthAchieved: number;
  weekTarget: number;
  weekAchieved: number;
  lastYearSame: number;
}

export default function SalesForecastingTargetsProMaxEditable({ userRole = 'Sales_Manager' }: SalesForecastingTargetsProMaxEditableProps) {
  // 🔥 从localStorage加载数据
  const loadTargetData = (): TargetData => {
    const saved = localStorage.getItem('sales_targets_data_pro');
    if (saved) {
      return JSON.parse(saved);
    }
    // 默认数据
    return {
      annualTarget: 18500000,
      annualAchieved: 15680000,
      quarterTarget: 4800000,
      quarterAchieved: 4320000,
      monthTarget: 1550000,
      monthAchieved: 1420000,
      weekTarget: 387500,
      weekAchieved: 412000,
      lastYearSame: 13500000,
    };
  };

  // 🔥 状态管理
  const [targetData, setTargetData] = useState<TargetData>(loadTargetData());
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Partial<TargetData>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');
  const [showSetTarget, setShowSetTarget] = useState(false);
  const [showExecutionPlan, setShowExecutionPlan] = useState(false);
  const [showTargetBreakdown, setShowTargetBreakdown] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);

  // 🔥 保存数据到localStorage
  useEffect(() => {
    localStorage.setItem('sales_targets_data_pro', JSON.stringify(targetData));
  }, [targetData]);

  // 🔥 自动计算逻辑
  const calculateProgress = (achieved: number, target: number): number => {
    if (target === 0) return 0;
    return parseFloat(((achieved / target) * 100).toFixed(1));
  };

  // 计算所有进度
  const annualProgress = calculateProgress(targetData.annualAchieved, targetData.annualTarget);
  const quarterProgress = calculateProgress(targetData.quarterAchieved, targetData.quarterTarget);
  const monthProgress = calculateProgress(targetData.monthAchieved, targetData.monthTarget);
  const weekProgress = calculateProgress(targetData.weekAchieved, targetData.weekTarget);

  // 计算同比增长
  const yoyGrowth = parseFloat((((targetData.annualAchieved - targetData.lastYearSame) / targetData.lastYearSame) * 100).toFixed(1));

  // 计算市场份额
  const marketShare = 8.5;
  const competitorGrowth = 12.3;

  // 🔥 可编辑字段组件
  const EditableField = ({ 
    field, 
    value, 
    label,
    prefix = '$'
  }: { 
    field: keyof TargetData; 
    value: number; 
    label: string;
    prefix?: string;
  }) => {
    const isCurrentlyEditing = editingField === field;
    
    return (
      <div className="flex items-center gap-1.5">
        {isCurrentlyEditing ? (
          <>
            <Input
              type="text"
              value={tempValues[field]?.toLocaleString() || value.toLocaleString()}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-24 h-6 text-xs"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => saveEdit(field)}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={cancelEdit}
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </>
        ) : (
          <>
            <span className="font-semibold">{formatCurrency(value)}</span>
            {isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 opacity-50 hover:opacity-100"
                onClick={() => startEdit(field)}
              >
                <Edit3 className="h-2.5 w-2.5" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // 🔥 编辑功能
  const startEdit = (field: string) => {
    setEditingField(field);
    setTempValues({ [field]: targetData[field as keyof TargetData] });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const saveEdit = (field: string) => {
    const value = tempValues[field as keyof TargetData];
    if (value !== undefined && !isNaN(value) && value >= 0) {
      setTargetData({ ...targetData, [field]: value });
      setEditingField(null);
      setTempValues({});
      toast.success('✅ 数据已更新');
    } else {
      toast.error('请输入有效的数字');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const numValue = parseFloat(value.replace(/,/g, ''));
    setTempValues({ ...tempValues, [field]: isNaN(numValue) ? 0 : numValue });
  };

  // 🔥 AI销售预测（增强版 - 多维度）
  const salesForecast = {
    nextMonth: {
      predicted: 1580000,
      confidence: 92,
      min: 1450000,
      max: 1720000,
      growth: 8.5,
      factors: [
        { name: '季节性因素', impact: '+5%', description: '年底采购旺季' },
        { name: '市场趋势', impact: '+3%', description: '行业整体向好' },
        { name: '客户复购', impact: '+2%', description: '老客户增购' },
        { name: '新客户开发', impact: '+1.5%', description: '潜客转化' }
      ]
    },
    nextQuarter: {
      predicted: 4950000,
      confidence: 88,
      min: 4650000,
      max: 5280000,
      growth: 12.3,
      factors: [
        { name: 'Q1采购高峰', impact: '+8%', description: '春季补货需求' },
        { name: '新产品线', impact: '+3%', description: '门窗配件新品' },
        { name: '区域扩张', impact: '+2%', description: '南美市场开拓' }
      ]
    },
    yearEnd: {
      predicted: 19200000,
      confidence: 85,
      min: 18500000,
      max: 19900000,
      growth: 15.8,
      factors: [
        { name: '全年累积', impact: '+10%', description: '客户基数增长' },
        { name: '市场份额提升', impact: '+4%', description: '竞争优势' },
        { name: '产品组合优化', impact: '+2%', description: '高毛利产品' }
      ]
    }
  };

  // 🔥 目标制定依据（SMART原则）- 从销售数据管理中心加载
  const loadSalesManagementData = () => {
    const saved = localStorage.getItem('sales_management_data');
    if (saved) {
      const data = JSON.parse(saved);
      return {
        historical: {
          lastYear: data.historical.lastYear,
          twoYearsAgo: data.historical.twoYearsAgo,
          avgGrowth: parseFloat((((data.historical.lastYear - data.historical.twoYearsAgo) / data.historical.twoYearsAgo + (data.historical.twoYearsAgo - data.historical.threeYearsAgo) / data.historical.threeYearsAgo) / 2 * 100).toFixed(1)),
          bestMonth: 1680000,
          worstMonth: 1120000
        },
        market: {
          totalSize: data.market.totalSize,
          ourShare: data.market.ourShare,
          targetShare: data.market.targetShare,
          industryGrowth: data.market.industryGrowth,
          competitorAvgGrowth: data.market.competitorAvgGrowth
        },
        resources: {
          salesTeam: data.resource.salesTeam,
          avgDealsPerPerson: data.resource.avgDealsPerPerson,
          avgDealSize: data.resource.avgDealSize,
          conversionRate: data.resource.conversionRate
        },
        strategic: {
          newProducts: data.strategic.newProducts,
          newRegions: data.strategic.newRegions,
          majorClients: data.strategic.majorClients,
          partnerships: data.strategic.partnerships
        }
      };
    }
    // 默认数据（如果销售数据管理中心还没有数据）
    return {
      historical: {
        lastYear: 15980000,
        twoYearsAgo: 14200000,
        avgGrowth: 12.5,
        bestMonth: 1680000,
        worstMonth: 1120000
      },
      market: {
        totalSize: 218000000,
        ourShare: 8.5,
        targetShare: 9.2,
        industryGrowth: 14.2,
        competitorAvgGrowth: 12.3
      },
      resources: {
        salesTeam: 5,
        avgDealsPerPerson: 24,
        avgDealSize: 62000,
        conversionRate: 28
      },
      strategic: {
        newProducts: 3,
        newRegions: 1,
        majorClients: 8,
        partnerships: 2
      }
    };
  };

  const targetBasis = loadSalesManagementData();

  // 🔥 目标分解体系（年→季→月→周→日）
  const targetBreakdown = {
    annual: {
      total: 18500000,
      q1: 4200000,
      q2: 4500000,
      q3: 4300000,
      q4: 5500000
    },
    quarterly: {
      name: 'Q4 2024',
      total: 5500000,
      achieved: 4320000,
      remaining: 1180000,
      months: [
        { month: '10月', target: 1650000, achieved: 1580000, progress: 95.8 },
        { month: '11月', target: 1750000, achieved: 1420000, progress: 81.1 },
        { month: '12月', target: 2100000, achieved: 1320000, progress: 62.9 }
      ]
    },
    monthly: {
      name: '11月',
      total: 1750000,
      achieved: 1420000,
      remaining: 330000,
      weeks: [
        { week: '第1周', target: 437500, achieved: 485000, progress: 110.9 },
        { week: '第2周', target: 437500, achieved: 398000, progress: 91.0 },
        { week: '第3周', target: 437500, achieved: 425000, progress: 97.1 },
        { week: '第4周', target: 437500, achieved: 112000, progress: 25.6 }
      ]
    },
    daily: {
      target: 62500,
      achieved: 58000,
      workingDays: 7,
      remainingDays: 3
    }
  };

  // 🔥 执行策略和行动计划
  const executionStrategies = [
    {
      id: 1,
      category: '新客户开发',
      priority: 'high',
      targetContribution: 25,
      actions: [
        { 
          action: '每日LinkedIn外展50个潜在客户', 
          owner: '全体Sales Rep', 
          frequency: '每日',
          kpi: '50个/天',
          status: 'active'
        },
        { 
          action: '每周参加1场线上行业展会', 
          owner: 'Sales Manager', 
          frequency: '每周',
          kpi: '10个有效线索',
          status: 'active'
        },
        { 
          action: '冷邮件营销（A/B测试）', 
          owner: 'Marketing', 
          frequency: '持续',
          kpi: '3%回复率',
          status: 'active'
        }
      ],
      expectedRevenue: 450000,
      timeline: '持续执行'
    },
    {
      id: 2,
      category: '老客户深挖',
      priority: 'high',
      targetContribution: 35,
      actions: [
        { 
          action: '季度业务回顾会（QBR）', 
          owner: 'Account Manager', 
          frequency: '每季度',
          kpi: '100%覆盖',
          status: 'active'
        },
        { 
          action: '交叉销售和向上销售', 
          owner: '全体Sales', 
          frequency: '每月',
          kpi: '+20%客单价',
          status: 'active'
        },
        { 
          action: '客户满意度调研', 
          owner: 'CS Team', 
          frequency: '每半年',
          kpi: 'NPS>40',
          status: 'planned'
        }
      ],
      expectedRevenue: 630000,
      timeline: '持续执行'
    },
    {
      id: 3,
      category: '产品组合优化',
      priority: 'medium',
      targetContribution: 20,
      actions: [
        { 
          action: '推广高毛利产品套餐', 
          owner: 'Product Team', 
          frequency: '每月',
          kpi: '30%销售占比',
          status: 'active'
        },
        { 
          action: '新品上市推广（门窗配件）', 
          owner: 'Marketing', 
          frequency: 'Q4',
          kpi: '$200K收入',
          status: 'active'
        },
        { 
          action: '库存清仓促销', 
          owner: 'Operations', 
          frequency: '月末',
          kpi: '15%折扣率',
          status: 'planned'
        }
      ],
      expectedRevenue: 360000,
      timeline: 'Q4执行'
    },
    {
      id: 4,
      category: '区域市场拓展',
      priority: 'medium',
      targetContribution: 12,
      actions: [
        { 
          action: '南美市场本地化推广', 
          owner: 'Regional Manager', 
          frequency: 'Q4-Q1',
          kpi: '5个新客户',
          status: 'active'
        },
        { 
          action: '参加巴西线下展会', 
          owner: 'Sales Director', 
          frequency: '12月',
          kpi: '20个有效线索',
          status: 'planned'
        }
      ],
      expectedRevenue: 216000,
      timeline: 'Q4-Q1'
    },
    {
      id: 5,
      category: '销售效能提升',
      priority: 'low',
      targetContribution: 8,
      actions: [
        { 
          action: 'CRM系统使用培训', 
          owner: 'Admin', 
          frequency: '每月',
          kpi: '90%使用率',
          status: 'active'
        },
        { 
          action: '销售话术和案例分享', 
          owner: 'Sales Manager', 
          frequency: '每周',
          kpi: '团队参与度>80%',
          status: 'active'
        },
        { 
          action: '销售流程优化（缩短周期）', 
          owner: 'Operations', 
          frequency: '持续',
          kpi: '18天→15天',
          status: 'active'
        }
      ],
      expectedRevenue: 144000,
      timeline: '持续优化'
    }
  ];

  // 🔥 目标达成路径（Milestone）
  const milestones = [
    {
      date: '11-30',
      title: '11月目标达成',
      target: 1750000,
      predicted: 1650000,
      status: 'at-risk',
      gap: -100000,
      actions: ['加速跟进pending订单', '启动月末促销']
    },
    {
      date: '12-15',
      title: '12月中目标',
      target: 1050000,
      predicted: 1180000,
      status: 'on-track',
      gap: 130000,
      actions: ['保持当前节奏', '重点跟进大单']
    },
    {
      date: '12-31',
      title: 'Q4目标完成',
      target: 5500000,
      predicted: 5620000,
      status: 'exceed',
      gap: 120000,
      actions: ['冲刺年度目标', '客户答谢活动']
    },
    {
      date: '2025-03-31',
      title: 'Q1目标',
      target: 4200000,
      predicted: 4500000,
      status: 'projected',
      gap: 300000,
      actions: ['春季采购旺季准备', '新产品线推广']
    }
  ];

  // 🔥 风险评估与应对
  const risks = [
    {
      risk: '汇率波动影响',
      probability: 'high',
      impact: 'medium',
      potentialLoss: 180000,
      mitigation: '设置±3%汇率保护机制，提前锁定大额订单汇率',
      owner: 'CFO',
      status: 'monitored'
    },
    {
      risk: '供应链延迟',
      probability: 'medium',
      impact: 'high',
      potentialLoss: 320000,
      mitigation: '多供应商策略，提前2周下单，建立安全库存',
      owner: 'Operations',
      status: 'mitigated'
    },
    {
      risk: '大客户流失',
      probability: 'low',
      impact: 'high',
      potentialLoss: 450000,
      mitigation: '每月客户健康度检查，专属客户成功经理',
      owner: 'Account Manager',
      status: 'monitored'
    },
    {
      risk: '竞争对手价格战',
      probability: 'medium',
      impact: 'medium',
      potentialLoss: 220000,
      mitigation: '差异化价值主张，服务质量提升，长期合作优惠',
      owner: 'Sales Director',
      status: 'planned'
    }
  ];

  // 🔥 激励机制
  const incentivePlan = {
    individual: [
      { tier: 'Bronze (80-89%)', bonus: 5, description: '基础达成奖' },
      { tier: 'Silver (90-99%)', bonus: 10, description: '目标达成奖' },
      { tier: 'Gold (100-109%)', bonus: 18, description: '超额完成奖' },
      { tier: 'Platinum (110%+)', bonus: 25, description: '卓越表现奖' }
    ],
    team: [
      { milestone: 'Q4目标达成', reward: '$10K团队奖金池', criteria: '100%达成' },
      { milestone: '年度目标超额', reward: '全员海外旅游', criteria: '105%达成' },
      { milestone: '新客户突破', reward: '$500/人', criteria: '新签10个客户' }
    ],
    recognition: [
      '月度销售冠军（公司表彰）',
      '季度最佳新人奖',
      '年度销售MVP（$5K现金奖励）',
      'CEO午餐会（优秀员工）'
    ]
  };

  // 历史vs预测趋势（18个月）
  const extendedForecast = [
    { month: '5月', actual: 1280000, forecast: null, target: 1400000, yoy: 1150000 },
    { month: '6月', actual: 1320000, forecast: null, target: 1400000, yoy: 1180000 },
    { month: '7月', actual: 1380000, forecast: null, target: 1450000, yoy: 1220000 },
    { month: '8月', actual: 1450000, forecast: null, target: 1500000, yoy: 1280000 },
    { month: '9月', actual: 1520000, forecast: null, target: 1550000, yoy: 1320000 },
    { month: '10月', actual: 1580000, forecast: null, target: 1550000, yoy: 1380000 },
    { month: '11月', actual: 1420000, forecast: null, target: 1750000, yoy: 1280000 },
    { month: '12月', actual: null, forecast: 1650000, target: 2100000, yoy: 1450000 },
    { month: '1月', actual: null, forecast: 1380000, target: 1400000, yoy: null },
    { month: '2月', actual: null, forecast: 1420000, target: 1450000, yoy: null },
    { month: '3月', actual: null, forecast: 1650000, target: 1600000, yoy: null }
  ];

  // 策略贡献雷达图数据
  const strategyRadarData = executionStrategies.map(s => ({
    strategy: s.category,
    contribution: s.targetContribution,
    priority: s.priority === 'high' ? 90 : s.priority === 'medium' ? 60 : 30
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getPriorityBadge = (priority: string) => {
    const styles: any = {
      high: 'bg-red-100 text-red-700 border-red-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-blue-100 text-blue-700 border-blue-300'
    };
    return styles[priority] || styles.medium;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      'active': { style: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: '执行中' },
      'planned': { style: 'bg-blue-100 text-blue-700 border-blue-300', label: '计划中' },
      'completed': { style: 'bg-slate-100 text-slate-700 border-slate-300', label: '已完成' },
      'on-track': { style: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: '正常' },
      'at-risk': { style: 'bg-orange-100 text-orange-700 border-orange-300', label: '风险' },
      'exceed': { style: 'bg-purple-100 text-purple-700 border-purple-300', label: '超预期' },
      'projected': { style: 'bg-blue-100 text-blue-700 border-blue-300', label: '预测' },
      'monitored': { style: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: '监控中' },
      'mitigated': { style: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: '已缓解' }
    };
    return config[status] || config['planned'];
  };

  const handleRefresh = () => {
    toast.success('数据已刷新', {
      description: 'AI预测模型已重新计算'
    });
  };

  const handleSetTarget = () => {
    toast.success('目标已设置', {
      description: '新的销售目标已保存'
    });
    setShowSetTarget(false);
  };

  const handleExportReport = () => {
    // 生成报告数据
    const reportData = {
      reportTitle: '销售预测与目标管理报告',
      generatedDate: new Date().toLocaleString('zh-CN'),
      reportType: 'Pro Max Executive Edition',
      
      // 目标完成情况
      targetOverview: {
        annual: {
          progress: annualProgress,
          target: targetData.annualTarget,
          achieved: targetData.annualAchieved,
          yoyGrowth: yoyGrowth
        },
        quarter: {
          progress: quarterProgress,
          target: targetData.quarterTarget,
          achieved: targetData.quarterAchieved
        },
        month: {
          progress: monthProgress,
          target: targetData.monthTarget,
          achieved: targetData.monthAchieved
        },
        week: {
          progress: weekProgress,
          target: targetData.weekTarget,
          achieved: targetData.weekAchieved
        }
      },
      
      // 目标制定依据
      targetBasis: targetBasis,
      
      // AI销售预测
      salesForecast: {
        nextMonth: salesForecast.nextMonth,
        nextQuarter: salesForecast.nextQuarter,
        yearEnd: salesForecast.yearEnd
      },
      
      // 历史vs预测数据
      forecastTrend: extendedForecast,
      
      // 执行策略
      executionStrategies: executionStrategies.map(s => ({
        category: s.category,
        priority: s.priority,
        targetContribution: s.targetContribution,
        expectedRevenue: s.expectedRevenue,
        timeline: s.timeline,
        actions: s.actions
      })),
      
      // 里程碑
      milestones: milestones,
      
      // 风险评估
      risks: risks,
      
      // 激励机制
      incentivePlan: incentivePlan
    };

    // 生成可读的文本报告
    let reportText = `
========================================
销售预测与目标管理报告 (Pro Max)
========================================
生成时间: ${reportData.generatedDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 目标完成情况
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【年度目标 2024】
  进度: ${annualProgress}%
  目标: $${(targetData.annualTarget / 1000000).toFixed(2)}M
  已完成: $${(targetData.annualAchieved / 1000000).toFixed(2)}M
  同比增长: +${yoyGrowth}%

【季度目标 Q4】
  进度: ${quarterProgress}%
  目标: $${(targetData.quarterTarget / 1000000).toFixed(2)}M
  已完成: $${(targetData.quarterAchieved / 1000000).toFixed(2)}M

【本月目标 11月】
  进度: ${monthProgress}%
  目标: $${(targetData.monthTarget / 1000000).toFixed(2)}M
  已完成: $${(targetData.monthAchieved / 1000000).toFixed(2)}M

【本周目标】
  进度: ${weekProgress}%
  目标: $${(targetData.weekTarget / 1000).toFixed(2)}K
  已完成: $${(targetData.weekAchieved / 1000).toFixed(2)}K

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 目标制定科学依据 (SMART原则)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【综合评估结论】
  历史支撑度: 95%
  市场机会度: 88%
  团队执行力: 92%
  战略增长点: 90%
  综合可达成度: 91%
  
结论: 年度目标$18.5M具有91%的可实现性，目标设定科学合理，挑战性适中

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ AI销售预测
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【下月预测 (12月)】
  预测值: $${(salesForecast.nextMonth.predicted / 1000000).toFixed(2)}M
  置信度: ${salesForecast.nextMonth.confidence}%
  预测区间: $${(salesForecast.nextMonth.min / 1000000).toFixed(2)}M ~ $${(salesForecast.nextMonth.max / 1000000).toFixed(2)}M
  环比增长: +${salesForecast.nextMonth.growth}%

【下季度预测 (Q1 2025)】
  预测值: $${(salesForecast.nextQuarter.predicted / 1000000).toFixed(2)}M
  置信度: ${salesForecast.nextQuarter.confidence}%
  同比增长: +${salesForecast.nextQuarter.growth}%

【年终预测 (2024)】
  预测值: $${(salesForecast.yearEnd.predicted / 1000000).toFixed(2)}M
  置信度: ${salesForecast.yearEnd.confidence}%
  同比增长: +${salesForecast.yearEnd.growth}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 执行策略概览
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    executionStrategies.forEach((strategy, idx) => {
      reportText += `
${idx + 1}. ${strategy.category}
   优先级: ${strategy.priority === 'high' ? '高' : strategy.priority === 'medium' ? '中' : '低'}
   目标贡献: ${strategy.targetContribution}%
   预期收入: $${(strategy.expectedRevenue / 1000000).toFixed(2)}M
   时间线: ${strategy.timeline}
   行动项: ${strategy.actions.length}个
`;
    });

    reportText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 目标达成路径与里程碑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    milestones.forEach((milestone, idx) => {
      reportText += `
${idx + 1}. ${milestone.title} (${milestone.date})
   状态: ${milestone.status === 'exceed' ? '超额达成' : milestone.status === 'on-track' ? '正常' : milestone.status === 'at-risk' ? '有风险' : '未开始'}
   目标: $${(milestone.target / 1000000).toFixed(2)}M
   预测: $${(milestone.predicted / 1000000).toFixed(2)}M
   差距: ${milestone.gap >= 0 ? '+' : ''}$${(milestone.gap / 1000000).toFixed(2)}M
`;
    });

    reportText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 风险评估与应对
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    risks.forEach((risk, idx) => {
      reportText += `
${idx + 1}. ${risk.risk}
   概率: ${risk.probability === 'high' ? '高' : risk.probability === 'medium' ? '中' : '低'}
   影响: ${risk.impact === 'high' ? '高' : risk.impact === 'medium' ? '中' : '低'}
   潜在损失: $${(risk.potentialLoss / 1000000).toFixed(2)}M
   缓解策略: ${risk.mitigation}
   负责人: ${risk.owner}
`;
    });

    reportText += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
报告结束
生成时间: ${reportData.generatedDate}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // 创建Blob并下载
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `销售预测与目标管理报告_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 同时导出JSON格式的详细数据
    const jsonBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `销售预测与目标管理报告_详细数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(jsonLink);
    jsonLink.click();
    document.body.removeChild(jsonLink);
    URL.revokeObjectURL(jsonUrl);

    toast.success('报告导出成功', {
      description: '已生成文本报告和JSON详细数据文件'
    });
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '22px', fontWeight: 700 }}>
            <Target className="w-6 h-6 text-purple-600" />
            销售预测与目标管理 Pro Max
            <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white border-0">
              Executive Edition
            </Badge>
            {isEditing && (
              <Badge className="bg-blue-600 text-white animate-pulse">
                编辑模式
              </Badge>
            )}
          </h1>
          <p className="text-slate-600 mt-0.5" style={{ fontSize: '13px' }}>
            Sales Forecasting & Target Management · 目标制定 · 执行落地 · 绩效追踪 · 风险管控
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 h-8 ${isEditing ? 'bg-blue-50 border-blue-300' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                完成编辑
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                编辑模式
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleRefresh}>
            <RefreshCw className="w-3.5 h-3.5" />
            刷新预测
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={handleExportReport}>
            <Download className="w-3.5 h-3.5" />
            导出报告
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-purple-600 hover:bg-purple-700 h-8"
            onClick={() => setShowSetTarget(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            设置目标
          </Button>
        </div>
      </div>

      {/* 🔥 目标完成情况（增强版 - 4层级）*/}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 年度目标 */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-600 text-xs mb-0.5">年度目标（2024）</p>
              <p className="text-2xl font-bold text-blue-600">{annualProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">目标:</span>
              <EditableField field="annualTarget" value={targetData.annualTarget} label="年度目标" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">已完成:</span>
              <EditableField field="annualAchieved" value={targetData.annualAchieved} label="年度已完成" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">同比增长:</span>
              <span className="font-semibold text-emerald-600">+{yoyGrowth}%</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${annualProgress}%` }} />
          </div>
        </Card>

        {/* 季度目标 */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-600 text-xs mb-0.5">季度目标（Q4）</p>
              <p className="text-2xl font-bold text-purple-600">{quarterProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">目标:</span>
              <EditableField field="quarterTarget" value={targetData.quarterTarget} label="季度目标" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">已完成:</span>
              <EditableField field="quarterAchieved" value={targetData.quarterAchieved} label="季度已完成" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">剩余:</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(targetData.quarterTarget - targetData.quarterAchieved)}
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${quarterProgress}%` }} />
          </div>
        </Card>

        {/* 月度目标 */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-600 text-xs mb-0.5">本月目标（11月）</p>
              <p className="text-2xl font-bold text-emerald-600">{monthProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">目标:</span>
              <EditableField field="monthTarget" value={targetData.monthTarget} label="月度目标" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">已完成:</span>
              <EditableField field="monthAchieved" value={targetData.monthAchieved} label="月度已完成" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">剩余天数:</span>
              <span className="font-semibold text-orange-600">3天</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${monthProgress}%` }} />
          </div>
        </Card>

        {/* 本周目标 */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-600 text-xs mb-0.5">本周目标（第4周）</p>
              <p className="text-2xl font-bold text-orange-600">{weekProgress}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-0.5 text-xs mb-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">目标:</span>
              <EditableField field="weekTarget" value={targetData.weekTarget} label="周目标" />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">已完成:</span>
              <EditableField field="weekAchieved" value={targetData.weekAchieved} label="周已完成" />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">日均:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(targetData.weekAchieved / 4)}</span>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-orange-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(weekProgress, 100)}%` }} />
          </div>
        </Card>
      </div>

      {/* 🔥 目标制定依据（SMART原则）*/}
      {(() => {
        // 动态计算当前目标的增长率
        const currentTargetGrowth = parseFloat((((targetData.annualTarget - targetBasis.historical.lastYear) / targetBasis.historical.lastYear) * 100).toFixed(1));
        const isGrowthReasonable = currentTargetGrowth >= targetBasis.historical.avgGrowth && currentTargetGrowth <= targetBasis.historical.avgGrowth + 5;
        
        return (
      <Card className="p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                目标制定科学依据（SMART原则）
              </h3>
              <p className="text-xs text-slate-600">基于历史数据、市场分析、资源评估和战略规划的科学目标设定</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              toast.info('💡 请前往"销售数据管理与计算中心"修改SMART基础数据');
              window.location.hash = '#sales-data-management';
              setTimeout(() => {
                toast.success('✅ 已进入数据管理中心');
              }, 100);
            }}
          >
            <Edit3 className="size-3 mr-1" />
            编辑基础数据
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 历史数据分析 */}
          <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <LineChartIcon className="w-4 h-4 text-blue-600" />
              <p className="font-semibold text-slate-900 text-sm">历史数据分析</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">去年同期:</span>
                <span className="font-semibold">{formatCurrency(targetBasis.historical.lastYear)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">两年前:</span>
                <span className="font-semibold">{formatCurrency(targetBasis.historical.twoYearsAgo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">平均增长:</span>
                <span className="font-semibold text-emerald-600">+{targetBasis.historical.avgGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">最佳月份:</span>
                <span className="font-semibold text-purple-600">{formatCurrency(targetBasis.historical.bestMonth)}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-blue-700 font-semibold">✅ 支撑度: 95%</p>
              <p className="text-xs text-slate-600 mt-0.5">
                历史年均增长{targetBasis.historical.avgGrowth}%，当前目标增长{currentTargetGrowth}%
                {Math.abs(currentTargetGrowth - targetBasis.historical.avgGrowth) <= 5 ? '略高但可实现' : currentTargetGrowth > targetBasis.historical.avgGrowth ? '具有挑战性' : '较为保守'}
              </p>
            </div>
          </div>

          {/* 市场环境分析 */}
          <div className="bg-white rounded-lg p-3 border-2 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <p className="font-semibold text-slate-900 text-sm">市场环境分析</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">市场规模:</span>
                <span className="font-semibold">{formatCurrency(targetBasis.market.totalSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">当前份额:</span>
                <span className="font-semibold">{targetBasis.market.ourShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">目标份额:</span>
                <span className="font-semibold text-purple-600">{targetBasis.market.targetShare}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">行业增长:</span>
                <span className="font-semibold text-emerald-600">+{targetBasis.market.industryGrowth}%</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-emerald-700 font-semibold">✅ 机会度: 88%</p>
              <p className="text-xs text-slate-600 mt-0.5">
                市场增长{targetBasis.market.industryGrowth}%，我们目标{currentTargetGrowth}%，
                {currentTargetGrowth > targetBasis.market.industryGrowth ? '高于行业' : '低于行业'}
                {Math.abs(currentTargetGrowth - targetBasis.market.industryGrowth) <= 3 ? '但合理' : currentTargetGrowth > targetBasis.market.industryGrowth ? '，具有竞争力' : '，相对保守'}
              </p>
            </div>
          </div>

          {/* 资源能力评估 */}
          <div className="bg-white rounded-lg p-3 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              <p className="font-semibold text-slate-900 text-sm">资源能力评估</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">销售团队:</span>
                <span className="font-semibold">{targetBasis.resources.salesTeam}人</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">人均成单:</span>
                <span className="font-semibold">{targetBasis.resources.avgDealsPerPerson}单/年</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">平均客单价:</span>
                <span className="font-semibold">{formatCurrency(targetBasis.resources.avgDealSize)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">转化率:</span>
                <span className="font-semibold text-blue-600">{targetBasis.resources.conversionRate}%</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-purple-700 font-semibold">✅ 执行力: 92%</p>
              <p className="text-xs text-slate-600 mt-0.5">团队能力支撑目标，需提升转化率至30%</p>
            </div>
          </div>

          {/* 战略举措支撑 */}
          <div className="bg-white rounded-lg p-3 border-2 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-orange-600" />
              <p className="font-semibold text-slate-900 text-sm">战略举措支撑</p>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">新产品线:</span>
                <span className="font-semibold">{targetBasis.strategic.newProducts}个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">新区域:</span>
                <span className="font-semibold">{targetBasis.strategic.newRegions}个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">大客户:</span>
                <span className="font-semibold text-purple-600">{targetBasis.strategic.majorClients}家</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">战略合作:</span>
                <span className="font-semibold">{targetBasis.strategic.partnerships}个</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-orange-700 font-semibold">✅ 增长点: 90%</p>
              <p className="text-xs text-slate-600 mt-1">新产品和新区域预计贡献$2.5M增量收入</p>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-4 border-2 border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            <p className="font-semibold text-indigo-700">综合评估结论</p>
          </div>
          <div className="grid grid-cols-5 gap-3 text-center">
            <div className="bg-blue-50 rounded p-2">
              <p className="text-2xl font-bold text-blue-600">95%</p>
              <p className="text-xs text-slate-600">历史支撑</p>
            </div>
            <div className="bg-emerald-50 rounded p-2">
              <p className="text-2xl font-bold text-emerald-600">88%</p>
              <p className="text-xs text-slate-600">市场机会</p>
            </div>
            <div className="bg-purple-50 rounded p-2">
              <p className="text-2xl font-bold text-purple-600">92%</p>
              <p className="text-xs text-slate-600">团队执行力</p>
            </div>
            <div className="bg-orange-50 rounded p-2">
              <p className="text-2xl font-bold text-orange-600">90%</p>
              <p className="text-xs text-slate-600">战略增长点</p>
            </div>
            <div className="bg-indigo-50 rounded p-2">
              <p className="text-2xl font-bold text-indigo-600">91%</p>
              <p className="text-xs text-slate-600">综合可达成度</p>
            </div>
          </div>
          <p className="text-xs text-slate-700 mt-3 text-center">
            💡 结论：年度目标{formatCurrency(targetData.annualTarget)}（同比增长{currentTargetGrowth}%）具有91%的可实现性，
            {isGrowthReasonable ? '目标设定科学合理，挑战性适中' : currentTargetGrowth > targetBasis.historical.avgGrowth + 5 ? '目标挑战性较高，需强化执行' : '目标相对保守，可适当提高'}
          </p>
        </div>
      </Card>
        );
      })()}

      {/* 🔥 AI销售预测 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 下月预测 */}
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-600">下月预测（12月）</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(salesForecast.nextMonth.predicted)}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs mb-4">
            <div className="flex justify-between">
              <span className="text-slate-600">置信度:</span>
              <span className="font-semibold text-emerald-600">{salesForecast.nextMonth.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">预测区间:</span>
              <span className="font-semibold">{formatCurrency(salesForecast.nextMonth.min)} ~ {formatCurrency(salesForecast.nextMonth.max)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">环比增长:</span>
              <span className="font-semibold text-purple-600">+{salesForecast.nextMonth.growth}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-900">影响因素：</p>
            {salesForecast.nextMonth.factors.map((factor, idx) => (
              <div key={idx} className="bg-white rounded p-2 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{factor.name}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{factor.impact}</Badge>
                </div>
                <p className="text-xs text-slate-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 下季度预测 */}
        <Card className="p-5 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-600">下季度预测（Q1 2025）</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(salesForecast.nextQuarter.predicted)}</p>
            </div>
          </div>
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-600">置信度:</span>
              <span className="font-semibold text-emerald-600">{salesForecast.nextQuarter.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">预测区间:</span>
              <span className="font-semibold">{formatCurrency(salesForecast.nextQuarter.min)} ~ {formatCurrency(salesForecast.nextQuarter.max)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">同比增长:</span>
              <span className="font-semibold text-purple-600">+{salesForecast.nextQuarter.growth}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-900">影响因素：</p>
            {salesForecast.nextQuarter.factors.map((factor, idx) => (
              <div key={idx} className="bg-white rounded p-2 border border-purple-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold">{factor.name}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{factor.impact}</Badge>
                </div>
                <p className="text-xs text-slate-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 年终预测 */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-600">年终预测（2024）</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(salesForecast.yearEnd.predicted)}</p>
            </div>
          </div>
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between">
              <span className="text-slate-600">置信度:</span>
              <span className="font-semibold text-emerald-600">{salesForecast.yearEnd.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">预测区间:</span>
              <span className="font-semibold">{formatCurrency(salesForecast.yearEnd.min)} ~ {formatCurrency(salesForecast.yearEnd.max)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">同比增长:</span>
              <span className="font-semibold text-orange-600">+{salesForecast.yearEnd.growth}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-900">影响因素：</p>
            {salesForecast.yearEnd.factors.map((factor, idx) => (
              <div key={idx} className="bg-white rounded p-2 border border-orange-100">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold">{factor.name}</span>
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs">{factor.impact}</Badge>
                </div>
                <p className="text-xs text-slate-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 🔥 历史vs预测趋势图 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <LineChartIcon className="w-4 h-4 text-indigo-600" />
          <h3 className="text-slate-900 font-semibold text-sm">
            历史趋势 vs AI预测（18个月）
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={extendedForecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip 
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area 
              type="monotone" 
              dataKey="yoy" 
              fill="#94a3b8" 
              stroke="#64748b" 
              name="去年同期"
              fillOpacity={0.2}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={2.5}
              name="实际销售额"
              dot={{ fill: '#3b82f6', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#8b5cf6" 
              strokeWidth={2.5}
              strokeDasharray="5 5"
              name="AI预测"
              dot={{ fill: '#8b5cf6', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="3 3"
              name="目标"
              dot={{ fill: '#f59e0b', r: 2.5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 🔥 执行策略和行动计划（重点）*/}
      <Card className="p-4 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 border-2 border-emerald-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
                执行策略与行动计划
                <Badge className="bg-red-500 text-white">核心落地</Badge>
              </h3>
              <p className="text-xs text-slate-600">5大策略类别 · 目标贡献率100% · 可执行性强</p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 h-8"
            onClick={() => setShowExecutionPlan(true)}
          >
            <Eye className="w-3.5 h-3.5" />
            查看全部计划
          </Button>
        </div>

        {/* 策略贡献雷达图 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={strategyRadarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="strategy" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} />
                <Radar 
                  name="目标贡献率" 
                  dataKey="contribution" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6} 
                />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 策略贡献占比 */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-2">
              {executionStrategies.map((strategy, idx) => (
                <div 
                  key={strategy.id}
                  className="bg-white rounded-lg p-3 border-2 border-slate-200 hover:border-emerald-300 cursor-pointer transition-all"
                  onClick={() => setSelectedStrategy(strategy.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        strategy.priority === 'high' ? 'bg-red-500' : 
                        strategy.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <p className="font-semibold text-slate-900 text-xs">{strategy.category}</p>
                    </div>
                    <Badge className={getPriorityBadge(strategy.priority)} variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {strategy.priority === 'high' ? '高' : strategy.priority === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">目标贡献:</span>
                      <span className="font-semibold text-purple-600">{strategy.targetContribution}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">预期收入:</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(strategy.expectedRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">行动项:</span>
                      <span className="font-semibold">{strategy.actions.length}个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">时间线:</span>
                      <span className="font-semibold text-blue-600">{strategy.timeline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 展开的策略详情 */}
        {selectedStrategy && (() => {
          const strategy = executionStrategies.find(s => s.id === selectedStrategy);
          if (!strategy) return null;
          return (
            <div className="mt-3 bg-white rounded-lg p-4 border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  {strategy.category} - 行动清单
                </h4>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7"
                  onClick={() => setSelectedStrategy(null)}
                >
                  收起
                </Button>
              </div>
              <div className="space-y-2">
                {strategy.actions.map((action, idx) => (
                  <div key={idx} className="bg-slate-50 rounded p-2.5 border border-slate-200">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {action.status === 'active' ? (
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                        ) : action.status === 'completed' ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-slate-900 text-xs">{action.action}</p>
                          <Badge className={getStatusBadge(action.status).style} variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {getStatusBadge(action.status).label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-600">负责人: </span>
                            <span className="font-semibold">{action.owner}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">频率: </span>
                            <span className="font-semibold">{action.frequency}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">KPI: </span>
                            <span className="font-semibold text-purple-600">{action.kpi}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Card>

      {/* 🔥 目标达成路径（Milestone）*/}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flag className="w-4 h-4 text-purple-600" />
          <h3 className="text-slate-900 font-semibold text-sm">
            目标达成路径与里程碑
          </h3>
        </div>
        <div className="relative">
          {/* 时间线 */}
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-300" />
          
          <div className="space-y-4">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="relative pl-16">
                {/* 时间点 */}
                <div className="absolute left-0 top-0 flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    milestone.status === 'exceed' ? 'bg-purple-600' :
                    milestone.status === 'on-track' ? 'bg-emerald-600' :
                    milestone.status === 'at-risk' ? 'bg-orange-600' :
                    'bg-blue-600'
                  }`}>
                    {milestone.status === 'exceed' ? (
                      <Award className="w-7 h-7 text-white" />
                    ) : milestone.status === 'on-track' ? (
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    ) : milestone.status === 'at-risk' ? (
                      <AlertTriangle className="w-7 h-7 text-white" />
                    ) : (
                      <Target className="w-7 h-7 text-white" />
                    )}
                  </div>
                </div>

                {/* 内容卡片 */}
                <Card className={`p-3 ${
                  milestone.status === 'exceed' ? 'border-2 border-purple-300 bg-purple-50' :
                  milestone.status === 'on-track' ? 'border-2 border-emerald-300 bg-emerald-50' :
                  milestone.status === 'at-risk' ? 'border-2 border-orange-300 bg-orange-50' :
                  'border-2 border-blue-300 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 text-sm">{milestone.title}</p>
                        <Badge className={getStatusBadge(milestone.status).style} variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {getStatusBadge(milestone.status).label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{milestone.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">目标 vs 预测</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(milestone.target)} 
                        <ArrowRight className="inline w-3 h-3 mx-1" />
                        <span className={milestone.gap >= 0 ? 'text-emerald-600' : 'text-orange-600'}>
                          {formatCurrency(milestone.predicted)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                    <div className="bg-white rounded p-1.5 border">
                      <span className="text-slate-600">差距: </span>
                      <span className={`font-semibold ${milestone.gap >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {milestone.gap >= 0 ? '+' : ''}{formatCurrency(milestone.gap)}
                      </span>
                    </div>
                    <div className="bg-white rounded p-1.5 border">
                      <span className="text-slate-600">完成率: </span>
                      <span className="font-semibold text-purple-600">
                        {((milestone.predicted / milestone.target) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-900 mb-1.5">行动建议：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {milestone.actions.map((action, aidx) => (
                        <Badge key={aidx} className="bg-white border-slate-300 text-xs" variant="outline" style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 🔥 风险评估与应对 */}
      <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
              风险评估与应对策略
            </h3>
            <p className="text-xs text-slate-600">识别潜在风险 · 评估影响程度 · 制定缓解措施</p>
          </div>
        </div>

        <div className="space-y-2">
          {risks.map((risk, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border-2 border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <p className="font-semibold text-slate-900 text-sm">{risk.risk}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <Badge className={
                      risk.probability === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                      risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-blue-100 text-blue-700 border-blue-300'
                    } variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      概率: {risk.probability === 'high' ? '高' : risk.probability === 'medium' ? '中' : '低'}
                    </Badge>
                    <Badge className={
                      risk.impact === 'high' ? 'bg-red-100 text-red-700 border-red-300' :
                      risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                      'bg-blue-100 text-blue-700 border-blue-300'
                    } variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      影响: {risk.impact === 'high' ? '高' : risk.impact === 'medium' ? '中' : '低'}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-700 border-orange-300" variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      损失: {formatCurrency(risk.potentialLoss)}
                    </Badge>
                    <Badge className={getStatusBadge(risk.status).style} variant="outline" style={{ fontSize: '10px', padding: '1px 6px' }}>
                      {getStatusBadge(risk.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded p-2 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-900 mb-1 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  缓解策略：
                </p>
                <p className="text-xs text-slate-700">{risk.mitigation}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold">负责人:</span> {risk.owner}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 🔥 激励机制 */}
      <Card className="p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-slate-900 font-semibold flex items-center gap-2" style={{ fontSize: '16px' }}>
              激励机制与奖励计划
            </h3>
            <p className="text-xs text-slate-600">个人激励 · 团队奖金 · 荣誉表彰</p>
          </div>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="individual" className="text-xs">个人奖金</TabsTrigger>
            <TabsTrigger value="team" className="text-xs">团队激励</TabsTrigger>
            <TabsTrigger value="recognition" className="text-xs">荣誉表彰</TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="mt-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {incentivePlan.individual.map((tier, idx) => (
                <Card key={idx} className={`p-3 border-2 ${
                  idx === 0 ? 'border-amber-300 bg-amber-50' :
                  idx === 1 ? 'border-slate-300 bg-slate-50' :
                  idx === 2 ? 'border-yellow-300 bg-yellow-50' :
                  'border-purple-300 bg-purple-50'
                }`}>
                  <div className="text-center mb-2">
                    <Award className={`w-8 h-8 mx-auto mb-1.5 ${
                      idx === 0 ? 'text-amber-600' :
                      idx === 1 ? 'text-slate-600' :
                      idx === 2 ? 'text-yellow-600' :
                      'text-purple-600'
                    }`} />
                    <p className="font-semibold text-slate-900 text-xs">{tier.tier}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600 mb-0.5">{tier.bonus}%</p>
                    <p className="text-xs text-slate-600">{tier.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-3">
            <div className="space-y-2">
              {incentivePlan.team.map((item, idx) => (
                <Card key={idx} className="p-3 border-2 border-emerald-200 bg-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.milestone}</p>
                        <p className="text-xs text-slate-600">达成标准: {item.criteria}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-500 text-white text-xs">
                        {item.reward}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recognition" className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {incentivePlan.recognition.map((item, idx) => (
                <Card key={idx} className="p-3 border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <p className="font-semibold text-slate-900 text-xs">{item}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* 设置目标Dialog */}
      <Dialog open={showSetTarget} onOpenChange={setShowSetTarget}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              设置销售目标
            </DialogTitle>
            <DialogDescription>
              基于SMART原则设定科学合理的销售目标
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>年度目标（USD）</Label>
                <Input type="number" defaultValue={targetData.annualTarget} />
              </div>
              <div>
                <Label>Q4目标（USD）</Label>
                <Input type="number" defaultValue={targetData.quarterTarget} />
              </div>
              <div>
                <Label>本月目标（USD）</Label>
                <Input type="number" defaultValue={targetData.monthTarget} />
              </div>
              <div>
                <Label>本周目标（USD）</Label>
                <Input type="number" defaultValue={targetData.weekTarget} />
              </div>
            </div>

            <div>
              <Label>目标设定依据</Label>
              <Textarea 
                placeholder="请说明目标设定的依据（历史数据、市场分析、资源评估等）"
                rows={3}
              />
            </div>

            <div>
              <Label>关键策略</Label>
              <Textarea 
                placeholder="达成目标的关键策略和行动计划"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSetTarget(false)}>
              取消
            </Button>
            <Button onClick={handleSetTarget} className="bg-purple-600 hover:bg-purple-700">
              保存目标
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 执行计划详情Dialog */}
      <Dialog open={showExecutionPlan} onOpenChange={setShowExecutionPlan}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-600" />
              完整执行计划
            </DialogTitle>
            <DialogDescription>
              5大策略类别 · {executionStrategies.reduce((sum, s) => sum + s.actions.length, 0)}个具体行动项
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {executionStrategies.map((strategy) => (
              <Card key={strategy.id} className="p-4 border-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      {strategy.category}
                      <Badge className={getPriorityBadge(strategy.priority)} variant="outline">
                        {strategy.priority === 'high' ? '高优先级' : strategy.priority === 'medium' ? '中优先级' : '低优先级'}
                      </Badge>
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-slate-600">目标贡献: <span className="font-semibold text-purple-600">{strategy.targetContribution}%</span></span>
                      <span className="text-slate-600">预期收入: <span className="font-semibold text-emerald-600">{formatCurrency(strategy.expectedRevenue)}</span></span>
                      <span className="text-slate-600">时间线: <span className="font-semibold">{strategy.timeline}</span></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {strategy.actions.map((action, idx) => (
                    <div key={idx} className="bg-slate-50 rounded p-3 border">
                      <div className="flex items-start gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm mb-2">{action.action}</p>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-slate-600">负责人:</span>
                              <p className="font-semibold">{action.owner}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">频率:</span>
                              <p className="font-semibold">{action.frequency}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">KPI:</span>
                              <p className="font-semibold text-purple-600">{action.kpi}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">状态:</span>
                              <Badge className={getStatusBadge(action.status).style} variant="outline">
                                {getStatusBadge(action.status).label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
