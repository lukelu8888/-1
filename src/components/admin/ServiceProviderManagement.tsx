import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Truck, Star, DollarSign, TrendingUp, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Plus, Eye, Phone, Mail,
  MapPin, FileText, Calendar, Award, Target, Activity, Download,
  Send, Edit, BarChart3, Package, Ship, FileCheck, Shield,
  Anchor, Home, AlertTriangle, Zap
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';

// 服务商类型枚举
export enum ServiceProviderType {
  FREIGHT_FORWARDER = 'forwarder',      // 货代公司
  TRUCKING = 'trucking',                // 拖车/集卡公司
  WAREHOUSE = 'warehouse',              // 仓储公司
  CUSTOMS_BROKER = 'customs',           // 报关行
  INSPECTION = 'inspection',            // 验货公司/商检
  QC_AGENCY = 'qc',                    // 质检机构
  INSURANCE = 'insurance',              // 保险公司
  CERTIFICATION = 'certification',      // 认证机构
  TRANSLATION = 'translation',          // 翻译公司
}

// 服务商接口
export interface ServiceProvider {
  id: string;
  name: string;
  code: string;
  nameEn: string;
  type: ServiceProviderType;
  level: 'A' | 'B' | 'C';
  contact: string;
  phone: string;
  email: string;
  address: string;
  businessLicense: string;
  certifications: string[];
  cooperationYears: number;
  totalServices: number;
  totalAmount: number;
  onTimeRate: number;
  satisfactionRate: number;
  status: 'active' | 'inactive' | 'suspended';
  serviceScope: string[];
  pricingModel: string;
}

// 服务订单接口
interface ServiceOrder {
  id: string;
  orderNumber: string;
  providerName: string;
  serviceType: string;
  shipmentNumber?: string;
  customerName: string;
  serviceDescription: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  orderDate: string;
  expectedDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

// 服务商付款接口
interface ServicePayment {
  id: string;
  paymentNumber: string;
  providerName: string;
  serviceOrderNumber: string;
  type: 'deposit' | 'balance' | 'full';
  amount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod: 'T/T' | 'Cash' | 'Check';
}

// 服务商绩效接口
interface ServiceProviderPerformance {
  providerName: string;
  totalServices: number;
  completedServices: number;
  onTimeServices: number;
  onTimeRate: number;
  satisfactionRate: number;
  avgCompletionDays: number;
  totalAmount: number;
  rating: number;
}

// 模拟数据
const mockServiceProviders: ServiceProvider[] = [
  {
    id: 'SP001',
    name: 'DHL全球货代',
    code: 'DHL-GF-001',
    nameEn: 'DHL Global Forwarding',
    type: ServiceProviderType.FREIGHT_FORWARDER,
    level: 'A',
    contact: '张经理',
    phone: '+86-755-8888-8888',
    email: 'zhang@dhl.com',
    address: '深圳市南山区科技园',
    businessLicense: '91440300MA5XXXXX',
    certifications: ['NVOCC', 'IATA', 'WCA'],
    cooperationYears: 5,
    totalServices: 156,
    totalAmount: 458000,
    onTimeRate: 96.5,
    satisfactionRate: 94.8,
    status: 'active',
    serviceScope: ['海运', '空运', '铁路运输'],
    pricingModel: '按立方米/重量计费'
  },
  {
    id: 'SP002',
    name: '顺丰拖车物流',
    code: 'SF-TRUCK-002',
    nameEn: 'SF Trucking Logistics',
    type: ServiceProviderType.TRUCKING,
    level: 'A',
    contact: '李师傅',
    phone: '+86-755-6666-6666',
    email: 'li@sf-truck.com',
    address: '深圳市宝安区物流园',
    businessLicense: '91440300MA5YYYYY',
    certifications: ['道路运输许可证'],
    cooperationYears: 3,
    totalServices: 234,
    totalAmount: 128000,
    onTimeRate: 98.2,
    satisfactionRate: 96.5,
    status: 'active',
    serviceScope: ['集卡拖车', '散货运输', '特种柜运输'],
    pricingModel: '按次计费'
  },
  {
    id: 'SP003',
    name: '中港报关有限公司',
    code: 'ZG-CUSTOMS-003',
    nameEn: 'ZG Customs Broker Ltd.',
    type: ServiceProviderType.CUSTOMS_BROKER,
    level: 'B',
    contact: '王报关',
    phone: '+86-755-7777-7777',
    email: 'wang@zgcustoms.com',
    address: '深圳市福田区口岸大厦',
    businessLicense: '91440300MA5ZZZZZ',
    certifications: ['报关企业注册登记证书'],
    cooperationYears: 4,
    totalServices: 189,
    totalAmount: 94500,
    onTimeRate: 92.8,
    satisfactionRate: 91.2,
    status: 'active',
    serviceScope: ['一般贸易报关', '快件报关', 'ATA报关'],
    pricingModel: '按票计费'
  },
  {
    id: 'SP004',
    name: 'SGS通标检验',
    code: 'SGS-QC-004',
    nameEn: 'SGS Inspection',
    type: ServiceProviderType.INSPECTION,
    level: 'A',
    contact: '陈工程师',
    phone: '+86-755-9999-9999',
    email: 'chen@sgs.com',
    address: '深圳市罗湖区测试中心',
    businessLicense: '91440300MA5WWWWW',
    certifications: ['CNAS', 'ISO17025', 'ILAC-MRA'],
    cooperationYears: 6,
    totalServices: 312,
    totalAmount: 187200,
    onTimeRate: 95.8,
    satisfactionRate: 97.3,
    status: 'active',
    serviceScope: ['产品验货', '工厂审核', '实验室测试'],
    pricingModel: '按人天+费用计费'
  },
  {
    id: 'SP005',
    name: '盐田国际集装箱码头',
    code: 'YT-WH-005',
    nameEn: 'Yantian International Container Terminal',
    type: ServiceProviderType.WAREHOUSE,
    level: 'B',
    contact: '赵主管',
    phone: '+86-755-5555-5555',
    email: 'zhao@yict.com',
    address: '深圳市盐田区盐田港',
    businessLicense: '91440300MA5VVVVV',
    certifications: ['保税仓许可证'],
    cooperationYears: 2,
    totalServices: 78,
    totalAmount: 52000,
    onTimeRate: 94.3,
    satisfactionRate: 92.8,
    status: 'active',
    serviceScope: ['保税仓储', '一般仓储', '冷链仓储'],
    pricingModel: '按面积/天计费'
  }
];

const mockServiceOrders: ServiceOrder[] = [
  {
    id: 'SO001',
    orderNumber: 'SO-NA-250115-0001',
    providerName: 'DHL全球货代',
    serviceType: '海运订舱',
    shipmentNumber: 'SH-NA-250115-0001',
    customerName: 'ABC Trading Inc.',
    serviceDescription: '2x40HQ 深圳-洛杉矶',
    amount: 3500,
    currency: 'USD',
    orderDate: '2025-01-15',
    expectedDate: '2025-02-20',
    status: 'in_progress',
    paymentStatus: 'paid'
  },
  {
    id: 'SO002',
    orderNumber: 'SO-NA-250118-0002',
    providerName: '顺丰拖车物流',
    serviceType: '集卡拖车',
    shipmentNumber: 'SH-NA-250115-0001',
    customerName: 'ABC Trading Inc.',
    serviceDescription: '工厂-盐田港 2x40HQ',
    amount: 800,
    currency: 'CNY',
    orderDate: '2025-01-18',
    expectedDate: '2025-01-20',
    completedDate: '2025-01-20',
    status: 'completed',
    paymentStatus: 'paid'
  },
  {
    id: 'SO003',
    orderNumber: 'SO-NA-250120-0003',
    providerName: '中港报关有限公司',
    serviceType: '出口报关',
    shipmentNumber: 'SH-NA-250115-0001',
    customerName: 'ABC Trading Inc.',
    serviceDescription: '一般贸易报关',
    amount: 500,
    currency: 'CNY',
    orderDate: '2025-01-20',
    expectedDate: '2025-01-21',
    completedDate: '2025-01-21',
    status: 'completed',
    paymentStatus: 'paid'
  }
];

const serviceTypeLabels = {
  [ServiceProviderType.FREIGHT_FORWARDER]: '货代公司',
  [ServiceProviderType.TRUCKING]: '拖车公司',
  [ServiceProviderType.WAREHOUSE]: '仓储公司',
  [ServiceProviderType.CUSTOMS_BROKER]: '报关行',
  [ServiceProviderType.INSPECTION]: '验货公司',
  [ServiceProviderType.QC_AGENCY]: '质检机构',
  [ServiceProviderType.INSURANCE]: '保险公司',
  [ServiceProviderType.CERTIFICATION]: '认证机构',
  [ServiceProviderType.TRANSLATION]: '翻译公司',
};

const serviceTypeIcons = {
  [ServiceProviderType.FREIGHT_FORWARDER]: Ship,
  [ServiceProviderType.TRUCKING]: Truck,
  [ServiceProviderType.WAREHOUSE]: Home,
  [ServiceProviderType.CUSTOMS_BROKER]: FileCheck,
  [ServiceProviderType.INSPECTION]: Shield,
  [ServiceProviderType.QC_AGENCY]: CheckCircle2,
  [ServiceProviderType.INSURANCE]: Award,
  [ServiceProviderType.CERTIFICATION]: FileText,
  [ServiceProviderType.TRANSLATION]: FileText,
};

export default function ServiceProviderManagement() {
  const [activeTab, setActiveTab] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

  // 筛选服务商
  const filteredProviders = mockServiceProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || provider.type === filterType;
    const matchesLevel = filterLevel === 'all' || provider.level === filterLevel;
    return matchesSearch && matchesType && matchesLevel;
  });

  // 统计数据
  const stats = {
    total: mockServiceProviders.length,
    active: mockServiceProviders.filter(p => p.status === 'active').length,
    forwarders: mockServiceProviders.filter(p => p.type === ServiceProviderType.FREIGHT_FORWARDER).length,
    trucking: mockServiceProviders.filter(p => p.type === ServiceProviderType.TRUCKING).length,
    customs: mockServiceProviders.filter(p => p.type === ServiceProviderType.CUSTOMS_BROKER).length,
    inspection: mockServiceProviders.filter(p => p.type === ServiceProviderType.INSPECTION).length,
    totalAmount: mockServiceProviders.reduce((sum, p) => sum + p.totalAmount, 0),
    avgSatisfaction: mockServiceProviders.reduce((sum, p) => sum + p.satisfactionRate, 0) / mockServiceProviders.length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">服务商管理</h1>
          <p className="text-sm text-gray-500">
            管理物流、报关、验货等服务提供商
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#F96302] hover:bg-[#E55A02]">
              <Plus className="w-4 h-4 mr-2" />
              添加服务商
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加新服务商</DialogTitle>
              <DialogDescription>填写服务商基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>服务商名称（中文）*</Label>
                <Input placeholder="例如：DHL全球货代" className="mt-1" />
              </div>
              <div>
                <Label>服务商名称（英文）</Label>
                <Input placeholder="例如：DHL Global Forwarding" className="mt-1" />
              </div>
              <div>
                <Label>服务商编号*</Label>
                <Input placeholder="例如：DHL-GF-001" className="mt-1" />
              </div>
              <div>
                <Label>服务类型*</Label>
                <Select>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择服务类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(serviceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>联系人*</Label>
                <Input placeholder="联系人姓名" className="mt-1" />
              </div>
              <div>
                <Label>联系电话*</Label>
                <Input placeholder="+86-xxx-xxxx-xxxx" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>联系邮箱*</Label>
                <Input type="email" placeholder="email@example.com" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>公司地址</Label>
                <Input placeholder="详细地址" className="mt-1" />
              </div>
              <div>
                <Label>服务等级</Label>
                <Select defaultValue="B">
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A级（优秀）</SelectItem>
                    <SelectItem value="B">B级（良好）</SelectItem>
                    <SelectItem value="C">C级（合格）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>营业执照号</Label>
                <Input placeholder="统一社会信用代码" className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>服务范围</Label>
                <Textarea placeholder="描述服务范围，例如：海运、空运、铁路运输" className="mt-1" rows={2} />
              </div>
              <div className="col-span-2">
                <Label>计费模式</Label>
                <Input placeholder="例如：按立方米/重量计费" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline">取消</Button>
              <Button 
                className="bg-[#F96302] hover:bg-[#E55A02]"
                onClick={() => {
                  toast.success('服务商添加成功！');
                }}
              >
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">服务商总数</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl text-gray-900 mb-1">{stats.total}</div>
          <div className="text-xs text-gray-500">活跃: {stats.active}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">货代公司</span>
            <Ship className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl text-gray-900 mb-1">{stats.forwarders}</div>
          <div className="text-xs text-gray-500">国际物流</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">拖车公司</span>
            <Truck className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl text-gray-900 mb-1">{stats.trucking}</div>
          <div className="text-xs text-gray-500">集卡运输</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">报关行</span>
            <FileCheck className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl text-gray-900 mb-1">{stats.customs}</div>
          <div className="text-xs text-gray-500">清关服务</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">验货公司</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl text-gray-900 mb-1">{stats.inspection}</div>
          <div className="text-xs text-gray-500">质量检验</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="list">服务商列表</TabsTrigger>
          <TabsTrigger value="orders">服务订单</TabsTrigger>
          <TabsTrigger value="payments">应付账款</TabsTrigger>
          <TabsTrigger value="performance">绩效评估</TabsTrigger>
        </TabsList>

        {/* 服务商列表 */}
        <TabsContent value="list" className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索服务商名称或编号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="服务类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(serviceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="服务等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等级</SelectItem>
                  <SelectItem value="A">A级</SelectItem>
                  <SelectItem value="B">B级</SelectItem>
                  <SelectItem value="C">C级</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 服务商表格 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>服务商信息</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>等级</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead className="text-right">服务次数</TableHead>
                  <TableHead className="text-right">服务金额</TableHead>
                  <TableHead className="text-center">准时率</TableHead>
                  <TableHead className="text-center">满意度</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => {
                  const TypeIcon = serviceTypeIcons[provider.type];
                  return (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{provider.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{provider.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{serviceTypeLabels[provider.type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          provider.level === 'A' ? 'default' : 
                          provider.level === 'B' ? 'secondary' : 
                          'outline'
                        }>
                          {provider.level}级
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-gray-900">{provider.contact}</div>
                          <div className="text-gray-500">{provider.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-900">
                        {provider.totalServices}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-900">
                        ${provider.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress 
                            value={provider.onTimeRate} 
                            className="w-16 h-2"
                          />
                          <span className="text-sm text-gray-900">{provider.onTimeRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-gray-900">{provider.satisfactionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          provider.status === 'active' ? 'default' :
                          provider.status === 'inactive' ? 'secondary' :
                          'destructive'
                        }>
                          {provider.status === 'active' ? '活跃' :
                           provider.status === 'inactive' ? '暂停' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedProvider(provider)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>服务商详情</DialogTitle>
                              </DialogHeader>
                              {selectedProvider && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <Label className="text-gray-500">服务商名称</Label>
                                      <p className="mt-1">{selectedProvider.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-500">服务商编号</Label>
                                      <p className="mt-1 font-mono text-sm">{selectedProvider.code}</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-500">服务类型</Label>
                                      <p className="mt-1">{serviceTypeLabels[selectedProvider.type]}</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-500">服务等级</Label>
                                      <p className="mt-1">
                                        <Badge>{selectedProvider.level}级</Badge>
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-500">联系人</Label>
                                      <p className="mt-1">{selectedProvider.contact}</p>
                                    </div>
                                    <div>
                                      <Label className="text-gray-500">联系电话</Label>
                                      <p className="mt-1">{selectedProvider.phone}</p>
                                    </div>
                                    <div className="col-span-3">
                                      <Label className="text-gray-500">联系邮箱</Label>
                                      <p className="mt-1">{selectedProvider.email}</p>
                                    </div>
                                    <div className="col-span-3">
                                      <Label className="text-gray-500">公司地址</Label>
                                      <p className="mt-1">{selectedProvider.address}</p>
                                    </div>
                                    <div className="col-span-3">
                                      <Label className="text-gray-500">服务范围</Label>
                                      <p className="mt-1">{selectedProvider.serviceScope.join('、')}</p>
                                    </div>
                                    <div className="col-span-3">
                                      <Label className="text-gray-500">计费模式</Label>
                                      <p className="mt-1">{selectedProvider.pricingModel}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">合作年限</div>
                                      <div className="text-lg text-gray-900">{selectedProvider.cooperationYears}年</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">服务次数</div>
                                      <div className="text-lg text-gray-900">{selectedProvider.totalServices}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">准时率</div>
                                      <div className="text-lg text-green-600">{selectedProvider.onTimeRate}%</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-xs text-gray-500 mb-1">满意度</div>
                                      <div className="text-lg text-blue-600">{selectedProvider.satisfactionRate}%</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 服务订单 */}
        <TabsContent value="orders" className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>服务订单号</TableHead>
                  <TableHead>服务商</TableHead>
                  <TableHead>服务类型</TableHead>
                  <TableHead>关联发货单</TableHead>
                  <TableHead>服务描述</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">付款状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockServiceOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-900">{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{order.providerName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.serviceType}</Badge>
                    </TableCell>
                    <TableCell>
                      {order.shipmentNumber && (
                        <span className="font-mono text-xs text-blue-600">{order.shipmentNumber}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{order.serviceDescription}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm text-gray-900">
                        {order.currency} {order.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{order.orderDate}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'in_progress' ? 'secondary' :
                        order.status === 'pending' ? 'outline' :
                        'destructive'
                      }>
                        {order.status === 'completed' ? '已完成' :
                         order.status === 'in_progress' ? '进行中' :
                         order.status === 'pending' ? '待处理' : '已取消'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        order.paymentStatus === 'paid' ? 'default' :
                        order.paymentStatus === 'partial' ? 'secondary' :
                        'destructive'
                      }>
                        {order.paymentStatus === 'paid' ? '已付款' :
                         order.paymentStatus === 'partial' ? '部分付款' : '未付款'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 应付账款 */}
        <TabsContent value="payments" className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">应付账款功能开发中...</p>
            <p className="text-sm text-gray-400 mt-1">将统一管理供应商和服务商的应付款项</p>
          </div>
        </TabsContent>

        {/* 绩效评估 */}
        <TabsContent value="performance" className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">绩效评估功能开发中...</p>
            <p className="text-sm text-gray-400 mt-1">将展示服务商的详细绩效数据和评分</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
