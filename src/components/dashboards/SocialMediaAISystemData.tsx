// 🎯 社交媒体AI系统数据配置
// 包含目标客户类型、平台配置、AI工具、执行流程等核心数据

import { 
  Store, Hammer, Plane, Palette, Home, Building2,
  Linkedin, Facebook, Instagram, Youtube, Share2
} from 'lucide-react';

// 🎯 目标客户类型
export const ALL_TARGET_CUSTOMERS = [
  {
    type: 'Retailer',
    name: '零售商/经销商',
    label: '零售商',
    icon: Store,
    description: '大型零售商、连锁店、经销商网络',
    platforms: ['LinkedIn', 'Facebook', 'Instagram'],
    contentFocus: ['产品目录', '批发价格', 'B2B案例', '行业趋势'],
    kpis: { reach: 'high', engagement: 'medium', conversion: 'high' },
    avgOrderValue: '$50K',
    conversionRate: '12%',
    ltv: '$200K',
    isNew: false,
    idealProfile: {
      '公司规模': '50-500人',
      '年采购额': '$200K-$1M',
      '决策周期': '1-3个月',
      '关注点': '价格+质量'
    },
    socialSignals: [
      '发布产品采购信息',
      '关注行业展会动态',
      '寻找新供应商',
      '比较产品规格和价格'
    ]
  },
  {
    type: 'Contractor',
    name: '承包商/工程商',
    label: '承包商',
    icon: Hammer,
    description: '建筑承包商、装修公司、工程项目方',
    platforms: ['LinkedIn', 'Facebook', 'YouTube'],
    contentFocus: ['工程案例', '产品性能', '技术支持', '项目合作'],
    kpis: { reach: 'medium', engagement: 'high', conversion: 'high' },
    avgOrderValue: '$35K',
    conversionRate: '15%',
    ltv: '$150K',
    isNew: false,
    idealProfile: {
      '公司规模': '10-100人',
      '年项目数': '20-50个',
      '决策周期': '2-4周',
      '关注点': '质量+交期'
    },
    socialSignals: [
      '分享项目案例照片',
      '寻找特定产品供应商',
      '询问技术规格问题',
      '关注安装和维护'
    ]
  },
  {
    type: 'Distributor',
    name: '进口商/贸易商',
    label: '进口商',
    icon: Plane,
    description: '国际贸易商、进口代理、分销网络',
    platforms: ['LinkedIn', 'Facebook'],
    contentFocus: ['出口能力', '认证资质', '物流方案', '贸易条款'],
    kpis: { reach: 'high', engagement: 'medium', conversion: 'medium' },
    avgOrderValue: '$80K',
    conversionRate: '10%',
    ltv: '$350K',
    isNew: false,
    idealProfile: {
      '公司规模': '20-200人',
      '年进口额': '$500K-$5M',
      '决策周期': '3-6个月',
      '关注点': '认证+物流'
    },
    socialSignals: [
      '寻找出口商和制造商',
      '询问产品认证资质',
      '关注国际贸易政策',
      '建立长期合作关系'
    ]
  },
  {
    type: 'Designer',
    name: '设计师/建筑师',
    label: '设计师',
    icon: Palette,
    description: '室内设计师、建筑设计公司、设计事务所',
    platforms: ['Instagram', 'LinkedIn', 'Pinterest'],
    contentFocus: ['设计案例', '产品美学', '定制服务', '趋势分享'],
    kpis: { reach: 'medium', engagement: 'high', conversion: 'medium' },
    avgOrderValue: '$25K',
    conversionRate: '8%',
    ltv: '$80K',
    isNew: false,
    idealProfile: {
      '公司规模': '5-50人',
      '年项目数': '10-30个',
      '决策周期': '1-2个月',
      '关注点': '美学+创新'
    },
    socialSignals: [
      '分享设计作品和灵感',
      '关注最新设计趋势',
      '寻找独特产品和材料',
      '与品牌商合作'
    ]
  },
  {
    type: 'EndUser',
    name: '终端用户/消费者',
    label: '终端用户',
    icon: Home,
    description: '高端住宅业主、商业地产、酒店项目',
    platforms: ['Instagram', 'Facebook', 'TikTok'],
    contentFocus: ['产品展示', '使用教程', '用户评价', '品牌故事'],
    kpis: { reach: 'very high', engagement: 'very high', conversion: 'low' },
    avgOrderValue: '$15K',
    conversionRate: '5%',
    ltv: '$30K',
    isNew: false,
    idealProfile: {
      '目标群体': '高端业主',
      '项目类型': '住宅/商业',
      '决策周期': '1-3周',
      '关注点': '品质+服务'
    },
    socialSignals: [
      '关注家居装修内容',
      '寻找产品评价和推荐',
      '询问使用和安装问题',
      '分享使用体验'
    ]
  },
  {
    type: 'PropertyDeveloper',
    name: '地产开发商',
    label: '地产商',
    icon: Building2,
    description: '房地产开发商、商业地产、酒店集团',
    platforms: ['LinkedIn', 'Facebook'],
    contentFocus: ['大型项目', '批量采购', '长期合作', '定制方案'],
    kpis: { reach: 'high', engagement: 'medium', conversion: 'very high' },
    avgOrderValue: '$120K',
    conversionRate: '18%',
    ltv: '$500K',
    isNew: true,
    idealProfile: {
      '公司规模': '100-1000人',
      '年项目数': '5-20个',
      '决策周期': '6-12个月',
      '关注点': '规模+成本'
    },
    socialSignals: [
      '发布项目招标信息',
      '寻找批量供应商',
      '关注行业政策动态',
      '建立战略合作伙伴'
    ]
  }
];

// 🔵 社交媒体平台配置
export const SOCIAL_PLATFORMS = [
  {
    platform: 'LinkedIn',
    name: 'LinkedIn',
    icon: Linkedin,
    priority: 1,
    effectiveness: 92,
    description: 'B2B专业网络',
    category: 'B2B专业网络',
    color: '#0A66C2',
    strengths: ['B2B获客', '行业影响力', '专业内容', '商业合作'],
    targetAudience: ['Retailer', 'Contractor', 'Distributor', 'Designer'],
    contentTypes: ['行业洞察', '案例研究', '产品白皮书', '公司动态'],
    bestPractices: ['发布行业分析', '分享专业知识', '建立思想领导力', '参与行业讨论'],
    postingFrequency: '每周3-5次',
    optimalTimes: ['周二-周四 9:00-11:00', '周三 12:00-14:00'],
    adTypes: ['Sponsored Content', 'Text Ads', 'InMail']
  },
  {
    platform: 'Facebook',
    name: 'Facebook',
    icon: Facebook,
    priority: 2,
    effectiveness: 88,
    description: '全场景社交平台',
    category: '全场景社交平台',
    color: '#1877F2',
    strengths: ['广泛覆盖', '精准定位', '社群运营', '广告系统'],
    targetAudience: ['Retailer', 'Contractor', 'Distributor', 'EndUser'],
    contentTypes: ['产品视频', '客户案例', '促销活动', '直播互动'],
    bestPractices: ['视频优先', '建立社群', '客户互动', 'Messenger营销'],
    postingFrequency: '每天1-2次',
    optimalTimes: ['周三-周五 13:00-16:00', '周末 12:00-15:00'],
    adTypes: ['Image Ads', 'Video Ads', 'Carousel', 'Collection']
  },
  {
    platform: 'Instagram',
    name: 'Instagram',
    icon: Instagram,
    priority: 3,
    effectiveness: 85,
    description: '视觉内容平台',
    category: '视觉内容平台',
    color: '#E4405F',
    strengths: ['视觉展示', '品牌建设', '年轻受众', 'Stories/Reels'],
    targetAudience: ['Designer', 'EndUser', 'Contractor'],
    contentTypes: ['产品美图', '设计灵感', '安装教程', '客户分享'],
    bestPractices: ['高质量图片', 'Stories互动', 'Reels视频', 'Hashtag策略'],
    postingFrequency: '每天1-3次',
    optimalTimes: ['周一-周五 11:00-13:00', '19:00-21:00'],
    adTypes: ['Photo Ads', 'Video Ads', 'Stories Ads', 'Reels Ads']
  },
  {
    platform: 'YouTube',
    name: 'YouTube',
    icon: Youtube,
    priority: 4,
    effectiveness: 80,
    description: '视频内容平台',
    category: '视频内容平台',
    color: '#FF0000',
    strengths: ['长视频', 'SEO价值', '教育内容', '品牌权威'],
    targetAudience: ['Contractor', 'Designer', 'EndUser'],
    contentTypes: ['产品演示', '安装教程', '项目案例', '行业教育'],
    bestPractices: ['SEO优化标题', '详细描述', '字幕添加', '播放列表'],
    postingFrequency: '每周1-2次',
    optimalTimes: ['周末 12:00-16:00', '工作日 18:00-22:00'],
    adTypes: ['TrueView Ads', 'Bumper Ads', 'Discovery Ads']
  },
  {
    platform: 'TikTok',
    name: 'TikTok',
    icon: Share2,
    priority: 5,
    effectiveness: 78,
    description: '短视频娱乐平台',
    category: '短视频娱乐平台',
    color: '#000000',
    strengths: ['病毒传播', '年轻用户', '创意内容', '快速增长'],
    targetAudience: ['EndUser', 'Designer'],
    contentTypes: ['产品创意展示', '趋势挑战', 'DIY教程', '幕后花絮'],
    bestPractices: ['跟随趋势', '音乐配合', '快节奏剪辑', '互动挑战'],
    postingFrequency: '每天2-4次',
    optimalTimes: ['周一-周五 12:00-14:00', '18:00-22:00'],
    adTypes: ['In-Feed Ads', 'TopView', 'Brand Takeover', 'Hashtag Challenge']
  }
];

// 🤖 AI工具配置
export const AI_TOOLS = [
  {
    category: '内容生成',
    name: 'ChatGPT',
    icon: 'Bot',
    capabilities: ['文案撰写', 'SEO优化', '标题生成', '脚本创作'],
    use_cases: ['LinkedIn长文', 'Facebook帖子', '广告文案', '博客文章'],
    prompt_template: '为{platform}平台创建一条关于{product}的{content_type}，目标受众是{audience}，语气{tone}，字数{word_count}字'
  },
  {
    category: '图像生成',
    name: 'Midjourney',
    icon: 'Sparkles',
    capabilities: ['产品渲染', '场景设计', '概念图', '营销素材'],
    use_cases: ['Instagram视觉', '广告图片', '品牌设计', '灵感图'],
    prompt_template: '/imagine {product} in {style} style, {scene}, professional photography, 8k, --ar {aspect_ratio}'
  },
  {
    category: '视频编辑',
    name: 'Runway ML',
    icon: 'Film',
    capabilities: ['视频生成', '背景替换', '特效添加', '自动剪辑'],
    use_cases: ['产品视频', 'Reels制作', 'TikTok内容', '广告素材'],
    prompt_template: 'Generate a {duration}s video showing {product}, {action}, cinematic lighting, smooth transitions'
  },
  {
    category: '数据分析',
    name: 'Analytics AI',
    icon: 'BarChart3',
    capabilities: ['趋势预测', '受众洞察', 'A/B测试', 'ROI优化'],
    use_cases: ['投放优化', '内容策略', '受众定位', '预算分配'],
    prompt_template: 'Analyze {metric} performance for {platform} campaign, identify patterns and suggest optimization strategies'
  }
];

// 📋 执行工作流
export const EXECUTION_WORKFLOW = [
  {
    stage: '策略规划',
    steps: ['目标设定', '受众分析', '平台选择', '内容规划'],
    duration: '1-2周',
    deliverables: ['营销策略文档', '内容日历', '预算分配', 'KPI设定']
  },
  {
    stage: '内容创作',
    steps: ['AI生成初稿', '人工审核', '视觉设计', '品牌审批'],
    duration: '持续进行',
    deliverables: ['图文内容', '视频素材', '广告创意', 'Landing Page']
  },
  {
    stage: '发布执行',
    steps: ['排期发布', '社群互动', '付费推广', '实时监控'],
    duration: '持续进行',
    deliverables: ['发布日志', '互动记录', '广告报告', '舆情监测']
  },
  {
    stage: '数据分析',
    steps: ['效果追踪', 'A/B测试', '趋势分析', '优化建议'],
    duration: '每周/每月',
    deliverables: ['数据报告', '优化方案', 'ROI分析', '下期计划']
  },
  {
    stage: '线索转化',
    steps: ['线索识别', '评分筛选', '销售对接', '客户培育'],
    duration: '持续进行',
    deliverables: ['线索列表', 'CRM录入', '跟进记录', '转化报告']
  }
];

// 🎬 视频工具配置
export const VIDEO_TOOLS = [
  {
    name: 'Premiere Pro',
    type: '专业剪辑',
    level: 'Advanced',
    use_cases: ['长视频', 'YouTube内容', '品牌宣传片'],
    features: ['多轨编辑', '颜色校正', '音频混音', '特效合成'],
    learning_curve: 'Steep'
  },
  {
    name: 'CapCut',
    type: '快速剪辑',
    level: 'Beginner',
    use_cases: ['TikTok', 'Reels', 'Stories'],
    features: ['自动字幕', '模板库', '特效滤镜', '音乐库'],
    learning_curve: 'Easy'
  },
  {
    name: 'Canva Video',
    type: '模板制作',
    level: 'Beginner',
    use_cases: ['广告视频', '产品展示', '社交帖子'],
    features: ['海量模板', '拖拽编辑', '品牌套件', '团队协作'],
    learning_curve: 'Very Easy'
  }
];

// 📺 直播系统配置
export const LIVESTREAM_SYSTEM = {
  platforms: [
    {
      name: 'Facebook Live',
      max_duration: '8小时',
      max_viewers: '无限制',
      features: ['实时互动', '观众洞察', '视频存档', '多平台分发'],
      equipment: ['摄像头', '麦克风', '灯光', '稳定器'],
      best_for: ['产品发布', '工厂参观', 'Q&A会议', '展会直播']
    },
    {
      name: 'LinkedIn Live',
      max_duration: '4小时',
      max_viewers: '基于粉丝数',
      features: ['专业受众', '企业品牌', '领导力展示', '行业讨论'],
      equipment: ['高清摄像头', '专业麦克风', '虚拟背景', '演示软件'],
      best_for: ['行业峰会', '专家访谈', '新品发布', '企业培训']
    },
    {
      name: 'Instagram Live',
      max_duration: '4小时',
      max_viewers: '基于粉丝数',
      features: ['Stories整合', '实时互动', '保存回放', '合作直播'],
      equipment: ['手机/相机', '稳定器', '环形灯', '移动麦克风'],
      best_for: ['幕后花絮', '产品演示', '设计分享', '客户互动']
    }
  ],
  content_ideas: [
    '工厂参观 - 展示生产线和质量控制',
    '产品演示 - 现场展示产品特性和使用方法',
    '专家访谈 - 邀请行业专家讨论趋势',
    '客户案例 - 分享成功项目和客户见证',
    'Q&A会议 - 解答客户疑问和技术问题',
    '新品发布 - 首发展示新产品和创新功能',
    '展会报道 - 现场报道行业展会和活动',
    '培训课程 - 提供产品使用和维护培训'
  ],
  engagement_tactics: [
    '提前预告直播时间和主题',
    '准备互动问题和抽奖活动',
    '邀请观众提前提交问题',
    '展示独家内容和优惠',
    '实时回复评论和问题',
    '使用投票和问卷功能',
    '邀请嘉宾增加吸引力',
    '直播后发布精彩剪辑'
  ]
};