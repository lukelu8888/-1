import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  FileText, Search, Eye, Plus, Send, CheckCircle2, Clock, 
  XCircle, ArrowRight, Bell, Package, DollarSign, Calendar,
  User, Mail, Phone, MapPin, AlertCircle, Download, Edit,
  TrendingUp, ChevronRight, Zap, Archive, BarChart3
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Progress } from '../ui/progress';
import { useOrders } from '../../contexts/OrderContext';

// 询价接口
interface Inquiry {
  id: string;
  inquiryNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  region: string;
  products: {
    name: string;
    quantity: number;
    specs: string;
  }[];
  message: string;
  inquiryDate: string;
  status: 'pending' | 'quoted' | 'confirmed' | 'rejected';
  priority: 'high' | 'medium' | 'low';
}

// 报价接口
interface Quotation {
  id: string;
  quotationNumber: string;
  inquiryId: string;
  inquiryNumber: string;
  customerName: string;
  customerEmail: string;
  products: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specs: string;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  validUntil: string;
  paymentTerms: string;
  deliveryTerms: string;
  quotationDate: string;
  status: 'draft' | 'sent' | 'confirmed' | 'rejected' | 'expired' | 'converted';
  notes: string;
  confirmedDate?: string;
  confirmedBy?: string;
}

export default function QuotationFlowManagement() {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'quotations' | 'notifications'>('inquiries');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewInquiry, setViewInquiry] = useState<Inquiry | null>(null);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [isCreateQuotationOpen, setIsCreateQuotationOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  // 使用OrderContext
  const { addOrder, orders } = useOrders();

  // 模拟询价数据
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: 'INQ-001',
      inquiryNumber: 'INQ-2025-1156',
      customerName: 'ABC Trading Ltd.',
      customerEmail: 'contact@abctrading.com',
      customerPhone: '+1 555-0123',
      region: '北美',
      products: [
        { name: '智能插座 EU标准', quantity: 5000, specs: '16A, 250V, CE认证' },
        { name: '墙壁开关 86型', quantity: 3000, specs: '双控, 带LED指示灯' }
      ],
      message: '需要报价含FOB价格和交货期，计划12月初下单',
      inquiryDate: '2025-11-15',
      status: 'pending',
      priority: 'high'
    },
    {
      id: 'INQ-002',
      inquiryNumber: 'INQ-2025-1189',
      customerName: 'HomeStyle Warehouse',
      customerEmail: 'orders@homestyle.com',
      customerPhone: '+44 20 7946 0958',
      region: '欧洲',
      products: [
        { name: '淋浴花洒套装', quantity: 2000, specs: '不锈钢, 带恒温阀' }
      ],
      message: '请提供详细报价，包括样品价格',
      inquiryDate: '2025-11-16',
      status: 'quoted',
      priority: 'medium'
    },
    {
      id: 'INQ-003',
      inquiryNumber: 'INQ-2025-1201',
      customerName: 'BuildPro Solutions',
      customerEmail: 'info@buildpro.com',
      customerPhone: '+1 555-0199',
      region: '北美',
      products: [
        { name: '门窗铰链 重型', quantity: 8000, specs: '304不锈钢, 承重150kg' }
      ],
      message: '长期合作意向，需要报价和样品',
      inquiryDate: '2025-11-17',
      status: 'confirmed',
      priority: 'high'
    }
  ]);

  // 模拟报价数据
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: 'QUO-001',
      quotationNumber: 'QUO-2025-1156',
      inquiryId: 'INQ-002',
      inquiryNumber: 'INQ-2025-1189',
      customerName: 'HomeStyle Warehouse',
      customerEmail: 'orders@homestyle.com',
      products: [
        {
          name: '淋浴花洒套装',
          quantity: 2000,
          unitPrice: 28.50,
          totalPrice: 57000,
          specs: '不锈钢, 带恒温阀'
        }
      ],
      subtotal: 57000,
      discount: 2850,
      tax: 0,
      totalAmount: 54150,
      currency: 'USD',
      validUntil: '2025-12-16',
      paymentTerms: '30% T/T预付，70%见提单副本付款',
      deliveryTerms: 'FOB Shenzhen, 15-20个工作日',
      quotationDate: '2025-11-16',
      status: 'sent',
      notes: '5%折扣仅在11月底前有效'
    },
    {
      id: 'QUO-002',
      quotationNumber: 'QUO-2025-1201',
      inquiryId: 'INQ-003',
      inquiryNumber: 'INQ-2025-1201',
      customerName: 'BuildPro Solutions',
      customerEmail: 'info@buildpro.com',
      products: [
        {
          name: '门窗铰链 重型',
          quantity: 8000,
          unitPrice: 8.50,
          totalPrice: 68000,
          specs: '304不锈钢, 承重150kg'
        }
      ],
      subtotal: 68000,
      discount: 0,
      tax: 0,
      totalAmount: 68000,
      currency: 'USD',
      validUntil: '2025-12-17',
      paymentTerms: '30% T/T预付，70%见提单副本付款',
      deliveryTerms: 'FOB Ningbo, 20-25个工作日',
      quotationDate: '2025-11-17',
      status: 'confirmed',
      confirmedDate: '2025-11-18',
      confirmedBy: 'John Smith',
      notes: ''
    }
  ]);

  // 模拟通知数据
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-001',
      type: 'quotation_confirmed',
      title: '报价已确认',
      message: 'BuildPro Solutions 已确认报价 QUO-2025-1201',
      quotationNumber: 'QUO-2025-1201',
      time: '2025-11-18 10:30',
      isRead: false,
      action: 'convert_to_order'
    },
    {
      id: 'NOTIF-002',
      type: 'new_inquiry',
      title: '新询价',
      message: 'ABC Trading Ltd. 提交了新询价 INQ-2025-1156',
      inquiryNumber: 'INQ-2025-1156',
      time: '2025-11-15 14:20',
      isRead: true,
      action: 'create_quotation'
    }
  ]);

  // 统计数据
  const stats = {
    pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
    quotedInquiries: inquiries.filter(i => i.status === 'quoted').length,
    confirmedQuotations: quotations.filter(q => q.status === 'confirmed').length,
    sentQuotations: quotations.filter(q => q.status === 'sent').length,
    totalQuotationValue: quotations.reduce((sum, q) => sum + q.totalAmount, 0),
    unreadNotifications: notifications.filter(n => !n.isRead).length
  };

  // 获取询价状态配置
  const getInquiryStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待报价', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
      quoted: { label: '已报价', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
      confirmed: { label: '已确认', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      rejected: { label: '已拒绝', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取报价状态配置
  const getQuotationStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '草稿', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Edit },
      sent: { label: '已发送', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
      confirmed: { label: '已确认', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      rejected: { label: '已拒绝', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
      expired: { label: '已过期', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock },
      converted: { label: '已转订单', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package }
    };
    return configs[status as keyof typeof configs];
  };

  // 获取优先级配置
  const getPriorityConfig = (priority: string) => {
    const configs = {
      high: { label: '高', color: 'bg-rose-50 text-rose-700 border-rose-200' },
      medium: { label: '中', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      low: { label: '低', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    };
    return configs[priority as keyof typeof configs];
  };

  // 创建报价
  const handleCreateQuotation = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsCreateQuotationOpen(true);
  };

  // 发送报价
  const handleSendQuotation = (quotationId: string) => {
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { ...q, status: 'sent' as const } : q
    ));
    
    // 更新对应询价状态
    const quotation = quotations.find(q => q.id === quotationId);
    if (quotation) {
      setInquiries(inquiries.map(i => 
        i.id === quotation.inquiryId ? { ...i, status: 'quoted' as const } : i
      ));
    }

    toast.success('报价已发送给客户', {
      description: `报价编号: ${quotations.find(q => q.id === quotationId)?.quotationNumber}`
    });
  };

  // 模拟客户确认报价
  const handleSimulateCustomerConfirm = (quotationId: string) => {
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) return;

    // 更新报价状态
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { 
        ...q, 
        status: 'confirmed' as const,
        confirmedDate: new Date().toISOString().split('T')[0],
        confirmedBy: 'Customer'
      } : q
    ));

    // 更新询价状态
    setInquiries(inquiries.map(i => 
      i.id === quotation.inquiryId ? { ...i, status: 'confirmed' as const } : i
    ));

    // 添加通知
    const newNotification = {
      id: `NOTIF-${Date.now()}`,
      type: 'quotation_confirmed',
      title: '✅ 报价已确认',
      message: `${quotation.customerName} 已确认报价 ${quotation.quotationNumber}`,
      quotationNumber: quotation.quotationNumber,
      time: new Date().toLocaleString('zh-CN'),
      isRead: false,
      action: 'convert_to_order'
    };
    setNotifications([newNotification, ...notifications]);

    toast.success('客户已确认报价！', {
      description: `可以将 ${quotation.quotationNumber} 下推生成订单`,
      duration: 5000
    });
  };

  // 下推生成订单
  const handleConvertToOrder = (quotationId: string) => {
    console.log('🚀🚀🚀 ========== 开始下推订单 ==========');
    console.log('🎯 quotationId:', quotationId);
    console.log('📊 调用前的订单数量:', orders.length);
    console.log('📋 调用前的订单列表:', orders);
    
    const quotation = quotations.find(q => q.id === quotationId);
    if (!quotation) {
      console.error('❌ 找不到报价:', quotationId);
      toast.error('错误', { description: '找不到报价信息' });
      return;
    }

    console.log('✅ 找到报价:', quotation);
    console.log('🎯 开始生成订单，报价信息:', quotation);

    // 生成订单编号
    const orderNumber = `ORD-2025-${String(orders.length + 90).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 45); // 45天后交货
    
    console.log('📦 订单编号:', orderNumber);
    console.log('📊 当前订单数量:', orders.length);
    
    // 创建新订单
    const newOrder = {
      id: `ORD-${Date.now()}`,
      orderNumber: orderNumber,
      customer: quotation.customerName,
      customerEmail: quotation.customerEmail,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      date: today,
      expectedDelivery: deliveryDate.toISOString().split('T')[0],
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
      status: 'Pending' as const,
      progress: 0,
      products: quotation.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.totalPrice,
        specs: p.specs,
        produced: 0
      })),
      paymentStatus: 'Pending Payment',
      paymentTerms: quotation.paymentTerms,
      shippingMethod: 'Sea Freight',
      deliveryTerms: quotation.deliveryTerms,
      notes: quotation.notes,
      createdFrom: 'quotation' as const,
      createdAt: new Date().toISOString()
    };

    console.log('✅ 创建的新订单:', newOrder);

    // 添加订单到OrderContext
    console.log('📝 调用addOrder之前...');
    console.log('📝 准备添加的订单:', newOrder);
    addOrder(newOrder);
    console.log('✅ addOrder已调用完成');
    
    // 使用setTimeout来检查订单是否真的被添加了
    setTimeout(() => {
      console.log('⏰ 延迟检查 - 当前订单数量:', orders.length);
      console.log('⏰ 延迟检查 - 订单列表:', orders);
    }, 100);

    // 更新报价状态为已转订单
    setQuotations(quotations.map(q => 
      q.id === quotationId ? { ...q, status: 'converted' as const } : q
    ));

    // 标记通知为已读
    setNotifications(notifications.map(n => 
      n.quotationNumber === quotation.quotationNumber ? { ...n, isRead: true } : n
    ));

    toast.success('订单已生成！', {
      description: `报价 ${quotation.quotationNumber} 已成功转换为订单 ${orderNumber}`,
      action: {
        label: '查订单',
        onClick: () => {
          // 这里可以触发导航到订单管理页面
          console.log('跳转到订单管理，订单编号:', orderNumber);
        }
      },
      duration: 5000
    });

    console.log('🎉 订单生成完成！');
  };

  return (
    <div className="space-y-3">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">待报价</span>
            <Clock className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.pendingInquiries}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">需处理</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">已报价</span>
            <FileText className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.quotedInquiries}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">待确认</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">已确认报价</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.confirmedQuotations}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">待转单</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">进行中报价</span>
            <Send className="w-3 h-3 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.sentQuotations}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">已发送</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">报价总额</span>
            <DollarSign className="w-3 h-3 text-orange-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">${(stats.totalQuotationValue / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-gray-500 mt-0.5">本月</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">未读通知</span>
            <Bell className="w-3 h-3 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.unreadNotifications}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">需查看</p>
          {stats.unreadNotifications > 0 && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger 
                value="inquiries" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <FileText className="w-3 h-3 mr-1" />
                客户询价
                {stats.pendingInquiries > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-amber-100 text-amber-700 border-amber-200">
                    {stats.pendingInquiries}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="quotations" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium"
              >
                <Package className="w-3 h-3 mr-1" />
                报价管理
                {stats.confirmedQuotations > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">
                    {stats.confirmedQuotations}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-rose-600 data-[state=active]:bg-transparent data-[state=active]:text-rose-700 rounded-none px-0 pb-2 pt-2 text-[11px] font-medium relative"
              >
                <Bell className="w-3 h-3 mr-1" />
                实时通知
                {stats.unreadNotifications > 0 && (
                  <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-rose-100 text-rose-700 border-rose-200">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 客户询价标签页 */}
          <TabsContent value="inquiries" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索询价编号、客户名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="pending" style={{ fontSize: '11px' }}>待报价</SelectItem>
                    <SelectItem value="quoted" style={{ fontSize: '11px' }}>已报价</SelectItem>
                    <SelectItem value="confirmed" style={{ fontSize: '11px' }}>已确认</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">询价编号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">客户信息</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">产品明细</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">区域</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">询价日期</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">优先级</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">状态</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-blue-600">{inquiry.inquiryNumber}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-gray-900">{inquiry.customerName}</p>
                        <p className="text-[10px] text-gray-500">{inquiry.customerEmail}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">{inquiry.products[0].name}</p>
                        <p className="text-[10px] text-gray-500">
                          {inquiry.products.length > 1 ? `+${inquiry.products.length - 1}个产品` : `数量: ${inquiry.products[0].quantity}`}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className="h-4 px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          {inquiry.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{inquiry.inquiryDate}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${getPriorityConfig(inquiry.priority).color}`}>
                          {getPriorityConfig(inquiry.priority).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${getInquiryStatusConfig(inquiry.status).color}`}>
                          {getInquiryStatusConfig(inquiry.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setViewInquiry(inquiry)}>
                            <Eye className="w-3 h-3 mr-0.5" />
                            查看
                          </Button>
                          {inquiry.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleCreateQuotation(inquiry)}
                            >
                              <Plus className="w-3 h-3 mr-0.5" />
                              创建报价
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 报价管理标签页 */}
          <TabsContent value="quotations" className="m-0">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索报价编号、客户名称..."
                    className="pl-7 h-7 text-[11px] border-gray-300"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
                    <SelectItem value="sent" style={{ fontSize: '11px' }}>已发送</SelectItem>
                    <SelectItem value="confirmed" style={{ fontSize: '11px' }}>已确认</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">报价编号</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">关联询价</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">客户名称</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">产品信息</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">报价金额</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">有效期至</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium">状态</TableHead>
                    <TableHead className="h-7 py-1.5 text-[11px] text-gray-600 font-medium text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id} className="hover:bg-gray-50">
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-emerald-600">{quotation.quotationNumber}</p>
                        <p className="text-[10px] text-gray-500">{quotation.quotationDate}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-blue-600">{quotation.inquiryNumber}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] font-medium text-gray-900">{quotation.customerName}</p>
                        <p className="text-[10px] text-gray-500">{quotation.customerEmail}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-900">{quotation.products[0].name}</p>
                        <p className="text-[10px] text-gray-500">
                          数量: {quotation.products[0].quantity.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[12px] font-bold text-gray-900">
                          ${quotation.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500">{quotation.currency}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <p className="text-[11px] text-gray-700">{quotation.validUntil}</p>
                      </TableCell>
                      <TableCell className="py-1.5">
                        <Badge className={`h-4 px-1.5 text-[10px] border ${getQuotationStatusConfig(quotation.status).color}`}>
                          {getQuotationStatusConfig(quotation.status).label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px]"
                            onClick={() => setViewQuotation(quotation)}
                          >
                            <Eye className="w-3 h-3 mr-0.5" />
                            查看
                          </Button>
                          {quotation.status === 'draft' && (
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleSendQuotation(quotation.id)}
                            >
                              <Send className="w-3 h-3 mr-0.5" />
                              发送
                            </Button>
                          )}
                          {quotation.status === 'sent' && (
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleSimulateCustomerConfirm(quotation.id)}
                              title="模拟客户确认报价"
                            >
                              <Zap className="w-3 h-3 mr-0.5" />
                              模拟确认
                            </Button>
                          )}
                          {quotation.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleConvertToOrder(quotation.id)}
                            >
                              <ArrowRight className="w-3 h-3 mr-0.5" />
                              下推订单
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 实时通知标签页 */}
          <TabsContent value="notifications" className="m-0">
            <div className="p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[12px] text-gray-500">暂无通知</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`border rounded-lg p-3 ${
                      notification.isRead 
                        ? 'bg-white border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-full p-1.5 ${
                        notification.type === 'quotation_confirmed' 
                          ? 'bg-emerald-100' 
                          : 'bg-blue-100'
                      }`}>
                        {notification.type === 'quotation_confirmed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[12px] font-semibold text-gray-900">{notification.title}</h4>
                          <span className="text-[10px] text-gray-500">{notification.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-700 mb-2">{notification.message}</p>
                        {notification.action === 'convert_to_order' && (
                          <Button 
                            size="sm" 
                            className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              const quotation = quotations.find(q => q.quotationNumber === notification.quotationNumber);
                              if (quotation) handleConvertToOrder(quotation.id);
                            }}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            下推生成订单
                          </Button>
                        )}
                        {notification.action === 'create_quotation' && (
                          <Button 
                            size="sm" 
                            className="h-6 text-[10px] bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              const inquiry = inquiries.find(i => i.inquiryNumber === notification.inquiryNumber);
                              if (inquiry) handleCreateQuotation(inquiry);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            创建报价
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 查看询价详情对话框 */}
      <Dialog open={!!viewInquiry} onOpenChange={() => setViewInquiry(null)}>
        <DialogContent className="max-w-2xl">
          {viewInquiry && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '15px' }}>询价详情</DialogTitle>
                <DialogDescription style={{ fontSize: '12px' }}>
                  {viewInquiry.inquiryNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3">
                {/* 客户信息 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <h3 className="text-[12px] font-semibold text-blue-900">客户信息</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">客户名称</p>
                      <p className="text-[11px] font-medium text-gray-900">{viewInquiry.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">区域</p>
                      <Badge className="h-4 px-1.5 text-[10px] bg-blue-100 text-blue-700 border-blue-200">
                        {viewInquiry.region}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">电子邮箱</p>
                      <p className="text-[11px] text-gray-900">{viewInquiry.customerEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">联系电话</p>
                      <p className="text-[11px] text-gray-900">{viewInquiry.customerPhone}</p>
                    </div>
                  </div>
                </div>

                {/* 产品明细 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <h3 className="text-[12px] font-semibold text-emerald-900">产品明细</h3>
                  </div>
                  <div className="space-y-2">
                    {viewInquiry.products.map((product, idx) => (
                      <div key={idx} className="bg-white rounded p-2 border border-emerald-100">
                        <p className="text-[11px] font-medium text-gray-900">{product.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-600">数量: {product.quantity.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-600">规格: {product.specs}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 询价信息 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-gray-600" />
                    <h3 className="text-[12px] font-semibold text-gray-900">询价信息</h3>
                  </div>
                  <p className="text-[11px] text-gray-700 leading-relaxed">{viewInquiry.message}</p>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200">
                    <span className="text-[10px] text-gray-500">询价日期: {viewInquiry.inquiryDate}</span>
                    <Badge className={`h-4 px-1.5 text-[10px] border ${getPriorityConfig(viewInquiry.priority).color}`}>
                      {getPriorityConfig(viewInquiry.priority).label}优先级
                    </Badge>
                    <Badge className={`h-4 px-1.5 text-[10px] border ${getInquiryStatusConfig(viewInquiry.status).color}`}>
                      {getInquiryStatusConfig(viewInquiry.status).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setViewInquiry(null)}>
                  关闭
                </Button>
                {viewInquiry.status === 'pending' && (
                  <Button 
                    size="sm" 
                    className="h-8 text-[11px] bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      handleCreateQuotation(viewInquiry);
                      setViewInquiry(null);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    创建报价
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 查看报价详情对话框 */}
      <Dialog open={!!viewQuotation} onOpenChange={() => setViewQuotation(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewQuotation && (
            <>
              <DialogHeader>
                <DialogTitle style={{ fontSize: '15px' }}>报价详情</DialogTitle>
                <DialogDescription style={{ fontSize: '12px' }}>
                  {viewQuotation.quotationNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <h3 className="text-[12px] font-semibold text-blue-900">客户信息</h3>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500">客户名称</p>
                        <p className="text-[11px] font-medium text-gray-900">{viewQuotation.customerName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">联系邮箱</p>
                        <p className="text-[11px] text-gray-900">{viewQuotation.customerEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <h3 className="text-[12px] font-semibold text-purple-900">时间信息</h3>
                    </div>
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[10px] text-gray-500">报价日期</p>
                        <p className="text-[11px] font-medium text-gray-900">{viewQuotation.quotationDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">有效期至</p>
                        <p className="text-[11px] text-gray-900">{viewQuotation.validUntil}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 产品明细 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <h3 className="text-[12px] font-semibold text-emerald-900">产品明细</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-emerald-50/50">
                        <TableHead className="h-6 py-1 text-[10px]">产品名称</TableHead>
                        <TableHead className="h-6 py-1 text-[10px]">数量</TableHead>
                        <TableHead className="h-6 py-1 text-[10px]">单价</TableHead>
                        <TableHead className="h-6 py-1 text-[10px] text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewQuotation.products.map((product, idx) => (
                        <TableRow key={idx} className="hover:bg-white">
                          <TableCell className="py-1">
                            <p className="text-[11px] font-medium">{product.name}</p>
                            <p className="text-[10px] text-gray-500">{product.specs}</p>
                          </TableCell>
                          <TableCell className="py-1 text-[11px]">{product.quantity.toLocaleString()}</TableCell>
                          <TableCell className="py-1 text-[11px]">${product.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="py-1 text-[11px] text-right font-medium">
                            ${product.totalPrice.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 金额汇总 */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-orange-600" />
                    <h3 className="text-[12px] font-semibold text-orange-900">金额汇总</h3>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-600">小计</span>
                      <span className="font-medium">${viewQuotation.subtotal.toLocaleString()}</span>
                    </div>
                    {viewQuotation.discount > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-600">折扣</span>
                        <span className="text-emerald-600">-${viewQuotation.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] font-bold pt-1.5 border-t border-orange-200">
                      <span className="text-gray-900">总计</span>
                      <span className="text-orange-700">${viewQuotation.totalAmount.toLocaleString()} {viewQuotation.currency}</span>
                    </div>
                  </div>
                </div>

                {/* 交易条款 */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-gray-600" />
                    <h3 className="text-[12px] font-semibold text-gray-900">交易条款</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">付款条款</p>
                      <p className="text-[11px] text-gray-900">{viewQuotation.paymentTerms}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">交货条款</p>
                      <p className="text-[11px] text-gray-900">{viewQuotation.deliveryTerms}</p>
                    </div>
                  </div>
                  {viewQuotation.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-[10px] text-gray-500 mb-0.5">备注</p>
                      <p className="text-[11px] text-gray-900">{viewQuotation.notes}</p>
                    </div>
                  )}
                </div>

                {/* 状态信息 */}
                {viewQuotation.status === 'confirmed' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <h3 className="text-[12px] font-semibold text-emerald-900">确认信息</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">确认日期</p>
                        <p className="text-[11px] font-medium text-gray-900">{viewQuotation.confirmedDate}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">确认人</p>
                        <p className="text-[11px] font-medium text-gray-900">{viewQuotation.confirmedBy}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <Badge className={`h-5 px-2 text-[11px] border ${getQuotationStatusConfig(viewQuotation.status).color}`}>
                  {getQuotationStatusConfig(viewQuotation.status).label}
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={() => setViewQuotation(null)}>
                    关闭
                  </Button>
                  <Button size="sm" className="h-8 text-[11px] bg-gray-600 hover:bg-gray-700">
                    <Download className="w-3 h-3 mr-1" />
                    导出PDF
                  </Button>
                  {viewQuotation.status === 'sent' && (
                    <Button 
                      size="sm" 
                      className="h-8 text-[11px] bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        handleSimulateCustomerConfirm(viewQuotation.id);
                        setViewQuotation(null);
                      }}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      模拟客户确认
                    </Button>
                  )}
                  {viewQuotation.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        handleConvertToOrder(viewQuotation.id);
                        setViewQuotation(null);
                      }}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      下推生成订单
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}