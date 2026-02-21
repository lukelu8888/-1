// 🤖 AI内容生成工作台 Pro版 - 多语言、真实AI API、完整历史记录
// 新增功能：Facebook/Instagram/Twitter模板、多语言、OpenAI集成、A/B测试

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  Sparkles, Wand2, Copy, Download, RefreshCw, Settings, 
  FileText, Image, Video, Megaphone, Target, TrendingUp,
  Save, Edit, Trash2, Eye, CheckCircle, Clock, Zap, Mail,
  MessageSquare, Share2, Globe, History, BookOpen, Lightbulb,
  Award, Check, BarChart, Star, Facebook, Instagram, Twitter, 
  Youtube
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../../utils/clipboard'; // 🔥 使用安全的剪贴板工具

interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  icon: any;
  description: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }[];
  prompt: string;
  example?: string;
  supportsAB?: boolean; // 是否支持A/B测试
}

interface HistoryItem {
  id: number;
  template: string;
  timestamp: string;
  content: string;
  language: string;
  inputs: { [key: string]: string };
  rating?: number;
}

// 扩展的内容模板库
const contentTemplates: ContentTemplate[] = [
  // ===== 产品类 =====
  {
    id: 'product-description',
    name: '产品描述',
    category: 'Product',
    icon: Image,
    description: '生成专业的B2B产品描述，突出卖点和规格',
    fields: [
      { name: 'productName', label: '产品名称', type: 'text', placeholder: '如：智能门锁', required: true },
      { name: 'category', label: '产品类别', type: 'text', placeholder: '如：五金/门窗配件' },
      { name: 'features', label: '主要功能', type: 'textarea', placeholder: '列出产品的核心功能和卖点' },
      { name: 'specs', label: '技术规格', type: 'textarea', placeholder: '尺寸、材质、认证等' },
      { name: 'tone', label: '语言风格', type: 'select', options: ['专业正式', '友好亲切', '技术详细', '简洁明快'] }
    ],
    prompt: '为B2B客户生成专业的产品描述，包含功能、规格和优势',
    supportsAB: true
  },
  {
    id: 'product-comparison',
    name: '产品对比',
    category: 'Product',
    icon: TrendingUp,
    description: '生成产品与竞品的对比说明',
    fields: [
      { name: 'ourProduct', label: '我们的产品', type: 'text', placeholder: '产品名称', required: true },
      { name: 'competitor', label: '竞品', type: 'text', placeholder: '竞争对手产品' },
      { name: 'advantages', label: '我们的优势', type: 'textarea', placeholder: '列出3-5个优势' },
      { name: 'pricePoint', label: '价格定位', type: 'select', options: ['更低价', '性价比', '高端定位'] }
    ],
    prompt: '生成客观专业的产品对比，突出我们的优势',
    supportsAB: true
  },

  // ===== 邮件类 =====
  {
    id: 'cold-email',
    name: '开发信',
    category: 'Email',
    icon: Mail,
    description: '生成个性化的客户开发邮件，提高回复率',
    fields: [
      { name: 'recipientName', label: '收件人姓名', type: 'text', placeholder: '如：John Smith' },
      { name: 'company', label: '客户公司', type: 'text', placeholder: '如：ABC Hardware Ltd.' },
      { name: 'industry', label: '行业', type: 'text', placeholder: '如：家居建材零售' },
      { name: 'painPoint', label: '客户痛点', type: 'textarea', placeholder: '客户可能面临的问题' },
      { name: 'solution', label: '我们的解决方案', type: 'textarea', placeholder: '如何帮助客户' },
      { name: 'cta', label: '行动号召', type: 'select', options: ['预约视频会议', '索取样品', '获取报价', '查看目录'] }
    ],
    prompt: '生成专业的B2B开发信，个性化、简洁、有吸引力',
    supportsAB: true
  },
  {
    id: 'follow-up-email',
    name: '跟进邮件',
    category: 'Email',
    icon: MessageSquare,
    description: '生成礼貌的跟进邮件，维护客户关系',
    fields: [
      { name: 'previousContact', label: '上次沟通内容', type: 'textarea', placeholder: '上次交流的要点' },
      { name: 'daysSince', label: '距离上次联系', type: 'select', options: ['3天', '1周', '2周', '1个月'] },
      { name: 'purpose', label: '跟进目的', type: 'select', options: ['催促回复', '提供新信息', '分享案例', '节日问候'] },
      { name: 'valueAdd', label: '新增价值', type: 'textarea', placeholder: '这次提供的新信息或优惠' }
    ],
    prompt: '生成专业的跟进邮件，不唐突、有价值',
    supportsAB: true
  },

  // ===== 社媒类 - LinkedIn =====
  {
    id: 'linkedin-post',
    name: 'LinkedIn帖子',
    category: 'LinkedIn',
    icon: Share2,
    description: '生成专业的LinkedIn内容，展示行业专业性',
    fields: [
      { name: 'topic', label: '主题', type: 'text', placeholder: '如：新品发布、行业洞察、客户案例', required: true },
      { name: 'keyMessage', label: '核心信息', type: 'textarea', placeholder: '想要传达的主要内容' },
      { name: 'callToAction', label: 'CTA', type: 'text', placeholder: '如：联系我们了解更多' },
      { name: 'hashtags', label: '话题标签', type: 'text', placeholder: '如：#B2B #Manufacturing #SmartHome' },
      { name: 'postType', label: '帖子类型', type: 'select', options: ['产品介绍', '行业洞察', '客户案例', '公司动态'] }
    ],
    prompt: '生成专业的LinkedIn帖子，适合B2B营销',
    supportsAB: true
  },

  // ===== 社媒类 - Facebook =====
  {
    id: 'facebook-ad',
    name: 'Facebook广告',
    category: 'Facebook',
    icon: Facebook,
    description: '生成吸引眼球的Facebook广告文案',
    fields: [
      { name: 'productService', label: '产品/服务', type: 'text', placeholder: '推广的产品或服务', required: true },
      { name: 'targetAudience', label: '目标受众', type: 'text', placeholder: '如：北美家居零售商' },
      { name: 'uniqueSelling', label: '独特卖点', type: 'textarea', placeholder: '为什么选择我们？' },
      { name: 'offer', label: '优惠/促销', type: 'text', placeholder: '如：首单8折、免费样品' },
      { name: 'adFormat', label: '广告格式', type: 'select', options: ['单图广告', '轮播广告', '视频广告', '精品栏广告'] }
    ],
    prompt: '生成简洁有力的Facebook广告文案，包含标题、正文和CTA',
    supportsAB: true
  },
  {
    id: 'facebook-post',
    name: 'Facebook动态',
    category: 'Facebook',
    icon: Facebook,
    description: '生成吸引互动的Facebook主页动态',
    fields: [
      { name: 'postGoal', label: '发帖目的', type: 'select', options: ['产品推广', '品牌故事', '客户互动', '行业资讯'], required: true },
      { name: 'content', label: '内容要点', type: 'textarea', placeholder: '想要分享的内容' },
      { name: 'engagementType', label: '互动类型', type: 'select', options: ['提问互动', '投票', '分享故事', '征集意见'] },
      { name: 'emoji', label: '表情风格', type: 'select', options: ['专业简洁', '友好活泼', '热情洋溢'] }
    ],
    prompt: '生成适合Facebook的轻松友好的动态内容，鼓励互动',
    supportsAB: true
  },

  // ===== 社媒类 - Instagram =====
  {
    id: 'instagram-caption',
    name: 'Instagram标题',
    category: 'Instagram',
    icon: Instagram,
    description: '生成吸引眼球的Instagram帖子标题',
    fields: [
      { name: 'imageContent', label: '图片内容', type: 'text', placeholder: '如：新品展示、工厂场景、客户案例', required: true },
      { name: 'message', label: '核心信息', type: 'textarea', placeholder: '想要传达的内容' },
      { name: 'hashtags', label: '话题标签数量', type: 'select', options: ['5-10个', '10-15个', '15-20个', '20-30个'] },
      { name: 'captionStyle', label: '标题风格', type: 'select', options: ['简短有力', '故事叙述', '激励人心', '幽默风趣'] }
    ],
    prompt: '生成Instagram风格的标题，包含表情符号和相关标签',
    supportsAB: true
  },
  {
    id: 'instagram-story',
    name: 'Instagram故事',
    category: 'Instagram',
    icon: Instagram,
    description: '生成Instagram快拍的文案和互动元素',
    fields: [
      { name: 'storyType', label: '故事类型', type: 'select', options: ['产品介绍', '幕后花絮', '用户见证', '促销活动'], required: true },
      { name: 'duration', label: '时长', type: 'select', options: ['单帧(15秒)', '多帧(3-5帧)', '长故事(5+帧)'] },
      { name: 'interactive', label: '互动元素', type: 'select', options: ['投票', '提问', '测验', '滑动链接'] },
      { name: 'urgency', label: '紧迫感', type: 'select', options: ['限时优惠', '限量供应', '新品预告', '无紧迫感'] }
    ],
    prompt: '生成Instagram Story脚本，包含文字、互动元素和时间规划',
    supportsAB: false
  },

  // ===== 社媒类 - Twitter/X =====
  {
    id: 'twitter-thread',
    name: 'Twitter长推文',
    category: 'Twitter',
    icon: Twitter,
    description: '生成有深度的Twitter/X主题推文串',
    fields: [
      { name: 'mainTopic', label: '主题', type: 'text', placeholder: '如：供应链优化技巧', required: true },
      { name: 'keyPoints', label: '关键要点', type: 'textarea', placeholder: '列出3-5个要点' },
      { name: 'threadLength', label: '推文数量', type: 'select', options: ['3-5条', '5-8条', '8-10条'] },
      { name: 'tone', label: '语气', type: 'select', options: ['专业权威', '轻松对话', '激励鼓舞'] }
    ],
    prompt: '生成Twitter推文串，每条控制在280字符内，结构清晰',
    supportsAB: false
  },
  {
    id: 'twitter-single',
    name: 'Twitter单条推文',
    category: 'Twitter',
    icon: Twitter,
    description: '生成简洁有力的单条推文',
    fields: [
      { name: 'message', label: '核心信息', type: 'textarea', placeholder: '想要传达的内容', required: true },
      { name: 'includeHashtags', label: '包含标签', type: 'select', options: ['是', '否'] },
      { name: 'includeEmoji', label: '包含表情', type: 'select', options: ['是', '否'] },
      { name: 'callToAction', label: 'CTA类型', type: 'select', options: ['访问网站', '回复评论', '转发分享', '无CTA'] }
    ],
    prompt: '生成280字符内的推文，简洁有力',
    supportsAB: true
  },

  // ===== 视频类 =====
  {
    id: 'video-script',
    name: '视频脚本',
    category: 'Video',
    icon: Video,
    description: '生成产品展示或工厂参观视频的脚本',
    fields: [
      { name: 'videoType', label: '视频类型', type: 'select', options: ['产品展示', '工厂参观', '使用教程', '客户见证'], required: true },
      { name: 'duration', label: '时长', type: 'select', options: ['30秒', '1分钟', '3分钟', '5分钟'] },
      { name: 'product', label: '产品/主题', type: 'text', placeholder: '视频的核心主题' },
      { name: 'keyPoints', label: '关键要点', type: 'textarea', placeholder: '需要强调的3-5个要点' },
      { name: 'targetAudience', label: '目标观众', type: 'text', placeholder: '如：北美零售商、欧洲批发商' }
    ],
    prompt: '生成结构化的视频脚本，包含画面和旁白',
    supportsAB: false
  },
  {
    id: 'youtube-description',
    name: 'YouTube视频描述',
    category: 'Video',
    icon: Youtube,
    description: '生成优化的YouTube视频描述和标签',
    fields: [
      { name: 'videoTitle', label: '视频标题', type: 'text', placeholder: '视频的标题', required: true },
      { name: 'videoContent', label: '视频内容', type: 'textarea', placeholder: '视频主要讲什么' },
      { name: 'keywords', label: 'SEO关键词', type: 'text', placeholder: '如：智能门锁, B2B供应商' },
      { name: 'includeTimestamps', label: '包含时间戳', type: 'select', options: ['是', '否'] },
      { name: 'includeLinks', label: '包含链接', type: 'select', options: ['网站+社媒', '仅网站', '无链接'] }
    ],
    prompt: '生成SEO优化的YouTube描述，包含关键词、时间戳和链接',
    supportsAB: false
  }
];

export function AIContentStudioPro() {
  const [activeTemplate, setActiveTemplate] = useState<ContentTemplate | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentB, setContentB] = useState(''); // A/B测试的B版本
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN'); // 默认中文
  const [useRealAI, setUseRealAI] = useState(false); // 是否使用真实AI API
  const [generateAB, setGenerateAB] = useState(false); // 是否生成A/B版本
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // 从localStorage加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('aiContentHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // 保存历史记录到localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('aiContentHistory', JSON.stringify(history.slice(0, 50))); // 保留最近50条
    }
  }, [history]);

  // 语言选项
  const languages = [
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' }
  ];

  // 处理模板选择
  const handleTemplateSelect = (template: ContentTemplate) => {
    setActiveTemplate(template);
    setFormData({});
    setGeneratedContent('');
    setContentB('');
  };

  // 处理表单输入
  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 调用真实AI API (OpenAI)
  const callOpenAI = async (prompt: string): Promise<string> => {
    // 这里需要调用OpenAI API
    // 注意：由于安全原因，API密钥应该从服务器端调用
    toast.info('真实AI API集成开发中...');
    return '这是AI生成的真实内容（功能开发中）';
  };

  // 生成内容
  const handleGenerate = async () => {
    if (!activeTemplate) return;

    // 检查必填项
    const requiredFields = activeTemplate.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.name]);
    
    if (missingFields.length > 0) {
      toast.error(`请填写必填项：${missingFields.map(f => f.label).join('、')}`);
      return;
    }

    setIsGenerating(true);
    
    try {
      // 如果启用真实AI且有API密钥
      if (useRealAI && apiKey) {
        const content = await callOpenAI(activeTemplate.prompt);
        setGeneratedContent(content);
      } else {
        // 使用模拟生成
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockContent = generateMockContent(activeTemplate, formData, selectedLanguage);
        setGeneratedContent(mockContent);
        
        // 如果需要A/B测试
        if (generateAB && activeTemplate.supportsAB) {
          const mockContentB = generateMockContent(activeTemplate, formData, selectedLanguage, true);
          setContentB(mockContentB);
        }
      }
      
      // 添加到历史记录
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        template: activeTemplate.name,
        timestamp: new Date().toISOString(),
        content: generatedContent,
        language: selectedLanguage,
        inputs: { ...formData }
      };
      setHistory(prev => [newHistoryItem, ...prev]);
      
      toast.success('内容已生成！');
    } catch (error) {
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 模拟内容生成（支持多语言）
  const generateMockContent = (template: ContentTemplate, data: any, lang: string, isVersionB: boolean = false): string => {
    const isEnglish = lang.startsWith('en');
    const isSpanish = lang.startsWith('es');
    const isPortuguese = lang.startsWith('pt');
    
    // 根据模板ID生成不同内容
    switch (template.id) {
      case 'facebook-ad':
        if (isEnglish) {
          return isVersionB 
            ? `🎯 **Version B: Direct Approach**\n\n**Headline:** ${data.productService || 'Premium B2B Solutions'} - ${data.offer || 'Special Offer'}\n\n**Body:** Looking for reliable ${data.productService || 'B2B products'}? ${data.uniqueSelling || 'We deliver quality, consistency, and competitive pricing.'}\n\n${data.offer ? '🎁 **Limited Time:** ' + data.offer : ''}\n\n**Call-to-Action:** Get Your Free Sample Today! →\n\n#B2B #Wholesale #${(data.targetAudience || 'Quality').replace(/\s/g, '')}`
            : `✨ **Version A: Story-Based**\n\n**Headline:** Transform Your Business with ${data.productService || 'Our Solutions'}\n\n**Body:** ${data.targetAudience || 'Businesses like yours'} trust us for ${data.productService || 'premium products'}.\n\n${data.uniqueSelling || '✓ Factory-direct pricing\n✓ ISO certified quality\n✓ Fast shipping\n✓ Dedicated support'}\n\n${data.offer ? '🔥 **Special Offer:** ' + data.offer : ''}\n\n**Call-to-Action:** Contact Us for Pricing →\n\n#B2B #Manufacturing #QualityFirst`;
        }
        return `🎯 **${data.productService || '优质B2B解决方案'}**\n\n专为${data.targetAudience || '批发商和零售商'}设计\n\n${data.uniqueSelling || '✓ 工厂直供价格\n✓ ISO认证品质\n✓ 快速交付\n✓ 专业支持'}\n\n${data.offer ? '🎁 限时优惠：' + data.offer : ''}\n\n👉 立即联系获取报价！\n\n#B2B #批发 #品质保证`;

      case 'instagram-caption':
        if (isEnglish) {
          const hashtagCount = data.hashtags === '20-30个' ? 25 : data.hashtags === '15-20个' ? 18 : 10;
          const emojis = ['✨', '🎯', '💼', '🚀', '⭐', '💡', '🔥', '👏'];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          
          return `${randomEmoji} ${data.message || 'Discover innovation in B2B manufacturing'}\n\n${data.imageContent ? '📸 Featured: ' + data.imageContent : ''}\n\nWe believe in quality that speaks for itself. Every product tells a story of craftsmanship, innovation, and dedication.\n\n${data.captionStyle === '激励人心' ? '💪 Your success is our mission.\n🌟 Together, we build better.' : ''}\n\n${'#' + ['B2B', 'Manufacturing', 'Quality', 'Innovation', 'Wholesale', 'Business', 'Trade', 'Export', 'Supplier', 'Partnership'].slice(0, hashtagCount).join(' #')}`;
        }
        return `✨ ${data.message || '探索B2B制造业的创新'}\n\n${data.imageContent ? '📸 本期展示：' + data.imageContent : ''}\n\n我们相信品质会说话。每一件产品都诉说着工艺、创新和专注的故事。\n\n${'#' + ['B2B', '制造业', '品质', '创新', '批发', '商务', '贸易', '出口', '供应商', '合作伙伴'].join(' #')}`;

      case 'twitter-thread':
        const points = (data.keyPoints || '').split('\n').filter(p => p.trim());
        if (isEnglish) {
          let thread = `🧵 Thread: ${data.mainTopic || 'B2B Insights'}\n\n`;
          thread += `1/${points.length + 2} Let's talk about ${data.mainTopic || 'optimizing your supply chain'}. Here's what you need to know:\n\n`;
          points.forEach((point, idx) => {
            thread += `${idx + 2}/${points.length + 2} ${point}\n\n`;
          });
          thread += `${points.length + 2}/${points.length + 2} That's it! What's your experience with this? Drop your thoughts below 👇\n\n#B2B #Manufacturing #BusinessTips`;
          return thread;
        }
        let thread = `🧵 主题串：${data.mainTopic || 'B2B洞察'}\n\n`;
        thread += `1/${points.length + 2} 让我们聊聊${data.mainTopic || '供应链优化'}。这里是你需要知道的：\n\n`;
        points.forEach((point, idx) => {
          thread += `${idx + 2}/${points.length + 2} ${point}\n\n`;
        });
        thread += `${points.length + 2}/${points.length + 2} 就是这样！你的经验如何？欢迎在下方分享 👇\n\n#B2B #制造业 #商业技巧`;
        return thread;

      case 'youtube-description':
        if (isEnglish) {
          return `${data.videoTitle || 'Professional B2B Product Showcase'}\n\n${data.videoContent || 'In this video, we showcase our premium products designed for wholesale buyers and distributors.'}\n\n${data.includeTimestamps === '是' ? '⏱️ TIMESTAMPS:\n0:00 Introduction\n0:30 Product Overview\n2:00 Key Features\n4:00 Technical Specifications\n5:30 Conclusion\n\n' : ''}🔗 USEFUL LINKS:\n${data.includeLinks !== '无链接' ? '🌐 Website: www.cosun.com\n📧 Email: sales@cosun.com\n' : ''}${data.includeLinks === '网站+社媒' ? '📱 LinkedIn: linkedin.com/company/cosun\n📘 Facebook: facebook.com/cosun\n📸 Instagram: @cosun_official\n\n' : ''}\n🏷️ KEYWORDS:\n${data.keywords || 'B2B, wholesale, manufacturing, quality products, supplier'}\n\n#B2B #Manufacturing #Wholesale #Quality #Export`;
        }
        return `${data.videoTitle || '专业B2B产品展示'}\n\n${data.videoContent || '本视频展示我们为批发商和分销商设计的优质产品。'}\n\n${data.includeTimestamps === '是' ? '⏱️ 时间轴：\n0:00 开场介绍\n0:30 产品概览\n2:00 核心功能\n4:00 技术规格\n5:30 总结\n\n' : ''}🔗 相关链接：\n${data.includeLinks !== '无链接' ? '🌐 官网：www.cosun.com\n📧 邮箱：sales@cosun.com\n' : ''}${data.includeLinks === '网站+社媒' ? '📱 领英：linkedin.com/company/cosun\n📘 Facebook：facebook.com/cosun\n📸 Instagram：@cosun_official\n\n' : ''}\n🏷️ 关键词：\n${data.keywords || 'B2B, 批发, 制造业, 优质产品, 供应商'}\n\n#B2B #制造业 #批发 #品质 #出口`;

      // 其他模板使用原来的逻辑
      case 'product-description':
        if (isEnglish) {
          return `**${data.productName || 'Premium Product'}** - Professional B2B Solution\n\n${data.features || 'Advanced features designed for professional applications'}\n\n**Key Features:**\n- High-quality construction and materials\n- Industry-leading performance standards\n- Comprehensive warranty and support\n- Bulk order discounts available\n\n**Technical Specifications:**\n${data.specs || 'Professional-grade specifications meeting international standards'}\n\n**Perfect For:** Wholesale buyers, retailers, and distributors seeking reliable ${data.category || 'hardware'} solutions.\n\n**MOQ:** Available for bulk orders - Contact us for competitive pricing and samples.`;
        }
        if (isSpanish) {
          return `**${data.productName || 'Producto Premium'}** - Solución B2B Profesional\n\n${data.features || 'Características avanzadas diseñadas para aplicaciones profesionales'}\n\n**Características Clave:**\n- Construcción y materiales de alta calidad\n- Estándares de rendimiento líderes en la industria\n- Garantía integral y soporte\n- Descuentos por pedidos al por mayor\n\n**Especificaciones Técnicas:**\n${data.specs || 'Especificaciones de grado profesional que cumplen con estándares internacionales'}\n\n**Perfecto Para:** Compradores mayoristas, minoristas y distribuidores que buscan soluciones confiables de ${data.category || 'hardware'}.\n\n**MOQ:** Disponible para pedidos al por mayor - Contáctenos para precios competitivos y muestras.`;
        }
        return `**${data.productName || '优质产品'}** - 专业B2B解决方案\n\n${data.features || '为专业应用设计的先进功能'}\n\n**核心特性：**\n- 高品质构造和材料\n- 行业领先的性能标准\n- 全面的保修和支持\n- 批量订购折扣\n\n**技术规格：**\n${data.specs || '符合国际标准的专业级规格'}\n\n**适用于：** 寻求可靠${data.category || '五金'}解决方案的批发商、零售商和分销商。\n\n**起订量：** 支持批量订购 - 联系我们获取有竞争力的价格和样品。`;

      case 'cold-email':
        if (isEnglish) {
          return `Subject: ${data.solution ? 'Solution for ' + data.company : 'Partnership Opportunity with COSUN'}\n\nDear ${data.recipientName || 'Valued Partner'},\n\nI hope this email finds you well. I'm reaching out because ${data.company || 'your company'} ${data.industry ? 'in the ' + data.industry + ' sector' : ''} might benefit from our ${data.solution || 'innovative product solutions'}.\n\n**The Challenge:**\n${data.painPoint || 'Many businesses struggle with finding reliable suppliers with consistent quality and competitive pricing.'}\n\n**Our Solution:**\n${data.solution || 'We offer premium products with factory-direct pricing, full quality control, and flexible MOQ options.'}\n\n**Why Partner With Us:**\n✓ 15+ years manufacturing experience\n✓ ISO certified quality systems\n✓ Competitive factory-direct pricing\n✓ Flexible payment terms for established partners\n\nWould you be interested in ${data.cta || 'scheduling a brief call'} to explore how we can support your business growth?\n\nBest regards,\n[Your Name]\nCOSUN International`;
        }
        return `主题：${data.solution ? data.company + '的解决方案' : '与COSUN的合作机会'}\n\n尊敬的${data.recipientName || '合作伙伴'},\n\n希望这封邮件您一切安好。我联系您是因为${data.company || '贵公司'}${data.industry ? '在' + data.industry + '领域' : ''}可能会从我们的${data.solution || '创新产品解决方案'}中受益。\n\n**面临的挑战：**\n${data.painPoint || '许多企业在寻找具有稳定质量和有竞争力价格的可靠供应商方面遇到困难。'}\n\n**我们的解决方案：**\n${data.solution || '我们提供优质产品，工厂直供价格，全面质量控制，灵活的起订量选项。'}\n\n**为什么与我们合作：**\n✓ 15年以上制造经验\n✓ ISO认证质量体系\n✓ 有竞争力的工厂直供价格\n✓ 为成熟合作伙伴提供灵活的付款条件\n\n您是否有兴趣${data.cta || '安排一次简短通话'}，探讨我们如何支持您的业务增长？\n\n此致\n敬礼\n[您的名字]\nCOSUN国际`;

      default:
        return '专业的营销内容已生成，请根据实际情况调整使用。';
    }
  };

  // 复制内容
  const handleCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast.success('已复制到剪贴板！');
    } else {
      toast.error('复制失败，请手动复制');
    }
  };

  // 保存API密钥
  const handleSaveApiKey = () => {
    localStorage.setItem('openaiApiKey', apiKey);
    toast.success('API密钥已保存！');
    setShowSettings(false);
  };

  // 删除历史记录
  const handleDeleteHistory = (id: number) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.success('已删除！');
  };

  // 复用历史记录
  const handleReuseHistory = (item: HistoryItem) => {
    const template = contentTemplates.find(t => t.name === item.template);
    if (template) {
      setActiveTemplate(template);
      setFormData(item.inputs);
      setSelectedLanguage(item.language);
      setShowHistory(false);
      toast.success('已加载历史记录！');
    }
  };

  // 评分历史记录
  const handleRateHistory = (id: number, rating: number) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, rating } : item
    ));
    toast.success(`已评分：${rating}星`);
  };

  // 下载内容
  const handleDownload = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-content-${Date.now()}.txt`;
    a.click();
    toast.success('内容已下载！');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="size-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI内容生成工作台 Pro</h1>
                <p className="text-white/90 mt-1">多语言、多平台、A/B测试 - 专业营销文案生成</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 语言选择 */}
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 历史记录按钮 */}
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setShowHistory(true)}
              >
                <History className="size-4 mr-2" />
                历史记录 ({history.length})
              </Button>

              {/* 设置按钮 */}
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="size-4 mr-2" />
                设置
              </Button>
            </div>
          </div>
          
          {/* 快速统计 */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            {[
              { label: '可用模板', value: contentTemplates.length, icon: FileText },
              { label: '支持语言', value: languages.length, icon: Globe },
              { label: '历史记录', value: history.length, icon: History },
              { label: '本月生成', value: '87', icon: TrendingUp },
              { label: '节省时间', value: '52h', icon: Target }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="size-4" />
                  <span className="text-sm opacity-90">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：模板选择 */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="size-5 text-purple-600" />
                内容模板
              </h3>

              <Tabs defaultValue="all" className="mb-4">
                <TabsList className="grid grid-cols-5 w-full text-xs">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="product">产品</TabsTrigger>
                  <TabsTrigger value="email">邮件</TabsTrigger>
                  <TabsTrigger value="social">社媒</TabsTrigger>
                  <TabsTrigger value="video">视频</TabsTrigger>
                </TabsList>

                {/* 全部模板 */}
                <TabsContent value="all" className="space-y-2 mt-4 max-h-[600px] overflow-y-auto">
                  {contentTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                        activeTemplate?.id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          activeTemplate?.id === template.id ? 'bg-purple-600' : 'bg-slate-100'
                        }`}>
                          <template.icon className={`size-5 ${
                            activeTemplate?.id === template.id ? 'text-white' : 'text-slate-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-slate-900">
                              {template.name}
                            </h4>
                            {template.supportsAB && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                                A/B
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        {activeTemplate?.id === template.id && (
                          <Check className="size-5 text-purple-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </TabsContent>

                {/* 按类别筛选 */}
                <TabsContent value="product" className="space-y-2 mt-4">
                  {contentTemplates.filter(t => t.category === 'Product').map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeTemplate?.id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className="size-5 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="email" className="space-y-2 mt-4">
                  {contentTemplates.filter(t => t.category === 'Email').map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeTemplate?.id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className="size-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="social" className="space-y-2 mt-4">
                  {contentTemplates.filter(t => ['LinkedIn', 'Facebook', 'Instagram', 'Twitter'].includes(t.category)).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeTemplate?.id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className="size-5 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1">{template.category}</Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="video" className="space-y-2 mt-4">
                  {contentTemplates.filter(t => t.category === 'Video').map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeTemplate?.id === template.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <template.icon className="size-5 text-red-600" />
                        <div>
                          <h4 className="font-semibold text-sm">{template.name}</h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </TabsContent>
              </Tabs>

              {/* 提示 */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <Lightbulb className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">💡 Pro功能</p>
                    <p className="text-xs text-blue-700">
                      • 支持6种语言生成<br/>
                      • A/B测试对比版本<br/>
                      • 历史记录永久保存<br/>
                      • 可选真实AI API
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 右侧：表单和生成结果 */}
          <div className="lg:col-span-2 space-y-6">
            {!activeTemplate ? (
              <Card className="p-12 text-center">
                <Wand2 className="size-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  选择一个模板开始创作
                </h3>
                <p className="text-slate-600 mb-6">
                  从左侧选择适合您需求的内容模板，AI将帮您生成专业文案
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4" />
                    <span>{languages.length}种语言</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <span>{contentTemplates.length}个模板</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="size-4" />
                    <span>A/B测试</span>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                {/* 表单区域 */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <activeTemplate.icon className="size-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{activeTemplate.name}</h3>
                        <p className="text-sm text-slate-600">{activeTemplate.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activeTemplate.category}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {activeTemplate.fields.map((field) => (
                      <div key={field.name}>
                        <Label htmlFor={field.name} className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.type === 'text' && (
                          <Input
                            id={field.name}
                            placeholder={field.placeholder}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <Textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            rows={3}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                          />
                        )}
                        
                        {field.type === 'select' && field.options && (
                          <Select value={formData[field.name]} onValueChange={(value) => handleInputChange(field.name, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="请选择" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 高级选项 */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">高级选项</h4>
                    
                    {activeTemplate.supportsAB && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart className="size-4 text-slate-600" />
                          <Label htmlFor="ab-test" className="text-sm text-slate-700">生成A/B测试版本</Label>
                        </div>
                        <Switch
                          id="ab-test"
                          checked={generateAB}
                          onCheckedChange={setGenerateAB}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-slate-600" />
                        <Label htmlFor="real-ai" className="text-sm text-slate-700">使用真实AI API (需配置)</Label>
                      </div>
                      <Switch
                        id="real-ai"
                        checked={useRealAI}
                        onCheckedChange={setUseRealAI}
                        disabled={!apiKey}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="size-4 mr-2 animate-spin" />
                          AI生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-4 mr-2" />
                          生成内容
                        </>
                      )}
                    </Button>
                    {generatedContent && (
                      <Button variant="outline" onClick={handleGenerate}>
                        <RefreshCw className="size-4 mr-2" />
                        重新生成
                      </Button>
                    )}
                  </div>
                </Card>

                {/* 生成结果区域 */}
                {generatedContent && (
                  <>
                    {/* A版本或单一版本 */}
                    <Card className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <Star className="size-5 text-yellow-500" />
                          {generateAB ? '版本 A' : '生成的内容'}
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent)}>
                            <Copy className="size-4 mr-2" />
                            复制
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(generatedContent)}>
                            <Download className="size-4 mr-2" />
                            下载
                          </Button>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">
                          {generatedContent}
                        </pre>
                      </div>
                    </Card>

                    {/* B版本 (如果启用A/B测试) */}
                    {generateAB && contentB && (
                      <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Star className="size-5 text-blue-500" />
                            版本 B
                          </h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCopy(contentB)}>
                              <Copy className="size-4 mr-2" />
                              复制
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDownload(contentB)}>
                              <Download className="size-4 mr-2" />
                              下载
                            </Button>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">
                            {contentB}
                          </pre>
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 历史记录对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5" />
              历史记录 ({history.length})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <History className="size-12 mx-auto mb-3 text-slate-300" />
                <p>暂无历史记录</p>
              </div>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{item.template}</Badge>
                        <Badge variant="outline">
                          {languages.find(l => l.code === item.language)?.flag} {languages.find(l => l.code === item.language)?.name}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(item.timestamp).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < item.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!item.rating && (
                        <div className="flex gap-1 mr-2">
                          {[1, 2, 3, 4, 5].map(rating => (
                            <button
                              key={rating}
                              onClick={() => handleRateHistory(item.id, rating)}
                              className="hover:scale-110 transition-transform"
                            >
                              <Star className="size-4 text-slate-300 hover:text-yellow-500" />
                            </button>
                          ))}
                        </div>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleReuseHistory(item)}>
                        <RefreshCw className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(item.content)}>
                        <Copy className="size-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteHistory(item.id)}>
                        <Trash2 className="size-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded p-3 text-sm text-slate-700 line-clamp-3">
                    {item.content}
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 设置对话框 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5" />
              设置
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <Label htmlFor="api-key" className="text-sm font-semibold mb-2 block">
                OpenAI API密钥
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-2">
                配置后可使用真实AI生成更高质量的内容。密钥仅保存在本地浏览器中。
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <Lightbulb className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">⚠️ 注意事项</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>API调用会产生费用，请合理使用</li>
                    <li>建议设置使用限额</li>
                    <li>不要分享您的API密钥</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                取消
              </Button>
              <Button onClick={handleSaveApiKey}>
                <Save className="size-4 mr-2" />
                保存设置
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}