import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  ArrowLeft, ArrowRight, Check, Target, Users, Share2, 
  FileText, Link as LinkIcon, Calendar, DollarSign, Eye,
  Instagram, Facebook, Youtube, Search, Image as ImageIcon,
  Video, Upload, X, Copy, CheckCircle2, Sparkles, TrendingUp,
  MapPin, Building2, Briefcase, Globe, UserCheck, Store,
  ShoppingBag, Play, Pause, BarChart3, Hash, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// TikTok图标组件
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface SocialMediaCampaignWizardProps {
  onClose: () => void;
  onPublish?: (campaign: any) => void;
}

export default function SocialMediaCampaignWizard({ onClose, onPublish }: SocialMediaCampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // 步骤1：活动目标
  const [campaignObjective, setCampaignObjective] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');

  // 步骤2：目标受众
  const [targetMarket, setTargetMarket] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [targetIndustry, setTargetIndustry] = useState<string[]>([]);

  // 步骤3：渠道选择
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // 步骤4：内容创建
  const [contentType, setContentType] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentCopy, setContentCopy] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);

  // 步骤5：落地页和追踪
  const [landingPageUrl, setLandingPageUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');

  // 步骤6：预算和排期
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bidStrategy, setBidStrategy] = useState('');

  const objectives = [
    {
      id: 'awareness',
      name: '品牌曝光',
      description: '提升品牌知名度，扩大触达范围',
      icon: Eye,
      color: 'blue',
      metrics: ['展示次数', '触达人数', '频次']
    },
    {
      id: 'traffic',
      name: '流量获取',
      description: '引导目标客户访问网站',
      icon: TrendingUp,
      color: 'purple',
      metrics: ['点击次数', 'CTR', '网站访问']
    },
    {
      id: 'leads',
      name: '潜客收集',
      description: '收集高质量B2B询盘线索',
      icon: UserCheck,
      color: 'green',
      metrics: ['询盘表单', '注册数', '下载数']
    },
    {
      id: 'conversion',
      name: '直接转化',
      description: '促进订单成交和交易',
      icon: ShoppingBag,
      color: 'orange',
      metrics: ['订单数', '交易额', 'ROAS']
    },
  ];

  const channels = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-purple-500 to-pink-500',
      contentTypes: ['图片', '视频', '轮播', '快拍'],
      audience: '视觉导向的B2B决策者',
      bestFor: '产品展示、品牌故事'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-400',
      contentTypes: ['图片', '视频', '轮播', '直播'],
      audience: '企业主、采购经理',
      bestFor: 'B2B广告、社群运营'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TikTokIcon,
      color: 'from-black to-gray-700',
      contentTypes: ['短视频', '直播'],
      audience: '年轻化的采购决策者',
      bestFor: '产品演示、工厂展示'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'from-red-600 to-red-400',
      contentTypes: ['视频', '直播'],
      audience: '寻求详细信息的买家',
      bestFor: '教程、案例研究'
    },
    {
      id: 'google',
      name: 'Google Ads',
      icon: Search,
      color: 'from-green-600 to-blue-600',
      contentTypes: ['搜索广告', '展示广告'],
      audience: '主动搜索的采购商',
      bestFor: '关键词营销、再营销'
    },
  ];

  const markets = [
    { id: 'north-america', name: '北美市场', flag: '🇺🇸', countries: 'USA, Canada, Mexico' },
    { id: 'south-america', name: '南美市场', flag: '🇧🇷', countries: 'Brazil, Argentina, Chile' },
    { id: 'europe-africa', name: '欧非市场', flag: '🇪🇺', countries: 'UK, Germany, France, South Africa' },
  ];

  const audienceTypes = [
    { id: 'retailer', name: '零售商', icon: Store, description: '单店/连锁店主和采购经理' },
    { id: 'wholesaler', name: '批发商', icon: ShoppingBag, description: '区域分销商和代理商' },
    { id: 'importer', name: '进口商', icon: Globe, description: '跨境贸易公司' },
    { id: 'purchaser', name: '采购经理', icon: Briefcase, description: '企业采购决策人' },
  ];

  const industries = [
    { id: 'construction', name: '建筑工程', icon: Building2 },
    { id: 'retail', name: '零售连锁', icon: Store },
    { id: 'hospitality', name: '酒店餐饮', icon: Building2 },
    { id: 'real-estate', name: '房地产开发', icon: Building2 },
    { id: 'facility', name: '物业设施管理', icon: Building2 },
  ];

  // 生成UTM追踪链接
  const generateTrackingUrl = () => {
    if (!landingPageUrl) return '';
    
    const baseUrl = landingPageUrl.includes('?') 
      ? landingPageUrl.split('?')[0] 
      : landingPageUrl;
    
    const params = new URLSearchParams();
    if (utmSource) params.append('utm_source', utmSource);
    if (utmMedium) params.append('utm_medium', utmMedium);
    if (utmCampaign) params.append('utm_campaign', utmCampaign);
    if (utmContent) params.append('utm_content', utmContent);
    
    return `${baseUrl}?${params.toString()}`;
  };

  const trackingUrl = generateTrackingUrl();

  const handleNext = () => {
    // 验证当前步骤
    if (currentStep === 1 && (!campaignObjective || !campaignName)) {
      toast.error('请完成活动目标设置');
      return;
    }
    if (currentStep === 2 && (targetMarket.length === 0 || targetAudience.length === 0)) {
      toast.error('请选择目标市场和受众类型');
      return;
    }
    if (currentStep === 3 && selectedChannels.length === 0) {
      toast.error('请至少选择一个营销渠道');
      return;
    }
    if (currentStep === 4 && (!contentType || !contentTitle)) {
      toast.error('请完成内容创建');
      return;
    }
    if (currentStep === 5 && !landingPageUrl) {
      toast.error('请设置落地页URL');
      return;
    }
    if (currentStep === 6 && (!budget || !startDate || !endDate)) {
      toast.error('请完成预算和排期设置');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    // 构建活动数据对象
    const newCampaign = {
      id: `camp-${Date.now()}`,
      name: campaignName,
      description: campaignDescription,
      objective: campaignObjective,
      channels: selectedChannels,
      market: targetMarket?.[0] || 'all', // 使用第一个市场作为主市场
      targetMarket: targetMarket,
      targetAudience: targetAudience,
      targetIndustry: targetIndustry,
      contentType: contentType,
      contentTitle: contentTitle,
      contentCopy: contentCopy,
      landingPageUrl: landingPageUrl,
      trackingUrl: trackingUrl,
      utmParams: {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
      },
      budget: Number(budget),
      spent: 0,
      startDate: startDate,
      endDate: endDate,
      bidStrategy: bidStrategy,
      status: 'active',
      createdAt: new Date().toISOString(),
      // 初始化追踪数据
      impressions: 0,
      clicks: 0,
      visits: 0,
      registrations: 0,
      inquiries: 0,
      quotes: 0,
      orders: 0,
      revenue: 0,
      // 初始化计算字段
      conversions: 0,
      ctr: 0,
      cpc: 0,
    };

    // 调用回调函数传递活动数据
    if (onPublish) {
      onPublish(newCampaign);
    }

    toast.success('活动已成功发布！', {
      description: '正在生成追踪链接和监控面板...'
    });
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handleSaveDraft = () => {
    toast.success('活动已保存为草稿');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const copyTrackingUrl = () => {
    if (trackingUrl) {
      navigator.clipboard.writeText(trackingUrl);
      toast.success('追踪链接已复制到剪贴板');
    }
  };

  const toggleSelection = (array: string[], setter: (val: string[]) => void, id: string) => {
    if (array.includes(id)) {
      setter(array.filter(item => item !== id));
    } else {
      setter([...array, id]);
    }
  };

  const steps = [
    { number: 1, name: '活动目标', icon: Target },
    { number: 2, name: '目标受众', icon: Users },
    { number: 3, name: '渠道选择', icon: Share2 },
    { number: 4, name: '内容创建', icon: FileText },
    { number: 5, name: '落地页追踪', icon: LinkIcon },
    { number: 6, name: '预算排期', icon: Calendar },
    { number: 7, name: '预览发布', icon: Eye },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
              创建社媒营销活动
            </h2>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: '12px' }}>
              全链路追踪 - 从点击到成交
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 进度指示器 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <p
                      className={`text-center ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}
                      style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 bg-gray-200 relative top-[-16px]">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        style={{ width: isCompleted ? '100%' : '0%' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 步骤1：活动目标 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  选择活动目标
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  明确的目标将帮助系统优化活动表现和追踪关键指标
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((obj) => {
                  const Icon = obj.icon;
                  const isSelected = campaignObjective === obj.id;
                  
                  return (
                    <div
                      key={obj.id}
                      onClick={() => setCampaignObjective(obj.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? `bg-${obj.color}-600`
                              : 'bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              isSelected ? 'text-white' : 'text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>
                              {obj.name}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>
                            {obj.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {obj.metrics.map((metric) => (
                              <Badge
                                key={metric}
                                variant="outline"
                                className="h-5 px-2"
                                style={{ fontSize: '10px' }}
                              >
                                {metric}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <Label htmlFor="campaignName" style={{ fontSize: '12px' }}>
                    活动名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="campaignName"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="例如：2025 Q1 北美卫浴产品推广"
                    className="mt-1.5 h-10"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="campaignDescription" style={{ fontSize: '12px' }}>
                    活动描述
                  </Label>
                  <Textarea
                    id="campaignDescription"
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="描述活动的核心卖点和预期效果..."
                    className="mt-1.5"
                    style={{ fontSize: '13px' }}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 步骤2：目标受众 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  定义目标受众
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  精准定位您的B2B目标客户，提升营销ROI
                </p>
              </div>

              {/* 目标市场 */}
              <div>
                <Label className="mb-3 block" style={{ fontSize: '13px', fontWeight: 600 }}>
                  <MapPin className="w-4 h-4 inline mr-1" />
                  目标市场 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {markets.map((market) => {
                    const isSelected = targetMarket.includes(market.id);
                    return (
                      <div
                        key={market.id}
                        onClick={() => toggleSelection(targetMarket, setTargetMarket, market.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: '24px' }}>{market.flag}</span>
                          <h4 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {market.name}
                          </h4>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />}
                        </div>
                        <p className="text-gray-500" style={{ fontSize: '10px' }}>
                          {market.countries}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 受众类型 */}
              <div>
                <Label className="mb-3 block" style={{ fontSize: '13px', fontWeight: 600 }}>
                  <Users className="w-4 h-4 inline mr-1" />
                  受众类型 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {audienceTypes.map((audience) => {
                    const Icon = audience.icon;
                    const isSelected = targetAudience.includes(audience.id);
                    return (
                      <div
                        key={audience.id}
                        onClick={() => toggleSelection(targetAudience, setTargetAudience, audience.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-blue-600' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                                {audience.name}
                              </h4>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-gray-600" style={{ fontSize: '11px' }}>
                              {audience.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 行业细分 */}
              <div>
                <Label className="mb-3 block" style={{ fontSize: '13px', fontWeight: 600 }}>
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  目标行业（可选）
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {industries.map((industry) => {
                    const Icon = industry.icon;
                    const isSelected = targetIndustry.includes(industry.id);
                    return (
                      <div
                        key={industry.id}
                        onClick={() => toggleSelection(targetIndustry, setTargetIndustry, industry.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all text-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-1 ${
                          isSelected ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <p className="text-gray-900" style={{ fontSize: '11px', fontWeight: isSelected ? 600 : 400 }}>
                          {industry.name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 步骤3：渠道选择 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  选择营销渠道
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  根据目标受众选择最有效的社媒平台
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = selectedChannels.includes(channel.id);
                  
                  return (
                    <div
                      key={channel.id}
                      onClick={() => toggleSelection(selectedChannels, setSelectedChannels, channel.id)}
                      className={`p-5 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center bg-gradient-to-br ${channel.color} flex-shrink-0`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
                              {channel.name}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>支持内容类型</p>
                              <div className="flex flex-wrap gap-1">
                                {channel.contentTypes.map((type) => (
                                  <Badge key={type} variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>目标受众</p>
                              <p className="text-gray-700" style={{ fontSize: '11px' }}>
                                {channel.audience}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>最适合</p>
                              <p className="text-gray-700" style={{ fontSize: '11px' }}>
                                {channel.bestFor}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedChannels.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-900 mb-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                        已选择 {selectedChannels.length} 个渠道
                      </p>
                      <p className="text-green-700" style={{ fontSize: '11px' }}>
                        系统将为每个渠道自动生成独立的追踪链接，帮助您分析各渠道的转化效果
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤4：内容创建 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  创建营销内容
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  准备吸引目标客户的优质内容素材
                </p>
              </div>

              <div>
                <Label htmlFor="contentType" style={{ fontSize: '12px' }}>
                  内容类型 <span className="text-red-500">*</span>
                </Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="mt-1.5 h-10" style={{ fontSize: '13px' }}>
                    <SelectValue placeholder="选择内容类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image" style={{ fontSize: '12px' }}>
                      <ImageIcon className="w-4 h-4 inline mr-2" />
                      单图广告
                    </SelectItem>
                    <SelectItem value="carousel" style={{ fontSize: '12px' }}>
                      <ImageIcon className="w-4 h-4 inline mr-2" />
                      轮播图集
                    </SelectItem>
                    <SelectItem value="video" style={{ fontSize: '12px' }}>
                      <Video className="w-4 h-4 inline mr-2" />
                      视频广告
                    </SelectItem>
                    <SelectItem value="live" style={{ fontSize: '12px' }}>
                      <Play className="w-4 h-4 inline mr-2" />
                      直播活动
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contentTitle" style={{ fontSize: '12px' }}>
                  内容标题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contentTitle"
                  value={contentTitle}
                  onChange={(e) => setContentTitle(e.target.value)}
                  placeholder="例如：高品质卫浴产品 - 工厂直供批发价"
                  className="mt-1.5 h-10"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <Label htmlFor="contentCopy" style={{ fontSize: '12px' }}>
                  广告文案
                </Label>
                <Textarea
                  id="contentCopy"
                  value={contentCopy}
                  onChange={(e) => setContentCopy(e.target.value)}
                  placeholder="编写吸引B2B客户的广告文案...&#10;&#10;建议包含：&#10;• 产品核心优势&#10;• 批发/大单优惠&#10;• 明确的CTA（行动号召）"
                  className="mt-1.5"
                  style={{ fontSize: '13px' }}
                  rows={6}
                />
              </div>

              <div>
                <Label style={{ fontSize: '12px' }}>
                  上传素材
                </Label>
                <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1" style={{ fontSize: '13px' }}>
                    点击上传或拖拽文件
                  </p>
                  <p className="text-gray-500" style={{ fontSize: '11px' }}>
                    支持 JPG, PNG, MP4, MOV (最大 50MB)
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                      B2B内容优化建议
                    </p>
                    <ul className="text-blue-700 space-y-1" style={{ fontSize: '11px' }}>
                      <li>• 突出产品质量认证和标准合规性</li>
                      <li>• 展示工厂实力和生产能力</li>
                      <li>• 提供批量采购的价格优势</li>
                      <li>• 包含成功案例和客户评价</li>
                      <li>• 明确下一步行动（询价、下载目录等）</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤5：落地页和追踪 */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  设置落地页和追踪参数
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  配置UTM参数，实现全链路数据追踪
                </p>
              </div>

              <div>
                <Label htmlFor="landingPageUrl" style={{ fontSize: '12px' }}>
                  落地页URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="landingPageUrl"
                  value={landingPageUrl}
                  onChange={(e) => {
                    setLandingPageUrl(e.target.value);
                    // 自动填充UTM参数建议
                    if (!utmCampaign && campaignName) {
                      setUtmCampaign(campaignName.toLowerCase().replace(/\s+/g, '_'));
                    }
                  }}
                  placeholder="https://www.cosun-global.com/products/bathroom"
                  className="mt-1.5 h-10"
                  style={{ fontSize: '13px' }}
                />
                <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                  输入客户点击广告后访问的页面URL
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="utmSource" style={{ fontSize: '12px' }}>
                    UTM Source（来源）
                  </Label>
                  <Input
                    id="utmSource"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    placeholder="例如：instagram, facebook, tiktok"
                    className="mt-1.5 h-10"
                    style={{ fontSize: '13px' }}
                  />
                  <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                    流量来源平台
                  </p>
                </div>

                <div>
                  <Label htmlFor="utmMedium" style={{ fontSize: '12px' }}>
                    UTM Medium（媒介）
                  </Label>
                  <Select value={utmMedium} onValueChange={setUtmMedium}>
                    <SelectTrigger className="mt-1.5 h-10" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择媒介类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social" style={{ fontSize: '12px' }}>social（社交媒体）</SelectItem>
                      <SelectItem value="cpc" style={{ fontSize: '12px' }}>cpc（付费点击）</SelectItem>
                      <SelectItem value="display" style={{ fontSize: '12px' }}>display（展示广告）</SelectItem>
                      <SelectItem value="video" style={{ fontSize: '12px' }}>video（视频广告）</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                    营销媒介类型
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="utmCampaign" style={{ fontSize: '12px' }}>
                  UTM Campaign（活动名称）
                </Label>
                <Input
                  id="utmCampaign"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="例如：2025_q1_bathroom_promo"
                  className="mt-1.5 h-10"
                  style={{ fontSize: '13px' }}
                />
                <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                  活动标识符，用于区分不同营销活动
                </p>
              </div>

              <div>
                <Label htmlFor="utmContent" style={{ fontSize: '12px' }}>
                  UTM Content（内容标识）
                </Label>
                <Input
                  id="utmContent"
                  value={utmContent}
                  onChange={(e) => setUtmContent(e.target.value)}
                  placeholder="例如：video_01, carousel_a, image_red_cta"
                  className="mt-1.5 h-10"
                  style={{ fontSize: '13px' }}
                />
                <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                  用于A/B测试，区分不同素材版本
                </p>
              </div>

              {trackingUrl && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-900 mb-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                        追踪链接已生成
                      </p>
                      <p className="text-green-700 mb-2" style={{ fontSize: '11px' }}>
                        在广告中使用此链接，系统将自动追踪点击、访问、注册、询价和订单数据
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-green-300 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-600" style={{ fontSize: '11px', fontWeight: 600 }}>
                        完整追踪URL
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-gray-800 bg-gray-50 p-2 rounded break-all" style={{ fontSize: '11px' }}>
                        {trackingUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyTrackingUrl}
                        className="h-8 px-3 flex-shrink-0"
                        style={{ fontSize: '11px' }}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        复制
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                      全链路追踪说明
                    </p>
                    <div className="text-blue-700 space-y-1" style={{ fontSize: '11px' }}>
                      <p>✓ <strong>点击追踪：</strong>记录广告点击次数和来源</p>
                      <p>✓ <strong>访问追踪：</strong>追踪落地页访问和浏览行为</p>
                      <p>✓ <strong>注册追踪：</strong>识别新注册用户来源</p>
                      <p>✓ <strong>询价追踪：</strong>记录询价表单提交</p>
                      <p>✓ <strong>订单追踪：</strong>归因成交订单和收入</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤6：预算和排期 */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  设置预算和投放排期
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  控制营销成本，优化投放时间
                </p>
              </div>

              <div>
                <Label htmlFor="budget" style={{ fontSize: '12px' }}>
                  总预算（USD）<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="5000"
                  className="mt-1.5 h-10"
                  style={{ fontSize: '13px' }}
                />
                <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                  建议B2B活动预算：$3,000 - $20,000
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" style={{ fontSize: '12px' }}>
                    开始日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1.5 h-10"
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate" style={{ fontSize: '12px' }}>
                    结束日期 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1.5 h-10"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bidStrategy" style={{ fontSize: '12px' }}>
                  出价策略
                </Label>
                <Select value={bidStrategy} onValueChange={setBidStrategy}>
                  <SelectTrigger className="mt-1.5 h-10" style={{ fontSize: '13px' }}>
                    <SelectValue placeholder="选择出价策略" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" style={{ fontSize: '12px' }}>
                      自动出价 - 系统优化CPM/CPC
                    </SelectItem>
                    <SelectItem value="manual-cpc" style={{ fontSize: '12px' }}>
                      手动CPC - 控制每次点击成本
                    </SelectItem>
                    <SelectItem value="target-cpa" style={{ fontSize: '12px' }}>
                      目标CPA - 优化转化成本
                    </SelectItem>
                    <SelectItem value="target-roas" style={{ fontSize: '12px' }}>
                      目标ROAS - 优化广告回报率
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {budget && startDate && endDate && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-900 mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>
                    预算分配预估
                  </h4>
                  <div className="space-y-2">
                    {selectedChannels.map((channelId) => {
                      const channel = channels.find(c => c.id === channelId);
                      if (!channel) return null;
                      const Icon = channel.icon;
                      const channelBudget = (Number(budget) / selectedChannels.length).toFixed(0);
                      
                      return (
                        <div key={channelId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br ${channel.color}`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-gray-700" style={{ fontSize: '12px' }}>
                              {channel.name}
                            </span>
                          </div>
                          <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                            ${channelBudget}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 mt-3 border-t border-gray-300 flex items-center justify-between">
                    <span className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                      总计
                    </span>
                    <span className="text-blue-600" style={{ fontSize: '14px', fontWeight: 700 }}>
                      ${budget}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 步骤7：预览发布 */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                  活动预览
                </h3>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  确认所有设置无误后发布活动
                </p>
              </div>

              {/* 活动概览卡片 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {campaignName || '未命名活动'}
                    </h3>
                    <p className="text-gray-600" style={{ fontSize: '12px' }}>
                      {campaignDescription || '暂无描述'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>活动目标</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {objectives.find(o => o.id === campaignObjective)?.name || '-'}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>投放渠道</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {selectedChannels.length} 个平台
                    </p>
                  </div>
                  <div className="bg-white/80 rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>总预算</p>
                    <p className="text-green-600" style={{ fontSize: '13px', fontWeight: 600 }}>
                      ${budget || '0'}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded p-3">
                    <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>投放时长</p>
                    <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {startDate && endDate 
                        ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}天`
                        : '-'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 详细配置 */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Users className="w-4 h-4" />
                    目标受众
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-500 mb-2" style={{ fontSize: '11px' }}>目标市场</p>
                      <div className="flex flex-wrap gap-1">
                        {targetMarket.map(marketId => {
                          const market = markets.find(m => m.id === marketId);
                          return market ? (
                            <Badge key={marketId} variant="outline" className="h-6 px-2" style={{ fontSize: '11px' }}>
                              {market.flag} {market.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-2" style={{ fontSize: '11px' }}>受众类型</p>
                      <div className="flex flex-wrap gap-1">
                        {targetAudience.map(audienceId => {
                          const audience = audienceTypes.find(a => a.id === audienceId);
                          return audience ? (
                            <Badge key={audienceId} variant="outline" className="h-6 px-2" style={{ fontSize: '11px' }}>
                              {audience.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-2" style={{ fontSize: '11px' }}>目标行业</p>
                      <div className="flex flex-wrap gap-1">
                        {targetIndustry.length > 0 ? targetIndustry.map(industryId => {
                          const industry = industries.find(i => i.id === industryId);
                          return industry ? (
                            <Badge key={industryId} variant="outline" className="h-6 px-2" style={{ fontSize: '11px' }}>
                              {industry.name}
                            </Badge>
                          ) : null;
                        }) : (
                          <span className="text-gray-400" style={{ fontSize: '11px' }}>未指定</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Share2 className="w-4 h-4" />
                    投放渠道
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedChannels.map(channelId => {
                      const channel = channels.find(c => c.id === channelId);
                      if (!channel) return null;
                      const Icon = channel.icon;
                      return (
                        <div key={channelId} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                          <div className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br ${channel.color}`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>
                            {channel.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <FileText className="w-4 h-4" />
                    营销内容
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500" style={{ fontSize: '11px', width: '80px' }}>内容类型：</span>
                      <span className="text-gray-900" style={{ fontSize: '12px' }}>
                        {contentType === 'image' ? '单图广告' :
                         contentType === 'carousel' ? '轮播图集' :
                         contentType === 'video' ? '视频广告' :
                         contentType === 'live' ? '直播活动' : '-'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500" style={{ fontSize: '11px', width: '80px' }}>标题：</span>
                      <span className="text-gray-900" style={{ fontSize: '12px' }}>
                        {contentTitle || '-'}
                      </span>
                    </div>
                    {contentCopy && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500" style={{ fontSize: '11px', width: '80px' }}>文案：</span>
                        <span className="text-gray-600" style={{ fontSize: '11px' }}>
                          {contentCopy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-gray-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <LinkIcon className="w-4 h-4" />
                    追踪链接
                  </h4>
                  {trackingUrl ? (
                    <div className="bg-gray-50 rounded p-3">
                      <code className="text-gray-800 break-all" style={{ fontSize: '11px' }}>
                        {trackingUrl}
                      </code>
                    </div>
                  ) : (
                    <p className="text-gray-400" style={{ fontSize: '11px' }}>未设置</p>
                  )}
                </div>
              </div>

              {/* 预期效果预测 */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-gray-900 mb-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                      预期效果预测（基于历史数据）
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded p-3">
                        <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>预计触达</p>
                        <p className="text-gray-900" style={{ fontSize: '16px', fontWeight: 700 }}>
                          {budget ? (Number(budget) * 50).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>预计点击</p>
                        <p className="text-blue-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                          {budget ? (Number(budget) * 1.5).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>预计询盘</p>
                        <p className="text-purple-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                          {budget ? Math.round(Number(budget) * 0.08) : '-'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-3">
                        <p className="text-gray-500 mb-1" style={{ fontSize: '10px' }}>预计订单</p>
                        <p className="text-green-600" style={{ fontSize: '16px', fontWeight: 700 }}>
                          {budget ? Math.round(Number(budget) * 0.02) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-10 px-4"
                style={{ fontSize: '13px' }}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                上一步
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              className="h-10 px-4"
              style={{ fontSize: '13px' }}
            >
              保存草稿
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
                style={{ fontSize: '13px' }}
              >
                下一步
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                className="h-10 px-4 bg-green-600 hover:bg-green-700"
                style={{ fontSize: '13px' }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                发布活动
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
