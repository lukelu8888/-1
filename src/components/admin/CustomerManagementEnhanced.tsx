import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, Filter, Mail, Phone, MapPin, Calendar, DollarSign, Package, 
  Users, Eye, TrendingUp, Star, Clock, ArrowRight, Building2, 
  Globe, Briefcase, UserPlus, RotateCcw, Award, CheckCircle2,
  Sparkles, FileSearch, Instagram, Facebook, Linkedin, Youtube,
  ArrowUpRight, User, ChevronRight, Activity, AlertCircle, Crown,
  Download, Upload, RefreshCw, MessageSquare, Settings, BarChart3
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner@2.0.3';

// 客户数据类型
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  region?: string; // 🌍 客户所属区域 (NA / SA / EA)
  type: string;
  status: 'pool' | 'prospect' | 'customer' | 'vip';
  joined: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrder?: string;
  source: {
    type: 'social' | 'organic' | 'referral' | 'direct' | 'exhibition' | 'website';
    platform?: string;
    date: string;
    campaignId?: string;
  };
  businessTypes?: ('trading' | 'inspection' | 'agency' | 'project')[]; // 🔥 新增：业务类型
  assignedTo?: string;
  assignedDate?: string;
  expiryDate?: string;
  bgChecked: boolean;
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
  followUpCount: number;
  lastContact?: string;
}

export default function CustomerManagementEnhanced() {
  const [activeTab, setActiveTab] = useState<'pool' | 'prospect' | 'customer' | 'vip'>('pool');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterBusinessType, setFilterBusinessType] = useState('all'); // 🔥 新增：业务类型筛选
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCheckingBg, setIsCheckingBg] = useState(false);

  // 模拟客户数据
  const customers: Customer[] = [
    // 公海客户
    {
      id: 'POOL-001',
      name: 'Global Hardware Supplies',
      email: 'info@globalhw.com',
      phone: '+1-555-0101',
      country: 'United States',
      type: 'Retailer',
      status: 'pool',
      joined: '2025-11-15',
      totalOrders: 0,
      totalRevenue: 0,
      source: {
        type: 'social',
        platform: 'LinkedIn',
        date: '2025-11-15',
        campaignId: 'LI-2025-11-B2B'
      },
      bgChecked: false,
      followUpCount: 0
    },
    {
      id: 'POOL-002',
      name: 'BuildMaster Inc.',
      email: 'contact@buildmaster.com',
      phone: '+44-20-1234-5678',
      country: 'United Kingdom',
      type: 'Wholesaler',
      status: 'pool',
      joined: '2025-11-16',
      totalOrders: 0,
      totalRevenue: 0,
      source: {
        type: 'social',
        platform: 'Facebook',
        date: '2025-11-16',
        campaignId: 'FB-2025-11-EU'
      },
      bgChecked: false,
      followUpCount: 0
    },
    {
      id: 'POOL-003',
      name: 'Pacific Trade Solutions',
      email: 'sales@pacifictrade.com',
      phone: '+61-2-9876-5432',
      country: 'Australia',
      type: 'Importer',
      status: 'pool',
      joined: '2025-11-17',
      totalOrders: 0,
      totalRevenue: 0,
      source: {
        type: 'social',
        platform: 'Instagram',
        date: '2025-11-17',
        campaignId: 'IG-2025-11-APAC'
      },
      bgChecked: true,
      bgData: {
        companySize: 'Medium (50-200)',
        industry: 'Building Materials Distribution',
        founded: '2018',
        website: 'www.pacifictrade.com',
        employees: '85',
        annualRevenue: '$15M - $25M',
        businessType: 'Importer & Distributor',
        creditScore: 78
      },
      followUpCount: 0
    },
    // 意向客户
    {
      id: 'PROS-001',
      name: 'HomeStyle Warehouse',
      email: 'procurement@homestyle.com',
      phone: '+1-555-0202',
      country: 'Canada',
      type: 'Wholesaler',
      status: 'prospect',
      joined: '2025-10-25',
      totalOrders: 0,
      totalRevenue: 0,
      source: {
        type: 'social',
        platform: 'LinkedIn',
        date: '2025-10-25',
        campaignId: 'LI-2025-10-NAM'
      },
      assignedTo: 'Sarah Chen',
      assignedDate: '2025-10-26',
      expiryDate: '2025-11-26',
      bgChecked: true,
      bgData: {
        companySize: 'Large (200+)',
        industry: 'Home Improvement Retail',
        founded: '2010',
        website: 'www.homestyle.ca',
        employees: '320',
        annualRevenue: '$50M+',
        businessType: 'Retail Chain',
        creditScore: 85
      },
      followUpCount: 5,
      lastContact: '2025-11-17'
    },
    {
      id: 'PROS-002',
      name: 'Industrial Supply Co.',
      email: 'buyers@indsupply.com',
      phone: '+49-30-1234-5678',
      country: 'Germany',
      type: 'Project Contractor',
      status: 'prospect',
      joined: '2025-11-01',
      totalOrders: 0,
      totalRevenue: 0,
      source: {
        type: 'social',
        platform: 'Facebook',
        date: '2025-11-01',
        campaignId: 'FB-2025-11-EU'
      },
      assignedTo: 'Michael Zhang',
      assignedDate: '2025-11-02',
      expiryDate: '2025-12-02',
      bgChecked: true,
      bgData: {
        companySize: 'Medium (50-200)',
        industry: 'Industrial Construction',
        founded: '2015',
        website: 'www.indsupply.de',
        employees: '125',
        annualRevenue: '$20M - $30M',
        businessType: 'Contractor',
        creditScore: 72
      },
      followUpCount: 3,
      lastContact: '2025-11-16'
    },
    // 成交客户
    {
      id: 'CUST-001',
      name: 'ABC Trading Ltd.',
      email: 'contact@abctrading.com',
      phone: '+1-555-0303',
      country: 'United States',
      type: 'Retailer',
      status: 'customer',
      joined: '2023-05-15',
      totalOrders: 45,
      totalRevenue: 285400,
      lastOrder: '2025-10-20',
      source: {
        type: 'social',
        platform: 'LinkedIn',
        date: '2023-05-10',
        campaignId: 'LI-2023-05-NAM'
      },
      businessTypes: ['trading', 'inspection'], // 🔥 新增：业务类型
      assignedTo: 'Sarah Chen',
      assignedDate: '2023-05-11',
      bgChecked: true,
      bgData: {
        companySize: 'Medium (50-200)',
        industry: 'Building Materials Retail',
        founded: '2008',
        website: 'www.abctrading.com',
        employees: '150',
        annualRevenue: '$30M - $40M',
        businessType: 'Retailer',
        creditScore: 82
      },
      followUpCount: 67,
      lastContact: '2025-11-15'
    },
    {
      id: 'CUST-002',
      name: 'Elite Supplies',
      email: 'orders@elitesupplies.com',
      phone: '+44-20-7123-4567',
      country: 'United Kingdom',
      type: 'Importer',
      status: 'customer',
      joined: '2024-01-12',
      totalOrders: 28,
      totalRevenue: 154800,
      lastOrder: '2025-10-12',
      source: {
        type: 'organic',
        date: '2024-01-10'
      },
      businessTypes: ['trading'], // 🔥 新增：业务类型
      assignedTo: 'Michael Zhang',
      assignedDate: '2024-01-12',
      bgChecked: true,
      bgData: {
        companySize: 'Small (10-50)',
        industry: 'Import & Distribution',
        founded: '2020',
        website: 'www.elitesupplies.co.uk',
        employees: '35',
        annualRevenue: '$10M - $15M',
        businessType: 'Importer',
        creditScore: 76
      },
      followUpCount: 42,
      lastContact: '2025-11-10'
    },
    // VIP客户
    {
      id: 'VIP-001',
      name: 'MegaBuild Corporation',
      email: 'vip@megabuild.com',
      phone: '+1-555-0404',
      country: 'United States',
      type: 'Wholesaler',
      status: 'vip',
      joined: '2022-03-20',
      totalOrders: 156,
      totalRevenue: 1850000,
      lastOrder: '2025-11-16',
      source: {
        type: 'referral',
        date: '2022-03-15'
      },
      businessTypes: ['trading', 'project'], // 🔥 新增：业务类型
      assignedTo: 'Sarah Chen',
      assignedDate: '2022-03-20',
      bgChecked: true,
      bgData: {
        companySize: 'Enterprise (500+)',
        industry: 'Construction Supply Chain',
        founded: '1995',
        website: 'www.megabuild.com',
        employees: '1200',
        annualRevenue: '$200M+',
        businessType: 'National Distributor',
        creditScore: 95
      },
      followUpCount: 234,
      lastContact: '2025-11-18'
    },
    {
      id: 'VIP-002',
      name: 'Premium Hardware Group',
      email: 'executives@premiumhw.com',
      phone: '+65-6123-4567',
      country: 'Singapore',
      type: 'Importer',
      status: 'vip',
      joined: '2021-08-10',
      totalOrders: 98,
      totalRevenue: 980000,
      lastOrder: '2025-11-15',
      source: {
        type: 'social',
        platform: 'LinkedIn',
        date: '2021-08-05',
        campaignId: 'LI-2021-08-APAC'
      },
      businessTypes: ['trading', 'agency', 'inspection'], // 🔥 新增：业务类型
      assignedTo: 'Michael Zhang',
      assignedDate: '2021-08-10',
      bgChecked: true,
      bgData: {
        companySize: 'Large (200+)',
        industry: 'Premium Building Materials',
        founded: '2005',
        website: 'www.premiumhw.sg',
        employees: '450',
        annualRevenue: '$80M - $100M',
        businessType: 'Regional Distributor',
        creditScore: 92
      },
      followUpCount: 178,
      lastContact: '2025-11-17'
    },
  ];

  // 获取筛选后的客户
  const getFilteredCustomers = () => {
    return customers.filter((customer) => {
      const matchesTab = customer.status === activeTab;
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = filterSource === 'all' || 
        (customer.source.type === 'social' && customer.source.platform === filterSource) ||
        (customer.source.type === filterSource);
      const matchesBusinessType = filterBusinessType === 'all' || 
        (customer.businessTypes && customer.businessTypes.includes(filterBusinessType as any));
      return matchesTab && matchesSearch && matchesSource && matchesBusinessType;
    });
  };

  const filteredCustomers = getFilteredCustomers();

  // 统计数据
  const stats = {
    pool: customers.filter(c => c.status === 'pool').length,
    prospect: customers.filter(c => c.status === 'prospect').length,
    customer: customers.filter(c => c.status === 'customer').length,
    vip: customers.filter(c => c.status === 'vip').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
    avgOrderValue: customers.filter(c => c.totalOrders > 0).length > 0 
      ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0)
      : 0
  };

  // 处理领取客户
  const handleClaimCustomer = (customerId: string) => {
    toast.success('客户领取成功！已分配给您，请在30天内转化为意向客户。');
  };

  // 处理背调
  const handleBackgroundCheck = async (customer: Customer) => {
    setIsCheckingBg(true);
    // 模拟AI背调过程
    setTimeout(() => {
      setIsCheckingBg(false);
      toast.success('客户背调完成！已更新详细信息。');
      setSelectedCustomer({
        ...customer,
        bgChecked: true,
        bgData: {
          companySize: 'Medium (50-200)',
          industry: 'Building Materials Distribution',
          founded: '2015',
          website: `www.${customer.name.toLowerCase().replace(/\s+/g, '')}.com`,
          employees: '120',
          annualRevenue: '$15M - $25M',
          businessType: 'Wholesaler',
          creditScore: 75
        }
      });
    }, 3000);
  };

  // 获取来源图标
  const getSourceIcon = (source: Customer['source']) => {
    if (source.type === 'social') {
      switch (source.platform) {
        case 'LinkedIn': return <Linkedin className="w-3 h-3" />;
        case 'Facebook': return <Facebook className="w-3 h-3" />;
        case 'Instagram': return <Instagram className="w-3 h-3" />;
        case 'YouTube': return <Youtube className="w-3 h-3" />;
        default: return <Globe className="w-3 h-3" />;
      }
    }
    return <Globe className="w-3 h-3" />;
  };

  // 获取状态配置
  const getStatusConfig = (status: Customer['status']) => {
    switch (status) {
      case 'pool':
        return { label: '公海客户', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Users };
      case 'prospect':
        return { label: '意向客户', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: TrendingUp };
      case 'customer':
        return { label: '成交客户', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 };
      case 'vip':
        return { label: 'VIP客户', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Crown };
    }
  };

  // 🔥 新增：获取业务类型配置
  const getBusinessTypeConfig = (type: 'trading' | 'inspection' | 'agency' | 'project') => {
    const configs = {
      trading: { label: '产品采购', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package },
      inspection: { label: '验货服务', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
      agency: { label: '代理服务', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Briefcase },
      project: { label: '一站式项目', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Activity }
    };
    return configs[type];
  };

  return (
    <div className="space-y-4">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                <Users className="w-4 h-4 text-gray-700" />
              </div>
              <span className="text-xs text-gray-600">公海客户</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pool}</p>
          <p className="text-xs text-gray-500 mt-1">待领取开发</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-700" />
              </div>
              <span className="text-xs text-blue-600">意向客户</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.prospect}</p>
          <p className="text-xs text-blue-600 mt-1">跟进培育中</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-700" />
              </div>
              <span className="text-xs text-green-600">成交客户</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.customer}</p>
          <p className="text-xs text-green-600 mt-1">持续合作中</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-200 flex items-center justify-center">
                <Crown className="w-4 h-4 text-amber-700" />
              </div>
              <span className="text-xs text-amber-600">VIP客户</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900">{stats.vip}</p>
          <p className="text-xs text-amber-600 mt-1">核心大客户</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-200 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-700" />
              </div>
              <span className="text-xs text-emerald-600">总营收</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-900">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-xs text-emerald-600 mt-1">累计交易额</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-200 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-700" />
              </div>
              <span className="text-xs text-purple-600">平均客单</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-900">${(stats.avgOrderValue / 1000).toFixed(1)}K</p>
          <p className="text-xs text-purple-600 mt-1">每单均值</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* 标题栏 */}
        <div className="border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>客户管理系统</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                导出数据
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                设置
              </Button>
            </div>
          </div>
        </div>

        {/* 标签页切换 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="border-b border-gray-200 px-5">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger 
                value="pool" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:bg-transparent rounded-none px-0 pb-3 pt-3 text-xs"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" />
                公海客户 ({stats.pool})
              </TabsTrigger>
              <TabsTrigger 
                value="prospect" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 rounded-none px-0 pb-3 pt-3 text-xs"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                意向客户 ({stats.prospect})
              </TabsTrigger>
              <TabsTrigger 
                value="customer" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:text-green-600 rounded-none px-0 pb-3 pt-3 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                成交客户 ({stats.customer})
              </TabsTrigger>
              <TabsTrigger 
                value="vip" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:text-amber-600 rounded-none px-0 pb-3 pt-3 text-xs"
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" />
                VIP客户 ({stats.vip})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 搜索和筛选 */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索客户名称、邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '12px' }}>全部来源</SelectItem>
                  <SelectItem value="LinkedIn" style={{ fontSize: '12px' }}>LinkedIn</SelectItem>
                  <SelectItem value="Facebook" style={{ fontSize: '12px' }}>Facebook</SelectItem>
                  <SelectItem value="Instagram" style={{ fontSize: '12px' }}>Instagram</SelectItem>
                  <SelectItem value="YouTube" style={{ fontSize: '12px' }}>YouTube</SelectItem>
                  <SelectItem value="organic" style={{ fontSize: '12px' }}>自然搜索</SelectItem>
                  <SelectItem value="referral" style={{ fontSize: '12px' }}>推荐转介</SelectItem>
                  <SelectItem value="direct" style={{ fontSize: '12px' }}>直接访问</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '12px' }}>全部业务类型</SelectItem>
                  <SelectItem value="trading" style={{ fontSize: '12px' }}>贸易</SelectItem>
                  <SelectItem value="inspection" style={{ fontSize: '12px' }}>检验</SelectItem>
                  <SelectItem value="agency" style={{ fontSize: '12px' }}>代理</SelectItem>
                  <SelectItem value="project" style={{ fontSize: '12px' }}>项目</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 表格内容 */}
          <TabsContent value={activeTab} className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-9" style={{ fontSize: '12px' }}>客户编号</TableHead>
                    <TableHead className="h-9" style={{ fontSize: '12px' }}>公司名称</TableHead>
                    <TableHead className="h-9" style={{ fontSize: '12px' }}>联系方式</TableHead>
                    <TableHead className="h-9" style={{ fontSize: '12px' }}>来源</TableHead>
                    {activeTab !== 'pool' && (
                      <TableHead className="h-9" style={{ fontSize: '12px' }}>业务员</TableHead>
                    )}
                    {activeTab === 'prospect' && (
                      <TableHead className="h-9" style={{ fontSize: '12px' }}>到期时间</TableHead>
                    )}
                    {(activeTab === 'customer' || activeTab === 'vip') && (
                      <>
                        <TableHead className="h-9 text-right" style={{ fontSize: '12px' }}>订单数</TableHead>
                        <TableHead className="h-9 text-right" style={{ fontSize: '12px' }}>营收</TableHead>
                      </>
                    )}
                    <TableHead className="h-9" style={{ fontSize: '12px' }}>背调</TableHead>
                    <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="font-medium text-blue-600">{customer.id}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-medium text-gray-900" style={{ fontSize: '13px' }}>{customer.name}</p>
                            <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span style={{ fontSize: '11px' }}>{customer.country}</span>
                            </div>
                            {/* 🔥 新增：业务类型标签 */}
                            {customer.businessTypes && customer.businessTypes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {customer.businessTypes.map((bt) => (
                                  <Badge 
                                    key={bt} 
                                    className={`h-4 px-1.5 text-[10px] border ${getBusinessTypeConfig(bt).color}`}
                                  >
                                    {getBusinessTypeConfig(bt).label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span style={{ fontSize: '11px' }}>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span style={{ fontSize: '11px' }}>{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-start gap-1.5">
                          <div className="mt-0.5">
                            {getSourceIcon(customer.source)}
                          </div>
                          <div>
                            {customer.source.type === 'social' && customer.source.platform && (
                              <p className="font-medium text-gray-900" style={{ fontSize: '12px' }}>
                                {customer.source.platform}
                              </p>
                            )}
                            <p className="text-gray-500" style={{ fontSize: '11px' }}>
                              {customer.source.date}
                            </p>
                            {customer.source.campaignId && (
                              <p className="text-gray-400" style={{ fontSize: '10px' }}>
                                {customer.source.campaignId}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      {activeTab !== 'pool' && (
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700" style={{ fontSize: '12px' }}>
                              {customer.assignedTo}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {activeTab === 'prospect' && customer.expiryDate && (
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-orange-500" />
                            <span className="text-orange-600" style={{ fontSize: '12px' }}>
                              {customer.expiryDate}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {(activeTab === 'customer' || activeTab === 'vip') && (
                        <>
                          <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                            <span className="font-medium text-gray-900">{customer.totalOrders}</span>
                          </TableCell>
                          <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                            <span className="font-medium text-gray-900">
                              ${(customer.totalRevenue / 1000).toFixed(1)}K
                            </span>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="py-3">
                        {customer.bgChecked ? (
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
                        <div className="flex items-center justify-center gap-2">
                          {activeTab === 'pool' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleClaimCustomer(customer.id)}
                            >
                              <UserPlus className="w-3 h-3 mr-1" />
                              领取
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle style={{ fontSize: '16px' }}>客户详情</DialogTitle>
                                <DialogDescription style={{ fontSize: '13px' }}>
                                  查看完整的客户信息、背调数据和历史记录
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCustomer && (
                                <div className="space-y-4">
                                  {/* 客户状态标签 */}
                                  <div className="flex items-center gap-2">
                                    <Badge className={`h-6 px-3 text-xs border ${getStatusConfig(selectedCustomer.status).color}`}>
                                      {getStatusConfig(selectedCustomer.status).label}
                                    </Badge>
                                    {selectedCustomer.bgChecked ? (
                                      <Badge className="h-6 px-3 text-xs bg-green-100 text-green-700 border-green-300">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        已完成背调
                                      </Badge>
                                    ) : (
                                      <Badge className="h-6 px-3 text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        待背调
                                      </Badge>
                                    )}
                                  </div>

                                  {/* 基本信息 */}
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px' }}>
                                      基本信息
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">客户编号</p>
                                        <p className="text-sm font-medium text-blue-600">{selectedCustomer.id}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">公司名称</p>
                                        <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">国家地区</p>
                                        <p className="text-sm">{selectedCustomer.country}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">电子邮箱</p>
                                        <p className="text-sm">{selectedCustomer.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">联系电话</p>
                                        <p className="text-sm">{selectedCustomer.phone}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">客户类型</p>
                                        <Badge variant="outline" className="h-5 px-2 text-xs">{selectedCustomer.type}</Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 来源追踪 */}
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2" style={{ fontSize: '14px' }}>
                                      <Activity className="w-4 h-4" />
                                      来源追踪
                                    </h4>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-xs text-blue-700 mb-1">来源渠道</p>
                                        <div className="flex items-center gap-2">
                                          {getSourceIcon(selectedCustomer.source)}
                                          <p className="text-sm font-medium text-blue-900">
                                            {selectedCustomer.source.type === 'social' && selectedCustomer.source.platform 
                                              ? selectedCustomer.source.platform 
                                              : selectedCustomer.source.type}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-xs text-blue-700 mb-1">注册时间</p>
                                        <p className="text-sm font-medium text-blue-900">{selectedCustomer.source.date}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-blue-700 mb-1">活动ID</p>
                                        <p className="text-sm font-medium text-blue-900">
                                          {selectedCustomer.source.campaignId || '无'}
                                        </p>
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
                                      {!selectedCustomer.bgChecked && (
                                        <Button
                                          size="sm"
                                          className="h-7 bg-purple-600 hover:bg-purple-700 text-xs"
                                          onClick={() => handleBackgroundCheck(selectedCustomer)}
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
                                    {selectedCustomer.bgChecked && selectedCustomer.bgData ? (
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">公司规模</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.companySize}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">所属行业</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.industry}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">成立时间</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.founded}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">员工人数</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.employees}人</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">年营收规模</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.annualRevenue}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">业务类型</p>
                                          <p className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.businessType}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">官网</p>
                                          <a href={`https://${selectedCustomer.bgData.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-purple-600 hover:underline flex items-center gap-1">
                                            {selectedCustomer.bgData.website}
                                            <ArrowUpRight className="w-3 h-3" />
                                          </a>
                                        </div>
                                        <div>
                                          <p className="text-xs text-purple-700 mb-1">信用评分</p>
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-purple-200 rounded-full h-2">
                                              <div 
                                                className="bg-purple-600 rounded-full h-2" 
                                                style={{ width: `${selectedCustomer.bgData.creditScore}%` }}
                                              />
                                            </div>
                                            <span className="text-sm font-medium text-purple-900">{selectedCustomer.bgData.creditScore}</span>
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

                                  {/* 业务统计 */}
                                  {selectedCustomer.status !== 'pool' && (
                                    <div className="grid grid-cols-4 gap-3">
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Calendar className="w-4 h-4 text-blue-600" />
                                          <p className="text-xs text-blue-900">分配时间</p>
                                        </div>
                                        <p className="text-sm font-medium text-blue-900">{selectedCustomer.assignedDate}</p>
                                      </div>
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <MessageSquare className="w-4 h-4 text-green-600" />
                                          <p className="text-xs text-green-900">跟进次数</p>
                                        </div>
                                        <p className="text-xl font-bold text-green-900">{selectedCustomer.followUpCount}</p>
                                      </div>
                                      {(selectedCustomer.status === 'customer' || selectedCustomer.status === 'vip') && (
                                        <>
                                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                              <Package className="w-4 h-4 text-emerald-600" />
                                              <p className="text-xs text-emerald-900">总订单数</p>
                                            </div>
                                            <p className="text-xl font-bold text-emerald-900">{selectedCustomer.totalOrders}</p>
                                          </div>
                                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                              <DollarSign className="w-4 h-4 text-amber-600" />
                                              <p className="text-xs text-amber-900">总营收</p>
                                            </div>
                                            <p className="text-xl font-bold text-amber-900">${(selectedCustomer.totalRevenue / 1000).toFixed(0)}K</p>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* 操作按钮 */}
                                  <div className="flex gap-3 pt-2">
                                    <Button className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-xs">
                                      <Mail className="w-3.5 h-3.5 mr-1.5" />
                                      发送邮件
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-9 text-xs">
                                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                      添加跟进
                                    </Button>
                                    {selectedCustomer.status === 'customer' || selectedCustomer.status === 'vip' ? (
                                      <Button variant="outline" className="flex-1 h-9 text-xs">
                                        <Package className="w-3.5 h-3.5 mr-1.5" />
                                        查看订单
                                      </Button>
                                    ) : (
                                      <Button variant="outline" className="flex-1 h-9 text-xs">
                                        <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                                        推进转化
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500" style={{ fontSize: '13px' }}>暂无客户数据</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}