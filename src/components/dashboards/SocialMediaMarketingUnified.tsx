// 🎯 社交媒体营销 - 终极统一版
// 整合AI驱动版 + 经典版的所有优势功能
// 12个核心标签页，按业务流程组织

import { useState, useEffect } from 'react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Bot, Sparkles, Target, Users, TrendingUp, Zap, BarChart3,
  Copy, ExternalLink, CheckCircle, AlertCircle, Clock, Calendar,
  MessageSquare, ThumbsUp, Star, Hash, ArrowRight, BookOpen, Rocket,
  Lightbulb, Database, Search, Eye, Shield, Users2, Radio, Monitor,
  Film, Wand2, Scissors, Play, Download, UserPlus, Instagram, Facebook,
  Youtube, Linkedin, TrendingDown, DollarSign, MousePointerClick,
  Plus, Edit, Trash2, Share2, FileText, Video, Link as LinkIcon,
  Heart, Send, ShoppingBag, Filter, PieChart, Activity, Award,
  Mail, Code2, Settings, Globe, Building2, Bell, RefreshCw, CheckCircle2,
  TrendingUpIcon, AlertTriangle, MessageCircle, UserCheck, Megaphone
} from "lucide-react";
import { User } from "../../lib/rbac-config";
import { LiveStreamManagement } from './LiveStreamManagement';
import SeedingCampaignCenterEnhanced from '../admin/SeedingCampaignCenterEnhanced';
import CustomerIntakeSystem from '../admin/CustomerIntakeSystem';
import SocialMediaLeadsFlow from '../admin/SocialMediaLeadsFlow';
import SocialMediaAccounts from '../admin/SocialMediaAccounts';
import SocialMediaAPIDemo from '../admin/SocialMediaAPIDemo';
import SocialMediaCampaignWizard from '../admin/SocialMediaCampaignWizard';
import { FacebookAccountManager } from './FacebookAccountManager';
import { 
  ALL_TARGET_CUSTOMERS, 
  SOCIAL_PLATFORMS, 
  AI_TOOLS, 
  EXECUTION_WORKFLOW,
  VIDEO_TOOLS,
  LIVESTREAM_SYSTEM
} from './SocialMediaAISystemData';
import { toast } from 'sonner@2.0.3';
import React from 'react';

interface SocialMediaMarketingUnifiedProps {
  user: User;
}

// TikTok图标组件
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export function SocialMediaMarketingUnified({ user }: SocialMediaMarketingUnifiedProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomerType, setSelectedCustomerType] = useState('Retailer');
  const [selectedPlatform, setSelectedPlatform] = useState('LinkedIn');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30days');
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showFacebookManager, setShowFacebookManager] = useState(false);
  const [selectedChannelForManage, setSelectedChannelForManage] = useState<any>(null);
  
  // 🔵 Facebook实时数据状态
  const [facebookRealData, setFacebookRealData] = useState<any>(null);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [lastFacebookUpdate, setLastFacebookUpdate] = useState<Date | null>(null);

  // 渠道实时数据（来自经典版）
  const channels = [
    {
      id: 'linkedin', name: 'LinkedIn', icon: Linkedin,
      color: 'from-blue-700 to-blue-500', bgColor: 'bg-blue-50',
      followers: 8500, reach: 35600, engagement: 3.2,
      clicks: 1450, conversions: 112, spend: 2800, status: 'active'
    },
    {
      id: 'instagram', name: 'Instagram', icon: Instagram,
      color: 'from-purple-500 to-pink-500', bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      followers: 12500, reach: 45200, engagement: 3.8,
      clicks: 1240, conversions: 89, spend: 2450, status: 'active'
    },
    {
      id: 'facebook', name: 'Facebook', icon: Facebook,
      color: 'from-blue-600 to-blue-400', bgColor: 'bg-blue-50',
      // 🔵 使用真实数据（如果已连接）
      followers: facebookRealData?.fanCount || 8900, 
      reach: facebookRealData ? facebookRealData.fanCount * 3.6 : 32100, 
      engagement: facebookRealData ? parseFloat(facebookRealData.engagementRate) : 2.4,
      clicks: 980, 
      conversions: facebookRealData?.monthlyConversions || 67, 
      spend: 1890, 
      status: facebookConnected ? 'active' : 'disconnected',
      // 🔵 新增今日数据
      todayPosts: facebookRealData?.todayPosts || 0,
      todayEngagement: facebookRealData?.todayEngagement || 0,
      todayComments: facebookRealData?.todayComments || 0,
      todayNewFans: facebookRealData?.todayNewFans || 0,
      isRealData: !!facebookRealData
    },
    {
      id: 'tiktok', name: 'TikTok', icon: TikTokIcon,
      color: 'from-black to-gray-700', bgColor: 'bg-gray-50',
      followers: 25600, reach: 128000, engagement: 6.2,
      clicks: 3200, conversions: 156, spend: 3200, status: 'active'
    },
    {
      id: 'youtube', name: 'YouTube', icon: Youtube,
      color: 'from-red-600 to-red-400', bgColor: 'bg-red-50',
      followers: 5400, reach: 18900, engagement: 4.1,
      clicks: 890, conversions: 78, spend: 1560, status: 'active'
    },
    {
      id: 'google', name: 'Google Ads', icon: Search,
      color: 'from-green-600 to-blue-600', bgColor: 'bg-gradient-to-br from-green-50 to-blue-50',
      followers: 0, reach: 89000, engagement: 2.8,
      clicks: 4560, conversions: 234, spend: 5600, status: 'active'
    },
  ];

  // 🔵 获取Facebook实时数据
  const fetchFacebookData = async () => {
    const savedToken = localStorage.getItem('fb_access_token');
    const savedPageId = localStorage.getItem('fb_page_id');
    
    if (!savedToken || !savedPageId) {
      setFacebookConnected(false);
      return;
    }
    
    setFacebookLoading(true);
    
    try {
      // 获取主页基本信息
      const pageResponse = await fetch(
        `https://graph.facebook.com/v18.0/${savedPageId}?fields=name,fan_count,followers_count,new_like_count&access_token=${savedToken}`
      );
      
      const pageData = await pageResponse.json();
      
      // 🔥 检查是否是令牌过期错误
      if (pageData.error) {
        const errorCode = pageData.error.code;
        const errorSubcode = pageData.error.error_subcode;
        
        // OAuth错误码190表示令牌无效/过期
        if (errorCode === 190 || errorSubcode === 463) {
          console.warn('Facebook访问令牌已过期，正在清除本地缓存...');
          
          // 清除过期的令牌和相关数据
          localStorage.removeItem('fb_access_token');
          localStorage.removeItem('fb_page_id');
          localStorage.removeItem('fb_page_name');
          localStorage.removeItem('fb_user_id');
          localStorage.removeItem('fb_user_name');
          
          setFacebookConnected(false);
          setFacebookRealData(null);
          
          // 只在第一次检测到过期时显示提示
          if (facebookConnected) {
            toast.error('Facebook访问令牌已过期', {
              description: '请重新连接Facebook账号以继续获取实时数据'
            });
          }
          
          return; // 立即返回，避免继续尝试
        }
        
        // 其他API错误
        console.error('Facebook API错误:', pageData);
        throw new Error(pageData.error.message || '获取主页信息失败');
      }
      
      if (!pageResponse.ok) {
        throw new Error('获取主页信息失败');
      }
      
      // 获取最近帖子（用于计算今日发布数和互动数）
      const postsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${savedPageId}/posts?fields=created_time,message,likes.summary(true),comments.summary(true),shares&limit=100&access_token=${savedToken}`
      );
      
      let todayPosts = 0;
      let todayEngagement = 0;
      let todayComments = 0;
      let todayNewFans = 0;
      
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 计算今日数据
        postsData.data?.forEach((post: any) => {
          const postDate = new Date(post.created_time);
          postDate.setHours(0, 0, 0, 0);
          
          if (postDate.getTime() === today.getTime()) {
            todayPosts++;
            todayEngagement += (post.likes?.summary?.total_count || 0);
            todayEngagement += (post.comments?.summary?.total_count || 0);
            todayEngagement += (post.shares?.count || 0);
            todayComments += (post.comments?.summary?.total_count || 0);
          }
        });
      }
      
      // 🔵 获取今日新增粉丝数（使用Page Insights API）
      try {
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${savedPageId}/insights?metric=page_fans&period=day&since=${Math.floor(new Date().setHours(0,0,0,0) / 1000)}&until=${Math.floor(Date.now() / 1000)}&access_token=${savedToken}`
        );
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          // 从insights中获取今日新增粉丝数
          if (insightsData.data && insightsData.data.length > 0) {
            const values = insightsData.data[0].values;
            if (values && values.length > 0) {
              todayNewFans = values[values.length - 1].value || 0;
            }
          }
        }
      } catch (e) {
        console.log('无法获取insights数据，可能需要更多权限');
        // 如果无法获取insights，使用new_like_count（如果有），否则为0
        todayNewFans = pageData.new_like_count || 0;
      }
      
      // 计算互动率（基于今日互动和总粉丝）
      const engagementRate = pageData.fan_count > 0 
        ? ((todayEngagement / pageData.fan_count) * 100).toFixed(1)
        : '0';
      
      setFacebookRealData({
        name: pageData.name,
        fanCount: pageData.fan_count,
        followersCount: pageData.followers_count || pageData.fan_count,
        todayPosts,
        todayEngagement,
        todayComments,
        todayNewFans,
        engagementRate,
        monthlyConversions: 67 // 这个需要后续通过insights API获取
      });
      
      setFacebookConnected(true);
      setLastFacebookUpdate(new Date());
      
      // 成功获取数据后提示
      if (!facebookConnected) {
        toast.success(`✅ Facebook数据已同步`, {
          description: `${pageData.name} · ${pageData.fan_count.toLocaleString()} 粉丝`
        });
      }
      
    } catch (error: any) {
      console.error('获取Facebook数据失败:', error);
      setFacebookConnected(false);
      setFacebookRealData(null);
    } finally {
      setFacebookLoading(false);
    }
  };
  
  // 🔵 组件加载时获取Facebook数据
  useEffect(() => {
    const savedToken = localStorage.getItem('fb_access_token');
    const savedPageId = localStorage.getItem('fb_page_id');
    
    // 只在有有效令牌时才尝试获取数据
    if (savedToken && savedPageId) {
      fetchFacebookData();
      
      // 每5分钟自动刷新一次
      const interval = setInterval(() => {
        // 再次检查令牌是否仍然存在（可能已被清除）
        if (localStorage.getItem('fb_access_token')) {
          fetchFacebookData();
        }
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    } else {
      setFacebookConnected(false);
    }
  }, []);

  // 🔵 格式化粉丝数显示
  const formatFollowers = (count: number): string => {
    if (count === 0) return 'N/A';
    if (count < 1000) return count.toString();
    // 精确显示到小数点后1位
    return (count / 1000).toFixed(1) + 'K';
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(id);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const handlePublishCampaign = (newCampaign: any) => {
    setCampaigns([...campaigns, newCampaign]);
    toast.success('活动已添加到看板！');
  };

  const selectedCustomer = ALL_TARGET_CUSTOMERS.find(c => c.type === selectedCustomerType) || ALL_TARGET_CUSTOMERS[0];
  const selectedPlatformData = SOCIAL_PLATFORMS.find(p => p.platform === selectedPlatform) || SOCIAL_PLATFORMS[0];

  // 计算总体数据
  const totalFollowers = channels.reduce((sum, ch) => sum + ch.followers, 0);
  const totalReach = channels.reduce((sum, ch) => sum + ch.reach, 0);
  const totalClicks = channels.reduce((sum, ch) => sum + ch.clicks, 0);
  const totalConversions = channels.reduce((sum, ch) => sum + ch.conversions, 0);
  const totalSpend = channels.reduce((sum, ch) => sum + ch.spend, 0);
  const avgEngagement = (channels.reduce((sum, ch) => sum + ch.engagement, 0) / channels.length).toFixed(1);

  return (
    <div className="space-y-3 p-3 bg-slate-50">
      {/* 🎯 系统标题 - 终极版 */}
      <div className="rounded-lg p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Bot className="size-6" />
              社交媒体营销 - 终极统一版
            </h1>
            <p className="text-sm text-blue-100">
              整合AI驱动 + 数据监控 + 内容管理 + 客户开发 - 完整社媒营销解决方案
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-blue-100">总粉丝数</p>
              <p className="text-2xl font-bold">{(totalFollowers / 1000).toFixed(1)}K</p>
              <p className="text-xs text-blue-100">跨6大平台</p>
            </div>
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-blue-100">月度触达</p>
              <p className="text-2xl font-bold">{(totalReach / 1000).toFixed(0)}K</p>
              <p className="text-xs text-blue-100">总曝光量</p>
            </div>
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-blue-100">转化率</p>
              <p className="text-2xl font-bold">{((totalConversions / totalClicks) * 100).toFixed(1)}%</p>
              <p className="text-xs text-blue-100">点击→成交</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 核心Tabs - 12个标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-12 w-full">
          <TabsTrigger value="overview">📊 概览</TabsTrigger>
          <TabsTrigger value="platform-ops">📱 平台</TabsTrigger>
          <TabsTrigger value="calendar">📅 日历</TabsTrigger>
          <TabsTrigger value="ai-tools">🤖 AI</TabsTrigger>
          <TabsTrigger value="video-live">🎬 视频</TabsTrigger>
          <TabsTrigger value="seeding">🌱 种草</TabsTrigger>
          <TabsTrigger value="ads-seo">🎯 广告</TabsTrigger>
          <TabsTrigger value="leads">💡 线索</TabsTrigger>
          <TabsTrigger value="customers">👥 客户</TabsTrigger>
          <TabsTrigger value="customer-intake">👤 录入</TabsTrigger>
          <TabsTrigger value="analytics">📈 分析</TabsTrigger>
          <TabsTrigger value="execution">🚀 执行</TabsTrigger>
        </TabsList>

        {/* Tab 1: 📊 系统概览 - 整合两个版本的数据 */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-6 gap-3">
            <Card className="p-3 border-blue-300 bg-white">
              <Users className="size-8 text-blue-600 mb-2" />
              <p className="text-xs text-slate-600">总粉丝数</p>
              <p className="text-2xl font-bold text-slate-900">{(totalFollowers / 1000).toFixed(1)}K</p>
              <Badge className="mt-1 bg-green-500 text-white text-xs">+12%</Badge>
            </Card>
            <Card className="p-3 border-purple-300 bg-white">
              <Eye className="size-8 text-purple-600 mb-2" />
              <p className="text-xs text-slate-600">月度触达</p>
              <p className="text-2xl font-bold text-slate-900">{(totalReach / 1000).toFixed(0)}K</p>
              <Badge className="mt-1 bg-green-500 text-white text-xs">+18%</Badge>
            </Card>
            <Card className="p-3 border-green-300 bg-white">
              <MousePointerClick className="size-8 text-green-600 mb-2" />
              <p className="text-xs text-slate-600">总点击数</p>
              <p className="text-2xl font-bold text-slate-900">{(totalClicks / 1000).toFixed(1)}K</p>
              <Badge className="mt-1 bg-green-500 text-white text-xs">+25%</Badge>
            </Card>
            <Card className="p-3 border-orange-300 bg-white">
              <ShoppingBag className="size-8 text-orange-600 mb-2" />
              <p className="text-xs text-slate-600">总转化数</p>
              <p className="text-2xl font-bold text-slate-900">{totalConversions}</p>
              <Badge className="mt-1 bg-green-500 text-white text-xs">+15%</Badge>
            </Card>
            <Card className="p-3 border-pink-300 bg-white">
              <Heart className="size-8 text-pink-600 mb-2" />
              <p className="text-xs text-slate-600">互动率</p>
              <p className="text-2xl font-bold text-slate-900">{avgEngagement}%</p>
              <Badge className="mt-1 bg-green-500 text-white text-xs">+8%</Badge>
            </Card>
            <Card className="p-3 border-red-300 bg-white">
              <DollarSign className="size-8 text-red-600 mb-2" />
              <p className="text-xs text-slate-600">总投入</p>
              <p className="text-2xl font-bold text-slate-900">${(totalSpend / 1000).toFixed(1)}K</p>
              <p className="text-xs text-green-600">ROI: 3.2:1</p>
            </Card>
          </div>

          {/* 6大平台实时数据 */}
          <Card className="p-4 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-3">📱 6大平台实时数据</h3>
            <div className="grid grid-cols-6 gap-3">
              {channels.map(channel => {
                const Icon = channel.icon;
                return (
                  <div key={channel.id} className={`p-3 rounded-lg border-2 ${channel.bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="size-6" />
                      <Badge className="bg-green-500 text-white text-xs">{channel.status}</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">{channel.name}</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">粉丝:</span>
                        <span className="font-semibold">{channel.followers > 0 ? (channel.followers / 1000).toFixed(1) + 'K' : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">触达:</span>
                        <span className="font-semibold">{(channel.reach / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">互动率:</span>
                        <span className="font-semibold text-green-600">{channel.engagement}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">点击:</span>
                        <span className="font-semibold">{channel.clicks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">转化:</span>
                        <span className="font-semibold text-blue-600">{channel.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">花费:</span>
                        <span className="font-semibold">${channel.spend}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 目标客户概览 */}
          <Card className="p-4 border-cyan-300 bg-cyan-50">
            <h3 className="text-sm font-bold text-cyan-900 mb-3">🎯 6类目标客户定位</h3>
            <div className="grid grid-cols-6 gap-3">
              {ALL_TARGET_CUSTOMERS.map(customer => {
                const Icon = customer.icon;
                return (
                  <div key={customer.type} className="bg-white p-3 rounded border border-cyan-200">
                    <Icon className="size-6 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs font-bold text-slate-900 text-center">{customer.label}</p>
                    {customer.isNew && (
                      <Badge className="mt-1 bg-cyan-500 text-white text-xs w-full">新增</Badge>
                    )}
                    <p className="text-xs text-slate-600 mt-1 text-center">{customer.avgOrderValue}</p>
                    <p className="text-xs text-green-600 mt-1 text-center">转化: {customer.conversionRate}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 本月KPI进度 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">📈 本月KPI进度</h3>
            <div className="grid grid-cols-7 gap-2">
              {[
                { label: '内容发布', current: 45, target: 60, color: 'blue' },
                { label: '新增粉丝', current: 1200, target: 1500, color: 'purple' },
                { label: '潜客发现', current: 280, target: 350, color: 'green' },
                { label: '有效连接', current: 160, target: 200, color: 'orange' },
                { label: '深度对话', current: 55, target: 70, color: 'pink' },
                { label: 'BANT认证', current: 18, target: 25, color: 'cyan' },
                { label: '成交客户', current: 6, target: 8, color: 'red' },
              ].map((kpi, idx) => (
                <div key={idx} className="text-center p-2 bg-slate-50 rounded">
                  <p className="text-xs text-slate-600 mb-1">{kpi.label}</p>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    {kpi.current}/{kpi.target}
                  </p>
                  <Progress value={(kpi.current / kpi.target) * 100} className="h-1.5" />
                  <p className="text-xs text-green-600 mt-1">
                    {((kpi.current / kpi.target) * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: 📱 平台运营 - 日常作战室 */}
        <TabsContent value="platform-ops" className="space-y-3">
          {/* 🎯 作战室标题 */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <Megaphone className="size-6" />
                  社媒运营日常作战室
                </h3>
                <p className="text-sm text-blue-100">
                  账号维护 · 快速发布 · 互动管理 · 健康监测 - 运营人员每日工作中心
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 gap-1"
                  onClick={() => toast.success('数据已刷新！')}
                >
                  <RefreshCw className="size-3" />
                  刷新
                </Button>
                <Button 
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white gap-1"
                  onClick={() => setShowCampaignWizard(true)}
                >
                  <Plus className="size-3" />
                  快速发布
                </Button>
              </div>
            </div>
          </div>

          {/* 📊 今日概览 */}
          <Card className="p-4 border-orange-300 bg-orange-50">
            <h3 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-2">
              <Clock className="size-4" />
              今日数据概览 ({new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })})
            </h3>
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: '今日发布', value: 3, target: 5, icon: Send, color: 'blue' },
                { label: '待回复消息', value: 12, target: 0, icon: MessageCircle, color: 'orange', urgent: true },
                { label: '新增粉丝', value: 45, target: 50, icon: UserCheck, color: 'green' },
                { label: '内容互动', value: 128, target: 150, icon: Heart, color: 'pink' },
                { label: '新线索', value: 8, target: 10, icon: Lightbulb, color: 'yellow' },
                { label: '账号健康', value: 85, target: 90, icon: Activity, color: 'purple' }
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className={`p-3 bg-white rounded border-2 ${stat.urgent ? 'border-red-400' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`size-5 text-${stat.color}-600`} />
                      {stat.urgent && <Badge className="bg-red-500 text-white text-xs animate-pulse">紧急</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-500">目标: {stat.target}</span>
                      <Badge className={
                        stat.value >= stat.target ? 'bg-green-500 text-white text-xs' : 
                        stat.urgent ? 'bg-red-500 text-white text-xs' : 'bg-gray-400 text-white text-xs'
                      }>
                        {stat.value >= stat.target ? '已达标' : stat.urgent ? '需处理' : '进行中'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 📱 6大平台账号状态卡片 */}
          <Card className="p-4 border-slate-300 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="size-4" />
                  6大平台账号实时状态
                </h3>
                {facebookConnected && (
                  <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Facebook实时同步
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {lastFacebookUpdate && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="size-3" />
                    最后更新: {lastFacebookUpdate.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
                <Button size="sm" variant="outline" onClick={() => setActiveTab('calendar')}>
                  查看内容日历 →
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {channels.map(channel => {
                const Icon = channel.icon;
                const health = channel.engagement > 3 ? 'excellent' : channel.engagement > 2 ? 'good' : 'warning';
                return (
                  <div key={channel.id} className={`p-4 rounded-lg border-2 ${channel.bgColor}`}>
                    {/* 账号头部 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="size-6" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{channel.name}</h4>
                          {channel.id === 'facebook' && !facebookConnected ? (
                            <Badge className="bg-gray-400 text-white text-xs">
                              未连接
                            </Badge>
                          ) : (
                            <Badge className={
                              health === 'excellent' ? 'bg-green-500 text-white text-xs' :
                              health === 'good' ? 'bg-blue-500 text-white text-xs' :
                              'bg-orange-500 text-white text-xs'
                            }>
                              {health === 'excellent' ? '优秀' : health === 'good' ? '良好' : '需优化'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {channel.id === 'facebook' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              toast.info('正在刷新Facebook数据...');
                              fetchFacebookData();
                            }}
                            disabled={facebookLoading}
                          >
                            <RefreshCw className={`size-3 ${facebookLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                        <Button size="sm" className="h-7 text-xs gap-1">
                          <Send className="size-3" />
                          发布
                        </Button>
                      </div>
                    </div>

                    {/* 今日数据 */}
                    <div className="bg-white/80 rounded p-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-slate-600">今日表现</p>
                        {channel.id === 'facebook' && channel.isRealData && (
                          <Badge className="bg-green-500 text-white text-xs px-1 py-0">
                            <RefreshCw className="size-2 mr-0.5" />
                            实时
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">发布内容</p>
                          <p className="font-bold text-slate-900">
                            {channel.id === 'facebook' && channel.isRealData 
                              ? channel.todayPosts 
                              : Math.floor(Math.random() * 3) + 1
                            } 条
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">新增互动</p>
                          <p className="font-bold text-green-600">
                            +{channel.id === 'facebook' && channel.isRealData 
                              ? channel.todayEngagement 
                              : Math.floor(Math.random() * 50) + 20
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">待回复</p>
                          <p className="font-bold text-orange-600">
                            {channel.id === 'facebook' && channel.isRealData 
                              ? channel.todayComments 
                              : Math.floor(Math.random() * 5) + 1
                            } 条
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">新粉丝</p>
                          <p className="font-bold text-blue-600">
                            +{channel.id === 'facebook' && channel.isRealData 
                              ? channel.todayNewFans 
                              : Math.floor(Math.random() * 20) + 5
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 账号总体数据 */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">总粉丝:</span>
                        <span className="font-semibold">{formatFollowers(channel.followers)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">互动率:</span>
                        <span className={`font-semibold ${
                          channel.engagement > 3 ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {channel.engagement}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">本月转化:</span>
                        <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                          {channel.conversions} <TrendingUp className="size-3" />
                        </span>
                      </div>
                      {/* Facebook连接状态和更新时间 */}
                      {channel.id === 'facebook' && lastFacebookUpdate && (
                        <div className="flex justify-between pt-1 border-t border-slate-200">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="size-2" />
                            更新于
                          </span>
                          <span className="text-slate-400">
                            {lastFacebookUpdate.toLocaleTimeString('zh-CN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Facebook未连接提示 */}
                    {channel.id === 'facebook' && !facebookConnected && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                        <p className="text-xs text-yellow-800 mb-1 flex items-center gap-1">
                          <AlertCircle className="size-3" />
                          未连接Facebook
                        </p>
                        <Button 
                          size="sm" 
                          className="h-6 text-xs w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSelectedChannelForManage(channel);
                            setShowFacebookManager(true);
                          }}
                        >
                          立即连接
                        </Button>
                      </div>
                    )}

                    {/* 快速操作 */}
                    <div className="grid grid-cols-2 gap-1 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                          if (channel.id === 'facebook') {
                            setSelectedChannelForManage(channel);
                            setShowFacebookManager(true);
                          } else {
                            toast.info(`${channel.name}账号管理功能即将上线...`);
                          }
                        }}
                      >
                        <Settings className="size-3 mr-1" />
                        管理
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs"
                        onClick={() => {
                          if (channel.id === 'facebook') {
                            setSelectedChannelForManage(channel);
                            setShowFacebookManager(true);
                          } else {
                            toast.info(`${channel.name}数据详情即将上线...`);
                          }
                        }}
                      >
                        <BarChart3 className="size-3 mr-1" />
                        数据
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 🔔 待处理任务清单 */}
          <div className="grid grid-cols-2 gap-3">
            {/* 待回复消息 */}
            <Card className="p-3 border-orange-300 bg-orange-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-orange-900 flex items-center gap-2">
                  <Bell className="size-4 animate-pulse" />
                  待回复消息 (12条)
                </h3>
                <Badge className="bg-red-500 text-white">紧急</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { platform: 'LinkedIn', user: 'John Smith', msg: '你们有电气配件的产品目录吗？', time: '5分钟前', priority: 'high' },
                  { platform: 'Instagram', user: 'Building_Co', msg: '这个门窗配件的价格是多少？', time: '15分钟前', priority: 'high' },
                  { platform: 'Facebook', user: 'Hardware Store', msg: '可以寄样品吗？', time: '1小时前', priority: 'medium' },
                  { platform: 'TikTok', user: 'Construction_Pro', msg: '支持批发吗？最小订单量多少？', time: '2小时前', priority: 'medium' },
                ].map((msg, idx) => (
                  <div key={idx} className={`p-2 bg-white rounded border ${
                    msg.priority === 'high' ? 'border-red-300' : 'border-slate-200'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500 text-white text-xs">{msg.platform}</Badge>
                        <span className="text-xs font-bold text-slate-900">{msg.user}</span>
                      </div>
                      <span className="text-xs text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-700 mb-1">{msg.msg}</p>
                    <Button size="sm" className="h-6 w-full text-xs gap-1 bg-orange-600 hover:bg-orange-700 text-white">
                      <MessageSquare className="size-3" />
                      立即回复
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* 今日任务清单 */}
            <Card className="p-3 border-green-300 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  今日任务清单
                </h3>
                <Badge className="bg-blue-500 text-white">5/8 完成</Badge>
              </div>
              <div className="space-y-2">
                {[
                  { task: '发布LinkedIn专业文章', status: 'done', time: '09:00' },
                  { task: '回复所有Facebook评论', status: 'done', time: '10:00' },
                  { task: 'Instagram发布产品图片', status: 'done', time: '11:00' },
                  { task: 'TikTok上传短视频', status: 'done', time: '14:00' },
                  { task: 'YouTube更新产品介绍', status: 'done', time: '15:00' },
                  { task: '分析今日数据并优化', status: 'pending', time: '17:00' },
                  { task: '准备明日内容素材', status: 'pending', time: '17:30' },
                  { task: '制定下周发布计划', status: 'pending', time: '18:00' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2 bg-white rounded border ${
                    item.status === 'done' ? 'border-green-300' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === 'done' ? (
                          <CheckCircle2 className="size-4 text-green-600" />
                        ) : (
                          <Clock className="size-4 text-orange-600" />
                        )}
                        <span className={`text-xs ${
                          item.status === 'done' ? 'text-slate-500 line-through' : 'font-semibold text-slate-900'
                        }`}>
                          {item.task}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 📈 本周维护计划 */}
          <Card className="p-4 border-blue-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="size-4" />
              本周账号维护计划（{new Date().toLocaleDateString('zh-CN', { month: 'long' })}）
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, idx) => (
                <div key={idx} className={`p-3 rounded border-2 ${
                  idx === new Date().getDay() - 1 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                }`}>
                  <p className="text-xs font-bold text-slate-900 mb-2">{day}</p>
                  <div className="space-y-1">
                    {idx % 2 === 0 && (
                      <Badge className="bg-blue-500 text-white text-xs w-full mb-1">
                        <Instagram className="size-2 mr-1" />
                        发3帖
                      </Badge>
                    )}
                    {idx % 3 === 0 && (
                      <Badge className="bg-red-500 text-white text-xs w-full mb-1">
                        <Youtube className="size-2 mr-1" />
                        发1视频
                      </Badge>
                    )}
                    {idx % 4 === 0 && (
                      <Badge className="bg-purple-500 text-white text-xs w-full">
                        <Radio className="size-2 mr-1" />
                        直播
                      </Badge>
                    )}
                    <p className="text-xs text-slate-600 mt-1">回复评论</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 🎯 账号健康度检测 */}
          <Card className="p-4 border-purple-300 bg-purple-50">
            <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Activity className="size-4" />
              账号健康度诊断
            </h3>
            <div className="space-y-3">
              {channels.map(channel => {
                const Icon = channel.icon;
                const health = channel.engagement > 3 ? 85 + Math.random() * 15 : 
                              channel.engagement > 2 ? 70 + Math.random() * 15 : 
                              50 + Math.random() * 20;
                const healthLevel = health > 85 ? 'excellent' : health > 70 ? 'good' : 'warning';
                
                return (
                  <div key={channel.id} className="p-3 bg-white rounded border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5" />
                        <span className="text-sm font-bold text-slate-900">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">{health.toFixed(0)}分</span>
                        <Badge className={
                          healthLevel === 'excellent' ? 'bg-green-500 text-white' :
                          healthLevel === 'good' ? 'bg-blue-500 text-white' :
                          'bg-orange-500 text-white'
                        }>
                          {healthLevel === 'excellent' ? '优秀' : healthLevel === 'good' ? '良好' : '需改进'}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={health} className="h-2 mb-2" />
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-slate-600">发布频率</p>
                        <p className={`font-bold ${health > 80 ? 'text-green-600' : 'text-orange-600'}`}>
                          {health > 80 ? '正常' : '偏低'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600">互动质量</p>
                        <p className={`font-bold ${channel.engagement > 3 ? 'text-green-600' : 'text-orange-600'}`}>
                          {channel.engagement}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600">回复及时</p>
                        <p className="font-bold text-green-600">95%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-600">内容质量</p>
                        <p className={`font-bold ${health > 75 ? 'text-green-600' : 'text-orange-600'}`}>
                          {health > 75 ? '优质' : '一般'}
                        </p>
                      </div>
                    </div>
                    {healthLevel === 'warning' && (
                      <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                        <p className="text-xs text-orange-800 flex items-center gap-1">
                          <AlertTriangle className="size-3" />
                          建议：增加发布频率，提升内容互动性
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 📊 平台策略库 */}
          <Card className="p-3 border-cyan-300 bg-cyan-50">
            <h3 className="text-sm font-bold text-cyan-900 mb-2 flex items-center gap-2">
              <Target className="size-4" />
              平台策略库（参考）
            </h3>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform === platform.platform;
                return (
                  <button
                    key={platform.platform}
                    onClick={() => setSelectedPlatform(platform.platform)}
                    className={`w-full p-2 rounded border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-500 text-white text-xs">#{platform.priority}</Badge>
                      <Icon className="size-5" />
                      <span className="text-sm font-bold text-slate-900">{platform.platform}</span>
                      <span className="text-xs text-slate-600">{platform.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={platform.effectiveness} className="w-20 h-2" />
                      <span className="text-xs font-bold text-green-600">{platform.effectiveness}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 选中平台的详细策略 */}
          {selectedPlatformData && (() => {
            const PlatformIcon = selectedPlatformData.icon;
            return (
              <Card className="p-4 border-slate-300 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <PlatformIcon className="size-5" />
                      {selectedPlatformData.platform} 完整策略
                    </h3>
                    <p className="text-xs text-slate-600">{selectedPlatformData.description}</p>
                  </div>
                  <Badge className="bg-blue-500 text-white">优先级 #{selectedPlatformData.priority}</Badge>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-2 bg-blue-50 rounded">
                  <h4 className="text-xs font-bold text-blue-900 mb-1">AI应用场景</h4>
                  <div className="space-y-1">
                    {(selectedPlatformData.aiUseCases || selectedPlatformData.contentIdeas || []).map((useCase, idx) => (
                      <div key={idx} className="text-xs text-slate-700">
                        <CheckCircle className="size-3 text-blue-600 inline mr-1" />
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-green-50 rounded">
                  <h4 className="text-xs font-bold text-green-900 mb-1">每日行动清单</h4>
                  <div className="space-y-1">
                    {(selectedPlatformData.dailyActions || selectedPlatformData.engagementTactics?.map(action => ({ action, target: '✓' })) || []).map((action, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{typeof action === 'string' ? action : action.action}</span>
                        <span className="text-green-600">{typeof action === 'object' ? action.target : '✓'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            );
          })()}

          {/* ⚙️ 账号配置与管理 */}
          <Card className="p-4 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Settings className="size-4" />
              账号配置与管理（高级设置）
            </h3>
            <SocialMediaAccounts />
          </Card>
        </TabsContent>

        {/* Tab 3: 📅 内容日历 - 来自经典版 */}
        <TabsContent value="calendar" className="space-y-3">
          <Card className="p-4 border-green-300 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-green-900 mb-1">📅 内容发布日历</h3>
                <p className="text-sm text-green-700">规划和管理所有社媒平台的内容发布计划</p>
              </div>
              <Button 
                onClick={() => setShowCampaignWizard(true)}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Plus className="size-4" />
                创建内容
              </Button>
            </div>
          </Card>

          {showCampaignWizard && (
            <SocialMediaCampaignWizard 
              onClose={() => setShowCampaignWizard(false)}
              onPublish={handlePublishCampaign}
            />
          )}

          {/* 内容日历网格 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">📆 本月内容计划</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                <div key={day} className="p-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                  <p className="text-xs font-bold text-slate-900 mb-1">{day}日</p>
                  {day % 3 === 0 && (
                    <div className="text-xs">
                      <Badge className="bg-blue-500 text-white text-xs mb-1 w-full">
                        <Instagram className="size-2 mr-1" />
                        帖子
                      </Badge>
                    </div>
                  )}
                  {day % 5 === 0 && (
                    <Badge className="bg-red-500 text-white text-xs w-full">
                      <Youtube className="size-2 mr-1" />
                      视频
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 即将发布的内容 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">⏰ 即将发布（未来7天）</h3>
            <div className="space-y-2">
              {campaigns.slice(0, 5).map((camp, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{camp.contentTitle || camp.name}</h4>
                      <p className="text-xs text-slate-600">
                        {camp.channels?.join(', ')} · {camp.startDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        camp.status === 'active' ? 'bg-green-500 text-white' :
                        camp.status === 'scheduled' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }>
                        {camp.status === 'active' ? '进行中' : camp.status === 'scheduled' ? '已排期' : '草稿'}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Edit className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="size-12 mx-auto mb-2" />
                  <p className="text-sm">暂无计划内容，点击"创建内容"开始</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 4: 🤖 AI工具 - 整合两个版本的AI工具 */}
        <TabsContent value="ai-tools" className="space-y-3">
          {AI_TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <Card key={tool.name} className="p-4 border-slate-300 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Icon className="size-6 text-blue-600" />
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-600">{tool.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">应用场景</h4>
                    <div className="space-y-1">
                      {(tool.use_cases || []).map((useCase, idx) => (
                        <div key={idx} className="text-xs text-slate-700">
                          <Sparkles className="size-3 text-blue-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">AI提示词模板</h4>
                    <div className="space-y-1">
                      {(tool.prompts || []).map((prompt, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-xs text-slate-700">
                          <ThumbsUp className="size-3 text-green-600 mt-0.5" />
                          <span>{prompt.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(tool.prompts || []).map((promptData, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{promptData.title}</h5>
                        <p className="text-xs text-slate-600">模板ID: {promptData.id}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(promptData.prompt, `${tool.name}-${idx}`)}
                        className="h-6 text-xs"
                      >
                        {copiedPrompt === `${tool.name}-${idx}` ? (
                          <>
                            <CheckCircle className="size-3 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {promptData.prompt}
                      </pre>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab 5: 🎬 视频+直播 - 整合视频制作+直播系统 */}
        <TabsContent value="video-live" className="space-y-3">
          {/* 视频制作工具 */}
          <Card className="p-4 border-purple-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Wand2 className="size-6 text-purple-600" />
              AI视频生成工具
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {((VIDEO_TOOLS.find(cat => cat.category === 'AI视频生成')?.tools) || []).map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <div key={idx} className="p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-purple-600" />
                        <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                      </div>
                      {tool.recommended && <Badge className="bg-purple-500 text-white text-xs">推荐</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                    <div className="space-y-1 mb-2">
                      {(tool.useCases || []).map((useCase, fidx) => (
                        <div key={fidx} className="text-xs text-slate-700">
                          <CheckCircle className="size-3 text-purple-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{tool.pricing}</span>
                      <Badge variant="outline" className="text-xs">{tool.difficulty}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 视频编辑工具 */}
          <Card className="p-4 border-blue-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scissors className="size-6 text-blue-600" />
              视频编辑工具
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {((VIDEO_TOOLS.find(cat => cat.category === '视频编辑')?.tools) || []).map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                      </div>
                      {tool.name === 'CapCut' && <Badge className="bg-green-500 text-white text-xs">免费⭐</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                    <div className="space-y-1 mb-2">
                      {(tool.useCases || []).map((useCase, fidx) => (
                        <div key={fidx} className="text-xs text-slate-700">
                          <CheckCircle className="size-3 text-blue-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{tool.pricing}</span>
                      <Badge variant="outline" className="text-xs">{tool.difficulty}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 直播管理系统 */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <Radio className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">🎬 直播管理系统</h3>
                <p className="text-sm text-slate-600">多平台直播管理 · 数据分析 · 订单追踪</p>
              </div>
            </div>
          </div>
          <LiveStreamManagement />
        </TabsContent>

        {/* Tab 6: 🌱 种草营销 */}
        <TabsContent value="seeding" className="space-y-3">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">🌱 种草营销管理中心</h3>
                <p className="text-sm text-slate-600">B2B2C反向拉动策略 - 通过C端影响B端</p>
              </div>
            </div>
          </div>
          <SeedingCampaignCenterEnhanced userRole={user.role} />
        </TabsContent>

        {/* Tab 7: 🎯 广告+SEO - 整合广告活动+SEO优化 */}
        <TabsContent value="ads-seo" className="space-y-3">
          <Card className="p-4 border-orange-300 bg-orange-50">
            <h3 className="text-base font-bold text-orange-900 mb-3">🎯 付费广告 + SEO优化</h3>
            <p className="text-sm text-orange-700">整合付费推广和自然流量优化策略</p>
          </Card>

          {/* 广告活动管理 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">📢 当前广告活动</h3>
            <div className="space-y-2">
              {[
                { name: 'LinkedIn B2B精准投放', platform: 'LinkedIn', budget: 2800, spent: 2100, conversions: 112, status: 'active' },
                { name: 'Instagram品牌曝光', platform: 'Instagram', budget: 2450, spent: 1850, conversions: 89, status: 'active' },
                { name: 'Google搜索广告', platform: 'Google Ads', budget: 5600, spent: 4200, conversions: 234, status: 'active' },
                { name: 'TikTok视频推广', platform: 'TikTok', budget: 3200, spent: 2400, conversions: 156, status: 'active' },
              ].map((ad, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-900">{ad.name}</h4>
                    <Badge className="bg-green-500 text-white">{ad.status}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-600">预算</p>
                      <p className="font-bold text-slate-900">${ad.budget}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">已花费</p>
                      <p className="font-bold text-blue-600">${ad.spent}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">转化数</p>
                      <p className="font-bold text-green-600">{ad.conversions}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">ROI</p>
                      <p className="font-bold text-purple-600">{(ad.conversions / ad.spent * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <Progress value={(ad.spent / ad.budget) * 100} className="h-1.5 mt-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* SEO优化工具 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🔍 SEO优化建议</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded">
                <h4 className="text-xs font-bold text-blue-900 mb-2">关键词排名</h4>
                <div className="space-y-1">
                  {['电气配件供应商', '卫浴五金批发', '门窗配件厂家'].map((kw, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-slate-700">{kw}</span>
                      <span className="text-green-600">#{idx + 3}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <h4 className="text-xs font-bold text-green-900 mb-2">自然流量</h4>
                <p className="text-2xl font-bold text-green-600 mb-1">12.5K</p>
                <p className="text-xs text-slate-600">月访问量</p>
                <Badge className="mt-2 bg-green-500 text-white text-xs">+18%</Badge>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <h4 className="text-xs font-bold text-purple-900 mb-2">页面优化</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">加载速度:</span>
                    <span className="text-green-600">2.1s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">移动友好:</span>
                    <span className="text-green-600">95分</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">SEO得分:</span>
                    <span className="text-green-600">88分</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 8: 💡 线索管理 - 来自经典版 */}
        <TabsContent value="leads" className="space-y-3">
          <Card className="p-4 border-red-300 bg-red-50">
            <div className="flex items-center gap-3">
              <Lightbulb className="size-12 text-red-600" />
              <div>
                <h3 className="text-base font-bold text-red-900 mb-1">💡 线索管理中心</h3>
                <p className="text-sm text-red-700">从社媒平台捕获、跟进、转化线索的完整流程</p>
              </div>
            </div>
          </Card>
          <SocialMediaLeadsFlow />
        </TabsContent>

        {/* Tab 9: 👥 目标客户 - 来自AI版 */}
        <TabsContent value="customers" className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {ALL_TARGET_CUSTOMERS.map(customer => {
              const Icon = customer.icon;
              const isSelected = selectedCustomerType === customer.type;
              return (
                <button
                  key={customer.type}
                  onClick={() => setSelectedCustomerType(customer.type)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon className="size-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs font-bold text-slate-900">{customer.label}</p>
                  {customer.isNew && (
                    <Badge className="mt-1 bg-cyan-500 text-white text-xs">新增</Badge>
                  )}
                  <p className="text-xs text-slate-600 mt-1">{customer.avgOrderValue}</p>
                </button>
              );
            })}
          </div>

          {selectedCustomer && (
            <Card className="p-4 border-slate-300 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {selectedCustomer.label} ({selectedCustomer.type})
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>订单: {selectedCustomer.avgOrderValue}</span>
                    <span>转化率: {selectedCustomer.conversionRate}</span>
                    <span>LTV: {selectedCustomer.ltv}</span>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white">{selectedCustomer.value}价值</Badge>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <CheckCircle className="size-3 text-green-600" />
                    客户特征
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(selectedCustomer.characteristics || []).map((char, idx) => (
                      <li key={idx}>• {char}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <AlertCircle className="size-3 text-orange-600" />
                    核心痛点
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(selectedCustomer.painPoints || []).map((pain, idx) => (
                      <li key={idx} className="text-red-600">• {pain}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Star className="size-3 text-yellow-600" />
                    理想画像
                  </h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {Object.entries(selectedCustomer.idealProfile).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Target className="size-3 text-purple-600" />
                    社媒信号
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {(selectedCustomer.socialSignals || []).map((signal, idx) => (
                      <li key={idx}>• {signal}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedCustomer.developmentStrategy && (
                <div className="mt-3 bg-blue-50 p-3 rounded">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Rocket className="size-4 text-blue-600" />
                    5步开发策略
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedCustomer.developmentStrategy.map((strategy, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex-1 text-center p-2 bg-white rounded">
                          <p className="text-xs font-semibold text-slate-900">Step {strategy.step}</p>
                          <p className="text-xs text-slate-600">{strategy.name}</p>
                          <p className="text-xs text-blue-600">{strategy.action}</p>
                        </div>
                        {idx < selectedCustomer.developmentStrategy.length - 1 && (
                          <ArrowRight className="size-4 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Tab 10: 👤 客户录入评估 */}
        <TabsContent value="customer-intake" className="space-y-3">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <UserPlus className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">👤 客户录入与评估系统</h3>
                <p className="text-sm text-slate-600">AI驱动的客户质量评估与智能分配</p>
              </div>
            </div>
          </div>
          <CustomerIntakeSystem userRole={user.role} />
        </TabsContent>

        {/* Tab 11: 📈 数据分析 - 整合全链路追踪+API集成 */}
        <TabsContent value="analytics" className="space-y-3">
          <Card className="p-4 border-purple-300 bg-purple-50">
            <h3 className="text-base font-bold text-purple-900 mb-3">📈 数据分析中心 + API集成</h3>
            <p className="text-sm text-purple-700">全链路数据追踪、分析与第三方平台API集成</p>
          </Card>

          {/* 全链路追踪 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🔗 全链路数据追踪</h3>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded">
              {[
                { label: '曝光', value: totalReach, icon: Eye, color: 'blue' },
                { label: '点击', value: totalClicks, icon: MousePointerClick, color: 'green' },
                { label: '互动', value: Math.floor(totalReach * parseFloat(avgEngagement) / 100), icon: Heart, color: 'pink' },
                { label: '线索', value: 280, icon: Lightbulb, color: 'yellow' },
                { label: '转化', value: totalConversions, icon: ShoppingBag, color: 'orange' },
              ].map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <React.Fragment key={idx}>
                    <div className="text-center">
                      <Icon className={`size-8 mx-auto mb-1 text-${stage.color}-600`} />
                      <p className="text-xs text-slate-600 mb-1">{stage.label}</p>
                      <p className="text-lg font-bold text-slate-900">{stage.value.toLocaleString()}</p>
                      {idx < 4 && (
                        <p className="text-xs text-green-600 mt-1">
                          {((stage.value / totalReach) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                    {idx < 4 && <ArrowRight className="size-6 text-slate-400" />}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>

          {/* API集成状态 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🔌 第三方API集成状态</h3>
            <SocialMediaAPIDemo />
          </Card>
        </TabsContent>

        {/* Tab 12: 🚀 执行计划 - 整合执行流程+30天计划 */}
        <TabsContent value="execution" className="space-y-3">
          <Card className="p-4 border-green-300 bg-green-50">
            <h3 className="text-base font-bold text-green-900 mb-3">🚀 执行指南 + 30天行动计划</h3>
            <p className="text-sm text-green-700">标准化执行流程与月度落地计划</p>
          </Card>

          {/* 7步执行流程 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🎯 7步执行流程</h3>
            <div className="space-y-3">
              {EXECUTION_WORKFLOW.map(step => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Icon className="size-4" />
                          {step.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                          <Clock className="size-3" />
                          <span>{step.duration}</span>
                          <span>•</span>
                          <span>工具: {(step.tools || []).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-10">
                      <ul className="space-y-0.5 mb-2">
                        {(step.actions || []).map((action, tidx) => (
                          <li key={tidx} className="flex items-start gap-1 text-xs text-slate-700">
                            <span className="text-blue-600">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>

                      {step.output && (
                        <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="size-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">交付物: {step.output}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 30天落地计划 */}
          <Card className="p-4 border-blue-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3">📅 30天落地执行计划</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { week: '第1周', focus: '内容准备+账号优化', tasks: ['制作6个短视频', '生成15个帖子', '优化社媒主页', '策划首场直播'] },
                { week: '第2周', focus: '发布推广+客户开发', tasks: ['执行1场直播', '发布视频内容', '开发50个潜客', '发送100个连接'] },
                { week: '第3周', focus: '互动跟进+数据优化', tasks: ['跟进直播潜客', '分析数据调整', '继续日常开发', '发布优化内容'] },
                { week: '第4周', focus: '转化成交+月度复盘', tasks: ['推进报价样品', '成交目标客户', '月度数据分析', '制定下月计划'] }
              ].map((week, idx) => (
                <Card key={idx} className="p-3 border-blue-200 bg-blue-50">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">{week.week}</h4>
                  <p className="text-xs text-blue-700 mb-2">{week.focus}</p>
                  <ul className="space-y-1">
                    {week.tasks.map((task, tidx) => (
                      <li key={tidx} className="text-xs text-slate-700 flex items-start gap-1">
                        <CheckCircle className="size-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Card>

          {/* 成功关键因素 */}
          <Card className="p-3 border-green-300 bg-green-50">
            <h3 className="text-sm font-bold text-green-900 mb-2">🏆 成功的5个关键因素</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { factor: '精准定位', desc: '专注高价值客户', icon: Target },
                { factor: 'AI赋能', desc: '10倍效率提升', icon: Bot },
                { factor: '视频优先', desc: '互动率高10倍', icon: Film },
                { factor: '直播引流', desc: '20-50潜客/场', icon: Radio },
                { factor: '持续执行', desc: '每天2-3小时', icon: Clock }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="text-center p-2 bg-white rounded">
                    <Icon className="size-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900">{item.factor}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Facebook账号管理器弹窗 */}
      {showFacebookManager && (
        <FacebookAccountManager 
          onClose={() => setShowFacebookManager(false)}
          currentChannel={selectedChannelForManage}
        />
      )}
    </div>
  );
}