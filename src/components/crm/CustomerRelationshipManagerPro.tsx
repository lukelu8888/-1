// 🔥 THE COSUN BM - 客户关系管理（CRM Pro）- 完全打通社媒来源
// Customer Relationship Management Pro - Social Media Integration

import React, { useState } from 'react';
import { 
  Users, Target, Search, Plus, Download, Eye, 
  BarChart3, Linkedin, MessageSquare, Globe,
  Facebook, Instagram, Youtube, Radio, Mail,
  HeartPulse, AlertTriangle, CheckCircle2, XCircle,
  Clock, Award, Zap, RefreshCw, Calendar, DollarSign,
  ShoppingCart, Activity, Bell, Star, Gift, TrendingUp,
  TrendingDown, Phone, ArrowRight, Waves, Shield, LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import {
  CUSTOMER_STAGES, CUSTOMER_TYPES, CUSTOMER_SOURCES, CUSTOMER_RATINGS,
  CustomerStage, CustomerType, CustomerSource, Customer, calculateCustomerScore,
} from '../../lib/crm-config';
import { LeadConversionWorkbench } from '../dashboards/LeadConversionWorkbench'; // 🔥 导入潜客转化工作台
import PublicPoolManagementPro from '../admin/PublicPoolManagementPro'; // 🔥 导入公海客户池
import CustomerCreditEvaluation from '../admin/CustomerCreditEvaluation'; // 🔥 导入客户信用评估系统

interface SocialMediaInteraction {
  id: string;
  platform: 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'email';
  type: 'post_like' | 'post_comment' | 'message' | 'connection' | 'profile_view' | 'email_sent' | 'email_opened';
  date: Date;
  content: string;
  response?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface CustomerWithSocial extends Customer {
  socialProfiles?: { linkedin?: string; facebook?: string; instagram?: string; youtube?: string; };
  socialInteractions?: SocialMediaInteraction[];
  leadScore?: number;
  engagementLevel?: 'high' | 'medium' | 'low';
  lastSocialInteraction?: Date;
}

const MOCK_CUSTOMERS_WITH_SOCIAL: CustomerWithSocial[] = [
  {
    id: 'C001', companyName: 'ABC建材有限公司', companyNameEn: 'ABC Building Materials Ltd',
    stage: 'vip', type: 'retailer', businessType: ['direct_purchase'], source: 'linkedin',
    region: 'NA', rating: 'AAA', priority: 'high',
    contacts: [{ id: 'CT001', name: 'John Smith', position: 'Purchasing Manager', email: 'john@abc.com', phone: '+1-234-567-8900', isPrimary: true }],
    country: 'USA', assignedTo: 'sales.maria', assignedBy: 'marketing.ai', assignedAt: new Date('2024-01-15'),
    firstOrderDate: new Date('2024-02-01'), lastOrderDate: new Date('2024-11-25'),
    totalOrders: 45, totalRevenue: 1250000, averageOrderValue: 27778, followUpHistory: [],
    tags: ['大客户', 'VIP', 'LinkedIn来源'], notes: '通过LinkedIn建立联系，互动活跃',
    createdAt: new Date('2024-01-15'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-25'), updatedBy: 'sales.maria',
    socialProfiles: { linkedin: 'https://linkedin.com/company/abc-building' },
    leadScore: 95, engagementLevel: 'high', lastSocialInteraction: new Date('2024-11-28'),
    socialInteractions: [
      { id: 'SI001', platform: 'linkedin', type: 'connection', date: new Date('2024-01-10'), content: '已接受LinkedIn连接请求', sentiment: 'positive' },
      { id: 'SI002', platform: 'linkedin', type: 'message', date: new Date('2024-01-12'), content: '询问产品目录和价格', response: '已发送完整目录', sentiment: 'positive' }
    ]
  },
  {
    id: 'C002', companyName: 'XYZ装饰公司', companyNameEn: 'XYZ Decoration Co',
    stage: 'prospect', type: 'project_contractor', businessType: ['direct_purchase', 'project'], source: 'facebook',
    region: 'SA', rating: 'A', priority: 'high',
    contacts: [{ id: 'CT002', name: 'Carlos Silva', position: 'Project Manager', email: 'carlos@xyz.com', phone: '+55-11-1234-5678', isPrimary: true }],
    country: 'Brazil', assignedTo: 'sales.ana', assignedBy: 'marketing.ai', assignedAt: new Date('2024-11-20'),
    totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, followUpHistory: [],
    tags: ['Facebook来源', '项目承包商', '大型项目'], notes: 'Facebook广告吸引，承接大型建筑装修项目',
    createdAt: new Date('2024-11-20'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-28'), updatedBy: 'sales.ana',
    socialProfiles: { facebook: 'https://facebook.com/xyzdecoration' },
    leadScore: 78, engagementLevel: 'high', lastSocialInteraction: new Date('2024-11-27'),
    socialInteractions: [
      { id: 'SI004', platform: 'facebook', type: 'post_like', date: new Date('2024-11-18'), content: '点赞了产品展示帖子', sentiment: 'positive' }
    ]
  },
  {
    id: 'C003', companyName: 'DEF进出口贸易', companyNameEn: 'DEF Import Export',
    stage: 'pool', type: 'agency_seeker', businessType: ['agent'], source: 'instagram',
    region: 'EMEA', rating: 'UNRATED', priority: 'medium',
    contacts: [{ id: 'CT003', name: 'Mohammed Al-Rashid', position: 'CEO', email: 'mohammed@def.com', isPrimary: true }],
    country: 'UAE', totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, followUpHistory: [],
    tags: ['Instagram来源', '寻找中国代理', '中东市场'], notes: 'Instagram DM主动联系，寻求长期采购代理',
    createdAt: new Date('2024-11-25'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-25'), updatedBy: 'marketing.ai',
    socialProfiles: { instagram: 'https://instagram.com/def_trading' },
    leadScore: 65, engagementLevel: 'medium', lastSocialInteraction: new Date('2024-11-25'),
    socialInteractions: [
      { id: 'SI007', platform: 'instagram', type: 'profile_view', date: new Date('2024-11-23'), content: '多次浏览Instagram主页', sentiment: 'neutral' }
    ]
  },
  {
    id: 'C004', companyName: 'GHI五金批发', companyNameEn: 'GHI Hardware Wholesale',
    stage: 'active', type: 'wholesaler', businessType: ['direct_purchase'], source: 'youtube',
    region: 'NA', rating: 'AA', priority: 'medium',
    contacts: [{ id: 'CT004', name: 'Emily Johnson', position: 'Buyer', email: 'emily@ghi.com', phone: '+1-555-123-4567', isPrimary: true }],
    country: 'Canada', assignedTo: 'sales.tom', assignedBy: 'marketing.ai', assignedAt: new Date('2024-10-01'),
    firstOrderDate: new Date('2024-10-20'), lastOrderDate: new Date('2024-11-15'),
    totalOrders: 3, totalRevenue: 85000, averageOrderValue: 28333, followUpHistory: [],
    tags: ['YouTube来源', '视频营销', '批发商'], notes: '通过YouTube产品演示视频找到我们，区域批发分销商',
    createdAt: new Date('2024-10-01'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-15'), updatedBy: 'sales.tom',
    socialProfiles: { youtube: 'https://youtube.com/@ghihardware' },
    leadScore: 82, engagementLevel: 'high', lastSocialInteraction: new Date('2024-11-10'),
    socialInteractions: [
      { id: 'SI009', platform: 'youtube', type: 'post_comment', date: new Date('2024-09-28'), content: '在产品演示视频下评论询价', response: '已回复并发送邮件', sentiment: 'positive' }
    ]
  },
  {
    id: 'C005', companyName: 'JKL建筑工程', companyNameEn: 'JKL Construction',
    stage: 'prospect', type: 'project_contractor', businessType: ['project'], source: 'live_streaming',
    region: 'EMEA', rating: 'BBB', priority: 'high',
    contacts: [{ id: 'CT005', name: 'Hans Mueller', position: 'Procurement Director', email: 'hans@jkl.com', phone: '+49-30-1234567', isPrimary: true }],
    country: 'Germany', assignedTo: 'sales.maria', assignedBy: 'marketing.ai', assignedAt: new Date('2024-11-22'),
    totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, followUpHistory: [],
    tags: ['直播来源', '大型项目', '项目承包商'], notes: '在直播中提问并留下联系方式，承接大型建筑项目',
    createdAt: new Date('2024-11-22'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-28'), updatedBy: 'sales.maria',
    leadScore: 88, engagementLevel: 'high', lastSocialInteraction: new Date('2024-11-22'),
    socialInteractions: [
      { id: 'SI012', platform: 'linkedin', type: 'message', date: new Date('2024-11-22'), content: '直播后通过LinkedIn联系', response: '已安排后续会议', sentiment: 'positive' }
    ]
  },
  {
    id: 'C006', companyName: 'MNO家居连锁', companyNameEn: 'MNO Home Chain',
    stage: 'pool', type: 'retailer', businessType: ['direct_purchase'], source: 'email_marketing',
    region: 'SA', rating: 'UNRATED', priority: 'low',
    contacts: [{ id: 'CT006', name: 'Sofia Rodriguez', position: 'Purchasing Agent', email: 'sofia@mno.com', isPrimary: true }],
    country: 'Argentina', totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, followUpHistory: [],
    tags: ['邮件营销', '待分配', '建材零售商'], notes: '邮件营销活动响应，家居建材连锁店',
    createdAt: new Date('2024-11-26'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-26'), updatedBy: 'marketing.ai',
    leadScore: 45, engagementLevel: 'low', lastSocialInteraction: new Date('2024-11-26'),
    socialInteractions: [
      { id: 'SI013', platform: 'email', type: 'email_opened', date: new Date('2024-11-26'), content: '打开了营销邮件', sentiment: 'neutral' }
    ]
  },
  {
    id: 'C007', companyName: 'PQR门窗加工厂', companyNameEn: 'PQR Window & Door Manufacturing',
    stage: 'active', type: 'local_manufacturer', businessType: ['direct_purchase'], source: 'linkedin',
    region: 'NA', rating: 'A', priority: 'high',
    contacts: [{ id: 'CT007', name: 'Michael Brown', position: 'Owner', email: 'michael@pqr.com', phone: '+1-555-789-0123', isPrimary: true }],
    country: 'USA', assignedTo: 'sales.tom', assignedBy: 'marketing.ai', assignedAt: new Date('2024-09-15'),
    firstOrderDate: new Date('2024-10-01'), lastOrderDate: new Date('2024-11-20'),
    totalOrders: 12, totalRevenue: 180000, averageOrderValue: 15000, followUpHistory: [],
    tags: ['LinkedIn来源', '本地制造', '高频采购', '多SKU'], notes: '门窗加工厂，需要多品类原材料和配件，高频稳定采购',
    createdAt: new Date('2024-09-15'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-20'), updatedBy: 'sales.tom',
    socialProfiles: { linkedin: 'https://linkedin.com/company/pqr-windows' },
    leadScore: 90, engagementLevel: 'high', lastSocialInteraction: new Date('2024-11-18'),
    socialInteractions: [
      { id: 'SI014', platform: 'linkedin', type: 'connection', date: new Date('2024-09-10'), content: '主动连接，询问门窗配件', sentiment: 'positive' },
      { id: 'SI015', platform: 'linkedin', type: 'message', date: new Date('2024-09-12'), content: '发送详细原材料需求清单', response: '已提供报价', sentiment: 'positive' }
    ]
  },
  {
    id: 'C008', companyName: 'STU进口公司', companyNameEn: 'STU Import Co',
    stage: 'prospect', type: 'inspection_seeker', businessType: ['inspection'], source: 'google',
    region: 'EMEA', rating: 'BBB', priority: 'medium',
    contacts: [{ id: 'CT008', name: 'Laura White', position: 'Sourcing Manager', email: 'laura@stu.com', phone: '+44-20-1234-5678', isPrimary: true }],
    country: 'UK', assignedTo: 'sales.maria', assignedBy: 'marketing.ai', assignedAt: new Date('2024-11-15'),
    totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, followUpHistory: [],
    tags: ['Google搜索', '验货服务', '质量控制'], notes: 'Google搜索找到我们，需要验货+采购一体化服务',
    createdAt: new Date('2024-11-15'), createdBy: 'marketing.ai', updatedAt: new Date('2024-11-28'), updatedBy: 'sales.maria',
    socialProfiles: { linkedin: 'https://linkedin.com/company/stu-import' },
    leadScore: 72, engagementLevel: 'medium', lastSocialInteraction: new Date('2024-11-26'),
    socialInteractions: [
      { id: 'SI016', platform: 'email', type: 'email_sent', date: new Date('2024-11-15'), content: '发送验货服务介绍', sentiment: 'neutral' },
      { id: 'SI017', platform: 'email', type: 'email_opened', date: new Date('2024-11-16'), content: '打开了验货服务邮件', sentiment: 'positive' }
    ]
  },
];

const SOCIAL_PLATFORM_ICONS: Record<string, any> = {
  linkedin: Linkedin, facebook: Facebook, instagram: Instagram, youtube: Youtube,
  live_streaming: Radio, email_marketing: Mail, google: Globe,
};

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  post_like: '点赞帖子', post_comment: '评论帖子', message: '发送消息',
  connection: '建立连接', profile_view: '浏览主页', email_sent: '发送邮件', email_opened: '打开邮件',
};

export default function CustomerRelationshipManagerPro() {
  const [viewMode, setViewMode] = useState<'customer-types' | 'funnel' | 'list' | 'social' | 'analytics' | 'health' | 'lead-conversion' | 'public-pool' | 'credit'>('customer-types');
  const [selectedStage, setSelectedStage] = useState<CustomerStage | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<CustomerSource | 'all'>('all');
  const [selectedType, setSelectedType] = useState<CustomerType | 'all'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithSocial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [funnelLayout, setFunnelLayout] = useState<'cards' | 'visual'>('cards'); // 漏斗布局模式

  const filteredCustomers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(customer => {
    const matchesStage = selectedStage === 'all' || customer.stage === selectedStage;
    const matchesSource = selectedSource === 'all' || customer.source === selectedSource;
    const matchesType = selectedType === 'all' || customer.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      customer.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.companyNameEn?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSource && matchesType && matchesSearch;
  });

  const stageStats = Object.keys(CUSTOMER_STAGES).reduce((acc, stage) => {
    acc[stage as CustomerStage] = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === stage).length;
    return acc;
  }, {} as Record<CustomerStage, number>);

  const typeStats = Object.keys(CUSTOMER_TYPES).reduce((acc, type) => {
    const customers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.type === type);
    acc[type as CustomerType] = {
      count: customers.length,
      converted: customers.filter(c => c.stage === 'active' || c.stage === 'vip').length,
      revenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
      avgScore: customers.length > 0 ? Math.round(customers.reduce((sum, c) => sum + (c.leadScore || 0), 0) / customers.length) : 0,
    };
    return acc;
  }, {} as Record<CustomerType, { count: number; converted: number; revenue: number; avgScore: number }>);

  const sourceStats = Object.keys(CUSTOMER_SOURCES).reduce((acc, source) => {
    const customers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.source === source);
    acc[source as CustomerSource] = {
      count: customers.length,
      converted: customers.filter(c => c.stage === 'active' || c.stage === 'vip').length,
      revenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
    };
    return acc;
  }, {} as Record<CustomerSource, { count: number; converted: number; revenue: number }>);

  const socialSourcesStats = Object.entries(sourceStats)
    .filter(([source]) => {
      const category = CUSTOMER_SOURCES[source as CustomerSource]?.category;
      return category === 'social' || category === 'marketing';
    })
    .map(([source, stats]) => ({
      source: source as CustomerSource, ...stats,
      conversionRate: stats.count > 0 ? (stats.converted / stats.count * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="h-full flex flex-col bg-[#F5F5F5]">
      {/* Header - 台湾大厂风格 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F96302]" />
              客户关系管理系统 Pro - 社媒引流全打通 + 公海客户池
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              潜客转化 · 公海池管理 · 6类目标客户 | LinkedIn · Facebook · Instagram · YouTube · 直播 · 邮件营销
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-[#FAFBFC] border border-[#E5E7EB] rounded px-4 py-2">
              <p className="text-2xl font-bold text-gray-900">{MOCK_CUSTOMERS_WITH_SOCIAL.length}</p>
              <p className="text-xs text-gray-500">总客户数</p>
            </div>
            <div className="text-center bg-[#FAFBFC] border border-[#E5E7EB] rounded px-4 py-2">
              <p className="text-2xl font-bold text-gray-900">{socialSourcesStats.reduce((sum, s) => sum + s.count, 0)}</p>
              <p className="text-xs text-gray-500">社媒来源</p>
            </div>
            <div className="text-center bg-[#FAFBFC] border border-[#E5E7EB] rounded px-4 py-2">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(socialSourcesStats.reduce((sum, s) => sum + s.conversionRate, 0) / Math.max(socialSourcesStats.length, 1))}%
              </p>
              <p className="text-xs text-gray-500">平均转化率</p>
            </div>
          </div>
        </div>

        {/* Tab导航 - 台湾大厂风格 */}
        <div className="flex border-b border-gray-300 -mb-4 overflow-x-auto">
          <button onClick={() => setViewMode('lead-conversion')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'lead-conversion' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Target className="w-4 h-4" />潜客转化
          </button>
          <button onClick={() => setViewMode('public-pool')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'public-pool' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Waves className="w-4 h-4" />公海客户池
          </button>
          <button onClick={() => setViewMode('customer-types')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'customer-types' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" />6类客户
          </button>
          <button onClick={() => setViewMode('funnel')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'funnel' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Target className="w-4 h-4" />销售漏斗
          </button>
          <button onClick={() => setViewMode('list')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'list' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Users className="w-4 h-4" />客户列表
          </button>
          <button onClick={() => setViewMode('social')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'social' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Linkedin className="w-4 h-4" />社媒分析
          </button>
          <button onClick={() => setViewMode('analytics')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'analytics' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <BarChart3 className="w-4 h-4" />数据分析
          </button>
          <button onClick={() => setViewMode('health')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'health' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <HeartPulse className="w-4 h-4" />客户健康度
          </button>
          <button onClick={() => setViewMode('credit')} className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 ${viewMode === 'credit' ? 'border-[#F96302] text-[#F96302] bg-white' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
            <Shield className="w-4 h-4" />信用评级
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* 搜索和筛选控制 - 台湾大厂风格 */}
        <div className="bg-white border border-[#E5E7EB] rounded p-3 mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="搜索客户..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 w-56 h-8 text-xs border-[#D1D5DB] rounded" />
            </div>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as CustomerType | 'all')}>
              <SelectTrigger className="w-36 h-8 text-xs border-[#D1D5DB] rounded"><SelectValue placeholder="客户类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="retailer">🏪 建材零售商</SelectItem>
                <SelectItem value="project_contractor">🏗️ 项目承包商</SelectItem>
                <SelectItem value="inspection_seeker">🔍 验货客户</SelectItem>
                <SelectItem value="agency_seeker">🤝 中国代理</SelectItem>
                <SelectItem value="local_manufacturer">🏭 本土工厂</SelectItem>
                <SelectItem value="wholesaler">📦 批发商</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSource} onValueChange={(v) => setSelectedSource(v as CustomerSource | 'all')}>
              <SelectTrigger className="w-36 h-8 text-xs border-[#D1D5DB] rounded"><SelectValue placeholder="客户来源" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部来源</SelectItem>
                <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                <SelectItem value="facebook">👥 Facebook</SelectItem>
                <SelectItem value="instagram">📷 Instagram</SelectItem>
                <SelectItem value="youtube">📹 YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-[#F96302] hover:bg-[#EA580C] border border-[#EA580C] text-white h-8 px-3 text-xs rounded shadow-none"><Plus className="w-3.5 h-3.5 mr-1.5" />新增</Button>
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs border-[#D1D5DB] rounded shadow-none"><Download className="w-3.5 h-3.5 mr-1.5" />导出</Button>
          </div>
        </div>
        </div>

      {/* 🔥 潜客转化工作台视图 */}
      {viewMode === 'lead-conversion' && (
        <div className="mt-6">
          <LeadConversionWorkbench user={{ id: 'admin', name: 'Admin User', role: 'CEO', email: 'admin@cosun.com' }} />
        </div>
      )}

      {/* 🔥 公海客户池视图 */}
      {viewMode === 'public-pool' && (
        <div className="mt-6">
          <PublicPoolManagementPro userRole="CEO" userRegion="all" />
        </div>
      )}

      {/* 6类客户视图 */}
      {viewMode === 'customer-types' && (
        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(CUSTOMER_TYPES).map(([type, config]) => {
              const stats = typeStats[type as CustomerType];
              const conversionRate = stats.count > 0 ? (stats.converted / stats.count * 100) : 0;
              return (
                <div key={type} className="bg-white border border-[#E5E7EB] rounded hover:shadow-sm transition-shadow cursor-pointer flex flex-col">
                  {/* 紧凑型Header */}
                  <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC] flex items-center flex-shrink-0" style={{ minHeight: '72px' }}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-2xl flex-shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{config.name}</p>
                          <p className="text-xs text-gray-500 leading-tight mt-0.5">{config.nameEn}</p>
                        </div>
                      </div>
                      <div className="bg-[#F96302] text-white text-sm font-bold rounded px-2 py-0.5 min-w-[24px] text-center flex-shrink-0 ml-2">
                        {stats.count}
                      </div>
                    </div>
                  </div>
                  
                  {/* 紧凑型Content */}
                  <div className="px-3 py-2 flex-1">
                    {/* 转化率 - 固定高度 */}
                    <div className="mb-2" style={{ height: '44px' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">转化率</span>
                        <span className="text-xs font-bold text-[#F96302]">{conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={conversionRate} className="h-1.5" />
                    </div>
                    
                    {/* 已成交数据 - 固定高度 */}
                    <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5 text-center mb-2 flex flex-col items-center justify-center" style={{ height: '52px' }}>
                      <p className="text-lg font-bold text-green-600 leading-none">{stats.converted}</p>
                      <p className="text-xs text-gray-600 mt-0.5">已成交</p>
                    </div>
                    
                    {/* 总营业额 - 固定高度 */}
                    <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1.5 flex flex-col justify-center" style={{ height: '52px' }}>
                      <p className="text-xs text-gray-600 mb-0.5">总营业额</p>
                      <p className="text-lg font-bold text-[#F96302] leading-none">${(stats.revenue / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded">
            <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
              <p className="text-sm font-semibold text-gray-900">客户类型详细列表 - 共{filteredCustomers.length}个客户</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#FAFBFC]">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">客户</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">类型</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">来源</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">阶段</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">AI评分</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">营业额</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredCustomers.map(customer => {
                    const SourceIcon = SOCIAL_PLATFORM_ICONS[customer.source] || Globe;
                    return (
                      <tr key={customer.id} className="hover:bg-[#F5F5F5] transition-colors">
                        <td className="px-3 py-2">
                          <p className="text-sm text-gray-900">{customer.companyName}</p>
                          <p className="text-xs text-gray-500">{customer.companyNameEn}</p>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                            {CUSTOMER_TYPES[customer.type]?.icon} {CUSTOMER_TYPES[customer.type]?.name}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-300">
                            <SourceIcon className="w-3 h-3" />
                            {CUSTOMER_SOURCES[customer.source]?.name}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {CUSTOMER_STAGES[customer.stage]?.icon} {CUSTOMER_STAGES[customer.stage]?.name}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {customer.leadScore && (
                            <div className="flex items-center gap-2">
                              <Progress value={customer.leadScore} className="w-16 h-1.5" />
                              <span className="text-xs font-semibold text-[#F96302]">{customer.leadScore}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <p className="text-sm font-semibold text-green-600">${customer.totalRevenue.toLocaleString()}</p>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setSelectedCustomer(customer)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 销售漏斗视图 - 台湾大厂紧凑风格 */}
      {viewMode === 'funnel' && (
        <div className="space-y-3">
          {/* 顶部筛选栏 */}
          <div className="bg-white border border-[#E5E7EB] rounded p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="搜索客户..." 
                  className="pl-9 pr-3 py-1.5 text-xs border border-[#D1D5DB] rounded w-64 focus:outline-none focus:border-[#F96302]"
                />
              </div>
              
              {/* 维度切换 */}
              <div className="flex items-center gap-2 border-l border-[#E5E7EB] pl-3">
                <span className="text-xs text-gray-600">维度:</span>
                <button className="px-3 py-1.5 text-xs font-medium rounded bg-[#F96302] text-white">
                  全部客户
                </button>
                <button className="px-3 py-1.5 text-xs font-medium rounded border border-[#D1D5DB] text-gray-700 hover:bg-gray-50">
                  集中目标客户
                </button>
              </div>

              {/* 类型筛选 */}
              <select className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded focus:outline-none focus:border-[#F96302]">
                <option>全部类型</option>
                <option>🏪 建材零售商</option>
                <option>🏗️ 项目承包商</option>
                <option>🔍 验货客户</option>
                <option>🤝 中国代理</option>
                <option>🏭 本土工厂</option>
                <option>📦 批发商</option>
              </select>

              {/* 来源筛选 */}
              <select className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded focus:outline-none focus:border-[#F96302]">
                <option>全部来源</option>
                <option>LinkedIn</option>
                <option>Facebook</option>
                <option>Instagram</option>
                <option>YouTube</option>
                <option>邮件营销</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* 布局切换 */}
              <div className="flex items-center border border-[#D1D5DB] rounded overflow-hidden">
                <button 
                  onClick={() => setFunnelLayout('cards')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${funnelLayout === 'cards' ? 'bg-[#F96302] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  卡片视图
                </button>
                <button 
                  onClick={() => setFunnelLayout('visual')}
                  className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 border-l border-[#D1D5DB] ${funnelLayout === 'visual' ? 'bg-[#F96302] text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  漏斗视图
                </button>
              </div>
              
              <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                新增
              </button>
              <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                导出
              </button>
            </div>
          </div>

          {/* 销售漏斗看板 - 卡片布局 */}
          {funnelLayout === 'cards' && (
          <div className="grid grid-cols-6 gap-3">
            {Object.entries(CUSTOMER_STAGES).map(([key, stage]) => {
              const stageCustomers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === stage.id);
              const stageCount = stageCustomers.length;
              
              return (
                <div key={key} className="bg-white border border-[#E5E7EB] rounded">
                  {/* 阶段头部 */}
                  <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{stage.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{stage.name}</p>
                          <p className="text-xs text-gray-500">{stage.nameEn}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">{stageCount}</span>
                    </div>
                  </div>

                  {/* 客户列表 */}
                  <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                    {stageCustomers.slice(0, 5).map(customer => {
                      const SourceIcon = SOCIAL_PLATFORM_ICONS[customer.source] || Globe;
                      return (
                        <div 
                          key={customer.id} 
                          className="bg-[#FAFBFC] rounded border border-[#E5E7EB] p-2 hover:border-gray-300 transition-all cursor-pointer"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs font-semibold text-gray-900 truncate flex-1">
                              {customer.companyName}
                            </p>
                            <SourceIcon className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />
                          </div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                                {CUSTOMER_SOURCES[customer.source]?.icon}
                              </span>
                              <span className="text-xs text-gray-500">{customer.assignedTo?.split('.')[1] || '未分配'}</span>
                            </div>
                            {customer.leadScore && (
                              <span className="text-xs font-semibold text-[#F96302]">{customer.leadScore}</span>
                            )}
                          </div>

                          {/* 客户标签 */}
                          {customer.tags && customer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {customer.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                  {tag.length > 6 ? tag.substring(0, 6) + '...' : tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {stageCount > 5 && (
                      <button className="w-full py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded border border-dashed border-gray-300">
                        + 查看更多 ({stageCount - 5})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* 销售漏斗看板 - 可视化漏斗布局 */}
          {funnelLayout === 'visual' && (
          <div className="space-y-4">
            {/* 漏斗统计总览 */}
            <div className="bg-white border border-[#E5E7EB] rounded p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">总客户数</p>
                  <p className="text-2xl font-bold text-gray-900">{MOCK_CUSTOMERS_WITH_SOCIAL.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">漏斗转化率</p>
                  <p className="text-2xl font-bold text-[#F96302]">
                    {MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => ['active', 'vip'].includes(c.stage)).length > 0 
                      ? ((MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => ['active', 'vip'].includes(c.stage)).length / MOCK_CUSTOMERS_WITH_SOCIAL.length) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">成交客户</p>
                  <p className="text-2xl font-bold text-green-600">
                    {MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === 'active').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">VIP大客户</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === 'vip').length}
                  </p>
                </div>
              </div>
            </div>

            {/* 可视化漏斗图 */}
            <div className="bg-white border border-[#E5E7EB] rounded p-6">
              <div className="space-y-3">
                {[
                  { key: 'pool', stage: CUSTOMER_STAGES.pool, width: 100 },
                  { key: 'prospect', stage: CUSTOMER_STAGES.prospect, width: 80 },
                  { key: 'active', stage: CUSTOMER_STAGES.active, width: 50 },
                  { key: 'vip', stage: CUSTOMER_STAGES.vip, width: 30 },
                  { key: 'churned', stage: CUSTOMER_STAGES.churned, width: 40 },
                  { key: 'rejected', stage: CUSTOMER_STAGES.rejected, width: 35 },
                ].map(({ key, stage, width }) => {
                  const stageCustomers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === stage.id);
                  const stageCount = stageCustomers.length;
                  const totalCustomers = MOCK_CUSTOMERS_WITH_SOCIAL.length;
                  const percentage = totalCustomers > 0 ? ((stageCount / totalCustomers) * 100).toFixed(1) : '0.0';
                  
                  // 颜色映射
                  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
                    'pool': { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' },
                    'prospect': { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
                    'active': { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
                    'vip': { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
                    'churned': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' },
                    'rejected': { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
                  };

                  const colors = colorMap[key] || colorMap['pool'];

                  return (
                    <div key={key} className="relative">
                      {/* 漏斗层级 */}
                      <div className="flex items-center gap-4">
                        {/* 左侧标签 */}
                        <div className="w-32 flex-shrink-0 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-2xl">{stage.icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{stage.name}</p>
                              <p className="text-xs text-gray-500">{stage.nameEn}</p>
                            </div>
                          </div>
                        </div>

                        {/* 漏斗条形 */}
                        <div className="flex-1">
                          <div 
                            className={`relative ${colors.bg} border-2 ${colors.border} rounded-r-lg overflow-hidden`}
                            style={{ width: `${width}%`, transition: 'all 0.3s ease' }}
                          >
                            {/* 进度条效果 */}
                            <div className="h-16 flex items-center justify-between px-4">
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl font-bold ${colors.text}`}>{stageCount}</span>
                                <span className="text-xs text-gray-600">客户</span>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${colors.text}`}>{percentage}%</p>
                                <p className="text-xs text-gray-500">占比</p>
                              </div>
                            </div>

                            {/* 悬浮提示区域 */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all cursor-pointer" />
                          </div>
                        </div>
                      </div>

                      {/* 连接箭头（除了最后一个） */}
                      {key !== 'rejected' && (
                        <div className="absolute left-32 top-full w-0.5 h-3 bg-gray-300 ml-16" style={{ left: 'calc(8rem + 2rem)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 详细客户列表（可折叠卡片） */}
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(CUSTOMER_STAGES).map(([key, stage]) => {
                const stageCustomers = MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.stage === stage.id);
                const stageCount = stageCustomers.length;
                
                return (
                  <div key={key} className="bg-white border border-[#E5E7EB] rounded">
                    {/* 阶段头部 */}
                    <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{stage.icon}</span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{stage.name}</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{stageCount}</span>
                      </div>
                    </div>

                    {/* 客户列表（只显示前3个） */}
                    <div className="p-2 space-y-1.5">
                      {stageCustomers.slice(0, 3).map(customer => (
                        <div 
                          key={customer.id} 
                          className="bg-[#FAFBFC] rounded border border-[#E5E7EB] p-2 hover:border-gray-300 transition-all cursor-pointer text-xs"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <p className="font-semibold text-gray-900 truncate">{customer.companyName}</p>
                          <p className="text-gray-500 text-xs truncate">{customer.companyNameEn}</p>
                        </div>
                      ))}
                      {stageCount > 3 && (
                        <button className="w-full py-1 text-xs text-gray-600 hover:text-gray-900">
                          + 更多 {stageCount - 3} 个
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>
      )}

      {/* 客户列表视图 */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader><CardTitle>客户列表 ({filteredCustomers.length})</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">客户</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">阶段</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">类型</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">评级</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">社媒活跃度</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">营业额</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map(customer => {
                  const SourceIcon = SOCIAL_PLATFORM_ICONS[customer.source] || Globe;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm">{customer.companyName}</p>
                        <p className="text-xs text-gray-500">{customer.companyNameEn}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="gap-1">
                          <SourceIcon className="w-3 h-3" />
                          {CUSTOMER_SOURCES[customer.source]?.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{CUSTOMER_STAGES[customer.stage]?.icon} {CUSTOMER_STAGES[customer.stage]?.name}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{CUSTOMER_TYPES[customer.type]?.icon} {CUSTOMER_TYPES[customer.type]?.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{CUSTOMER_RATINGS[customer.rating]?.icon} {customer.rating}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {customer.engagementLevel === 'high' && <Badge className="bg-green-500">高</Badge>}
                        {customer.engagementLevel === 'medium' && <Badge variant="secondary">中</Badge>}
                        {customer.engagementLevel === 'low' && <Badge variant="outline">低</Badge>}
                        {customer.leadScore && <span className="text-xs text-gray-500 ml-2">({customer.leadScore}分)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm">${customer.totalRevenue.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 社媒分析视图 */}
      {viewMode === 'social' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />社媒渠道效果分析</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialSourcesStats.map(({ source, count, converted, revenue, conversionRate }) => {
                  const sourceConfig = CUSTOMER_SOURCES[source];
                  const SourceIcon = SOCIAL_PLATFORM_ICONS[source] || Globe;
                  return (
                    <div key={source} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <SourceIcon className="w-6 h-6 text-blue-600" />
                          <div>
                            <p className="font-semibold">{sourceConfig.name}</p>
                            <p className="text-xs text-gray-500">{sourceConfig.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-6">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{count}</p>
                            <p className="text-xs text-gray-500">客户数</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{converted}</p>
                            <p className="text-xs text-gray-500">已转化</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">转化率</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">${(revenue / 1000).toFixed(0)}K</p>
                            <p className="text-xs text-gray-500">营业额</p>
                          </div>
                        </div>
                      </div>
                      <Progress value={conversionRate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />最近社媒互动记录</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_CUSTOMERS_WITH_SOCIAL
                  .filter(c => c.socialInteractions && c.socialInteractions.length > 0)
                  .flatMap(customer => customer.socialInteractions!.slice(-1).map(interaction => ({ customer, interaction })))
                  .sort((a, b) => b.interaction.date.getTime() - a.interaction.date.getTime())
                  .slice(0, 10)
                  .map(({ customer, interaction }, idx) => {
                    const PlatformIcon = SOCIAL_PLATFORM_ICONS[interaction.platform] || Globe;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <PlatformIcon className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-sm">{customer.companyName}</p>
                            <p className="text-xs text-gray-600">{INTERACTION_TYPE_LABELS[interaction.type]}: {interaction.content}</p>
                            {interaction.response && <p className="text-xs text-green-600 mt-1">↳ {interaction.response}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{interaction.date.toLocaleDateString('zh-CN')}</p>
                          {interaction.sentiment && (
                            <Badge variant={interaction.sentiment === 'positive' ? 'default' : interaction.sentiment === 'neutral' ? 'secondary' : 'destructive'} className="text-xs mt-1">
                              {interaction.sentiment === 'positive' ? '😊 积极' : interaction.sentiment === 'neutral' ? '😐 中性' : '😞 消极'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 数据分析视图 */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>客户来源分布</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(sourceStats).sort(([, a], [, b]) => b.count - a.count).slice(0, 10).map(([source, stats]) => {
                  const sourceConfig = CUSTOMER_SOURCES[source as CustomerSource];
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-sm">{sourceConfig.icon} {sourceConfig.name}</span>
                      <Badge variant="secondary">{stats.count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>客户阶段分布</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stageStats).sort(([, a], [, b]) => b - a).map(([stage, count]) => {
                  const stageConfig = CUSTOMER_STAGES[stage as CustomerStage];
                  return (
                    <div key={stage} className="flex items-center justify-between">
                      <span className="text-sm">{stageConfig.icon} {stageConfig.name}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>关键指标</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">总营业额</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${MOCK_CUSTOMERS_WITH_SOCIAL.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">平均客单价</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ${Math.round(MOCK_CUSTOMERS_WITH_SOCIAL.reduce((sum, c) => sum + c.averageOrderValue, 0) / MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => c.averageOrderValue > 0).length).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">社媒转化率</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(socialSourcesStats.reduce((sum, s) => sum + s.conversionRate, 0) / Math.max(socialSourcesStats.length, 1))}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 客户健康度视图 - 台湾大厂紧凑风格 */}
      {viewMode === 'health' && (
        <div className="space-y-3">
          {/* 头部 + 筛选栏 */}
          <div className="bg-white border border-[#E5E7EB] rounded p-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-gray-900 flex items-center gap-2 text-lg font-semibold">
                  <HeartPulse className="w-5 h-5 text-[#F96302]" />
                  客户健康度监控系统
                </h1>
                <p className="text-gray-600 mt-0.5 text-xs">
                  Customer Health Monitor · 预防流失 · 促进增长
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 客户类型筛选 */}
                <select className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded focus:outline-none focus:border-[#F96302]">
                  <option value="all">全部类型</option>
                  <option value="retailer">🏪 建材零售商</option>
                  <option value="project_contractor">🏗️ 项目承包商</option>
                  <option value="inspection_seeker">🔍 验货客户</option>
                  <option value="agency_seeker">🤝 中国代理</option>
                  <option value="local_manufacturer">🏭 本土工厂</option>
                  <option value="wholesaler">📦 批发商</option>
                </select>
                
                <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  刷新数据
                </button>
                <button className="px-3 py-1.5 text-xs border border-[#D1D5DB] rounded hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  导出报告
                </button>
              </div>
            </div>
          </div>

          {/* 健康度总览KPI - 台湾大厂紧凑风格 */}
          <div className="grid grid-cols-5 gap-3">
            {/* 总客户数 */}
            <div className="bg-white border border-[#E5E7EB] rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gray-600 rounded flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-gray-600">总客户数</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">567</p>
            </div>

            {/* 健康客户 */}
            <div className="bg-white border border-emerald-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-emerald-600 rounded flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">健康客户</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  60.3%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">342</p>
            </div>

            {/* 需要关注 */}
            <div className="bg-white border border-yellow-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-yellow-600 rounded flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">需要关注</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold">
                  21.9%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">124</p>
            </div>

            {/* 高风险 */}
            <div className="bg-white border border-orange-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-600 rounded flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">高风险</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
                  11.8%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">67</p>
            </div>

            {/* 平均健康分 */}
            <div className="bg-white border border-blue-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs text-gray-600">平均健康分</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  +3.2
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">76.5</p>
            </div>
          </div>

          {/* RFM客户分级管理 - 台湾大厂紧凑风格 */}
          <div className="bg-white border border-[#E5E7EB] rounded">
            <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#FAFBFC]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  RFM客户分级管理
                </p>
                <p className="text-xs text-gray-500">最近购买 · 购买频率 · 消费金额</p>
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { 
                    name: '冠军客户', enName: 'Champions', count: 45, icon: '🏆', color: '#10b981',
                    revenue: 2345000, avgOrder: 52100,
                    features: '最近购买、频繁购买、高消费',
                    action: '保持关系，VIP服务'
                  },
                  { 
                    name: '忠诚客户', enName: 'Loyal Customers', count: 78, icon: '⭐', color: '#3b82f6',
                    revenue: 1876000, avgOrder: 24051,
                    features: '经常购买，消费稳定',
                    action: '提供会员优惠，推荐新品'
                  },
                  { 
                    name: '潜力客户', enName: 'Potential Loyalists', count: 124, icon: '📈', color: '#8b5cf6',
                    revenue: 1234000, avgOrder: 9952,
                    features: '最近购买，有潜力成为忠诚客户',
                    action: '培养忠诚度，交叉销售'
                  },
                  { 
                    name: '新客户', enName: 'New Customers', count: 89, icon: '🎁', color: '#06b6d4',
                    revenue: 445000, avgOrder: 5000,
                    features: '最近首次购买',
                    action: '新客欢迎，建立关系'
                  },
                ].map((segment, idx) => (
                  <div 
                    key={idx}
                    className="bg-[#FAFBFC] rounded border border-[#E5E7EB] p-3 hover:border-gray-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: segment.color + '20' }}>
                        <span className="text-xl">{segment.icon}</span>
                      </div>
                      <span className="text-sm px-2 py-0.5 rounded font-bold" style={{ backgroundColor: segment.color + '20', color: segment.color, border: `1px solid ${segment.color}40` }}>
                        {segment.count}
                      </span>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm font-semibold text-gray-900">{segment.name}</p>
                      <p className="text-xs text-gray-500">{segment.enName}</p>
                    </div>
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">总收入</span>
                        <span className="font-semibold text-gray-900">${(segment.revenue / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">平均订单</span>
                        <span className="font-semibold text-gray-900">${segment.avgOrder.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="bg-white rounded border border-gray-200 p-2 mb-1.5">
                      <p className="text-xs text-gray-600 mb-0.5">特征</p>
                      <p className="text-xs text-gray-700">{segment.features}</p>
                    </div>
                    <div className="bg-white rounded border border-gray-200 p-2">
                      <p className="text-xs text-gray-600 mb-0.5">行动</p>
                      <p className="text-xs font-medium" style={{ color: segment.color }}>{segment.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 流失预警 */}
          <Card className="p-6 border-2 border-red-200">
            <CardHeader className="pb-4 px-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    流失预警TOP 5
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">高风险客户 · 需要立即行动</p>
                </div>
                <Badge variant="destructive" className="gap-1">
                  <Bell className="w-3 h-3" />
                  {MOCK_CUSTOMERS_WITH_SOCIAL.filter(c => (c.leadScore || 0) < 60).length} 个高风险
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-3">
                {MOCK_CUSTOMERS_WITH_SOCIAL
                  .filter(c => (c.leadScore || 0) < 80)
                  .sort((a, b) => (a.leadScore || 0) - (b.leadScore || 0))
                  .slice(0, 5)
                  .map((customer, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{customer.companyName}</p>
                          <p className="text-xs text-gray-600">{customer.companyNameEn}</p>
                        </div>
                        <Badge className={(customer.leadScore || 0) < 60 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                          {(customer.leadScore || 0) < 60 ? '高风险' : '中风险'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-600">健康分</p>
                          <p className="text-lg font-bold text-red-600">{customer.leadScore}</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-600">总订单</p>
                          <p className="text-lg font-bold text-blue-600">{customer.totalOrders}</p>
                        </div>
                        <div className="bg-white rounded p-2">
                          <p className="text-xs text-gray-600">营业额</p>
                          <p className="text-lg font-bold text-green-600">${(customer.totalRevenue / 1000).toFixed(0)}K</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 gap-1">
                          <Mail className="w-3 h-3" />
                          立即联系
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Calendar className="w-3 h-3" />
                          安排跟进
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* 复购率分析 + 交叉销售机会 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 复购率趋势 */}
            <Card className="p-6 border-2 border-emerald-200">
              <CardHeader className="pb-4 px-0 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <ShoppingCart className="w-5 h-5" />
                      复购率趋势分析
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">复购率提升 · 平均周期缩短</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    当前复购率: 62.1%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={[
                    { month: '1月', rate: 42.3, avgCycle: 45 },
                    { month: '2月', rate: 45.8, avgCycle: 43 },
                    { month: '3月', rate: 48.2, avgCycle: 42 },
                    { month: '4月', rate: 51.5, avgCycle: 40 },
                    { month: '5月', rate: 53.7, avgCycle: 38 },
                    { month: '6月', rate: 56.2, avgCycle: 37 },
                    { month: '7月', rate: 54.8, avgCycle: 38 },
                    { month: '8月', rate: 57.3, avgCycle: 36 },
                    { month: '9月', rate: 59.8, avgCycle: 35 },
                    { month: '10月', rate: 62.1, avgCycle: 34 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="rate" name="复购率 (%)" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="avgCycle" name="平均周期 (天)" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    即将到复购周期（预计未来15天）
                  </p>
                  <div className="space-y-2">
                    {[
                      { customer: 'ABC建材有限公司', expectedDate: '2024-12-08', daysLeft: 7, probability: 85 },
                      { customer: 'GHI五金批发', expectedDate: '2024-12-10', daysLeft: 9, probability: 78 },
                      { customer: 'JKL建筑工程', expectedDate: '2024-12-12', daysLeft: 11, probability: 92 },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 rounded p-2 text-xs">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{item.customer}</p>
                          <p className="text-slate-600">{item.expectedDate} · {item.daysLeft}天后</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {item.probability}% 概率
                          </Badge>
                          <Button size="sm" variant="outline" className="h-7 px-2">
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 交叉销售机会 */}
            <Card className="p-6 border-2 border-yellow-200">
              <CardHeader className="pb-4 px-0 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-yellow-800">
                      <Zap className="w-5 h-5" />
                      交叉销售机会识别
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">基于购买行为的智能推荐</p>
                  </div>
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    预计增收: $161K
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  {[
                    { customer: 'ABC建材有限公司', current: '电气设备', recommended: '卫浴产品', probability: 78, revenue: 45000 },
                    { customer: 'XYZ装饰公司', current: '门窗配件', recommended: '劳保用品', probability: 82, revenue: 32000 },
                    { customer: 'GHI五金批发', current: '卫浴产品', recommended: '电气设备', probability: 75, revenue: 56000 },
                    { customer: 'JKL建筑工程', current: '劳保用品', recommended: '门窗配件', probability: 68, revenue: 28000 },
                  ].map((item, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{item.customer}</p>
                          <p className="text-xs text-gray-600">当前: {item.current} → 推荐: <span className="text-yellow-700 font-medium">{item.recommended}</span></p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">{item.probability}%</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-600">预计增收: ${(item.revenue / 1000).toFixed(0)}K</span>
                        <Button size="sm" variant="outline" className="h-7 px-3 gap-1">
                          <Mail className="w-3 h-3" />
                          推送
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VIP客户分级管理 + 客户生命周期价值趋势 */}
          <div className="grid grid-cols-2 gap-4">
            {/* VIP客户分级管理 */}
            <Card className="p-6 border-2 border-purple-200">
              <CardHeader className="pb-4 px-0 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <Award className="w-5 h-5" />
                      VIP客户分级管理
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">自动分级 · 专属权益</p>
                  </div>
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                    268 位VIP
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  {[
                    { tier: '钻石VIP', count: 12, minLTV: 500000, color: '#a855f7', benefits: '专属客户经理、优先发货、定制服务' },
                    { tier: '铂金VIP', count: 33, minLTV: 200000, color: '#3b82f6', benefits: '优先报价、优惠价格、快速响应' },
                    { tier: '黄金VIP', count: 78, minLTV: 100000, color: '#f59e0b', benefits: '会员折扣、积分奖励、新品优先' },
                    { tier: '白银VIP', count: 145, minLTV: 50000, color: '#64748b', benefits: '定期优惠、产品推荐、活动邀请' },
                  ].map((tier, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tier.color + '20' }}>
                            <Award className="w-5 h-5" style={{ color: tier.color }} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{tier.tier}</p>
                            <p className="text-xs text-slate-600">最低LTV: ${(tier.minLTV / 1000).toFixed(0)}K</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{tier.count}</p>
                          <p className="text-xs text-slate-600">位客户</p>
                        </div>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-slate-600 mb-1">专属权益:</p>
                        <p className="text-xs text-slate-700">{tier.benefits}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">💡 VIP客户管理建议</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• 钻石VIP每月至少接触2次，确保高端服务体验</li>
                    <li>• 铂金VIP提供季度业务回顾会议</li>
                    <li>• 黄金VIP定期推送新品和优惠信息</li>
                    <li>• 白银VIP培养计划，提升至黄金级别</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 客户生命周期价值趋势 */}
            <Card className="p-6 border-2 border-blue-200">
              <CardHeader className="pb-4 px-0 pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <BarChart3 className="w-5 h-5" />
                      客户生命周期价值趋势
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">CLV持续增长 · 客户价值最大化</p>
                  </div>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    平均CLV: $65,800
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={[
                    { month: '1月', avgCLV: 45000, topCLV: 234000, medianCLV: 28000 },
                    { month: '2月', avgCLV: 47200, topCLV: 245000, medianCLV: 29500 },
                    { month: '3月', avgCLV: 49800, topCLV: 256000, medianCLV: 31200 },
                    { month: '4月', avgCLV: 52100, topCLV: 267000, medianCLV: 32800 },
                    { month: '5月', avgCLV: 54300, topCLV: 278000, medianCLV: 34100 },
                    { month: '6月', avgCLV: 56700, topCLV: 289000, medianCLV: 35600 },
                    { month: '7月', avgCLV: 58900, topCLV: 298000, medianCLV: 37000 },
                    { month: '8月', avgCLV: 61200, topCLV: 312000, medianCLV: 38400 },
                    { month: '9月', avgCLV: 63500, topCLV: 325000, medianCLV: 39800 },
                    { month: '10月', avgCLV: 65800, topCLV: 338000, medianCLV: 41200 }
                  ]}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTop" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Tooltip 
                      formatter={(value: any) => `$${(value as number).toLocaleString()}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="avgCLV" name="平均CLV" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                    <Area type="monotone" dataKey="topCLV" name="Top 10% CLV" stroke="#10b981" fillOpacity={1} fill="url(#colorTop)" strokeWidth={2} />
                    <Line type="monotone" dataKey="medianCLV" name="中位数CLV" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-slate-600 mb-1">平均CLV</p>
                    <p className="text-lg font-bold text-blue-600">$65,800</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +46.2% vs 年初
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <p className="text-xs text-slate-600 mb-1">Top 10% CLV</p>
                    <p className="text-lg font-bold text-emerald-600">$338,000</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +44.4% vs 年初
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-slate-600 mb-1">中位数CLV</p>
                    <p className="text-lg font-bold text-orange-600">$41,200</p>
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +47.1% vs 年初
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 底部行动建议 */}
          <div className="bg-gradient-to-r from-rose-50 via-purple-50 to-rose-50 rounded-lg p-5 border-2 border-dashed border-rose-200">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-slate-900 font-semibold mb-2 text-sm">
                  🎯 本周客户健康管理行动计划
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-rose-200">
                    <p className="text-xs font-semibold text-red-700 mb-1">🚨 紧急：高风险客户挽回</p>
                    <p className="text-xs text-slate-700">1个高风险客户需要立即联系，建议提供10%特别折扣挽回</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ 重要：复购提醒</p>
                    <p className="text-xs text-slate-700">3个客户即将到复购周期（15天内），平均复购概率85%，预计带来$186K收入</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-700 mb-1">💰 机会：交叉销售推进</p>
                    <p className="text-xs text-slate-700">4个高概率交叉销售机会，预计增收$161K，建议发送个性化产品推荐邮件</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-xs font-semibold text-purple-700 mb-1">⭐ 优化：VIP客户关怀</p>
                    <p className="text-xs text-slate-700">12位钻石VIP需要本周接触，建议CEO亲自致电或视频会议，了解需求并提供定制服务</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 客户详情弹窗 */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCustomer(null)}>
          <Card className="w-[900px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b-2 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-orange-800">{selectedCustomer.companyName}</CardTitle>
                  <p className="text-sm text-gray-600">{selectedCustomer.companyNameEn}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">客户类型</p>
                  <p className="text-xl font-bold text-blue-600">
                    {CUSTOMER_TYPES[selectedCustomer.type]?.icon} {CUSTOMER_TYPES[selectedCustomer.type]?.name}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">客户来源</p>
                  <p className="text-xl font-bold text-green-600">
                    {CUSTOMER_SOURCES[selectedCustomer.source]?.icon} {CUSTOMER_SOURCES[selectedCustomer.source]?.name}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">客户阶段</p>
                  <p className="text-xl font-bold text-purple-600">
                    {CUSTOMER_STAGES[selectedCustomer.stage]?.icon} {CUSTOMER_STAGES[selectedCustomer.stage]?.name}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1 font-semibold">AI评分</p>
                  <p className="text-4xl font-bold text-orange-600">{selectedCustomer.leadScore}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">总订单数</p>
                  <p className="text-2xl font-bold">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">总营业额</p>
                  <p className="text-2xl font-bold text-green-600">${selectedCustomer.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">平均客单价</p>
                  <p className="text-2xl font-bold text-blue-600">${selectedCustomer.averageOrderValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 信用评级详情视图 */}
      {viewMode === 'credit' && (
        <div>
          <CustomerCreditEvaluation userRole="Sales_Manager" />
        </div>
      )}
      </div>
    </div>
  );
}