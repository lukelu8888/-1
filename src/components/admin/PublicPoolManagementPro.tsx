import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';
import { 
  Waves,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserPlus,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Globe,
  Building2,
  Users,
  Users2,
  Target,
  DollarSign,
  Zap,
  MapPin,
  Calendar,
  Activity,
  Award,
  BarChart3,
  Settings,
  Download,
  Upload,
  ArrowRight,
  Sparkles,
  Shield,
  Crown,
  Briefcase,
  Factory,
  Store,
  Hammer,
  UserCheck,
  ClipboardCheck,
  Tag,
  Linkedin,
  Facebook,
  Mail,
  Phone,
  FileText,
  Package,
  Lightbulb,
  Wrench,
  HardHat,
  Droplet,
  DoorOpen,
  Gauge,
  ShoppingCart,
  Truck,
  X,
  Plus,
  Flame,
  ThermometerSun,
  Wind,
  Snowflake,
  MessageSquare,
  Link2,
  Radio,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  Info
} from 'lucide-react';

interface PublicPoolManagementProProps {
  userRole?: string;
  userRegion?: string;
}

// 🎯 客户来源分类（12种专业渠道）
const CUSTOMER_SOURCES = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600', category: '社媒平台' },
  { value: 'facebook', label: 'Facebook/Instagram', icon: Facebook, color: 'bg-blue-500', category: '社媒平台' },
  { value: 'alibaba', label: 'Alibaba', icon: ShoppingCart, color: 'bg-orange-600', category: 'B2B平台' },
  { value: 'global_sources', label: 'Global Sources', icon: Globe, color: 'bg-red-600', category: 'B2B平台' },
  { value: 'trade_show', label: '展会活动', icon: Users, color: 'bg-purple-600', category: '线下渠道' },
  { value: 'website_inquiry', label: '官网询盘', icon: MessageSquare, color: 'bg-green-600', category: '官网渠道' },
  { value: 'google_ads', label: 'Google广告', icon: Target, color: 'bg-yellow-600', category: '搜索引擎' },
  { value: 'seo', label: 'SEO自然流量', icon: TrendingUp, color: 'bg-emerald-600', category: '搜索引擎' },
  { value: 'email_marketing', label: '邮件营销', icon: Mail, color: 'bg-indigo-600', category: '营销推广' },
  { value: 'referral', label: '客户转介绍', icon: Users, color: 'bg-pink-600', category: '转介绍' },
  { value: 'partner', label: '合作伙伴推荐', icon: Link2, color: 'bg-cyan-600', category: '合作渠道' },
  { value: 'cold_outreach', label: '主动开发', icon: Phone, color: 'bg-slate-600', category: '主动开发' },
  { value: 'industry_directory', label: '行业目录', icon: FileText, color: 'bg-amber-600', category: '目录平台' },
  { value: 'bidding', label: '竞标项目', icon: Award, color: 'bg-rose-600', category: '项目竞标' },
  { value: 'other', label: '其他渠道', icon: Radio, color: 'bg-gray-600', category: '其他' }
];

// 🏢 企业性质分类（核心5+1类客户类型，排除电商）
const ENTERPRISE_TYPES = [
  { value: 'retailer', label: '建材零售商', icon: Store, color: 'blue', priority: 'S', description: '实体门店，稳定采购' },
  { value: 'project_contractor', label: '项目承包商', icon: Building2, color: 'orange', priority: 'S', description: '大型项目，一站式采购' },
  { value: 'inspection_seeker', label: '验货客户', icon: Shield, color: 'cyan', priority: 'A', description: '需要验货+采购服务' },
  { value: 'agency_seeker', label: '中国代理', icon: Users2, color: 'purple', priority: 'S', description: '需要长期采购代理' },
  { value: 'local_manufacturer', label: '本土工厂', icon: Factory, color: 'green', priority: 'S', description: '原材料高频采购' },
  { value: 'wholesaler', label: '批发商', icon: Package, color: 'indigo', priority: 'A', description: '大宗批发分销' }
];

// 💼 业务类型（5种核心合作模式）
const BUSINESS_TYPES = [
  { 
    value: 'trading', 
    label: '直接采购', 
    icon: Store,
    priority: 'A',
    color: 'blue',
    avgValue: '$50K-200K',
    margin: '18-25%',
    cycle: '30-45天',
    description: '客户直接采购产品，我方负责采购和发货'
  },
  { 
    value: 'inspection', 
    label: '验货服务', 
    icon: ClipboardCheck,
    priority: 'A',
    color: 'green',
    avgValue: '$20K-100K',
    margin: '25-35%',
    cycle: '15-30天',
    description: '为客户提供第三方验货服务'
  },
  { 
    value: 'agency', 
    label: '代理服务', 
    icon: UserCheck,
    priority: 'S',
    color: 'purple',
    avgValue: '$100K-1M/年',
    margin: '12-18%',
    cycle: '长期合作',
    description: '作为客户的中国采购代理'
  },
  { 
    value: 'project', 
    label: '一站式项目', 
    icon: Hammer,
    priority: 'S',
    color: 'orange',
    avgValue: '$80K-500K',
    margin: '15-22%',
    cycle: '60-90天',
    description: '为客户提供采购+验货+物流的一站式服务'
  },
  {
    value: 'manufacturing',
    label: '原材料供应',
    icon: Factory,
    priority: 'S',
    color: 'teal',
    avgValue: '$30K-150K',
    margin: '15-20%',
    cycle: '长期合作',
    description: '为本地加工厂提供原材料和配件'
  }
];

// 🏭 行业类别（二级分类）
const INDUSTRY_CATEGORIES = {
  electrical: {
    label: '电气类',
    icon: Zap,
    color: 'yellow',
    subcategories: [
      { value: 'switches_sockets', label: '开关插座' },
      { value: 'circuit_breaker', label: '断路器' },
      { value: 'distribution_box', label: '配电箱' },
      { value: 'cable_wire', label: '电线电缆' },
      { value: 'lighting', label: '照明设备' }
    ]
  },
  sanitary: {
    label: '卫浴类',
    icon: Droplet,
    color: 'blue',
    subcategories: [
      { value: 'faucet', label: '水龙头' },
      { value: 'shower', label: '花洒' },
      { value: 'toilet', label: '马桶/坐便器' },
      { value: 'bathroom_cabinet', label: '浴室柜' },
      { value: 'hardware', label: '五金配件' }
    ]
  },
  door_window: {
    label: '门窗配件',
    icon: DoorOpen,
    color: 'indigo',
    subcategories: [
      { value: 'hinge', label: '合页铰链' },
      { value: 'door_closer', label: '闭门器' },
      { value: 'lock', label: '门锁' },
      { value: 'sliding_rail', label: '滑轨' },
      { value: 'glass_hardware', label: '玻璃五金' }
    ]
  },
  safety: {
    label: '劳保用品',
    icon: HardHat,
    color: 'orange',
    subcategories: [
      { value: 'helmet', label: '安全帽' },
      { value: 'gloves', label: '手套' },
      { value: 'protective_clothing', label: '防护服' },
      { value: 'safety_shoes', label: '安全鞋' },
      { value: 'goggles', label: '防护眼镜' }
    ]
  },
  hardware: {
    label: '建筑五金',
    icon: Wrench,
    color: 'slate',
    subcategories: [
      { value: 'fastener', label: '紧固件' },
      { value: 'tools', label: '工具' },
      { value: 'scaffold', label: '脚手架配件' },
      { value: 'decorative_hardware', label: '装饰五金' }
    ]
  },
  decoration: {
    label: '装饰材料',
    icon: Sparkles,
    color: 'purple',
    subcategories: [
      { value: 'aluminum_profile', label: '铝型材' },
      { value: 'decorative_panel', label: '装饰板' },
      { value: 'ceiling_material', label: '吊顶材料' }
    ]
  }
};

// 🔥 意向度等级（科学分级）
const INTENT_LEVELS = [
  { 
    value: 'S', 
    label: 'S级（Super Hot）', 
    icon: Flame, 
    color: 'bg-red-600 text-white',
    probability: '90%+',
    timeline: '7天内',
    description: '高概率成交，需立即跟进'
  },
  { 
    value: 'A', 
    label: 'A级（Hot）', 
    icon: ThermometerSun, 
    color: 'bg-orange-600 text-white',
    probability: '60-89%',
    timeline: '15天内',
    description: '有明确采购意向，需重点关注'
  },
  { 
    value: 'B', 
    label: 'B级（Warm）', 
    icon: Wind, 
    color: 'bg-yellow-600 text-white',
    probability: '30-59%',
    timeline: '30天内',
    description: '需重点培育，定期跟进'
  },
  { 
    value: 'C', 
    label: 'C级（Cold）', 
    icon: Snowflake, 
    color: 'bg-slate-600 text-white',
    probability: '<30%',
    timeline: '长期',
    description: '长期培育客户，低频跟进'
  }
];

// 📊 客户评分维度
const SCORE_DIMENSIONS = [
  { key: 'info_completeness', label: '信息完整度', weight: 20, icon: FileText },
  { key: 'response_speed', label: '沟通响应速度', weight: 20, icon: Zap },
  { key: 'budget_clarity', label: '采购预算明确度', weight: 20, icon: DollarSign },
  { key: 'decision_power', label: '决策权限', weight: 20, icon: Crown },
  { key: 'urgency', label: '时间紧迫度', weight: 20, icon: Clock }
];

// 🏷️ 智能标签库
const AUTO_TAGS = {
  behavior: [
    { value: 'high_response', label: '高响应率', color: 'green' },
    { value: 'fast_decision', label: '快速决策', color: 'blue' },
    { value: 'large_budget', label: '大额预算', color: 'purple' },
    { value: 'multi_category', label: '多品类采购', color: 'orange' },
    { value: 'long_term', label: '长期合作潜力', color: 'indigo' }
  ],
  risk: [
    { value: 'price_sensitive', label: '价格敏感', color: 'yellow' },
    { value: 'quality_focused', label: '质量要求高', color: 'emerald' },
    { value: 'competitor_client', label: '竞争对手客户', color: 'red' },
    { value: 'payment_risk', label: '付款风险', color: 'rose' }
  ],
  opportunity: [
    { value: 'vip_potential', label: 'VIP潜力', color: 'amber' },
    { value: 'focus_account', label: '重点关注', color: 'cyan' },
    { value: 'urgent_need', label: '紧急需求', color: 'red' },
    { value: 'expansion_opportunity', label: '扩展机会', color: 'violet' }
  ]
};

// 🕵️ 背调状态
const DUE_DILIGENCE_STATUS = [
  { value: 'pending', label: '待背调', icon: Clock, color: 'slate' },
  { value: 'in_progress', label: '背调中', icon: Activity, color: 'blue' },
  { value: 'approved', label: '背调通过', icon: CheckCircle2, color: 'green' },
  { value: 'questioned', label: '背调存疑', icon: AlertCircle, color: 'yellow' },
  { value: 'rejected', label: '背调失败', icon: X, color: 'red' }
];

export default function PublicPoolManagementPro({ userRole = 'Sales_Rep', userRegion = 'north_america' }: PublicPoolManagementProProps) {
  // 🔥 业务员只能看到自己负责的区域，其他角色可以切换区域
  const [selectedRegion, setSelectedRegion] = useState<string>(
    userRole === 'Sales_Rep' ? userRegion : 'north_america'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // 筛选条件（增强版）
  const [filters, setFilters] = useState({
    // 基础筛选
    businessType: 'all',
    enterpriseType: 'all',
    source: 'all',
    intentLevel: 'all',
    // 行业筛选
    industry: 'all',
    subIndustry: 'all',
    // 规模筛选
    employeeCount: 'all',
    annualPurchase: 'all',
    // 状态筛选
    dueDiligence: 'all',
    claimStatus: 'all',
    // 评分筛选
    minScore: 0,
    maxScore: 100,
    // 时间筛选
    addTime: 'all',
    // 标签筛选
    tags: [] as string[]
  });

  // 🌊 公海池总览数据（增强版）
  const poolOverview = {
    north_america: {
      region: '北美公海池',
      icon: '🇺🇸',
      totalLeads: 328,
      newToday: 23,
      hotLeads: 45, // S+A级
      avgScore: 67,
      avgClaimTime: '2.5小时',
      claimRate: 85,
      conversionRate: 42, // 转化率
      healthStatus: 'healthy',
      topSources: ['LinkedIn', 'Google Ads', '展会'],
      topIndustries: ['电气类', '卫浴类', '门窗配件']
    },
    south_america: {
      region: '南美公海池',
      icon: '🇧🇷',
      totalLeads: 156,
      newToday: 8,
      hotLeads: 18,
      avgScore: 58,
      avgClaimTime: '3.8小时',
      claimRate: 78,
      conversionRate: 35,
      healthStatus: 'healthy',
      topSources: ['Alibaba', 'B2B平台', '官网询盘'],
      topIndustries: ['劳保用品', '建筑五金', '电气类']
    },
    europe_africa: {
      region: '欧非公海池',
      icon: '🇪🇺',
      totalLeads: 241,
      newToday: 15,
      hotLeads: 32,
      avgScore: 72,
      avgClaimTime: '2.1小时',
      claimRate: 92,
      conversionRate: 48,
      healthStatus: 'excellent',
      topSources: ['展会', 'SEO', '客户转介绍'],
      topIndustries: ['卫浴类', '装饰材料', '门窗配件']
    }
  };

  // 📊 模拟客户数据（增强版）
  const mockCustomers = [
    {
      id: 'PC-NA-001',
      companyName: 'BuildPro Solutions Inc.',
      contactPerson: 'John Smith',
      country: 'United States',
      city: 'Los Angeles',
      source: 'linkedin',
      businessType: 'trading',
      enterpriseType: 'distributor',
      industry: 'electrical',
      subIndustry: 'switches_sockets',
      intentLevel: 'S',
      score: 92,
      estimatedValue: '$180K',
      addedDate: '2024-12-01',
      addedTime: '2小时前',
      dueDiligence: 'pending',
      claimStatus: 'available',
      employeeCount: '50-200',
      annualPurchase: '$500K-1M',
      tags: ['high_response', 'large_budget', 'vip_potential'],
      lastActivity: '主动询价，要求样品和价格表',
      urgency: 'high',
      decisionMaker: true,
      responseRate: '95%',
      avgResponseTime: '30分钟'
    },
    {
      id: 'PC-NA-002',
      companyName: 'HomeDepot Suppliers LLC',
      contactPerson: 'Sarah Johnson',
      country: 'Canada',
      city: 'Toronto',
      source: 'google_ads',
      businessType: 'project',
      enterpriseType: 'importer',
      industry: 'sanitary',
      subIndustry: 'faucet',
      intentLevel: 'A',
      score: 78,
      estimatedValue: '$320K',
      addedDate: '2024-11-30',
      addedTime: '5小时前',
      dueDiligence: 'in_progress',
      claimStatus: 'available',
      employeeCount: '200-500',
      annualPurchase: '$1M-5M',
      tags: ['multi_category', 'long_term', 'quality_focused'],
      lastActivity: '填写了详细询盘表单，咨询批量采购',
      urgency: 'medium',
      decisionMaker: true,
      responseRate: '88%',
      avgResponseTime: '1小时'
    },
    {
      id: 'PC-NA-003',
      companyName: 'Industrial Hardware Co.',
      contactPerson: 'Michael Brown',
      country: 'United States',
      city: 'Chicago',
      source: 'trade_show',
      businessType: 'agency',
      enterpriseType: 'trader',
      industry: 'hardware',
      subIndustry: 'fastener',
      intentLevel: 'A',
      score: 85,
      estimatedValue: '$150K-500K/年',
      addedDate: '2024-11-29',
      addedTime: '1天前',
      dueDiligence: 'approved',
      claimStatus: 'available',
      employeeCount: '100-200',
      annualPurchase: '$2M-5M',
      tags: ['fast_decision', 'long_term', 'focus_account'],
      lastActivity: '展会现场深度沟通，交换名片',
      urgency: 'medium',
      decisionMaker: false,
      responseRate: '82%',
      avgResponseTime: '2小时'
    },
    {
      id: 'PC-NA-004',
      companyName: 'SafeWork Equipment',
      contactPerson: 'Emily Davis',
      country: 'United States',
      city: 'New York',
      source: 'alibaba',
      businessType: 'trading',
      enterpriseType: 'ecommerce',
      industry: 'safety',
      subIndustry: 'helmet',
      intentLevel: 'B',
      score: 65,
      estimatedValue: '$45K',
      addedDate: '2024-11-28',
      addedTime: '2天前',
      dueDiligence: 'pending',
      claimStatus: 'available',
      employeeCount: '10-50',
      annualPurchase: '$100K-500K',
      tags: ['price_sensitive', 'urgent_need'],
      lastActivity: 'B2B平台询价，比较多家供应商',
      urgency: 'low',
      decisionMaker: true,
      responseRate: '70%',
      avgResponseTime: '4小时'
    },
    {
      id: 'PC-NA-005',
      companyName: 'Window & Door Specialists',
      contactPerson: 'David Wilson',
      country: 'United States',
      city: 'Miami',
      source: 'website_inquiry',
      businessType: 'inspection',
      enterpriseType: 'project_contractor',
      industry: 'door_window',
      subIndustry: 'door_closer',
      intentLevel: 'S',
      score: 88,
      estimatedValue: '$95K',
      addedDate: '2024-12-01',
      addedTime: '3小时前',
      dueDiligence: 'in_progress',
      claimStatus: 'available',
      employeeCount: '50-100',
      annualPurchase: '$500K-1M',
      tags: ['high_response', 'quality_focused', 'vip_potential'],
      lastActivity: '官网提交详细项目需求',
      urgency: 'high',
      decisionMaker: true,
      responseRate: '92%',
      avgResponseTime: '20分钟'
    }
  ];

  // 获取当前区域的客户数据
  const currentPoolData = poolOverview[selectedRegion as keyof typeof poolOverview];

  // 处理认领
  const handleClaim = (customer: any) => {
    setSelectedCustomer(customer);
    setShowClaimDialog(true);
  };

  const confirmClaim = () => {
    toast.success(`已成功认领客户：${selectedCustomer?.companyName}`);
    setShowClaimDialog(false);
  };

  // 查看详情
  const handleViewDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);
  };

  // 获取来源图标和标签
  const getSourceDisplay = (sourceValue: string) => {
    const source = CUSTOMER_SOURCES.find(s => s.value === sourceValue);
    if (!source) return null;
    const Icon = source.icon;
    return (
      <div className="flex items-center gap-2">
        <div className={`${source.color} p-1.5 rounded`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs">{source.label}</span>
      </div>
    );
  };

  // 获取意向度显示
  const getIntentDisplay = (level: string) => {
    const intent = INTENT_LEVELS.find(i => i.value === level);
    if (!intent) return null;
    const Icon = intent.icon;
    return (
      <Badge className={intent.color}>
        <Icon className="w-3 h-3 mr-1" />
        {intent.value}级
      </Badge>
    );
  };

  // 获取背调状态显示
  const getDueDiligenceDisplay = (status: string) => {
    const dd = DUE_DILIGENCE_STATUS.find(d => d.value === status);
    if (!dd) return null;
    const Icon = dd.icon;
    return (
      <Badge variant="outline" className={`text-${dd.color}-600 border-${dd.color}-300`}>
        <Icon className="w-3 h-3 mr-1" />
        {dd.label}
      </Badge>
    );
  };

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '24px', fontWeight: 700 }}>
            <Waves className="w-7 h-7 text-blue-600" />
            公海客户池管理 Pro
            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
              智能分池
            </Badge>
            {/* 🔥 角色标识 */}
            {userRole === 'Marketing_Ops' && (
              <Badge className="bg-orange-500 text-white">运营专员视图</Badge>
            )}
            {userRole === 'Sales_Rep' && (
              <Badge className="bg-cyan-500 text-white">业务员视图</Badge>
            )}
            {userRole === 'Sales_Manager' && (
              <Badge className="bg-green-500 text-white">区域主管视图</Badge>
            )}
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            {userRole === 'Marketing_Ops' && '运营专员：筛选合格客户并投放到公海池，监控投放效果和转化数据'}
            {userRole === 'Sales_Rep' && '业务员：浏览公海池客户，认领后进行背调和精准开发，7天保护期'}
            {userRole === 'Sales_Manager' && '区域主管：管理区域公海池，分配客户给团队成员，监控池子健康度'}
            {!['Marketing_Ops', 'Sales_Rep', 'Sales_Manager'].includes(userRole || '') && '社媒引流客户智能分类管理，支持15种来源渠道，4种业务模式，6大行业分类'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 🔥 运营专员：投放按钮 */}
          {userRole === 'Marketing_Ops' && (
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Upload className="w-4 h-4" />
              投放客户到公海池
            </Button>
          )}
          
          {/* 🔥 所有角色：通用按钮 */}
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            导出数据
          </Button>
          
          {/* 🔥 区域主管：分配规则 */}
          {(userRole === 'Sales_Manager' || userRole === 'Marketing_Ops') && (
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              分配规则
            </Button>
          )}
          
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 🔥 业务员区域锁定提示 */}
      {userRole === 'Sales_Rep' && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-600" />
            <div>
              <p className="font-semibold text-cyan-900" style={{ fontSize: '14px' }}>
                您当前只能查看 <span className="text-cyan-600">{userRegion === 'north_america' ? '北美' : userRegion === 'south_america' ? '南美' : '欧非'}</span> 区域公海池
              </p>
              <p className="text-xs text-cyan-700 mt-1">
                如需访问其他区域，请联系您的区域主管
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 三大公海池选择（增强版） */}
      <Tabs value={selectedRegion} onValueChange={(value) => {
        // 🔥 业务员不能切换区域
        if (userRole === 'Sales_Rep') {
          toast.error('您只能访问自己负责的区域');
          return;
        }
        setSelectedRegion(value);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-2 bg-slate-100">
          {Object.entries(poolOverview).map(([key, data]) => (
            <TabsTrigger 
              key={key}
              value={key} 
              className="flex flex-col items-start gap-2 p-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">{data.icon}</span>
                <span className="font-semibold">{data.region}</span>
                {data.newToday > 0 && (
                  <Badge className="bg-red-500 text-white ml-auto">{data.newToday} 新</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 w-full flex-wrap">
                <span>总数：{data.totalLeads}</span>
                <span>热度：{data.hotLeads}</span>
                <span>均分：{data.avgScore}</span>
                <span className={`ml-auto ${data.conversionRate >= 45 ? 'text-green-600' : data.conversionRate >= 35 ? 'text-blue-600' : 'text-yellow-600'}`}>
                  转化率 {data.conversionRate}%
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 公海池内容 */}
        {Object.entries(poolOverview).map(([key, data]) => (
          <TabsContent key={key} value={key} className="space-y-6 mt-6">
            {/* 数据概览卡片（增强版） */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">客户总数</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{data.totalLeads}</p>
                    <p className="text-xs text-green-600 mt-1">+{data.newToday} 今日新增</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">热度客户（S+A级）</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{data.hotLeads}</p>
                    <p className="text-xs text-orange-600 mt-1">{Math.round(data.hotLeads/data.totalLeads*100)}% 热度占比</p>
                  </div>
                  <Flame className="w-8 h-8 text-orange-400" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">平均评分</p>
                    <p className={`text-2xl font-bold mt-1 ${getScoreColor(data.avgScore)}`}>{data.avgScore}</p>
                    <p className="text-xs text-purple-600 mt-1">满分100分</p>
                  </div>
                  <Star className="w-8 h-8 text-purple-400" />
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600">转化率</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{data.conversionRate}%</p>
                    <p className="text-xs text-green-600 mt-1">认领率 {data.claimRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </Card>
            </div>

            {/* 热门来源和行业 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">热门客户来源 Top 3</h3>
                </div>
                <div className="space-y-2">
                  {data.topSources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm text-slate-700">{idx + 1}. {source}</span>
                      <Badge variant="outline" className="text-xs">{Math.round(Math.random() * 30 + 20)}%</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">热门行业类别 Top 3</h3>
                </div>
                <div className="space-y-2">
                  {data.topIndustries.map((industry, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm text-slate-700">{idx + 1}. {industry}</span>
                      <Badge variant="outline" className="text-xs">{Math.round(Math.random() * 25 + 15)}%</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 搜索和筛选栏（增强版） */}
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="搜索公司名称、联系人、国家/城市、标签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  筛选 {Object.values(filters).filter(v => v !== 'all' && (Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 100)).length > 0 && `(${Object.values(filters).filter(v => v !== 'all' && (Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 100)).length})`}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  高级筛选
                </Button>
              </div>

              {/* 基础筛选面板 */}
              {showFilters && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* 业务类型 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">业务类型</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.businessType}
                        onChange={(e) => setFilters({...filters, businessType: e.target.value})}
                      >
                        <option value="all">全部类型</option>
                        {BUSINESS_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label} ({type.priority}级)</option>
                        ))}
                      </select>
                    </div>

                    {/* 企业性质 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">企业性质</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.enterpriseType}
                        onChange={(e) => setFilters({...filters, enterpriseType: e.target.value})}
                      >
                        <option value="all">全部性质</option>
                        {ENTERPRISE_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 意向度 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">意向度等级</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.intentLevel}
                        onChange={(e) => setFilters({...filters, intentLevel: e.target.value})}
                      >
                        <option value="all">全部等级</option>
                        {INTENT_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 客户来源 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">客户来源</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.source}
                        onChange={(e) => setFilters({...filters, source: e.target.value})}
                      >
                        <option value="all">全部来源</option>
                        {CUSTOMER_SOURCES.map(source => (
                          <option key={source.value} value={source.value}>{source.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 行业类别 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">行业类别</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.industry}
                        onChange={(e) => setFilters({...filters, industry: e.target.value, subIndustry: 'all'})}
                      >
                        <option value="all">全部行业</option>
                        {Object.entries(INDUSTRY_CATEGORIES).map(([key, cat]) => (
                          <option key={key} value={key}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 背调状态 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">背调状态</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.dueDiligence}
                        onChange={(e) => setFilters({...filters, dueDiligence: e.target.value})}
                      >
                        <option value="all">全部状态</option>
                        {DUE_DILIGENCE_STATUS.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 认领状态 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">认领状态</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.claimStatus}
                        onChange={(e) => setFilters({...filters, claimStatus: e.target.value})}
                      >
                        <option value="all">全部状态</option>
                        <option value="available">可认领</option>
                        <option value="claimed">已认领</option>
                        <option value="protected">保护期</option>
                      </select>
                    </div>

                    {/* 添加时间 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">添加时间</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.addTime}
                        onChange={(e) => setFilters({...filters, addTime: e.target.value})}
                      >
                        <option value="all">全部时间</option>
                        <option value="today">今天</option>
                        <option value="yesterday">昨天</option>
                        <option value="week">近7天</option>
                        <option value="month">近30天</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      已筛选条件数：<span className="font-semibold text-blue-600">
                        {Object.values(filters).filter(v => v !== 'all' && (Array.isArray(v) ? v.length > 0 : v !== 0 && v !== 100)).length}
                      </span>
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters({
                        businessType: 'all',
                        enterpriseType: 'all',
                        source: 'all',
                        intentLevel: 'all',
                        industry: 'all',
                        subIndustry: 'all',
                        employeeCount: 'all',
                        annualPurchase: 'all',
                        dueDiligence: 'all',
                        claimStatus: 'all',
                        minScore: 0,
                        maxScore: 100,
                        addTime: 'all',
                        tags: []
                      })}
                    >
                      清空筛选
                    </Button>
                  </div>
                </div>
              )}

              {/* 高级筛选面板 */}
              {showAdvancedFilters && (
                <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-slate-900">高级筛选选项</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 评分范围 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">客户评分范围</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          placeholder="最低分"
                          value={filters.minScore}
                          onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value) || 0})}
                          className="text-sm"
                        />
                        <span className="text-slate-400">-</span>
                        <Input 
                          type="number" 
                          placeholder="最高分"
                          value={filters.maxScore}
                          onChange={(e) => setFilters({...filters, maxScore: parseInt(e.target.value) || 100})}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* 员工规模 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">员工规模</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.employeeCount}
                        onChange={(e) => setFilters({...filters, employeeCount: e.target.value})}
                      >
                        <option value="all">全部规模</option>
                        <option value="large">大型企业 (&gt;500人)</option>
                        <option value="medium">中型企业 (100-500人)</option>
                        <option value="small">小型企业 (&lt;100人)</option>
                      </select>
                    </div>

                    {/* 年采购额 */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600">年采购额</Label>
                      <select 
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={filters.annualPurchase}
                        onChange={(e) => setFilters({...filters, annualPurchase: e.target.value})}
                      >
                        <option value="all">全部金额</option>
                        <option value="ultra">&gt;$5M</option>
                        <option value="large">$1M-$5M</option>
                        <option value="medium">$500K-$1M</option>
                        <option value="small">$100K-$500K</option>
                        <option value="mini">&lt;$100K</option>
                      </select>
                    </div>
                  </div>

                  {/* 智能标签筛选 */}
                  <div className="mt-4 space-y-3">
                    <Label className="text-xs text-slate-600">智能标签（多选）</Label>
                    <div className="space-y-2">
                      {Object.entries(AUTO_TAGS).map(([category, tags]) => (
                        <div key={category}>
                          <p className="text-xs text-slate-500 mb-1.5 capitalize">{category}</p>
                          <div className="flex flex-wrap gap-2">
                            {tags.map(tag => (
                              <Badge 
                                key={tag.value}
                                variant={filters.tags.includes(tag.value) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => {
                                  if (filters.tags.includes(tag.value)) {
                                    setFilters({...filters, tags: filters.tags.filter(t => t !== tag.value)});
                                  } else {
                                    setFilters({...filters, tags: [...filters.tags, tag.value]});
                                  }
                                }}
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* 客户列表（增强版） */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  客户列表 
                  <span className="text-sm text-slate-500 ml-2">（共 {mockCustomers.length} 条记录）</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>排序：</span>
                  <select className="border rounded px-2 py-1">
                    <option>评分从高到低</option>
                    <option>意向度优先</option>
                    <option>添加时间最新</option>
                    <option>预估金额最高</option>
                  </select>
                </div>
              </div>

              {mockCustomers.map((customer) => (
                <Card key={customer.id} className="p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    {/* 左侧：客户信息 */}
                    <div className="flex-1 space-y-3">
                      {/* 第一行：公司名和关键标识 */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900" style={{ fontSize: '16px' }}>
                              {customer.companyName}
                            </h3>
                            {getIntentDisplay(customer.intentLevel)}
                            {customer.decisionMaker && (
                              <Badge variant="outline" className="text-purple-600 border-purple-300">
                                <Crown className="w-3 h-3 mr-1" />
                                决策者
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            <Users className="w-3.5 h-3.5 inline mr-1" />
                            {customer.contactPerson} · 
                            <MapPin className="w-3.5 h-3.5 inline mx-1" />
                            {customer.city}, {customer.country}
                          </p>
                        </div>

                        {/* 评分卡片 */}
                        <div className="text-center bg-slate-50 rounded-lg p-2 min-w-[70px]">
                          <div className={`text-xl font-bold ${getScoreColor(customer.score)}`}>
                            {customer.score}
                          </div>
                          <p className="text-xs text-slate-500">综合评分</p>
                        </div>
                      </div>

                      {/* 第二行：关键信息标签 */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-600">
                            {BUSINESS_TYPES.find(t => t.value === customer.businessType)?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-600">
                            {ENTERPRISE_TYPES.find(t => t.value === customer.enterpriseType)?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-600">
                            {INDUSTRY_CATEGORIES[customer.industry as keyof typeof INDUSTRY_CATEGORIES]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-600 font-semibold">{customer.estimatedValue}</span>
                        </div>
                      </div>

                      {/* 第三行：来源和响应数据 */}
                      <div className="flex items-center gap-4">
                        {getSourceDisplay(customer.source)}
                        <div className="flex items-center gap-1.5 text-xs">
                          <Activity className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-slate-600">响应率 {customer.responseRate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-purple-500" />
                          <span className="text-slate-600">平均 {customer.avgResponseTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-600">{customer.addedTime}</span>
                        </div>
                      </div>

                      {/* 第四行：最后活动和标签 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-slate-600 mb-2">
                            <Lightbulb className="w-3.5 h-3.5 inline mr-1 text-yellow-500" />
                            <span className="font-medium">最后活动：</span>{customer.lastActivity}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {customer.tags.map(tagValue => {
                              const tag = [...AUTO_TAGS.behavior, ...AUTO_TAGS.risk, ...AUTO_TAGS.opportunity].find(t => t.value === tagValue);
                              return tag ? (
                                <Badge key={tagValue} variant="outline" className={`text-${tag.color}-600 border-${tag.color}-300 text-xs`}>
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag.label}
                                </Badge>
                              ) : null;
                            })}
                            {getDueDiligenceDisplay(customer.dueDiligence)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 右侧：操作按钮 */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button 
                        className="gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                        onClick={() => handleViewDetail(customer)}
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </Button>
                      {customer.claimStatus === 'available' && userRole === 'Sales_Rep' && (
                        <Button 
                          variant="outline"
                          className="gap-2 whitespace-nowrap"
                          onClick={() => handleClaim(customer)}
                        >
                          <UserPlus className="w-4 h-4" />
                          认领客户
                        </Button>
                      )}
                      {userRole === 'Marketing_Ops' && (
                        <Button 
                          variant="outline"
                          className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 whitespace-nowrap"
                        >
                          <Settings className="w-4 h-4" />
                          编辑
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 分页 */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-slate-600">显示 1-{mockCustomers.length} 条，共 {mockCustomers.length} 条记录</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>上一页</Button>
                <Button variant="outline" size="sm">1</Button>
                <Button variant="outline" size="sm" disabled>下一页</Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* 认领对话框 */}
      <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              认领客户
            </DialogTitle>
            <DialogDescription>
              认领后您将获得该客户的7天保护期，请在保护期内完成背调和初步开发
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-slate-900 mb-2">{selectedCustomer.companyName}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">联系人：</span>
                    <span className="font-medium">{selectedCustomer.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">地区：</span>
                    <span className="font-medium">{selectedCustomer.city}, {selectedCustomer.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">意向度：</span>
                    {getIntentDisplay(selectedCustomer.intentLevel)}
                  </div>
                  <div>
                    <span className="text-slate-600">预估金额：</span>
                    <span className="font-medium text-green-600">{selectedCustomer.estimatedValue}</span>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <Label>认领原因（必填）</Label>
                <Textarea 
                  placeholder="请说明认领该客户的理由，例如：擅长该行业、地区经验、特殊资源等..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>初步跟进计划</Label>
                <Textarea 
                  placeholder="请简述您的跟进计划和时间安排..."
                  rows={3}
                />
              </div>

              <Card className="p-3 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-semibold mb-1">认领须知：</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>认领后自动进入7天保护期，期间其他业务员无法认领</li>
                      <li>保护期内需完成客户背调和至少3次跟进记录</li>
                      <li>如保护期内未完成要求，客户将自动退回公海池</li>
                      <li>每月最多认领10个客户，请谨慎选择</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClaimDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmClaim} className="bg-blue-600 hover:bg-blue-700">
              确认认领
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              客户详细信息
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* 基础信息卡片 */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedCustomer.companyName}</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">联系人：</span>
                        <span className="font-medium">{selectedCustomer.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">地区：</span>
                        <span className="font-medium">{selectedCustomer.city}, {selectedCustomer.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">企业规模：</span>
                        <span className="font-medium">{selectedCustomer.employeeCount}人</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">年采购额：</span>
                        <span className="font-medium">{selectedCustomer.annualPurchase}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                    <div className={`text-3xl font-bold ${getScoreColor(selectedCustomer.score)}`}>
                      {selectedCustomer.score}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">综合评分</p>
                  </div>
                </div>
              </Card>

              {/* 评分详情 */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  评分明细
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SCORE_DIMENSIONS.map(dim => {
                    const Icon = dim.icon;
                    const score = Math.floor(Math.random() * 30 + 70); // 模拟评分
                    return (
                      <Card key={dim.key} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-slate-700">{dim.label}</span>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score}/100</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-blue-600' : score >= 40 ? 'bg-yellow-600' : 'bg-red-600'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* 业务信息 */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  业务信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <p className="text-xs text-slate-600 mb-1">业务类型</p>
                    <p className="font-semibold text-slate-900">
                      {BUSINESS_TYPES.find(t => t.value === selectedCustomer.businessType)?.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {BUSINESS_TYPES.find(t => t.value === selectedCustomer.businessType)?.description}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-slate-600 mb-1">企业性质</p>
                    <p className="font-semibold text-slate-900">
                      {ENTERPRISE_TYPES.find(t => t.value === selectedCustomer.enterpriseType)?.label}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-slate-600 mb-1">目标行业</p>
                    <p className="font-semibold text-slate-900">
                      {INDUSTRY_CATEGORIES[selectedCustomer.industry as keyof typeof INDUSTRY_CATEGORIES]?.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      细分：{INDUSTRY_CATEGORIES[selectedCustomer.industry as keyof typeof INDUSTRY_CATEGORIES]?.subcategories.find(s => s.value === selectedCustomer.subIndustry)?.label}
                    </p>
                  </Card>
                </div>
              </div>

              {/* 客户标签 */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  客户标签
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tagValue: string) => {
                    const tag = [...AUTO_TAGS.behavior, ...AUTO_TAGS.risk, ...AUTO_TAGS.opportunity].find(t => t.value === tagValue);
                    return tag ? (
                      <Badge key={tagValue} className={`bg-${tag.color}-100 text-${tag.color}-700 border-${tag.color}-300`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.label}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              {/* 最后活动 */}
              <Card className="p-4 bg-slate-50">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  最后活动记录
                </h3>
                <p className="text-sm text-slate-700">{selectedCustomer.lastActivity}</p>
                <p className="text-xs text-slate-500 mt-1">时间：{selectedCustomer.addedTime}</p>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            {selectedCustomer?.claimStatus === 'available' && userRole === 'Sales_Rep' && (
              <Button 
                onClick={() => {
                  setShowDetailDialog(false);
                  handleClaim(selectedCustomer);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                认领客户
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
