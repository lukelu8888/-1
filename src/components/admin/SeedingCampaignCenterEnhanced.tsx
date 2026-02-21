import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { 
  Megaphone,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  Pause,
  BarChart3,
  FileText,
  Image,
  Video,
  MessageSquare,
  ThumbsUp,
  Share2,
  Eye,
  MousePointerClick,
  Store,
  ShoppingCart,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  UserPlus,
  Briefcase,
  Award,
  Star,
  TrendingDown,
  ArrowRight,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  ExternalLink,
  Link2,
  Send,
  CheckCircle,
  XCircle,
  Radio,
  Sparkles,
  Lightbulb,
  Rocket,
  Hash,
  Copy,
  BookOpen,
  Presentation,
  BarChart2,
  TrendingUpIcon,
  Activity
} from 'lucide-react';

interface SeedingCampaignCenterProps {
  userRole?: string;
}

// 🌍 目标市场配置
const TARGET_MARKETS = [
  {
    region: 'north_america',
    label: '北美市场',
    icon: MapPin,
    countries: ['美国', '加拿大', '墨西哥'],
    platforms: ['Reddit', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'Home Improvement Forums'],
    languages: ['英语', '西班牙语'],
    color: 'blue'
  },
  {
    region: 'south_america',
    label: '南美市场',
    icon: MapPin,
    countries: ['巴西', '阿根廷', '智利', '哥伦比亚'],
    platforms: ['Facebook', 'Instagram', 'YouTube', 'WhatsApp Groups', 'MercadoLibre'],
    languages: ['西班牙语', '葡萄牙语'],
    color: 'green'
  },
  {
    region: 'europe_africa',
    label: '欧非市场',
    icon: MapPin,
    countries: ['英国', '德国', '法国', '南非', '尼日利亚'],
    platforms: ['Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'Reddit', 'DIY Forums'],
    languages: ['英语', '德语', '法语'],
    color: 'purple'
  }
];

// 🎯 目标人群画像
const TARGET_AUDIENCES = [
  {
    id: 'homeowner',
    label: '房主/装修业主',
    icon: Users,
    description: '正在装修或计划装修的房主',
    platforms: ['Reddit r/HomeImprovement', 'Facebook DIY Groups', 'Instagram #HomeReno'],
    interests: ['家居装修', 'DIY', '建材选购', '装修攻略'],
    painPoints: ['不知道哪里买', '担心质量', '价格不透明', '安装复杂'],
    keyMessage: '品质保证、性价比高、专业指导'
  },
  {
    id: 'contractor',
    label: '承包商/装修公司',
    icon: Briefcase,
    description: '专业装修承包商和工程师',
    platforms: ['LinkedIn', 'Facebook专业群组', 'Contractor Forums'],
    interests: ['供应商信息', '批发价格', '产品认证', '技术规格'],
    painPoints: ['供应商不稳定', '质量问题', '交期问题'],
    keyMessage: '稳定供应、专业服务、批量优惠'
  },
  {
    id: 'retailer',
    label: '零售商/批发商',
    icon: Store,
    description: '建材零售店和批发商',
    platforms: ['LinkedIn', 'Trade Forums', 'Industry Groups'],
    interests: ['新品牌', '利润空间', '市场需求', '物流支持'],
    painPoints: ['库存压力', '品牌知名度低', '顾客询问少'],
    keyMessage: '终端需求强、利润空间大、物流支持'
  },
  {
    id: 'designer',
    label: '室内设计师/建筑师',
    icon: Award,
    description: '有产品推荐影响力的设计师',
    platforms: ['Instagram', 'Pinterest', 'Houzz', 'LinkedIn'],
    interests: ['产品美学', '创新设计', '案例展示', '品牌合作'],
    painPoints: ['产品选择少', '品牌认知度低'],
    keyMessage: '设计感强、多样选择、案例支持'
  }
];

// 📢 三种执行方式
const EXECUTION_METHODS = {
  inhouse: {
    id: 'inhouse',
    label: '自营团队',
    icon: Users,
    color: 'blue',
    description: '公司内部团队直接运营',
    advantages: ['成本可控', '品牌掌控力强', '响应速度快', '长期积累'],
    challenges: ['需要专业人员', '时区差异', '文化差异', '账号管理风险'],
    tasks: [
      '注册和管理平台账号',
      '内容创作和本地化',
      '定期发布和互动',
      '数据监控和优化'
    ],
    costs: '人力成本：$3K-$5K/月/市场',
    timeline: '长期持续运营',
    detailedSteps: [
      { step: 1, title: '组建团队', duration: '1-2周', tasks: ['招聘运营专员', '产品知识培训', '制定工作计划'] },
      { step: 2, title: '平台账号准备', duration: '1周', tasks: ['注册目标平台账号', '养号策略', '设置追踪链接'] },
      { step: 3, title: '内容素材准备', duration: '持续', tasks: ['建立素材库', '本地化调整', '创建内容模板'] },
      { step: 4, title: '内容发布执行', duration: '持续', tasks: ['按频率发布', '选择最佳时间', '记录发布数据'] },
      { step: 5, title: '互动管理', duration: '每天', tasks: ['回复评论', '主动互动', '社群管理'] },
      { step: 6, title: '经销商链接', duration: '关键', tasks: ['Where to Buy页面', '内容引导', '追踪询问'] },
      { step: 7, title: '数据追踪优化', duration: '每周', tasks: ['分析数据', '识别高效内容', '优化策略'] }
    ]
  },
  local_agency: {
    id: 'local_agency',
    label: '本地代理团队',
    icon: Briefcase,
    color: 'green',
    description: '雇佣目标市场当地营销团队',
    advantages: ['本地化专业', '文化理解深', '账号安全', '执行效率高'],
    challenges: ['成本较高', '沟通成本', '质量把控', '合同管理'],
    tasks: [
      '选择和签约代理商',
      '下发Brief和素材',
      '审核内容和成品',
      '效果验收和付款'
    ],
    costs: '外包成本：$5K-$10K/月/市场',
    timeline: '按项目或月度合作',
    detailedSteps: [
      { step: 1, title: '代理商选择评估', duration: '2-3周', tasks: ['筛选代理商', '评估打分', '面试沟通'] },
      { step: 2, title: '合同签订', duration: '1周', tasks: ['确认服务范围', '约定KPI', '签订合同'] },
      { step: 3, title: 'Brief下发', duration: '1周', tasks: ['项目背景', '产品信息', '内容要求'] },
      { step: 4, title: '启动会议', duration: '1天', tasks: ['团队介绍', 'Brief讲解', '确认流程'] },
      { step: 5, title: '内容创作审核', duration: '持续', tasks: ['代理商创作', '我方审核', '修改完善'] },
      { step: 6, title: '发布与互动', duration: '持续', tasks: ['按计划发布', '互动管理', '危机处理'] },
      { step: 7, title: '数据报告', duration: '每周/月', tasks: ['周报提交', '月报分析', 'ROI计算'] },
      { step: 8, title: '定期复盘', duration: '每月/季', tasks: ['复盘会议', '优化调整', '续约评估'] }
    ]
  },
  influencer: {
    id: 'influencer',
    label: '网红合作',
    icon: Star,
    color: 'orange',
    description: '与目标市场KOL/网红合作',
    advantages: ['影响力大', '信任度高', '传播快', '转化率高'],
    challenges: ['成本高', '选择困难', '真实性风险', '效果不确定'],
    tasks: [
      '筛选匹配网红',
      '洽谈合作方案',
      '提供产品和Brief',
      '内容审核和发布',
      '效果追踪和结算'
    ],
    costs: '按网红等级：Micro $500-$2K/次, Macro $5K-$20K/次, Mega $50K+/次',
    timeline: '按合作次数或长期合约',
    detailedSteps: [
      { step: 1, title: '网红数据库建立', duration: '持续', tasks: ['筛选网红', '评估真实性', '建立档案'] },
      { step: 2, title: '网红筛选联系', duration: '1-2周', tasks: ['确定候选人', '初步联系', '收集报价'] },
      { step: 3, title: '合作方案洽谈', duration: '1周', tasks: ['设计方案', '谈判报价', '确定交付'] },
      { step: 4, title: '合同签订付款', duration: '1周', tasks: ['审核合同', '预付款', '确认时间'] },
      { step: 5, title: 'Brief产品寄送', duration: '1周', tasks: ['下发Brief', '寄送产品', '确认收到'] },
      { step: 6, title: '内容创作审核', duration: '1-2周', tasks: ['网红创作', '我方审核', '修改完善'] },
      { step: 7, title: '内容发布推广', duration: '发布日', tasks: ['确认发布', '我方转发', '监控评论'] },
      { step: 8, title: '互动危机应对', duration: '持续', tasks: ['管理评论', '危机处理', '引导转化'] },
      { step: 9, title: '效果追踪结算', duration: '1个月', tasks: ['数据收集', 'ROI分析', '尾款支付'] }
    ]
  }
};

// 🎨 内容类型
const CONTENT_TYPES = [
  {
    type: 'product_showcase',
    label: '产品展示',
    icon: Image,
    formats: ['图片轮播', '短视频', '3D展示'],
    platforms: ['Instagram', 'Facebook', 'Pinterest'],
    example: '门窗配件精美图片+功能特点介绍',
    templates: [
      { id: 1, name: '产品多角度展示模板', description: '6张图片展示产品不同角度' },
      { id: 2, name: '功能特点对比模板', description: '展示产品核心功能' },
      { id: 3, name: '使用场景展示模板', description: '真实使用环境展示' }
    ],
    cases: [
      { id: 1, title: '不锈钢铰链产品图', platform: 'Instagram', engagement: '2.5K likes', link: '#' },
      { id: 2, title: '门窗配件套装展示', platform: 'Facebook', engagement: '1.8K likes', link: '#' }
    ]
  },
  {
    type: 'tutorial',
    label: '教程内容',
    icon: Video,
    formats: ['安装教程', '选购指南', 'DIY视频'],
    platforms: ['YouTube', 'TikTok', 'Reddit'],
    example: '如何选择优质铰链，3分钟教程',
    templates: [
      { id: 1, name: '安装步骤教程模板', description: '5步安装流程演示' },
      { id: 2, name: '选购指南模板', description: '3个选购关键点' },
      { id: 3, name: 'DIY改造模板', description: '从旧到新的改造过程' }
    ],
    cases: [
      { id: 1, title: '如何更换门铰链', platform: 'YouTube', engagement: '15K views', link: '#' },
      { id: 2, title: '选购门窗五金3要点', platform: 'TikTok', engagement: '8K views', link: '#' }
    ]
  },
  {
    type: 'case_study',
    label: '案例分享',
    icon: Award,
    formats: ['前后对比', '客户故事', '项目展示'],
    platforms: ['Facebook', 'Instagram', 'LinkedIn'],
    example: '用我们的产品改造的家居案例',
    templates: [
      { id: 1, name: '前后对比模板', description: 'Before & After对比图' },
      { id: 2, name: '客户故事模板', description: '客户使用体验分享' },
      { id: 3, name: '项目展示模板', description: '完整项目案例' }
    ],
    cases: [
      { id: 1, title: '旧房翻新案例', platform: 'Instagram', engagement: '3.2K likes', link: '#' },
      { id: 2, title: '承包商成功案例', platform: 'LinkedIn', engagement: '850 likes', link: '#' }
    ]
  },
  {
    type: 'comparison',
    label: '对比评测',
    icon: BarChart3,
    formats: ['产品对比', '性价比分析', '质量测试'],
    platforms: ['YouTube', 'Reddit', 'Forums'],
    example: '$50 vs $100铰链对比，区别在哪？',
    templates: [
      { id: 1, name: '价格对比模板', description: '不同价位产品对比' },
      { id: 2, name: '质量测试模板', description: '耐用性测试对比' },
      { id: 3, name: '性价比分析模板', description: '综合性价比评分' }
    ],
    cases: [
      { id: 1, title: '铰链价格对比评测', platform: 'YouTube', engagement: '22K views', link: '#' },
      { id: 2, title: '五金质量测试', platform: 'Reddit', engagement: '450 upvotes', link: '#' }
    ]
  },
  {
    type: 'qa_discussion',
    label: '问答讨论',
    icon: MessageSquare,
    formats: ['论坛回答', '评论互动', 'AMA'],
    platforms: ['Reddit', 'Quora', 'Facebook Groups'],
    example: '在r/HomeImprovement回答门窗配件选择问题',
    templates: [
      { id: 1, name: '专业回答模板', description: '提供专业建议' },
      { id: 2, name: 'AMA互动模板', description: 'Ask Me Anything格式' },
      { id: 3, name: '常见问题模板', description: 'FAQ集锦' }
    ],
    cases: [
      { id: 1, title: 'Reddit DIY问答', platform: 'Reddit', engagement: '120 comments', link: '#' },
      { id: 2, title: 'Facebook群组互动', platform: 'Facebook', engagement: '85 comments', link: '#' }
    ]
  },
  {
    type: 'promotion',
    label: '促销活动',
    icon: Zap,
    formats: ['限时优惠', '新品发布', '活动通知'],
    platforms: ['所有平台'],
    example: '黑五促销，门窗配件套装8折',
    templates: [
      { id: 1, name: '限时优惠模板', description: '倒计时促销海报' },
      { id: 2, name: '新品发布模板', description: '新品上市预告' },
      { id: 3, name: '节日活动模板', description: '节日特惠活动' }
    ],
    cases: [
      { id: 1, title: '黑五促销活动', platform: 'All', engagement: '5K+ clicks', link: '#' },
      { id: 2, title: '新品发布会', platform: 'Instagram', engagement: '2.8K likes', link: '#' }
    ]
  }
];

// 🔗 经销商链接策略
const DEALER_LINK_STRATEGIES = [
  {
    id: 'where_to_buy',
    label: 'Where to Buy 页面',
    icon: MapPin,
    description: '官网提供经销商查找功能',
    implementation: [
      '在官网创建"Where to Buy"页面',
      '按邮编/城市搜索附近经销商',
      '显示经销商地址、电话、营业时间',
      '提供Google Maps导航'
    ],
    example: '"想购买？输入您的邮编，找到最近的授权经销商"'
  },
  {
    id: 'dealer_map',
    label: '经销商地图',
    icon: Globe,
    description: '互动式地图展示所有经销商',
    implementation: [
      '使用Google Maps API',
      '标注所有合作经销商',
      '点击查看详细信息',
      '筛选：按产品类别、服务类型'
    ],
    example: '地图上标注所有Home Depot、Lowe\'s等合作门店'
  },
  {
    id: 'social_link',
    label: '社媒内容引导',
    icon: Link2,
    description: '种草内容中自然引导',
    implementation: [
      '内容底部添加"Available at XXX stores"',
      '视频结尾显示经销商logo',
      '评论区置顶经销商链接',
      'Story添加"Where to Buy"链接贴纸'
    ],
    example: '"This product available at Home Depot and Lowe\'s near you"'
  },
  {
    id: 'qr_code',
    label: '二维码引导',
    icon: Hash,
    description: '扫码查找经销商',
    implementation: [
      '生成专属二维码',
      '线下物料、展会使用',
      '扫码→官网经销商页面',
      '追踪扫码来源和转化'
    ],
    example: '产品包装上印"Scan to find dealers near you"'
  },
  {
    id: 'dealer_feedback',
    label: '经销商询问追踪',
    icon: MessageSquare,
    description: '经销商端反馈系统',
    implementation: [
      '给经销商提供"Customer Inquiry Form"',
      '记录顾客问询来源（社媒/官网/口碑）',
      '定期收集反馈',
      '分析哪个活动带来最多询问'
    ],
    example: '经销商反馈："本周有3个顾客提到在Instagram看到你们的产品"'
  }
];

// 📊 效果指标
const PERFORMANCE_METRICS = {
  awareness: {
    label: '品牌认知层',
    metrics: [
      { key: 'impressions', label: '曝光量', icon: Eye, target: '10万+/月' },
      { key: 'reach', label: '触达人数', icon: Users, target: '5万+/月' },
      { key: 'video_views', label: '视频播放', icon: Video, target: '2万+/月' },
      { key: 'followers', label: '粉丝增长', icon: UserPlus, target: '+500/月' }
    ]
  },
  engagement: {
    label: '互动参与层',
    metrics: [
      { key: 'likes', label: '点赞数', icon: ThumbsUp, target: '5000+/月' },
      { key: 'comments', label: '评论数', icon: MessageSquare, target: '500+/月' },
      { key: 'shares', label: '分享数', icon: Share2, target: '300+/月' },
      { key: 'saves', label: '收藏数', icon: Star, target: '400+/月' }
    ]
  },
  conversion: {
    label: '转化行为层',
    metrics: [
      { key: 'website_clicks', label: '官网点击', icon: MousePointerClick, target: '1000+/月' },
      { key: 'dealer_search', label: '经销商查询', icon: Search, target: '200+/月' },
      { key: 'dealer_inquiry', label: '经销商询问', icon: MessageSquare, target: '50+/月' },
      { key: 'purchase_intent', label: '购买意向', icon: ShoppingCart, target: '30+/月' }
    ]
  },
  business: {
    label: '商业价值层',
    metrics: [
      { key: 'dealer_new_lead', label: '经销商新线索', icon: Briefcase, target: '10+/月' },
      { key: 'dealer_order', label: '经销商订单', icon: CheckCircle, target: '3+/月' },
      { key: 'roi', label: 'ROI', icon: DollarSign, target: '3:1' },
      { key: 'cac', label: '客户获取成本', icon: TrendingDown, target: '<$200' }
    ]
  }
};

// 类型定义
interface Campaign {
  id: number;
  name: string;
  market: string;
  status: 'active' | 'planning' | 'paused' | 'completed';
  method: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  metrics: {
    impressions: number;
    reach: number;
    engagement: number;
    dealerInquiries: number;
    roi: number;
  };
  platforms: string[];
  description?: string;
  goals?: string;
}

interface Content {
  id: number;
  title: string;
  type: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string;
  metrics?: {
    views: number;
    engagement: number;
  };
}

export default function SeedingCampaignCenterEnhanced({ userRole }: SeedingCampaignCenterProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // 对话框状态
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [showMethodDetail, setShowMethodDetail] = useState(false);
  const [showContentCreator, setShowContentCreator] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showCaseLibrary, setShowCaseLibrary] = useState(false);
  
  // 数据状态
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<any>(null);
  const [contents, setContents] = useState<Content[]>([]);
  
  // 新建活动表单数据
  const [newCampaignForm, setNewCampaignForm] = useState({
    name: '',
    market: '',
    method: '',
    budget: '',
    startDate: '',
    endDate: '',
    platforms: [] as string[],
    goals: '',
    description: ''
  });
  
  // 新建内容表单数据
  const [newContentForm, setNewContentForm] = useState({
    title: '',
    type: '',
    platform: '',
    description: '',
    scheduledDate: ''
  });

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedCampaigns = localStorage.getItem('seeding_campaigns');
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    } else {
      // 初始示例数据
      const initialCampaigns: Campaign[] = [
        {
          id: 1,
          name: '北美门窗配件种草活动 Q4 2024',
          market: 'north_america',
          status: 'active',
          method: 'local_agency',
          budget: 8000,
          spent: 4500,
          startDate: '2024-10-01',
          endDate: '2024-12-31',
          metrics: {
            impressions: 125000,
            reach: 68000,
            engagement: 8500,
            dealerInquiries: 42,
            roi: 3.2
          },
          platforms: ['Reddit', 'Facebook', 'Instagram', 'YouTube'],
          description: '通过本地代理团队在北美市场推广门窗配件',
          goals: '月曝光10万+，经销商询问50+，ROI 3:1'
        },
        {
          id: 2,
          name: '南美网红合作 - 家居装修类',
          market: 'south_america',
          status: 'active',
          method: 'influencer',
          budget: 15000,
          spent: 9000,
          startDate: '2024-11-01',
          endDate: '2025-01-31',
          metrics: {
            impressions: 280000,
            reach: 150000,
            engagement: 18500,
            dealerInquiries: 38,
            roi: 4.1
          },
          platforms: ['Instagram', 'YouTube', 'TikTok'],
          description: '与南美家居装修类网红合作推广',
          goals: '通过网红影响力快速提升品牌知名度'
        },
        {
          id: 3,
          name: '欧非自营团队持续运营',
          market: 'europe_africa',
          status: 'planning',
          method: 'inhouse',
          budget: 5000,
          spent: 0,
          startDate: '2025-01-01',
          endDate: '2025-03-31',
          metrics: {
            impressions: 0,
            reach: 0,
            engagement: 0,
            dealerInquiries: 0,
            roi: 0
          },
          platforms: ['Facebook', 'LinkedIn', 'Reddit'],
          description: '组建自营团队在欧非市场持续运营',
          goals: '建立长期稳定的社媒运营体系'
        }
      ];
      setCampaigns(initialCampaigns);
      localStorage.setItem('seeding_campaigns', JSON.stringify(initialCampaigns));
    }

    const savedContents = localStorage.getItem('seeding_contents');
    if (savedContents) {
      setContents(JSON.parse(savedContents));
    }
  }, []);

  // 保存数据到 localStorage
  const saveCampaigns = (updatedCampaigns: Campaign[]) => {
    setCampaigns(updatedCampaigns);
    localStorage.setItem('seeding_campaigns', JSON.stringify(updatedCampaigns));
  };

  const saveContents = (updatedContents: Content[]) => {
    setContents(updatedContents);
    localStorage.setItem('seeding_contents', JSON.stringify(updatedContents));
  };

  // 创建新活动
  const handleCreateCampaign = () => {
    if (!newCampaignForm.name || !newCampaignForm.market || !newCampaignForm.method) {
      toast.error('请填写必填项：活动名称、目标市场、执行方式');
      return;
    }

    const newCampaign: Campaign = {
      id: Date.now(),
      name: newCampaignForm.name,
      market: newCampaignForm.market,
      status: 'planning',
      method: newCampaignForm.method,
      budget: parseInt(newCampaignForm.budget) || 0,
      spent: 0,
      startDate: newCampaignForm.startDate,
      endDate: newCampaignForm.endDate,
      metrics: {
        impressions: 0,
        reach: 0,
        engagement: 0,
        dealerInquiries: 0,
        roi: 0
      },
      platforms: newCampaignForm.platforms,
      description: newCampaignForm.description,
      goals: newCampaignForm.goals
    };

    saveCampaigns([...campaigns, newCampaign]);
    
    // 重置表单
    setNewCampaignForm({
      name: '',
      market: '',
      method: '',
      budget: '',
      startDate: '',
      endDate: '',
      platforms: [],
      goals: '',
      description: ''
    });
    
    setShowNewCampaign(false);
    toast.success('种草活动创建成功！');
  };

  // 更新活动状态
  const handleUpdateCampaignStatus = (campaignId: number, newStatus: Campaign['status']) => {
    const updatedCampaigns = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: newStatus } : c
    );
    saveCampaigns(updatedCampaigns);
    toast.success('活动状态已更新');
  };

  // 删除活动
  const handleDeleteCampaign = (campaignId: number) => {
    if (confirm('确定要删除这个活动吗？')) {
      const updatedCampaigns = campaigns.filter(c => c.id !== campaignId);
      saveCampaigns(updatedCampaigns);
      setShowCampaignDetail(false);
      toast.success('活动已删除');
    }
  };

  // 创建内容
  const handleCreateContent = () => {
    if (!newContentForm.title || !newContentForm.type || !newContentForm.platform) {
      toast.error('请填写必填项');
      return;
    }

    const newContent: Content = {
      id: Date.now(),
      title: newContentForm.title,
      type: newContentForm.type,
      platform: newContentForm.platform,
      status: newContentForm.scheduledDate ? 'scheduled' : 'draft',
      scheduledDate: newContentForm.scheduledDate,
      metrics: {
        views: 0,
        engagement: 0
      }
    };

    saveContents([...contents, newContent]);
    
    setNewContentForm({
      title: '',
      type: '',
      platform: '',
      description: '',
      scheduledDate: ''
    });
    
    setShowContentCreator(false);
    toast.success('内容创建成功！');
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: '进行中', className: 'bg-green-600 text-white' },
      planning: { label: '筹备中', className: 'bg-blue-600 text-white' },
      paused: { label: '已暂停', className: 'bg-yellow-600 text-white' },
      completed: { label: '已完成', className: 'bg-gray-600 text-white' }
    };
    const config = configs[status as keyof typeof configs] || configs.planning;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getMethodBadge = (methodId: string) => {
    const method = EXECUTION_METHODS[methodId as keyof typeof EXECUTION_METHODS];
    if (!method) return null;
    
    const colors = {
      inhouse: 'bg-blue-100 text-blue-800',
      local_agency: 'bg-green-100 text-green-800',
      influencer: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[methodId as keyof typeof colors]}>
        {method.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            种草营销管理中心
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            终端拉动策略：通过C端影响B端，让经销商感受到市场需求
          </p>
        </div>
        <Button 
          onClick={() => setShowNewCampaign(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建种草活动
        </Button>
      </div>

      {/* 战略说明卡片 */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 mb-2">种草营销核心逻辑</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                  <span className="font-semibold text-slate-900">社媒种草</span>
                </div>
                <p className="text-slate-600">在目标市场的论坛、社媒平台发布内容，建立品牌认知</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</div>
                  <span className="font-semibold text-slate-900">终端需求</span>
                </div>
                <p className="text-slate-600">消费者产生需求，搜索"哪里能买到"，找到经销商</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">3</div>
                  <span className="font-semibold text-slate-900">反向拉动</span>
                </div>
                <p className="text-slate-600">消费者向经销商询问产品，经销商感受到市场需求</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">4</div>
                  <span className="font-semibold text-slate-900">B端成交</span>
                </div>
                <p className="text-slate-600">经销商主动联系我们进货，完成B2B成交</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">活动概览</TabsTrigger>
          <TabsTrigger value="methods">执行方式</TabsTrigger>
          <TabsTrigger value="content">内容管理</TabsTrigger>
          <TabsTrigger value="dealers">经销商链接</TabsTrigger>
          <TabsTrigger value="analytics">效果分析</TabsTrigger>
        </TabsList>

        {/* Tab 1: 活动概览 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 活动统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">进行中活动</p>
                  <p className="text-2xl text-slate-900 mt-1">
                    {campaigns.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">总预算</p>
                  <p className="text-2xl text-slate-900 mt-1">
                    ${campaigns.reduce((sum, c) => sum + c.budget, 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">总曝光量</p>
                  <p className="text-2xl text-slate-900 mt-1">
                    {(campaigns.reduce((sum, c) => sum + c.metrics.impressions, 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600">经销商询问</p>
                  <p className="text-2xl text-slate-900 mt-1">
                    {campaigns.reduce((sum, c) => sum + c.metrics.dealerInquiries, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Store className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* 活动列表 */}
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">所有活动</h2>
            <div className="space-y-4">
              {campaigns.map(campaign => {
                const market = TARGET_MARKETS.find(m => m.region === campaign.market);
                const MarketIcon = market?.icon || MapPin;
                const budgetProgress = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
                
                return (
                  <Card key={campaign.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                          {getMethodBadge(campaign.method)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MarketIcon className="w-3 h-3" />
                            {market?.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {campaign.startDate} ~ {campaign.endDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {campaign.platforms.length} 个平台
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowCampaignDetail(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          管理
                        </Button>
                      </div>
                    </div>

                    {/* 预算进度 */}
                    {campaign.budget > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">预算使用</span>
                          <span className="text-slate-900 font-medium">
                            ${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()} ({budgetProgress.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${budgetProgress > 90 ? 'bg-red-500' : budgetProgress > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 关键指标 */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <Eye className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">曝光</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {(campaign.metrics.impressions / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <Users className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">触达</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {(campaign.metrics.reach / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <ThumbsUp className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">互动</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {(campaign.metrics.engagement / 1000).toFixed(1)}K
                        </p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <Store className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-green-600">经销商询问</p>
                        <p className="text-sm font-semibold text-green-900">
                          {campaign.metrics.dealerInquiries}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <TrendingUp className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-600">ROI</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {campaign.metrics.roi > 0 ? `${campaign.metrics.roi.toFixed(1)}:1` : '-'}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
              
              {campaigns.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>还没有创建任何活动</p>
                  <Button 
                    className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setShowNewCampaign(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建第一个活动
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: 三种执行方式 */}
        <TabsContent value="methods" className="space-y-4">
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">选择执行方式</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(EXECUTION_METHODS).map(method => {
                const Icon = method.icon;
                const isSelected = selectedMethod === method.id;
                
                return (
                  <Card 
                    key={method.id} 
                    className={`p-5 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-2 border-orange-500 shadow-lg' 
                        : 'border-2 border-transparent hover:border-orange-200'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-${method.color}-100 flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${method.color}-600`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{method.label}</h3>
                        <p className="text-xs text-slate-600">{method.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <p className="text-slate-600 font-medium mb-1">✅ 优势</p>
                        <ul className="space-y-0.5">
                          {method.advantages.map((adv, idx) => (
                            <li key={idx} className="text-slate-700">• {adv}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-slate-600 font-medium mb-1">⚠️ 挑战</p>
                        <ul className="space-y-0.5">
                          {method.challenges.map((challenge, idx) => (
                            <li key={idx} className="text-slate-700">• {challenge}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-900 font-medium">{method.costs}</p>
                        <p className="text-slate-600 mt-0.5">{method.timeline}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <Button 
                        className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMethodDetail(true);
                        }}
                      >
                        查看详细流程
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* 选中方式后显示详细流程 */}
          {selectedMethod && (
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <h2 className="font-semibold text-slate-900 mb-4">
                {EXECUTION_METHODS[selectedMethod as keyof typeof EXECUTION_METHODS].label} - 标准化流程
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {EXECUTION_METHODS[selectedMethod as keyof typeof EXECUTION_METHODS].tasks.map((task, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{task}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => setShowMethodDetail(true)}
                    >
                      查看SOP
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: 内容管理 */}
        <TabsContent value="content" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">内容类型库</h2>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => setShowContentCreator(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建内容
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CONTENT_TYPES.map(content => {
                const Icon = content.icon;
                return (
                  <Card key={content.type} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{content.label}</h3>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="text-slate-600 mb-1">格式：</p>
                        <div className="flex flex-wrap gap-1">
                          {content.formats.map((format, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {format}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-600 mb-1">适合平台：</p>
                        <div className="flex flex-wrap gap-1">
                          {content.platforms.map((platform, idx) => (
                            <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded">
                        <p className="text-slate-700">{content.example}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => {
                          setSelectedContentType(content);
                          setShowTemplateLibrary(true);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        模板
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs"
                        onClick={() => {
                          setSelectedContentType(content);
                          setShowCaseLibrary(true);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        案例
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* 已创建的内容列表 */}
          {contents.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-900 mb-4">我的内容</h2>
              <div className="space-y-3">
                {contents.map(content => (
                  <Card key={content.id} className="p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900">{content.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {CONTENT_TYPES.find(t => t.type === content.type)?.label}
                          </Badge>
                          <Badge className={
                            content.status === 'published' ? 'bg-green-100 text-green-800' :
                            content.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {content.status === 'published' ? '已发布' :
                             content.status === 'scheduled' ? '已排期' : '草稿'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span>{content.platform}</span>
                          {content.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {content.scheduledDate}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const updated = contents.filter(c => c.id !== content.id);
                          saveContents(updated);
                          toast.success('内容已删除');
                        }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 4: 经销商链接 */}
        <TabsContent value="dealers" className="space-y-4">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-start gap-3">
              <Link2 className="w-6 h-6 text-green-600 mt-0.5" />
              <div>
                <h2 className="font-semibold text-slate-900 mb-2">经销商链接策略 - 关键环节</h2>
                <p className="text-sm text-slate-700 mb-3">
                  种草内容必须让消费者能够找到经销商，否则反向拉动无法实现！
                </p>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-slate-900 font-medium mb-2">核心逻辑：</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">消费者看到种草内容</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">产生购买兴趣</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">查找"哪里能买"</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">找到经销商</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">向经销商询问</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-900 mb-4">5种链接策略</h2>
            <div className="space-y-4">
              {DEALER_LINK_STRATEGIES.map((strategy, idx) => {
                const Icon = strategy.icon;
                return (
                  <Card key={strategy.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{strategy.label}</h3>
                          <Badge variant="outline">策略 {idx + 1}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{strategy.description}</p>

                        <div className="bg-slate-50 p-3 rounded-lg mb-3">
                          <p className="text-xs font-semibold text-slate-900 mb-2">实施步骤：</p>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {strategy.implementation.map((step, stepIdx) => (
                              <li key={stepIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs font-semibold text-blue-900 mb-1">示例：</p>
                          <p className="text-xs text-blue-800 italic">"{strategy.example}"</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5: 效果分析 */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">效果指标体系 - 四层漏斗模型</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                导出报告
              </Button>
            </div>
            
            <div className="space-y-4">
              {Object.entries(PERFORMANCE_METRICS).map(([key, layer], layerIdx) => (
                <Card key={key} className="p-4 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      {layerIdx + 1}
                    </div>
                    <h3 className="font-semibold text-slate-900">{layer.label}</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {layer.metrics.map(metric => {
                      const Icon = metric.icon;
                      return (
                        <div key={metric.key} className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-slate-600" />
                            <p className="text-xs text-slate-600">{metric.label}</p>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">-</p>
                          <p className="text-xs text-green-600 mt-1">目标: {metric.target}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">关键成功指标 (KSI)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-1">🎯 经销商询问转化率</p>
                    <p className="text-slate-700 text-xs">
                      目标: 每10万曝光 → 50+经销商询问 (0.05%)
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-1">💰 ROI投资回报</p>
                    <p className="text-slate-700 text-xs">
                      目标: 3:1 以上（每投入$1，带来$3的B端订单价值）
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-1">📈 经销商新增线索</p>
                    <p className="text-slate-700 text-xs">
                      目标: 每月新增10+个有采购意向的经销商线索
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="font-semibold text-slate-900 mb-1">🔄 客户获取成本 (CAC)</p>
                    <p className="text-slate-700 text-xs">
                      目标: {'<'}$200/个经销商客户
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建活动对话框 */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建种草活动</DialogTitle>
            <DialogDescription>
              填写活动基本信息，选择目标市场和执行方式
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>活动名称 *</Label>
              <Input 
                placeholder="例如：北美门窗配件种草活动 Q1 2025"
                value={newCampaignForm.name}
                onChange={(e) => setNewCampaignForm({...newCampaignForm, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>开始日期</Label>
                <Input 
                  type="date"
                  value={newCampaignForm.startDate}
                  onChange={(e) => setNewCampaignForm({...newCampaignForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label>结束日期</Label>
                <Input 
                  type="date"
                  value={newCampaignForm.endDate}
                  onChange={(e) => setNewCampaignForm({...newCampaignForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>目标市场 *</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {TARGET_MARKETS.map(market => {
                  const Icon = market.icon;
                  const isSelected = newCampaignForm.market === market.region;
                  return (
                    <Card 
                      key={market.region} 
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected ? 'border-orange-500 border-2 bg-orange-50' : 'hover:border-orange-200'
                      }`}
                      onClick={() => setNewCampaignForm({...newCampaignForm, market: market.region})}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-semibold text-slate-900">{market.label}</span>
                      </div>
                      <p className="text-xs text-slate-600">{market.countries.join(', ')}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>执行方式 *</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {Object.values(EXECUTION_METHODS).map(method => {
                  const Icon = method.icon;
                  const isSelected = newCampaignForm.method === method.id;
                  return (
                    <Card 
                      key={method.id} 
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected ? 'border-orange-500 border-2 bg-orange-50' : 'hover:border-orange-200'
                      }`}
                      onClick={() => setNewCampaignForm({...newCampaignForm, method: method.id})}
                    >
                      <Icon className="w-5 h-5 text-slate-600 mb-2" />
                      <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                      <p className="text-xs text-slate-600 mt-1">{method.costs}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>预算 ($)</Label>
              <Input 
                type="number" 
                placeholder="10000"
                value={newCampaignForm.budget}
                onChange={(e) => setNewCampaignForm({...newCampaignForm, budget: e.target.value})}
              />
            </div>

            <div>
              <Label>选择平台</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Reddit', 'Facebook', 'Instagram', 'YouTube', 'LinkedIn', 'TikTok', 'Pinterest'].map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform}
                      checked={newCampaignForm.platforms.includes(platform)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewCampaignForm({
                            ...newCampaignForm,
                            platforms: [...newCampaignForm.platforms, platform]
                          });
                        } else {
                          setNewCampaignForm({
                            ...newCampaignForm,
                            platforms: newCampaignForm.platforms.filter(p => p !== platform)
                          });
                        }
                      }}
                    />
                    <label htmlFor={platform} className="text-sm cursor-pointer">
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>活动目标</Label>
              <Textarea 
                placeholder="例如：在北美市场建立品牌认知，每月获得50+经销商询问，ROI达到3:1"
                rows={3}
                value={newCampaignForm.goals}
                onChange={(e) => setNewCampaignForm({...newCampaignForm, goals: e.target.value})}
              />
            </div>

            <div>
              <Label>活动描述</Label>
              <Textarea 
                placeholder="详细描述活动内容、策略等"
                rows={3}
                value={newCampaignForm.description}
                onChange={(e) => setNewCampaignForm({...newCampaignForm, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCampaign(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleCreateCampaign}
            >
              <Rocket className="w-4 h-4 mr-2" />
              创建活动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 活动详情对话框 */}
      <Dialog open={showCampaignDetail} onOpenChange={setShowCampaignDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>活动管理</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-6">
              {/* 活动状态控制 */}
              <Card className="p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-2">活动状态</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedCampaign.status)}
                      {getMethodBadge(selectedCampaign.method)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedCampaign.status === 'planning' && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'active')}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        启动活动
                      </Button>
                    )}
                    {selectedCampaign.status === 'active' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'paused')}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        暂停活动
                      </Button>
                    )}
                    {selectedCampaign.status === 'paused' && (
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'active')}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        恢复活动
                      </Button>
                    )}
                    {(selectedCampaign.status === 'active' || selectedCampaign.status === 'paused') && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateCampaignStatus(selectedCampaign.id, 'completed')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        完成活动
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* 活动基本信息 */}
              <Card className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600">目标市场</p>
                    <p className="text-slate-900 font-medium">
                      {TARGET_MARKETS.find(m => m.region === selectedCampaign.market)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">执行方式</p>
                    <p className="text-slate-900 font-medium">
                      {EXECUTION_METHODS[selectedCampaign.method as keyof typeof EXECUTION_METHODS]?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">活动周期</p>
                    <p className="text-slate-900 font-medium">
                      {selectedCampaign.startDate} ~ {selectedCampaign.endDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600">预算</p>
                    <p className="text-slate-900 font-medium">${selectedCampaign.budget.toLocaleString()}</p>
                  </div>
                </div>
                {selectedCampaign.platforms.length > 0 && (
                  <div className="mt-3">
                    <p className="text-slate-600 text-sm mb-2">投放平台</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.platforms.map(p => (
                        <Badge key={p} variant="outline">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* 预算使用情况 */}
              {selectedCampaign.budget > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">预算使用情况</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">已使用</span>
                      <span className="text-slate-900 font-medium">
                        ${selectedCampaign.spent.toLocaleString()} / ${selectedCampaign.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                        style={{ width: `${Math.min((selectedCampaign.spent / selectedCampaign.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">剩余预算</span>
                      <span className="text-green-600 font-medium">
                        ${(selectedCampaign.budget - selectedCampaign.spent).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* 数据表现 */}
              <Card className="p-4">
                <h3 className="font-semibold text-slate-900 mb-3">数据表现</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">曝光量</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(selectedCampaign.metrics.impressions / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">触达人数</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(selectedCampaign.metrics.reach / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <ThumbsUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">互动数</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {(selectedCampaign.metrics.engagement / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="text-center">
                    <Store className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">经销商询问</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedCampaign.metrics.dealerInquiries}
                    </p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">ROI</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {selectedCampaign.metrics.roi > 0 ? `${selectedCampaign.metrics.roi.toFixed(1)}:1` : '-'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* 活动目标和描述 */}
              {(selectedCampaign.goals || selectedCampaign.description) && (
                <Card className="p-4">
                  {selectedCampaign.goals && (
                    <div className="mb-3">
                      <h3 className="font-semibold text-slate-900 mb-2">活动目标</h3>
                      <p className="text-sm text-slate-700">{selectedCampaign.goals}</p>
                    </div>
                  )}
                  {selectedCampaign.description && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">活动描述</h3>
                      <p className="text-sm text-slate-700">{selectedCampaign.description}</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (selectedCampaign) {
                  handleDeleteCampaign(selectedCampaign.id);
                }
              }}
              className="mr-auto text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除活动
            </Button>
            <Button variant="outline" onClick={() => setShowCampaignDetail(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 执行方式详细流程对话框 */}
      <Dialog open={showMethodDetail} onOpenChange={setShowMethodDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMethod && EXECUTION_METHODS[selectedMethod as keyof typeof EXECUTION_METHODS].label} - 详细流程
            </DialogTitle>
            <DialogDescription>
              标准化执行步骤和最佳实践
            </DialogDescription>
          </DialogHeader>

          {selectedMethod && (
            <div className="space-y-4">
              {EXECUTION_METHODS[selectedMethod as keyof typeof EXECUTION_METHODS].detailedSteps?.map((step, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{step.title}</h3>
                        <Badge variant="outline" className="text-xs">{step.duration}</Badge>
                      </div>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {step.tasks.map((task, taskIdx) => (
                          <li key={taskIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-2">📖 完整SOP文档</p>
                    <p className="text-sm text-blue-800 mb-3">
                      详细的标准化流程文档请查看：<code className="bg-white px-2 py-0.5 rounded">/docs/种草营销标准化流程SOP.md</code>
                    </p>
                    <p className="text-xs text-blue-700">
                      文档包含完整的操作指南、检查清单、话术模板、风险管理等内容
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMethodDetail(false)}>
              关闭
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Copy className="w-4 h-4 mr-2" />
              复制流程清单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 内容创建对话框 */}
      <Dialog open={showContentCreator} onOpenChange={setShowContentCreator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建内容</DialogTitle>
            <DialogDescription>
              选择内容类型和平台，开始创作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>内容标题 *</Label>
              <Input 
                placeholder="例如：门窗铰链安装教程"
                value={newContentForm.title}
                onChange={(e) => setNewContentForm({...newContentForm, title: e.target.value})}
              />
            </div>

            <div>
              <Label>内容类型 *</Label>
              <Select 
                value={newContentForm.type}
                onValueChange={(value) => setNewContentForm({...newContentForm, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择内容类型" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(type => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>发布平台 *</Label>
              <Select 
                value={newContentForm.platform}
                onValueChange={(value) => setNewContentForm({...newContentForm, platform: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择发布平台" />
                </SelectTrigger>
                <SelectContent>
                  {['Instagram', 'Facebook', 'YouTube', 'TikTok', 'Reddit', 'LinkedIn', 'Pinterest'].map(platform => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>内容描述</Label>
              <Textarea 
                placeholder="描述内容创意、脚本、关键点等"
                rows={4}
                value={newContentForm.description}
                onChange={(e) => setNewContentForm({...newContentForm, description: e.target.value})}
              />
            </div>

            <div>
              <Label>计划发布时间（可选）</Label>
              <Input 
                type="datetime-local"
                value={newContentForm.scheduledDate}
                onChange={(e) => setNewContentForm({...newContentForm, scheduledDate: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContentCreator(false)}>
              取消
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleCreateContent}
            >
              <Plus className="w-4 h-4 mr-2" />
              创建内容
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 模板库对话框 */}
      <Dialog open={showTemplateLibrary} onOpenChange={setShowTemplateLibrary}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContentType?.label} - 模板库
            </DialogTitle>
            <DialogDescription>
              选择适合的模板快速开始创作
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedContentType?.templates?.map((template: any) => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-slate-600">{template.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    使用
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateLibrary(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 案例库对话框 */}
      <Dialog open={showCaseLibrary} onOpenChange={setShowCaseLibrary}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedContentType?.label} - 成功案例
            </DialogTitle>
            <DialogDescription>
              参考优秀案例，提升内容质量
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedContentType?.cases?.map((caseItem: any) => (
              <Card key={caseItem.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{caseItem.title}</h3>
                      <Badge variant="outline" className="text-xs">{caseItem.platform}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {caseItem.engagement}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    查看
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCaseLibrary(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
