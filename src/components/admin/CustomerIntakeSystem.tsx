import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Linkedin,
  Facebook,
  Instagram,
  MessageSquare,
  Mail,
  Phone,
  Globe,
  Building2,
  Users,
  Briefcase,
  Package,
  DollarSign,
  Calendar,
  FileText,
  Target,
  Zap,
  TrendingUp,
  Award,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  Download,
  Upload,
  PlayCircle,
  MousePointerClick,
  ArrowRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  XCircle,
  Info,
  CheckCircle,
  Link2,
  ExternalLink,
  Waves,
  UserCheck,
  ClipboardList,
  Hash,
  MapPin,
  AlertTriangle,
  Star,
  Factory,
  Store,
  Shield,
  Users2
} from 'lucide-react';

interface CustomerIntakeSystemProps {
  userRole?: string;
}

// 🎯 详细的客户来源路径分类
const SOURCE_PATHS = {
  social_media: {
    label: '社媒渠道',
    icon: Users,
    color: 'blue',
    paths: [
      {
        value: 'linkedin_dm',
        label: 'LinkedIn私信',
        icon: Linkedin,
        tracking: ['LinkedIn个人主页', 'LinkedIn公司主页', 'LinkedIn广告', 'LinkedIn文章'],
        followUp: 'LinkedIn Messenger'
      },
      {
        value: 'facebook_messenger',
        label: 'Facebook Messenger',
        icon: Facebook,
        tracking: ['Facebook主页', 'Facebook广告', 'Facebook群组', 'Facebook Marketplace'],
        followUp: 'Facebook Messenger'
      },
      {
        value: 'instagram_dm',
        label: 'Instagram私信',
        icon: Instagram,
        tracking: ['Instagram帖子', 'Instagram Story', 'Instagram广告', 'Instagram Reels'],
        followUp: 'Instagram Direct'
      },
      {
        value: 'video_to_website',
        label: '短视频引流',
        icon: PlayCircle,
        tracking: ['TikTok视频', 'YouTube Shorts', 'Instagram Reels', 'Facebook视频'],
        followUp: '点击链接→官网→联系方式'
      },
      {
        value: 'social_ad_click',
        label: '社媒广告点击',
        icon: MousePointerClick,
        tracking: ['LinkedIn Ads', 'Facebook Ads', 'Instagram Ads', 'Twitter Ads'],
        followUp: '广告页面→官网→联系表单'
      }
    ]
  },
  website: {
    label: '官网渠道',
    icon: Globe,
    color: 'green',
    paths: [
      {
        value: 'contact_form',
        label: '官网联系表单',
        icon: FileText,
        tracking: ['Contact Us页面', 'Product页面表单', 'Quote Request表单'],
        followUp: '邮件回复'
      },
      {
        value: 'live_chat',
        label: '在线聊天',
        icon: MessageSquare,
        tracking: ['Intercom', 'Drift', 'Tawk.to', '自建聊天系统'],
        followUp: '实时对话'
      },
      {
        value: 'whatsapp_button',
        label: 'WhatsApp按钮',
        icon: Phone,
        tracking: ['官网WhatsApp浮窗', 'Product页WhatsApp', 'Contact页WhatsApp'],
        followUp: 'WhatsApp Business'
      },
      {
        value: 'email_inquiry',
        label: '邮件询盘',
        icon: Mail,
        tracking: ['info@邮箱', 'sales@邮箱', '个人邮箱'],
        followUp: '邮件往来'
      },
      {
        value: 'wechat_qr',
        label: '微信二维码',
        icon: MessageSquare,
        tracking: ['官网微信二维码', 'PDF资料微信码'],
        followUp: '微信聊天'
      }
    ]
  },
  proactive: {
    label: '主动开发',
    icon: Target,
    color: 'orange',
    paths: [
      {
        value: 'industry_directory',
        label: '行业目录搜索',
        icon: Search,
        tracking: ['建材行业黄页', 'B2B平台目录', 'Google搜索', '行业协会名录'],
        followUp: '冷邮件/电话'
      },
      {
        value: 'competitor_client',
        label: '竞争对手客户',
        icon: Target,
        tracking: ['竞品网站案例', 'LinkedIn连接', '行业报告', '展会客户'],
        followUp: '定向营销'
      },
      {
        value: 'trade_show_card',
        label: '展会名片',
        icon: Award,
        tracking: ['线下展会', '线上展会', 'Webinar', '行业峰会'],
        followUp: '展后邮件'
      },
      {
        value: 'cold_outreach',
        label: '冷邮件/电话',
        icon: Phone,
        tracking: ['邮件列表', 'Apollo.io', 'Hunter.io', 'LinkedIn Sales Navigator'],
        followUp: 'Follow-up邮件'
      },
      {
        value: 'referral',
        label: '客户转介绍',
        icon: Users,
        tracking: ['老客户推荐', '合作伙伴介绍', '行业内人士'],
        followUp: '感谢邮件+跟进'
      }
    ]
  },
  b2b_platform: {
    label: 'B2B平台',
    icon: Briefcase,
    color: 'purple',
    paths: [
      {
        value: 'alibaba_inquiry',
        label: 'Alibaba询盘',
        icon: Building2,
        tracking: ['RFQ', 'Message Center', 'Product询价'],
        followUp: 'Alibaba Message + 邮件'
      },
      {
        value: 'global_sources',
        label: 'Global Sources',
        icon: Globe,
        tracking: ['在线询盘', '杂志广告', '线上展会'],
        followUp: '平台消息 + 邮件'
      },
      {
        value: 'made_in_china',
        label: 'Made-in-China',
        icon: Building2,
        tracking: ['产品询价', 'RFQ', '店铺访问'],
        followUp: '平台消息'
      }
    ]
  },
  search_engine: {
    label: '搜索引擎',
    icon: TrendingUp,
    color: 'cyan',
    paths: [
      {
        value: 'google_ads',
        label: 'Google广告',
        icon: Target,
        tracking: ['搜索广告', '展示广告', 'Shopping广告', 'YouTube广告'],
        followUp: '广告着陆页→联系'
      },
      {
        value: 'seo_organic',
        label: 'SEO自然流量',
        icon: TrendingUp,
        tracking: ['Google搜索', 'Bing搜索', '关键词排名'],
        followUp: '官网联系方式'
      }
    ]
  }
};

// 🏢 核心5+1类目标客户类型（排除电商，聚焦稳定需求）
const TARGET_CLIENT_TYPES = [
  {
    value: 'retailer',
    label: '建材零售商',
    subtitle: '连锁店或单店',
    icon: Store,
    examples: ['Home Depot', 'Lowe\'s', 'Menards', 'Ace Hardware', '区域建材超市', '独立五金店'],
    keyInfo: ['采购负责人/Owner', '区域经理', '品类经理', '门店数量', '年采购额'],
    priority: 'S',
    description: '实体门店，直接面向终端消费者，采购频率高，决策链短',
    avgOrderValue: '$45K',
    conversionRate: '35%'
  },
  {
    value: 'project_contractor',
    label: '项目承包商',
    subtitle: '各类工程项目',
    icon: Award,
    examples: ['建筑公司', '装修公司', '工程总包', '设备安装商', '机电承包商'],
    keyInfo: ['项目经理', '采购负责人', '在建项目', '资质等级', '年产值'],
    priority: 'S',
    description: '大型项目一站式采购，订单金额大，注重交期和质量',
    avgOrderValue: '$85K',
    conversionRate: '45%'
  },
  {
    value: 'inspection_service_seeker',
    label: '验货客户',
    subtitle: '需要正规验货服务',
    icon: Shield,
    examples: ['中小进口商', '海外买家', '缺乏质量控制的采购商'],
    keyInfo: ['Owner/Sourcing Manager', '采购频次', '验货需求', '供应链痛点'],
    priority: 'A',
    description: '需要第三方验货和质量控制，希望验货+采购一体化服务',
    avgOrderValue: '$28K',
    conversionRate: '40%'
  },
  {
    value: 'agency_seeker',
    label: '寻找中国代理的客户',
    subtitle: '需要采购代理服务',
    icon: Users2,
    examples: ['需要中国采购代理', '缺乏中国资源的买家', 'Sourcing Agent需求方'],
    keyInfo: ['CEO/Procurement Director', '采购品类', '年采购预算', '代理费预期'],
    priority: 'S',
    description: '需要长期采购代理，缺乏中国供应链资源，愿意支付佣金',
    avgOrderValue: '$55K',
    conversionRate: '48%'
  },
  {
    value: 'local_manufacturer',
    label: '本土工厂',
    subtitle: '需要原材料和配件',
    icon: Factory,
    examples: ['门窗加工厂', '铝材加工商', '家具定制厂', '钣金加工厂', '装饰材料加工'],
    keyInfo: ['采购负责人', '生产经理', '加工类型', '主要产品线', '原材料需求清单', '月用量'],
    priority: 'S',
    description: '本地二次加工，多品类原材料需求，高频稳定采购',
    avgOrderValue: '$32K',
    conversionRate: '42%',
    materialNeeds: [
      '门窗配件：铰链、拉手、锁具、滑轨、密封条',
      '铝型材：门窗型材、幕墙型材、工业型材',
      '五金配件：地弹簧、闭门器、门把手、合页、螺丝',
      '电气配件：开关插座、接线盒、电缆桥架',
      '装饰材料：玻璃胶、结构胶、泡沫条、美缝剂',
      '紧固件：螺丝、螺母、膨胀螺栓、铆钉'
    ],
    purchasePattern: '多SKU、小批量、高频次采购',
    valueProposition: '一站式供应，减少供应商数量，灵活账期'
  },
  {
    value: 'wholesaler',
    label: '批发商',
    subtitle: '大宗批发分销',
    icon: Package,
    examples: ['电气批发商', '卫浴分销商', '五金经销商', '区域总代理'],
    keyInfo: ['Purchasing Director/COO', '仓库位置', '产品线', '年销售额', '下游客户类型'],
    priority: 'A',
    description: '向零售商/承包商批量供货，注重价格和周转率',
    avgOrderValue: '$38K',
    conversionRate: '38%'
  }
];

// 📋 客户信息完整度检查项
const INFO_COMPLETENESS_CHECKLIST = {
  basic: {
    label: '基础信息',
    weight: 30,
    items: [
      { field: 'companyName', label: '公司名称', required: true, score: 10 },
      { field: 'contactPerson', label: '联系人姓名', required: true, score: 5 },
      { field: 'position', label: '职位', required: false, score: 3 },
      { field: 'email', label: '邮箱', required: true, score: 5 },
      { field: 'phone', label: '电话', required: false, score: 3 },
      { field: 'whatsapp', label: 'WhatsApp/微信', required: false, score: 4 }
    ]
  },
  company: {
    label: '公司信息',
    weight: 25,
    items: [
      { field: 'website', label: '公司网站', required: false, score: 5 },
      { field: 'country', label: '国家', required: true, score: 5 },
      { field: 'city', label: '城市', required: false, score: 3 },
      { field: 'employeeCount', label: '员工规模', required: false, score: 4 },
      { field: 'annualRevenue', label: '年营业额', required: false, score: 4 },
      { field: 'establishedYear', label: '成立年份', required: false, score: 4 }
    ]
  },
  business: {
    label: '业务信息',
    weight: 25,
    items: [
      { field: 'businessType', label: '业务类型', required: true, score: 8 },
      { field: 'industry', label: '目标行业', required: true, score: 7 },
      { field: 'targetProducts', label: '采购产品', required: true, score: 5 },
      { field: 'annualPurchase', label: '年采购额', required: false, score: 5 }
    ]
  },
  demand: {
    label: '需求信息',
    weight: 20,
    items: [
      { field: 'specificDemand', label: '具体需求描述', required: false, score: 6 },
      { field: 'budget', label: '预算范围', required: false, score: 5 },
      { field: 'timeline', label: '采购时间表', required: false, score: 5 },
      { field: 'decisionProcess', label: '决策流程', required: false, score: 4 }
    ]
  }
};

export default function CustomerIntakeSystem({ userRole = 'Marketing_Ops' }: CustomerIntakeSystemProps) {
  const [activeTab, setActiveTab] = useState('intake'); // intake, pending, approved
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    // 来源信息
    sourceCategory: '',
    sourcePath: '',
    sourceTracking: '',
    firstContactMethod: '',
    referenceLink: '',
    
    // 基础信息
    companyName: '',
    contactPerson: '',
    position: '',
    email: '',
    phone: '',
    whatsapp: '',
    wechat: '',
    
    // 公司信息
    website: '',
    country: '',
    city: '',
    employeeCount: '',
    annualRevenue: '',
    establishedYear: '',
    linkedinUrl: '',
    
    // 业务信息
    businessType: '',
    enterpriseType: '',
    industry: '',
    subIndustry: '',
    targetProducts: '',
    currentSupplier: '',
    annualPurchase: '',
    purchaseFrequency: '',
    
    // 需求信息
    specificDemand: '',
    budget: '',
    timeline: '',
    decisionProcess: '',
    decisionMaker: false,
    
    // 沟通记录
    communicationHistory: '',
    attachments: '',
    clientResponse: '',
    urgency: 'medium',
    
    // 评估信息（运营专员填写）
    intentLevel: '',
    tags: [] as string[],
    notes: ''
  });

  // 计算信息完整度
  const calculateCompleteness = () => {
    let totalScore = 0;
    let maxScore = 0;
    
    Object.values(INFO_COMPLETENESS_CHECKLIST).forEach(category => {
      category.items.forEach(item => {
        maxScore += item.score;
        if (formData[item.field as keyof typeof formData]) {
          totalScore += item.score;
        }
      });
    });
    
    return Math.round((totalScore / maxScore) * 100);
  };

  // 自动评分系统
  const calculateAutoScore = () => {
    let score = 0;
    
    // 信息完整度（40分）
    score += Math.round(calculateCompleteness() * 0.4);
    
    // 主动性加分（20分）
    if (formData.specificDemand) score += 10;
    if (formData.budget) score += 5;
    if (formData.timeline) score += 5;
    
    // 决策权限（20分）
    if (formData.decisionMaker) score += 15;
    if (formData.position.includes('Manager') || formData.position.includes('Director')) score += 5;
    
    // 公司规模（10分）
    if (formData.employeeCount === 'large') score += 10;
    else if (formData.employeeCount === 'medium') score += 6;
    else if (formData.employeeCount === 'small') score += 3;
    
    // 采购规模（10分）
    if (formData.annualPurchase === 'ultra') score += 10;
    else if (formData.annualPurchase === 'large') score += 7;
    else if (formData.annualPurchase === 'medium') score += 4;
    
    return Math.min(score, 100);
  };

  // 智能意向度建议
  const suggestIntentLevel = () => {
    const score = calculateAutoScore();
    const hasUrgency = formData.urgency === 'high';
    const hasBudget = formData.budget !== '';
    const hasTimeline = formData.timeline !== '';
    const isDecisionMaker = formData.decisionMaker;
    
    if (score >= 80 && hasUrgency && hasBudget && isDecisionMaker) return 'S';
    if (score >= 60 && (hasBudget || hasTimeline)) return 'A';
    if (score >= 40) return 'B';
    return 'C';
  };

  // 模拟待审核客户
  const pendingCustomers = [
    {
      id: 'PENDING-001',
      companyName: 'BuildMart Supplies LLC',
      contactPerson: 'John Anderson',
      email: 'j.anderson@buildmart.com',
      sourceCategory: 'social_media',
      sourcePath: 'video_to_website',
      sourceDetail: 'YouTube产品视频→官网→WhatsApp联系',
      addedDate: '2024-12-02 10:30',
      completeness: 85,
      autoScore: 78,
      suggestedIntent: 'A',
      status: 'pending_review',
      targetType: 'chain_store',
      specificDemand: '需要大批量开关插座，要求UL认证，月需求5000套',
      urgency: 'high'
    },
    {
      id: 'PENDING-002',
      companyName: 'European Hardware Group',
      contactPerson: 'Maria Schmidt',
      email: 'm.schmidt@ehg.de',
      sourceCategory: 'proactive',
      sourcePath: 'industry_directory',
      sourceDetail: '通过德国建材行业协会名录主动开发',
      addedDate: '2024-12-02 09:15',
      completeness: 65,
      autoScore: 58,
      suggestedIntent: 'B',
      status: 'pending_review',
      targetType: 'distributor',
      specificDemand: '初步询价，了解产品线和价格',
      urgency: 'medium'
    },
    {
      id: 'PENDING-003',
      companyName: 'Smart Home Solutions Inc.',
      contactPerson: 'David Chen',
      email: 'david@smarthomesol.com',
      sourceCategory: 'website',
      sourcePath: 'contact_form',
      sourceDetail: '官网联系表单填写详细需求',
      addedDate: '2024-12-01 16:45',
      completeness: 92,
      autoScore: 88,
      suggestedIntent: 'S',
      status: 'pending_review',
      targetType: 'online_retailer',
      specificDemand: '智能开关项目，需要样品测试，有明确预算$50K',
      urgency: 'high'
    }
  ];

  const handleSubmitIntake = () => {
    const completeness = calculateCompleteness();
    const autoScore = calculateAutoScore();
    const suggestedIntent = suggestIntentLevel();
    
    if (completeness < 50) {
      toast.error('信息完整度不足50%，请补充必填信息');
      return;
    }
    
    toast.success(`客户已提交审核！\n完整度: ${completeness}%\n自动评分: ${autoScore}分\n建议意向度: ${suggestedIntent}级`);
    setShowIntakeForm(false);
    setFormData({
      sourceCategory: '',
      sourcePath: '',
      sourceTracking: '',
      firstContactMethod: '',
      referenceLink: '',
      companyName: '',
      contactPerson: '',
      position: '',
      email: '',
      phone: '',
      whatsapp: '',
      wechat: '',
      website: '',
      country: '',
      city: '',
      employeeCount: '',
      annualRevenue: '',
      establishedYear: '',
      linkedinUrl: '',
      businessType: '',
      enterpriseType: '',
      industry: '',
      subIndustry: '',
      targetProducts: '',
      currentSupplier: '',
      annualPurchase: '',
      purchaseFrequency: '',
      specificDemand: '',
      budget: '',
      timeline: '',
      decisionProcess: '',
      decisionMaker: false,
      communicationHistory: '',
      attachments: '',
      clientResponse: '',
      urgency: 'medium',
      intentLevel: '',
      tags: [],
      notes: ''
    });
  };

  const handleApproveToPool = (customer: any) => {
    toast.success(`客户 ${customer.companyName} 已投放到公海池！`);
  };

  const handleReject = (customer: any) => {
    toast.error(`客户 ${customer.companyName} 已拒绝`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-blue-600" />
            客户录入与评估系统
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              智能评分
            </Badge>
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            多渠道客户采集、智能分类评估、自动评分系统，确保高质量客户进入公海池
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowIntakeForm(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            新增客户录入
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">待审核客户</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{pendingCustomers.length}</p>
              <p className="text-xs text-blue-600 mt-1">需要评估</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">今日录入</p>
              <p className="text-2xl font-bold text-green-600 mt-1">12</p>
              <p className="text-xs text-green-600 mt-1">+5 vs 昨日</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">平均完整度</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">78%</p>
              <p className="text-xs text-purple-600 mt-1">信息质量良好</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600">通过率</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">85%</p>
              <p className="text-xs text-orange-600 mt-1">审核标准</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* 主要内容标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intake" className="gap-2">
            <UserPlus className="w-4 h-4" />
            客户录入
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            待审核 ({pendingCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <Waves className="w-4 h-4" />
            已投放公海池
          </TabsTrigger>
        </TabsList>

        {/* 客户录入指南 */}
        <TabsContent value="intake" className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              客户来源渠道说明
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(SOURCE_PATHS).map(([key, category]) => {
                const Icon = category.icon;
                return (
                  <Card key={key} className="p-4 border-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`bg-${category.color}-100 p-2 rounded`}>
                        <Icon className={`w-5 h-5 text-${category.color}-600`} />
                      </div>
                      <h3 className="font-semibold text-slate-900">{category.label}</h3>
                    </div>
                    <div className="space-y-2">
                      {category.paths.map(path => {
                        const PathIcon = path.icon;
                        return (
                          <div key={path.value} className="text-xs text-slate-600 flex items-start gap-2">
                            <PathIcon className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                            <div>
                              <p className="font-medium text-slate-700">{path.label}</p>
                              <p className="text-slate-500">{path.followUp}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              主动开发目标客户类型
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_CLIENT_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Card key={type.value} className="p-4 border-2 hover:border-orange-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-orange-600" />
                        <h3 className="font-semibold text-slate-900">{type.label}</h3>
                      </div>
                      <Badge className={`${type.priority === 'S' ? 'bg-red-600' : type.priority === 'A' ? 'bg-orange-600' : 'bg-blue-600'} text-white`}>
                        {type.priority}级优先
                      </Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      {type.description && (
                        <div className="bg-orange-50 p-2 rounded">
                          <p className="text-orange-800 font-medium">{type.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-600 mb-1">典型案例：</p>
                        <div className="flex flex-wrap gap-1">
                          {type.examples.map((ex, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{ex}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600 mb-1">关键信息：</p>
                        <div className="flex flex-wrap gap-1">
                          {type.keyInfo.map((info, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-blue-50">{info}</Badge>
                          ))}
                        </div>
                      </div>
                      {type.purchasePattern && (
                        <div className="bg-green-50 p-2 rounded mt-2">
                          <p className="text-green-800">
                            <span className="font-semibold">采购特点：</span>{type.purchasePattern}
                          </p>
                        </div>
                      )}
                      {type.valueProposition && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-blue-800">
                            <span className="font-semibold">价值主张：</span>{type.valueProposition}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* 本地制造加工服务商详细说明 */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <div className="flex items-start gap-3 mb-4">
              <Factory className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h2 className="font-semibold text-slate-900 text-lg mb-1">
                  本土工厂 - 多品类原材料需求详解 ⭐
                </h2>
                <p className="text-sm text-slate-700">
                  这类客户是优质长期合作对象，特点是多SKU、高频采购、客户粘性强，年采购额可观
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 门窗加工厂 */}
              <Card className="p-4 bg-white">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  门窗加工厂
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>• 铝型材：门窗型材、幕墙型材（各种规格）</p>
                  <p>• 五金配件：铰链、拉手、月牙锁、多点锁、滑轮</p>
                  <p>• 密封材料：密封条、毛条、泡沫条</p>
                  <p>• 玻璃配件：玻璃垫片、定位块、玻璃胶</p>
                  <p>• 紧固件：自攻螺丝、拉铆钉、膨胀螺栓</p>
                  <p>• 表面处理：粉末涂料、氟碳涂料</p>
                </div>
              </Card>

              {/* 窗帘制造商 */}
              <Card className="p-4 bg-white">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  窗帘制造商
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>• 轨道系统：铝合金轨道、罗马杆、电动轨道</p>
                  <p>• 配件：滑轮、挂钩、拉绳、吊环、窗帘杆托架</p>
                  <p>• 五金：窗帘圈、夹子、磁吸</p>
                  <p>• 电机：窗帘电机、遥控器、智能控制系统</p>
                  <p>• 装饰件：窗帘头、花边、流苏、绑带</p>
                  <p>• 辅料：缝纫线、魔术贴、铅坠</p>
                </div>
              </Card>

              {/* 家具定制厂 */}
              <Card className="p-4 bg-white">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  家具定制厂
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p>• 五金配件：铰链、抽屉滑轨、拉手、锁具</p>
                  <p>• 连接件：三合一连接件、偏心轮、螺母</p>
                  <p>• 功能配件：气撑、阻尼器、缓冲垫、脚垫</p>
                  <p>• 装饰件：封边条、铝合金包边、装饰条</p>
                  <p>• 电气件：LED灯条、感应开关、插座</p>
                  <p>• 工具配件：安装工具、固定件</p>
                </div>
              </Card>

              {/* 钣金/玻璃加工 */}
              <Card className="p-4 bg-white">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-cyan-600" />
                  钣金/玻璃加工厂
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <p><strong>钣金：</strong>冷轧板、镀锌板、不锈钢板、铝板</p>
                  <p>• 紧固件：螺丝、螺母、铆钉、焊钉</p>
                  <p>• 表面处理：喷塑粉末、油漆、电镀材料</p>
                  <p><strong>玻璃：</strong>玻璃胶、密封胶条、结构胶</p>
                  <p>• 配件：玻璃夹、驳接爪、点式配件、拉手</p>
                  <p>• 包装：保护膜、气泡膜、边角保护</p>
                </div>
              </Card>
            </div>

            {/* 开发要点 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded">
                <h4 className="font-semibold text-xs text-green-700 mb-2">✅ 识别技巧</h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 公司名：XX加工厂、XX制造</li>
                  <li>• 业务：来图加工、定制生产</li>
                  <li>• 地址：工业区、产业园</li>
                  <li>• 询价特点：产品清单长</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded">
                <h4 className="font-semibold text-xs text-blue-700 mb-2">💡 沟通要点</h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 强调一站式供应</li>
                  <li>• 统一账期管理</li>
                  <li>• 小批量灵活起订</li>
                  <li>• 本地化快速响应</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded">
                <h4 className="font-semibold text-xs text-orange-700 mb-2">🎯 成交策略</h4>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 从1-2个品类切入</li>
                  <li>• 首单试单建立信任</li>
                  <li>• 逐步扩展品类</li>
                  <li>• 签年度框架协议</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ 注意：</strong>
                这类客户决策周期1-3个月，价格敏感但更看重供应稳定性。
                首单试单后，客户粘性极高，年采购额可达$200K-$500K，值得重点开发！
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">智能评分系统说明</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <strong>信息完整度</strong>：自动计算必填和选填字段完成率（40分）</li>
                  <li>• <strong>主动性评估</strong>：客户提供需求、预算、时间表获得加分（20分）</li>
                  <li>• <strong>决策权限</strong>：是否决策者、职位等级（20分）</li>
                  <li>• <strong>公司规模</strong>：员工数量、营业额（10分）</li>
                  <li>• <strong>采购规模</strong>：年采购额估算（10分）</li>
                  <li className="mt-2 text-blue-700">→ 系统会自动建议意向度等级（S/A/B/C），运营专员可手动调整</li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 待审核客户 */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              待审核客户列表 <span className="text-sm text-slate-500 ml-2">（{pendingCustomers.length} 条待处理）</span>
            </h2>
            <div className="flex items-center gap-2">
              <Input placeholder="搜索客户..." className="w-64" />
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>

          {pendingCustomers.map(customer => (
            <Card key={customer.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  {/* 第一行：公司名和评分 */}
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900 text-lg">{customer.companyName}</h3>
                    <Badge className={`${customer.urgency === 'high' ? 'bg-red-600' : customer.urgency === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'} text-white`}>
                      {customer.urgency === 'high' ? '紧急' : customer.urgency === 'medium' ? '中等' : '一般'}
                    </Badge>
                    {customer.targetType && (
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        {TARGET_CLIENT_TYPES.find(t => t.value === customer.targetType)?.label}
                      </Badge>
                    )}
                  </div>

                  {/* 第二行：联系信息 */}
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {customer.contactPerson}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {customer.email}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {customer.addedDate}
                    </div>
                  </div>

                  {/* 第三行：来源路径 */}
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="bg-blue-50">
                      {SOURCE_PATHS[customer.sourceCategory as keyof typeof SOURCE_PATHS]?.label}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-600">{customer.sourceDetail}</span>
                  </div>

                  {/* 第四行：需求描述 */}
                  <div className="bg-slate-50 p-3 rounded">
                    <p className="text-xs text-slate-600 mb-1">客户需求：</p>
                    <p className="text-sm text-slate-800">{customer.specificDemand}</p>
                  </div>

                  {/* 第五行：评分指标 */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-slate-600">完整度:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${customer.completeness >= 80 ? 'bg-green-600' : customer.completeness >= 60 ? 'bg-blue-600' : 'bg-yellow-600'}`}
                            style={{ width: `${customer.completeness}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{customer.completeness}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-slate-600">自动评分:</span>
                      <span className={`text-sm font-bold ${customer.autoScore >= 80 ? 'text-green-600' : customer.autoScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {customer.autoScore}分
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-slate-600">建议意向度:</span>
                      <Badge className={`${customer.suggestedIntent === 'S' ? 'bg-red-600' : customer.suggestedIntent === 'A' ? 'bg-orange-600' : customer.suggestedIntent === 'B' ? 'bg-yellow-600' : 'bg-slate-600'} text-white`}>
                        {customer.suggestedIntent}级
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowDetailDialog(true);
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleApproveToPool(customer)}
                    className="gap-2 text-green-600 border-green-300 hover:bg-green-50 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4" />
                    投放公海池
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 whitespace-nowrap"
                  >
                    <Edit className="w-4 h-4" />
                    编辑信息
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(customer)}
                    className="gap-2 text-red-600 border-red-300 hover:bg-red-50 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* 已投放公海池 */}
        <TabsContent value="approved" className="space-y-4">
          <Card className="p-6 text-center">
            <Waves className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <p className="text-slate-600">本周已投放 45 个客户到公海池</p>
            <Button variant="outline" className="mt-4">
              <ExternalLink className="w-4 h-4 mr-2" />
              前往公海客户池查看
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 客户录入表单对话框 */}
      <Dialog open={showIntakeForm} onOpenChange={setShowIntakeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              新增客户录入
            </DialogTitle>
            <DialogDescription>
              请详细填写客户信息，系统将自动评分并建议意向度等级
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 实时评分显示 */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">信息完整度</p>
                  <p className="text-2xl font-bold text-blue-600">{calculateCompleteness()}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">自动评分</p>
                  <p className="text-2xl font-bold text-purple-600">{calculateAutoScore()}分</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">建议意向度</p>
                  <Badge className={`text-lg ${suggestIntentLevel() === 'S' ? 'bg-red-600' : suggestIntentLevel() === 'A' ? 'bg-orange-600' : suggestIntentLevel() === 'B' ? 'bg-yellow-600' : 'bg-slate-600'} text-white`}>
                    {suggestIntentLevel()}级
                  </Badge>
                </div>
              </div>
            </Card>

            {/* 表单内容 - 这里只展示部分，实际应该包含所有字段 */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">1. 来源信息（必填）</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>客户来源渠道 *</Label>
                  <select 
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.sourceCategory}
                    onChange={(e) => setFormData({...formData, sourceCategory: e.target.value, sourcePath: ''})}
                  >
                    <option value="">请选择来源渠道</option>
                    {Object.entries(SOURCE_PATHS).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {formData.sourceCategory && (
                  <div className="space-y-2">
                    <Label>具体来源路径 *</Label>
                    <select 
                      className="w-full border rounded-md px-3 py-2"
                      value={formData.sourcePath}
                      onChange={(e) => setFormData({...formData, sourcePath: e.target.value})}
                    >
                      <option value="">请选择具体路径</option>
                      {SOURCE_PATHS[formData.sourceCategory as keyof typeof SOURCE_PATHS]?.paths.map(path => (
                        <option key={path.value} value={path.value}>{path.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>来源详细说明（例如：YouTube产品视频→官网→WhatsApp联系）</Label>
                <Input 
                  placeholder="请描述客户如何找到我们的..."
                  value={formData.sourceTracking}
                  onChange={(e) => setFormData({...formData, sourceTracking: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">2. 基础信息（必填）</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>公司名称 *</Label>
                  <Input 
                    placeholder="请输入公司名称"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>联系人姓名 *</Label>
                  <Input 
                    placeholder="请输入联系人姓名"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>职位</Label>
                  <Input 
                    placeholder="例如：Purchasing Manager"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>邮箱 *</Label>
                  <Input 
                    type="email"
                    placeholder="example@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>电话</Label>
                  <Input 
                    placeholder="+1 234 567 8900"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp/微信</Label>
                  <Input 
                    placeholder="WhatsApp号码或微信ID"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">3. 业务需求（重要）</h3>
              <div className="space-y-2">
                <Label>具体需求描述</Label>
                <Textarea 
                  placeholder="请详细描述客户的采购需求、产品要求、数量、认证要求等..."
                  rows={4}
                  value={formData.specificDemand}
                  onChange={(e) => setFormData({...formData, specificDemand: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>预算范围</Label>
                  <Input 
                    placeholder="例如：$50K-100K"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>采购时间表</Label>
                  <Input 
                    placeholder="例如：2个月内"
                    value={formData.timeline}
                    onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>紧急程度</Label>
                  <select 
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.urgency}
                    onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                  >
                    <option value="low">一般</option>
                    <option value="medium">中等</option>
                    <option value="high">紧急</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={formData.decisionMaker}
                  onChange={(e) => setFormData({...formData, decisionMaker: e.target.checked})}
                  className="rounded"
                />
                <Label className="cursor-pointer">该联系人是决策者</Label>
              </div>
            </div>

            {calculateCompleteness() < 50 && (
              <Card className="p-3 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-semibold">信息完整度不足50%</p>
                    <p>请至少填写：公司名称、联系人、邮箱、来源渠道、业务类型、目标行业</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntakeForm(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSubmitIntake}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={calculateCompleteness() < 50}
            >
              <Send className="w-4 h-4 mr-2" />
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 客户详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>客户详细信息审核</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-lg mb-2">{selectedCustomer.companyName}</h3>
                <p className="text-sm text-slate-600">{selectedCustomer.contactPerson} · {selectedCustomer.email}</p>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-3 text-center">
                  <p className="text-xs text-slate-600 mb-1">完整度</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.completeness}%</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-slate-600 mb-1">评分</p>
                  <p className="text-2xl font-bold text-purple-600">{selectedCustomer.autoScore}分</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-slate-600 mb-1">意向度</p>
                  <Badge className="text-lg bg-orange-600 text-white">{selectedCustomer.suggestedIntent}级</Badge>
                </Card>
              </div>

              {/* 更多详细信息... */}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            <Button 
              onClick={() => {
                if (selectedCustomer) {
                  handleApproveToPool(selectedCustomer);
                  setShowDetailDialog(false);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              批准投放公海池
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}