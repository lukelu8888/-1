import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { 
  ArrowRight, CheckCircle2, XCircle, Clock, Star, Eye, UserPlus,
  Search, Filter, Mail, Phone, MapPin, Building2, Calendar,
  Sparkles, FileSearch, TrendingUp, AlertCircle, Globe,
  Instagram, Facebook, Linkedin, Youtube, Award, User,
  Package, DollarSign, RefreshCw, Send, MessageSquare, ArrowUpRight,
  Share2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner@2.0.3';

// 线索状态类型
type LeadStatus = 'pending' | 'qualified' | 'assigned' | 'rejected';

// 线索数据接口
interface SocialLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  source: {
    platform: string;
    campaignId: string;
    adName: string;
    date: string;
    utmParams?: string;
  };
  formData: {
    interest: string;
    orderVolume?: string;
    budget?: string;
    message?: string;
  };
  status: LeadStatus;
  qualityScore: number;
  assignedTo?: string;
  createdAt: string;
  processedAt?: string;
  bgChecked?: boolean;
  bgData?: {
    companySize?: string;
    industry?: string;
    founded?: string;
    website?: string;
    employees?: string;
    annualRevenue?: string;
    businessType?: string;
    creditScore?: number;
  };
}

export default function SocialMediaLeadsFlow() {
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('pending');
  const [filterSource, setFilterSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<SocialLead | null>(null);
  const [isCheckingBg, setIsCheckingBg] = useState(false);

  // 模拟线索数据
  const leads: SocialLead[] = [
    {
      id: 'LEAD-001',
      name: 'John Smith',
      company: 'BuildPro Supplies',
      email: 'john.smith@buildpro.com',
      phone: '+1-555-0123',
      country: 'United States',
      source: {
        platform: 'LinkedIn',
        campaignId: 'LI-2025-11-B2B',
        adName: '北美卫浴配件批发',
        date: '2025-11-18 14:23',
        utmParams: 'utm_source=linkedin&utm_campaign=b2b_bathroom'
      },
      formData: {
        interest: 'Bathroom Fixtures',
        orderVolume: '$50K - $100K',
        budget: 'Quarterly',
        message: 'Looking for bulk bathroom hardware suppliers for our retail chain.'
      },
      status: 'pending',
      qualityScore: 85,
      createdAt: '2025-11-18 14:23',
      bgChecked: false
    },
    {
      id: 'LEAD-002',
      name: 'Maria Garcia',
      company: 'HomeStyle Warehouse',
      email: 'maria@homestyle.com',
      phone: '+1-555-0456',
      country: 'Canada',
      source: {
        platform: 'Facebook',
        campaignId: 'FB-2025-11-NAM',
        adName: '门窗配件直销',
        date: '2025-11-18 10:15',
        utmParams: 'utm_source=facebook&utm_campaign=door_hardware'
      },
      formData: {
        interest: 'Door & Window Hardware',
        orderVolume: '$100K+',
        budget: 'Monthly',
        message: 'Need reliable supplier for door locks and window fittings.'
      },
      status: 'pending',
      qualityScore: 92,
      createdAt: '2025-11-18 10:15',
      bgChecked: false
    },
    {
      id: 'LEAD-003',
      name: 'Thomas Anderson',
      company: 'Industrial Supply Hub',
      email: 'thomas@indhub.com',
      phone: '+44-20-1234-5678',
      country: 'United Kingdom',
      source: {
        platform: 'LinkedIn',
        campaignId: 'LI-2025-11-EU',
        adName: '欧洲电气用品批发',
        date: '2025-11-18 09:30',
        utmParams: 'utm_source=linkedin&utm_campaign=eu_electrical'
      },
      formData: {
        interest: 'Electrical Supplies',
        orderVolume: '$200K+',
        budget: 'Annually',
        message: 'Expanding our electrical supplies division, seeking long-term partners.'
      },
      status: 'qualified',
      qualityScore: 88,
      createdAt: '2025-11-18 09:30',
      processedAt: '2025-11-18 11:45',
      bgChecked: true,
      bgData: {
        companySize: 'Medium (50-200)',
        industry: 'Industrial Distribution',
        founded: '2012',
        website: 'www.indhub.com',
        employees: '95',
        annualRevenue: '$20M - $30M',
        businessType: 'Wholesaler',
        creditScore: 82
      }
    },
    {
      id: 'LEAD-004',
      name: 'Sophie Chen',
      company: 'Pacific Hardware Group',
      email: 'sophie@pacifichw.com',
      phone: '+61-2-9876-5432',
      country: 'Australia',
      source: {
        platform: 'Instagram',
        campaignId: 'IG-2025-11-APAC',
        adName: 'APAC劳保用品批发',
        date: '2025-11-17 16:45',
        utmParams: 'utm_source=instagram&utm_campaign=apac_safety'
      },
      formData: {
        interest: 'Safety Equipment',
        orderVolume: '$30K - $50K',
        budget: 'Quarterly',
        message: 'Need safety equipment for construction projects.'
      },
      status: 'assigned',
      qualityScore: 78,
      assignedTo: 'Sarah Chen',
      createdAt: '2025-11-17 16:45',
      processedAt: '2025-11-18 08:20',
      bgChecked: true,
      bgData: {
        companySize: 'Small (10-50)',
        industry: 'Construction Supply',
        founded: '2019',
        website: 'www.pacifichw.com.au',
        employees: '28',
        annualRevenue: '$5M - $10M',
        businessType: 'Distributor',
        creditScore: 75
      }
    },
    {
      id: 'LEAD-005',
      name: 'David Wilson',
      company: 'QuickBuy Online',
      email: 'david@quickbuy.com',
      phone: '+1-555-0789',
      country: 'United States',
      source: {
        platform: 'Facebook',
        campaignId: 'FB-2025-11-NAM',
        adName: '美国五金工具批发',
        date: '2025-11-17 13:20',
        utmParams: 'utm_source=facebook&utm_campaign=us_tools'
      },
      formData: {
        interest: 'Hand Tools',
        orderVolume: '$10K - $20K',
        budget: 'One-time',
        message: 'Testing new suppliers for small batch orders.'
      },
      status: 'rejected',
      qualityScore: 45,
      createdAt: '2025-11-17 13:20',
      processedAt: '2025-11-17 15:30'
    },
    {
      id: 'LEAD-006',
      name: 'Emma Mueller',
      company: 'BauHaus Supplies GmbH',
      email: 'emma@bauhaus-supplies.de',
      phone: '+49-30-1234-5678',
      country: 'Germany',
      source: {
        platform: 'LinkedIn',
        campaignId: 'LI-2025-11-EU',
        adName: '德国建材批发',
        date: '2025-11-16 11:05',
        utmParams: 'utm_source=linkedin&utm_campaign=de_building'
      },
      formData: {
        interest: 'Building Materials',
        orderVolume: '$150K+',
        budget: 'Quarterly',
        message: 'Looking for comprehensive building materials supplier for our chain.'
      },
      status: 'assigned',
      qualityScore: 95,
      assignedTo: 'Michael Zhang',
      createdAt: '2025-11-16 11:05',
      processedAt: '2025-11-16 14:30',
      bgChecked: true,
      bgData: {
        companySize: 'Large (200+)',
        industry: 'Building Materials Retail',
        founded: '2005',
        website: 'www.bauhaus-supplies.de',
        employees: '280',
        annualRevenue: '$50M+',
        businessType: 'Retail Chain',
        creditScore: 90
      }
    }
  ];

  // 筛选线索
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesSource = filterSource === 'all' || lead.source.platform === filterSource;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSource && matchesSearch;
  });

  // 统计数据
  const stats = {
    pending: leads.filter(l => l.status === 'pending').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    assigned: leads.filter(l => l.status === 'assigned').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
    avgQualityScore: leads.reduce((sum, l) => sum + l.qualityScore, 0) / leads.length,
    conversionRate: ((leads.filter(l => l.status === 'assigned').length / leads.length) * 100).toFixed(1)
  };

  // 获取来源图标
  const getSourceIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'Facebook': return <Facebook className="w-3.5 h-3.5 text-blue-500" />;
      case 'Instagram': return <Instagram className="w-3.5 h-3.5 text-pink-500" />;
      case 'YouTube': return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      default: return <Globe className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  // 获取状态配置
  const getStatusConfig = (status: LeadStatus) => {
    switch (status) {
      case 'pending':
        return { label: '待审核', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock };
      case 'qualified':
        return { label: '已通过', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 };
      case 'assigned':
        return { label: '已分配', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: UserPlus };
      case 'rejected':
        return { label: '已拒绝', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle };
    }
  };

  // 获取质量分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 处理AI背调
  const handleBackgroundCheck = async (lead: SocialLead) => {
    setIsCheckingBg(true);
    setTimeout(() => {
      setIsCheckingBg(false);
      toast.success('客户背调完成！');
      if (selectedLead?.id === lead.id) {
        setSelectedLead({
          ...lead,
          bgChecked: true,
          bgData: {
            companySize: 'Medium (50-200)',
            industry: 'Building Materials Distribution',
            founded: '2018',
            website: `www.${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
            employees: '85',
            annualRevenue: '$15M - $25M',
            businessType: 'Wholesaler',
            creditScore: 78
          }
        });
      }
    }, 3000);
  };

  // 处理转入公海
  const handleMoveToPool = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // 🔥 构建公海客户数据
    const publicPoolCustomer = {
      // 基本信息
      companyName: lead.company,
      contactPerson: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      
      // 来源信息
      source: `社媒-${lead.source.platform}`,
      sourceDetails: {
        platform: lead.source.platform,
        campaign: lead.source.campaignId,
        adName: lead.source.adName,
        utmParams: lead.source.utmParams,
        collectDate: lead.createdAt
      },
      
      // 标签
      tags: [
        '社媒线索',
        lead.source.platform,
        lead.formData.interest,
        lead.formData.orderVolume || '未知规模'
      ],
      
      // 初步备注
      initialNote: `
【社媒线索自动转入】
来源平台：${lead.source.platform}
广告活动：${lead.source.campaignId}
意向产品：${lead.formData.interest}
订单规模：${lead.formData.orderVolume}
采购频次：${lead.formData.budget}
客户留言：${lead.formData.message}

质量评分：${lead.qualityScore}/100
${lead.bgChecked ? `
已完成背调：
- 公司规模：${lead.bgData?.companySize}
- 所属行业：${lead.bgData?.industry}
- 年收入：${lead.bgData?.annualRevenue}
- 业务类型：${lead.bgData?.businessType}
- 信用评分：${lead.bgData?.creditScore}/100
` : '待进行背调'}
      `.trim(),
      
      // 背调数据
      bgChecked: lead.bgChecked,
      bgData: lead.bgData,
      
      // 质量评分
      qualityScore: lead.qualityScore,
      
      // 状态
      status: 'pending_claim', // 待认领
      addedBy: 'Marketing_Ops', // 运营专员添加
      addedAt: new Date().toISOString(),
      
      // 原始线索ID（用于追溯）
      originalLeadId: lead.id
    };
    
    // 🔥 保存到localStorage公海池
    const existingPool = JSON.parse(localStorage.getItem('publicCustomerPool') || '[]');
    existingPool.push(publicPoolCustomer);
    localStorage.setItem('publicCustomerPool', JSON.stringify(existingPool));
    
    // 🔥 更新线索状态为"已转入"
    const updatedLeads = leads.map(l => 
      l.id === leadId 
        ? { ...l, status: 'qualified' as LeadStatus, processedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0] }
        : l
    );
    
    toast.success('线索已成功转入公海客户池！', {
      description: `${lead.company} 已添加到公海池，等待业务员认领`,
      duration: 3000
    });
  };

  // 处理分配给业务员
  const handleAssignToSales = (leadId: string) => {
    toast.success('线索已分配给业务员，自动转为意向客户！');
  };

  // 处理拒绝线索
  const handleRejectLead = (leadId: string) => {
    toast.error('线索已标记为不合格。');
  };

  return (
    <div className="space-y-4">
      {/* 流程可视化 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px' }}>
          <Sparkles className="w-4 h-4 text-blue-600" />
          社媒获客流转流程
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>社媒广告</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>投放推广</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>落地页</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>访问网站</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>表单提交</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>留资注册</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>线索池</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>待审核</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>AI背调</p>
                  <p className="text-gray-500" style={{ fontSize: '10px' }}>智能分析</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>公海客户</p>
                    <p className="text-gray-500" style={{ fontSize: '10px' }}>待领取</p>
                  </div>
                </div>
                <div className="text-center text-gray-400" style={{ fontSize: '10px' }}>或</div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>意向客户</p>
                    <p className="text-gray-500" style={{ fontSize: '10px' }}>直接分配</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="bg-white border border-yellow-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <Badge className="bg-yellow-100 text-yellow-700 border-0 h-5 px-2 text-xs">待审核</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">新线索</p>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <Badge className="bg-green-100 text-green-700 border-0 h-5 px-2 text-xs">已通过</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.qualified}</p>
          <p className="text-xs text-gray-500 mt-1">待分配</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <Badge className="bg-blue-100 text-blue-700 border-0 h-5 px-2 text-xs">已分配</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
          <p className="text-xs text-gray-500 mt-1">跟进中</p>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <Badge className="bg-red-100 text-red-700 border-0 h-5 px-2 text-xs">已拒绝</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
          <p className="text-xs text-gray-500 mt-1">不合格</p>
        </div>

        <div className="bg-white border border-purple-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-4 h-4 text-purple-600" />
            <Badge className="bg-purple-100 text-purple-700 border-0 h-5 px-2 text-xs">质量分</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.avgQualityScore.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">平均分数</p>
        </div>

        <div className="bg-white border border-emerald-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <Badge className="bg-emerald-100 text-emerald-700 border-0 h-5 px-2 text-xs">转化率</Badge>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
          <p className="text-xs text-gray-500 mt-1">分配转化</p>
        </div>
      </div>

      {/* 线索表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>社媒线索管理</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                刷新
              </Button>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="搜索客户姓名、公司、邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Filter className="w-3.5 h-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                <SelectItem value="pending" style={{ fontSize: '12px' }}>待审核</SelectItem>
                <SelectItem value="qualified" style={{ fontSize: '12px' }}>已通过</SelectItem>
                <SelectItem value="assigned" style={{ fontSize: '12px' }}>已分配</SelectItem>
                <SelectItem value="rejected" style={{ fontSize: '12px' }}>已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Globe className="w-3.5 h-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" style={{ fontSize: '12px' }}>全部来源</SelectItem>
                <SelectItem value="LinkedIn" style={{ fontSize: '12px' }}>LinkedIn</SelectItem>
                <SelectItem value="Facebook" style={{ fontSize: '12px' }}>Facebook</SelectItem>
                <SelectItem value="Instagram" style={{ fontSize: '12px' }}>Instagram</SelectItem>
                <SelectItem value="YouTube" style={{ fontSize: '12px' }}>YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9" style={{ fontSize: '12px' }}>线索编号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户信息</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>来源</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>意向产品</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>预算规模</TableHead>
                <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>质量分</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>背调</TableHead>
                <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-gray-50">
                  <TableCell className="py-3" style={{ fontSize: '12px' }}>
                    <span className="font-medium text-blue-600">{lead.id}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-gray-900" style={{ fontSize: '13px' }}>{lead.name}</p>
                      <p className="text-gray-600" style={{ fontSize: '12px' }}>{lead.company}</p>
                      <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span style={{ fontSize: '11px' }}>{lead.country}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-start gap-2">
                      {getSourceIcon(lead.source.platform)}
                      <div>
                        <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>
                          {lead.source.platform}
                        </p>
                        <p className="text-gray-500" style={{ fontSize: '11px' }}>
                          {lead.source.date}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3" style={{ fontSize: '12px' }}>
                    <Badge variant="outline" className="h-5 px-2 text-xs">
                      {lead.formData.interest}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3" style={{ fontSize: '12px' }}>
                    <span className="text-gray-700">{lead.formData.orderVolume || '-'}</span>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${getScoreColor(lead.qualityScore)}`} />
                      <span className={`font-medium ${getScoreColor(lead.qualityScore)}`} style={{ fontSize: '13px' }}>
                        {lead.qualityScore}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={`h-5 px-2 text-xs border ${getStatusConfig(lead.status).color}`}>
                      {getStatusConfig(lead.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    {lead.bgChecked ? (
                      <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        已背调
                      </Badge>
                    ) : (
                      <Badge className="h-5 px-2 text-xs bg-gray-100 text-gray-600 border-gray-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        未背调
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          详情
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle style={{ fontSize: '16px' }}>线索详情 - {selectedLead?.id}</DialogTitle>
                          <DialogDescription style={{ fontSize: '13px' }}>
                            审核线索信息并决定流转方向
                          </DialogDescription>
                        </DialogHeader>
                        {selectedLead && (
                          <div className="space-y-4">
                            {/* 状态标签 */}
                            <div className="flex items-center gap-2">
                              <Badge className={`h-6 px-3 text-xs border ${getStatusConfig(selectedLead.status).color}`}>
                                {getStatusConfig(selectedLead.status).label}
                              </Badge>
                              <div className="flex items-center gap-1.5">
                                <Star className={`w-4 h-4 ${getScoreColor(selectedLead.qualityScore)}`} />
                                <span className={`font-medium ${getScoreColor(selectedLead.qualityScore)}`} style={{ fontSize: '13px' }}>
                                  质量分: {selectedLead.qualityScore}
                                </span>
                              </div>
                            </div>

                            {/* 客户基本信息 */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px' }}>
                                客户基本信息
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">客户姓名</p>
                                  <p className="text-sm font-medium">{selectedLead.name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">公司名称</p>
                                  <p className="text-sm font-medium">{selectedLead.company}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">国家地区</p>
                                  <p className="text-sm">{selectedLead.country}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">电子邮箱</p>
                                  <p className="text-sm">{selectedLead.email}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">联系电话</p>
                                  <p className="text-sm">{selectedLead.phone}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">提交时间</p>
                                  <p className="text-sm">{selectedLead.createdAt}</p>
                                </div>
                              </div>
                            </div>

                            {/* 来源追踪 */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px' }}>
                                <Globe className="w-4 h-4" />
                                来源追踪
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-blue-700 mb-1">来源平台</p>
                                  <div className="flex items-center gap-2">
                                    {getSourceIcon(selectedLead.source.platform)}
                                    <p className="text-sm font-medium text-blue-900">{selectedLead.source.platform}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-blue-700 mb-1">广告活动</p>
                                  <p className="text-sm font-medium text-blue-900">{selectedLead.source.campaignId}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-blue-700 mb-1">广告名称</p>
                                  <p className="text-sm font-medium text-blue-900">{selectedLead.source.adName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-blue-700 mb-1">UTM参数</p>
                                  <p className="text-xs text-blue-700 font-mono">{selectedLead.source.utmParams}</p>
                                </div>
                              </div>
                            </div>

                            {/* 需求信息 */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <h4 className="font-semibold text-green-900 mb-3" style={{ fontSize: '14px' }}>
                                需求信息
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-green-700 mb-1">意向产品</p>
                                  <p className="text-sm font-medium text-green-900">{selectedLead.formData.interest}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-green-700 mb-1">订单规模</p>
                                  <p className="text-sm font-medium text-green-900">{selectedLead.formData.orderVolume}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-green-700 mb-1">采购频次</p>
                                  <p className="text-sm font-medium text-green-900">{selectedLead.formData.budget}</p>
                                </div>
                                <div className="col-span-3">
                                  <p className="text-xs text-green-700 mb-1">留言内容</p>
                                  <p className="text-sm text-green-900">{selectedLead.formData.message}</p>
                                </div>
                              </div>
                            </div>

                            {/* AI背调数据 */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-purple-900 flex items-center gap-2" style={{ fontSize: '14px' }}>
                                  <Sparkles className="w-4 h-4" />
                                  AI智能背调
                                </h4>
                                {!selectedLead.bgChecked && (
                                  <Button
                                    size="sm"
                                    className="h-7 bg-purple-600 hover:bg-purple-700 text-xs"
                                    onClick={() => handleBackgroundCheck(selectedLead)}
                                    disabled={isCheckingBg}
                                  >
                                    {isCheckingBg ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                        调查中...
                                      </>
                                    ) : (
                                      <>
                                        <FileSearch className="w-3 h-3 mr-1" />
                                        一键背调
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                              {selectedLead.bgChecked && selectedLead.bgData ? (
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">公司规模</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.companySize}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">所属行业</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.industry}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">成立时间</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.founded}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">员工人数</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.employees}人</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">年营收规模</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.annualRevenue}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">业务类型</p>
                                    <p className="text-sm font-medium text-purple-900">{selectedLead.bgData.businessType}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">官网</p>
                                    <a href={`https://${selectedLead.bgData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-purple-600 hover:underline flex items-center gap-1">
                                      {selectedLead.bgData.website}
                                      <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div>
                                    <p className="text-xs text-purple-700 mb-1">信用评分</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-purple-200 rounded-full h-2">
                                        <div 
                                          className="bg-purple-600 rounded-full h-2" 
                                          style={{ width: `${selectedLead.bgData.creditScore}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-purple-900">{selectedLead.bgData.creditScore}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-6 text-purple-600">
                                  <FileSearch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">点击"一键背调"开始AI智能调查</p>
                                </div>
                              )}
                            </div>

                            {/* 操作按钮 */}
                            {selectedLead.status === 'pending' && (
                              <div className="flex gap-3 pt-2">
                                <Button 
                                  className="flex-1 h-9 bg-gray-600 hover:bg-gray-700 text-xs"
                                  onClick={() => handleMoveToPool(selectedLead.id)}
                                >
                                  <Package className="w-3.5 h-3.5 mr-1.5" />
                                  转入公海
                                </Button>
                                <Button 
                                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-xs"
                                  onClick={() => handleAssignToSales(selectedLead.id)}
                                >
                                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                  分配业务员
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="flex-1 h-9 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                  onClick={() => handleRejectLead(selectedLead.id)}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                  拒绝线索
                                </Button>
                              </div>
                            )}
                            {selectedLead.status !== 'pending' && (
                              <div className="flex gap-3 pt-2">
                                <Button className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-xs">
                                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                                  发送邮件
                                </Button>
                                <Button variant="outline" className="flex-1 h-9 text-xs">
                                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                  添加备注
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500" style={{ fontSize: '13px' }}>暂无线索数据</p>
          </div>
        )}
      </div>
    </div>
  );
}