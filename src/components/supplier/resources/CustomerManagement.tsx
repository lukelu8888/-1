import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Edit, Building2, Mail, Phone, MapPin, User, Calendar, DollarSign, Package, TrendingUp, FileText, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner@2.0.3';
import { industryTemplates } from '../../../data/industryTemplates';

/**
 * 🔥 供应商视角：客户管理
 * - 管理我方的客户（当前主要是COSUN）
 * - 未来可扩展支持多客户
 * - 包含客户档案、联系人、收货地址、合作历史等
 */
export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false); // 🔥 新增客户对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 🔥 删除确认对话框
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // 🔥 编辑表单数据
  const [editCustomerForm, setEditCustomerForm] = useState<any>(null);

  // 🔥 编辑时的自定义标记
  const [showEditCustomIndustry, setShowEditCustomIndustry] = useState(false);
  const [showEditCustomType, setShowEditCustomType] = useState(false);
  const [editCustomIndustryInput, setEditCustomIndustryInput] = useState('');
  const [editCustomTypeInput, setEditCustomTypeInput] = useState('');

  // 🔥 预设选项列表（可动态扩展）
  // 🔥 从 industryTemplates 中提取所有行业名称（中文）
  const [industryOptions, setIndustryOptions] = useState(
    industryTemplates
      .filter(template => template.id !== 'custom') // 排除"自定义"选项
      .map(template => template.name)
  );

  const [customerTypeOptions, setCustomerTypeOptions] = useState([
    'Distributor',
    'Retailer',
    'Wholesaler',
    'Manufacturer',
    'End User',
    'Agent'
  ]);

  const customerLevelOptions = ['VIP', 'A', 'B', 'C'];
  const customerStatusOptions = [
    { value: 'active', label: '合作中' },
    { value: 'potential', label: '潜在客户' },
    { value: 'inactive', label: '暂停合作' }
  ];

  // 🔥 自定义新增标记
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [customTypeInput, setCustomTypeInput] = useState('');

  // 🔥 客户数据 - 改为状态管理
  const [customers, setCustomers] = useState([
    {
      id: 'CUST-001',
      code: 'COSUN',
      companyName: '福建高盛达富建材有限公司',
      companyNameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
      country: '中国',
      region: 'Asia Pacific',
      industry: 'Building Materials Trading',
      type: 'Distributor', // 经销商类型
      level: 'VIP', // 客户等级
      status: 'active',
      
      // 联系信息
      mainContact: {
        name: '李总',
        position: '采购总监',
        email: 'purchasing@gosundafu.com',
        phone: '+86-591-8888-8888',
        mobile: '+86-138-0591-8888',
        wechat: 'gosundafu_li'
      },
      
      // 公司信息
      address: '福建省福州市仓山区金山工业区',
      addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
      postalCode: '350000',
      website: 'www.gosundafu.com',
      
      // 收货地址（可多个）
      shippingAddresses: [
        {
          id: 'ADDR-001',
          label: '福州仓库（主仓）',
          contact: '王仓管',
          phone: '+86-591-8888-8889',
          address: '福建省福州市仓山区金山工业区1号仓库',
          isDefault: true
        },
        {
          id: 'ADDR-002',
          label: '厦门分仓',
          contact: '张仓管',
          phone: '+86-592-6666-6666',
          address: '福建省厦门市集美区工业园区',
          isDefault: false
        }
      ],
      
      // 业务数据
      businessData: {
        firstOrderDate: '2023-06-15',
        totalOrders: 156,
        totalAmount: 2450000,
        currency: 'USD',
        avgOrderValue: 15705,
        lastOrderDate: '2024-12-15',
        outstandingAmount: 125000,
        creditLimit: 500000,
        paymentTerm: 'T/T 30天账期',
        onTimePaymentRate: 98.5
      },
      
      // 产品偏好
      productPreferences: [
        { category: '电气配件', percentage: 35 },
        { category: '卫浴五金', percentage: 28 },
        { category: '门窗配件', percentage: 22 },
        { category: '劳保用品', percentage: 15 }
      ],
      
      // 备注
      notes: 'VIP客户，福建地区最大建材进口商之一，主要服务北美、南美、欧非市场。要求品质稳定，交期准确。',
      createdDate: '2023-06-10',
      updatedDate: '2024-12-18'
    }
  ]);

  // 🔥 新增客户表单数据
  const [newCustomerForm, setNewCustomerForm] = useState({
    code: '',
    companyName: '',
    companyNameEn: '',
    country: '',
    region: 'Asia Pacific',
    industry: '',
    type: 'Distributor',
    level: 'C',
    status: 'potential',
    contactName: '',
    contactPosition: '',
    contactEmail: '',
    contactPhone: '',
    contactMobile: '',
    contactWechat: '',
    address: '',
    addressEn: '',
    postalCode: '',
    website: '',
    creditLimit: '100000',
    paymentTerm: 'T/T 30天账期',
    notes: ''
  });

  // 🔥 重置新增表单
  const resetNewCustomerForm = () => {
    setNewCustomerForm({
      code: '',
      companyName: '',
      companyNameEn: '',
      country: '',
      region: 'Asia Pacific',
      industry: '',
      type: 'Distributor',
      level: 'C',
      status: 'potential',
      contactName: '',
      contactPosition: '',
      contactEmail: '',
      contactPhone: '',
      contactMobile: '',
      contactWechat: '',
      address: '',
      addressEn: '',
      postalCode: '',
      website: '',
      creditLimit: '100000',
      paymentTerm: 'T/T 30天账期',
      notes: ''
    });
  };

  // 🔥 保存新增客户
  const handleSaveNewCustomer = () => {
    // 🔥 处理自定义行业
    let finalIndustry = newCustomerForm.industry;
    if (newCustomerForm.industry === 'custom' && customIndustryInput.trim()) {
      finalIndustry = customIndustryInput.trim();
      // 添加到行业选项列表中
      if (!industryOptions.includes(finalIndustry)) {
        setIndustryOptions([...industryOptions, finalIndustry]);
      }
    }

    // 🔥 处理自定义客户类型
    let finalType = newCustomerForm.type;
    if (newCustomerForm.type === 'custom' && customTypeInput.trim()) {
      finalType = customTypeInput.trim();
      // 添加到类型选项列表中
      if (!customerTypeOptions.includes(finalType)) {
        setCustomerTypeOptions([...customerTypeOptions, finalType]);
      }
    }

    // 表单验证
    if (!newCustomerForm.code) {
      toast.error('请输入客户代码');
      return;
    }
    if (!newCustomerForm.companyName) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!newCustomerForm.companyNameEn) {
      toast.error('请输入公司名称（英文）');
      return;
    }
    if (!newCustomerForm.contactName) {
      toast.error('请输入主要联系人姓名');
      return;
    }
    if (!newCustomerForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }
    if (!newCustomerForm.contactPhone) {
      toast.error('请输入联系人电话');
      return;
    }

    // 检查客户代码是否重复
    if (customers.some(c => c.code === newCustomerForm.code)) {
      toast.error('客户代码已存在，请使用其他代码');
      return;
    }

    // 生成新客户ID
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // 创建新客户对象
    const newCustomer = {
      id: newId,
      code: newCustomerForm.code,
      companyName: newCustomerForm.companyName,
      companyNameEn: newCustomerForm.companyNameEn,
      country: newCustomerForm.country,
      region: newCustomerForm.region,
      industry: finalIndustry, // 使用最终确定的行业
      type: finalType, // 使用最终确定的类型
      level: newCustomerForm.level,
      status: newCustomerForm.status,
      mainContact: {
        name: newCustomerForm.contactName,
        position: newCustomerForm.contactPosition,
        email: newCustomerForm.contactEmail,
        phone: newCustomerForm.contactPhone,
        mobile: newCustomerForm.contactMobile,
        wechat: newCustomerForm.contactWechat
      },
      address: newCustomerForm.address,
      addressEn: newCustomerForm.addressEn,
      postalCode: newCustomerForm.postalCode,
      website: newCustomerForm.website,
      shippingAddresses: [],
      businessData: {
        firstOrderDate: today,
        totalOrders: 0,
        totalAmount: 0,
        currency: 'USD',
        avgOrderValue: 0,
        lastOrderDate: '',
        outstandingAmount: 0,
        creditLimit: parseFloat(newCustomerForm.creditLimit) || 100000,
        paymentTerm: newCustomerForm.paymentTerm,
        onTimePaymentRate: 100
      },
      productPreferences: [],
      notes: newCustomerForm.notes,
      createdDate: today,
      updatedDate: today
    };

    // 添加到客户列表
    setCustomers([...customers, newCustomer]);

    // 显示成功提示
    toast.success(`客户 ${newCustomerForm.companyName} 新增成功！`, {
      description: `客户代码：${newCustomerForm.code} | 客户等级：${newCustomerForm.level}`
    });

    // 关闭对话框并重置表单
    setAddDialogOpen(false);
    resetNewCustomerForm();
    setShowCustomIndustry(false);
    setShowCustomType(false);
    setCustomIndustryInput('');
    setCustomTypeInput('');
  };

  // 🔥 打开编辑对话框并填充数据
  const handleOpenEditDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setEditCustomerForm({
      code: customer.code,
      companyName: customer.companyName,
      companyNameEn: customer.companyNameEn,
      country: customer.country,
      region: customer.region,
      industry: customer.industry,
      type: customer.type,
      level: customer.level,
      status: customer.status,
      contactName: customer.mainContact.name,
      contactPosition: customer.mainContact.position,
      contactEmail: customer.mainContact.email,
      contactPhone: customer.mainContact.phone,
      contactMobile: customer.mainContact.mobile,
      contactWechat: customer.mainContact.wechat,
      address: customer.address,
      addressEn: customer.addressEn,
      postalCode: customer.postalCode,
      website: customer.website,
      creditLimit: String(customer.businessData.creditLimit),
      paymentTerm: customer.businessData.paymentTerm,
      notes: customer.notes
    });
    setEditDialogOpen(true);
  };

  // 🔥 保存编辑的客户
  const handleSaveEditCustomer = () => {
    if (!editCustomerForm || !selectedCustomer) return;

    // 🔥 处理自定义行业
    let finalIndustry = editCustomerForm.industry;
    if (editCustomerForm.industry === 'custom' && editCustomIndustryInput.trim()) {
      finalIndustry = editCustomIndustryInput.trim();
      if (!industryOptions.includes(finalIndustry)) {
        setIndustryOptions([...industryOptions, finalIndustry]);
      }
    }

    // 🔥 处理自定义客户类型
    let finalType = editCustomerForm.type;
    if (editCustomerForm.type === 'custom' && editCustomTypeInput.trim()) {
      finalType = editCustomTypeInput.trim();
      if (!customerTypeOptions.includes(finalType)) {
        setCustomerTypeOptions([...customerTypeOptions, finalType]);
      }
    }

    // 表单验证
    if (!editCustomerForm.companyName) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!editCustomerForm.contactName) {
      toast.error('请输入主要联系人姓名');
      return;
    }
    if (!editCustomerForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // 更新客户信息
    const updatedCustomers = customers.map(c => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          code: editCustomerForm.code,
          companyName: editCustomerForm.companyName,
          companyNameEn: editCustomerForm.companyNameEn,
          country: editCustomerForm.country,
          region: editCustomerForm.region,
          industry: finalIndustry,
          type: finalType,
          level: editCustomerForm.level,
          status: editCustomerForm.status,
          mainContact: {
            name: editCustomerForm.contactName,
            position: editCustomerForm.contactPosition,
            email: editCustomerForm.contactEmail,
            phone: editCustomerForm.contactPhone,
            mobile: editCustomerForm.contactMobile,
            wechat: editCustomerForm.contactWechat
          },
          address: editCustomerForm.address,
          addressEn: editCustomerForm.addressEn,
          postalCode: editCustomerForm.postalCode,
          website: editCustomerForm.website,
          businessData: {
            ...c.businessData,
            creditLimit: parseFloat(editCustomerForm.creditLimit) || 100000,
            paymentTerm: editCustomerForm.paymentTerm
          },
          notes: editCustomerForm.notes,
          updatedDate: today
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);

    // 更新 selectedCustomer 用于详情页面
    const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
    if (updatedCustomer) {
      setSelectedCustomer(updatedCustomer);
    }

    toast.success(`客户 ${editCustomerForm.companyName} 更新成功！`);

    // 关闭编辑对话框
    setEditDialogOpen(false);
    setEditCustomerForm(null);
    setShowEditCustomIndustry(false);
    setShowEditCustomType(false);
    setEditCustomIndustryInput('');
    setEditCustomTypeInput('');
  };

  // 🔥 打开删除确认对话框
  const handleOpenDeleteDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  // 🔥 删除客户
  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;

    const updatedCustomers = customers.filter(c => c.id !== selectedCustomer.id);
    setCustomers(updatedCustomers);

    toast.success(`客户 ${selectedCustomer.companyName} 已删除`, {
      description: `客户代码：${selectedCustomer.code}`
    });

    // 关闭删除对话框
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  const getCustomerLevelBadge = (level: string) => {
    const config: any = {
      VIP: { label: 'VIP客户', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      A: { label: 'A级客户', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      B: { label: 'B级客户', color: 'bg-green-100 text-green-800 border-green-300' },
      C: { label: 'C级客户', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    return config[level] || config.C;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      active: { label: '合作中', color: 'bg-green-100 text-green-800 border-green-300' },
      inactive: { label: '暂停合作', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      potential: { label: '潜在客户', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    };
    return config[status] || config.active;
  };

  const detailTabs = [
    { id: 'basic', label: '基本信息', icon: Building2 },
    { id: 'contacts', label: '联系人', icon: User },
    { id: 'addresses', label: '收货地址', icon: MapPin },
    { id: 'business', label: '业务数据', icon: TrendingUp },
    { id: 'orders', label: '订单历史', icon: Package },
  ];

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>客户管理</h2>
              <p className="text-xs text-gray-500">管理我方客户档案、联系人和业务数据</p>
            </div>
          </div>
          <Button 
            className="gap-2 bg-orange-600 hover:bg-orange-700"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            新增客户
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">客户总数</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
          <p className="text-xs text-gray-500 mt-1">VIP客户: 1</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计订单</span>
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">156</p>
          <p className="text-xs text-gray-500 mt-1">本月新增: 12</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计销售额</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">$2.45M</p>
          <p className="text-xs text-gray-500 mt-1">平均订单: $15.7K</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待收账款</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">$125K</p>
          <p className="text-xs text-gray-500 mt-1">账期内: 100%</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索客户名称、代码或联系人..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* 客户列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>客户代码</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户名称</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>国家</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>客户等级</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>主要联系人</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>联系方式</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>累计订单</TableHead>
                <TableHead className="h-9 w-28 text-right" style={{ fontSize: '12px' }}>累计销售额</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const levelBadge = getCustomerLevelBadge(customer.level);
                const statusBadge = getStatusBadge(customer.status);
                
                return (
                  <TableRow key={customer.id} className="hover:bg-gray-50">
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-blue-600">{customer.code}</p>
                        <p className="text-xs text-gray-500">{customer.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{customer.companyName}</p>
                        <p className="text-xs text-gray-500">{customer.companyNameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <span className="text-gray-700">{customer.country}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${levelBadge.color}`}>
                        {levelBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{customer.mainContact.name}</p>
                        <p className="text-xs text-gray-500">{customer.mainContact.position}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs">{customer.mainContact.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{customer.mainContact.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className="font-medium">{customer.businessData.totalOrders}</span>
                      <span className="text-gray-500 ml-1">单</span>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-bold text-green-600">
                          ${(customer.businessData.totalAmount / 1000).toFixed(1)}K
                        </p>
                        <p className="text-xs text-gray-500">
                          平均 ${(customer.businessData.avgOrderValue / 1000).toFixed(1)}K
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setDetailDialogOpen(true);
                          }}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleOpenEditDialog(customer)}
                          title="编辑客户"
                        >
                          <Edit className="w-4 h-4 text-orange-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleOpenDeleteDialog(customer)}
                          title="删除客户"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 客户详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              客户详情 - {selectedCustomer?.companyName}
            </DialogTitle>
            <DialogDescription>
              客户代码：{selectedCustomer?.code} | 等级：{selectedCustomer?.level}
            </DialogDescription>
          </DialogHeader>

          {/* Tab导航 */}
          <div className="border-b border-gray-200">
            <div className="flex items-center gap-1">
              {detailTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-600 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab内容 */}
          <div className="flex-1 overflow-y-auto py-4">
            {activeTab === 'basic' && selectedCustomer && (
              <div className="space-y-4 min-h-[400px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">公司名称（中文）</p>
                      <p className="text-sm font-medium">{selectedCustomer.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">公司名称（英文）</p>
                      <p className="text-sm font-medium">{selectedCustomer.companyNameEn}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">国家/地区</p>
                      <p className="text-sm font-medium">{selectedCustomer.country} / {selectedCustomer.region}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">所属行业</p>
                      <p className="text-sm font-medium">{selectedCustomer.industry}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">客户类型</p>
                      <p className="text-sm font-medium">{selectedCustomer.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">公司网站</p>
                      <p className="text-sm font-medium text-blue-600">{selectedCustomer.website}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">合作开始日期</p>
                      <p className="text-sm font-medium">{selectedCustomer.businessData.firstOrderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">最后更新</p>
                      <p className="text-sm font-medium">{selectedCustomer.updatedDate}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">公司地址</p>
                  <p className="text-sm font-medium">{selectedCustomer.address}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedCustomer.addressEn}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                </div>
              </div>
            )}

            {activeTab === 'contacts' && selectedCustomer && (
              <div className="space-y-4 min-h-[400px]">
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">主要联系人</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">姓名</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">职位</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.position}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">邮箱</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">电话</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">手机</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.mobile}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">微信</p>
                      <p className="text-sm font-medium">{selectedCustomer.mainContact.wechat}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && selectedCustomer && (
              <div className="space-y-3 min-h-[400px]">
                {selectedCustomer.shippingAddresses.map((addr: any) => (
                  <div key={addr.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">{addr.label}</span>
                      </div>
                      {addr.isDefault && (
                        <Badge className="h-5 px-2 text-xs bg-orange-100 text-orange-800 border-orange-300">
                          默认地址
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">联系人：</span>
                        <span className="font-medium ml-2">{addr.contact}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">电话：</span>
                        <span className="font-medium ml-2">{addr.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">地址：</span>
                        <span className="font-medium ml-2">{addr.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'business' && selectedCustomer && (
              <div className="space-y-4 min-h-[400px]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">累计订单</p>
                      <p className="text-sm font-medium">{selectedCustomer.businessData.totalOrders} 单</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">累计销售额</p>
                      <p className="text-sm font-medium">${(selectedCustomer.businessData.totalAmount / 1000000).toFixed(2)}M {selectedCustomer.businessData.currency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">待收账款</p>
                      <p className="text-sm font-medium">${(selectedCustomer.businessData.outstandingAmount / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">信用额度</p>
                      <p className="text-sm font-medium">${(selectedCustomer.businessData.creditLimit / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">付款条款</p>
                      <p className="text-sm font-medium">{selectedCustomer.businessData.paymentTerm}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">准时付款率</p>
                      <p className="text-sm font-medium text-green-600">{selectedCustomer.businessData.onTimePaymentRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">平均订单值</p>
                      <p className="text-sm font-medium">${(selectedCustomer.businessData.avgOrderValue / 1000).toFixed(1)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">最后订单日期</p>
                      <p className="text-sm font-medium">{selectedCustomer.businessData.lastOrderDate}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 mb-2">产品偏好分布</p>
                  <div className="space-y-2">
                    {selectedCustomer.productPreferences.map((pref: any) => (
                      <div key={pref.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{pref.category}</span>
                          <span className="text-sm font-medium text-orange-600">{pref.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${pref.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2" />
                  <p>订单历史记录</p>
                  <p className="text-xs">（与客户订单模块联动）</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (selectedCustomer) {
                  handleOpenEditDialog(selectedCustomer);
                  setDetailDialogOpen(false);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑客户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增客户对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              新增客户
            </DialogTitle>
            <DialogDescription>
              请填写客户的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          {/* 🔥 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Building2 className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户代码 *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.code}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：COSUN"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.companyName}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, companyName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：福建高盛达富建材有限公司"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.companyNameEn}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, companyNameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：FUJIAN GOSUNDA FU"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.country}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">所属行业</Label>
                  <Select
                    value={newCustomerForm.industry}
                    onValueChange={(value) => {
                      setNewCustomerForm({ ...newCustomerForm, industry: value });
                      if (value === 'custom') {
                        setShowCustomIndustry(true);
                      } else {
                        setShowCustomIndustry(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择行业" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">自定义行业</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomIndustry && (
                    <Input
                      className="h-9 mt-2"
                      value={customIndustryInput}
                      onChange={(e) => setCustomIndustryInput(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="请输入自定义行业"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户类型</Label>
                  <Select
                    value={newCustomerForm.type}
                    onValueChange={(value) => {
                      setNewCustomerForm({ ...newCustomerForm, type: value });
                      if (value === 'custom') {
                        setShowCustomType(true);
                      } else {
                        setShowCustomType(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择客户类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">自定义类型</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomType && (
                    <Input
                      className="h-9 mt-2"
                      value={customTypeInput}
                      onChange={(e) => setCustomTypeInput(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="请输入自定义类型"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户等级</Label>
                  <Select
                    value={newCustomerForm.level}
                    onValueChange={(value) => setNewCustomerForm({ ...newCustomerForm, level: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择客户等级" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerLevelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">状态</Label>
                  <Select
                    value={newCustomerForm.status}
                    onValueChange={(value) => setNewCustomerForm({ ...newCustomerForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司网站</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.website}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, website: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：www.example.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 mb-1">公司地址（中文）</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：福建省福州市仓山区金山工业区"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮政编码</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.postalCode}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, postalCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：350000"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">公司地址（英文）</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.addressEn}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, addressEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">信用额度（USD）</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.creditLimit}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, creditLimit: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：100000"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 mb-1">付款条款</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.paymentTerm}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, paymentTerm: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：T/T 30天账期"
                  />
                </div>
              </div>
            </div>

            {/* 联系人信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <User className="w-4 h-4 text-orange-600" />
                联系人信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">主要联系人姓名 *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactName}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：李总"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">职位</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactPosition}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactPosition: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：采购总监"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactEmail}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：contact@example.com"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">电话 *</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactPhone}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-591-8888-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactMobile}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0591-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">微信</Label>
                  <Input
                    className="h-9"
                    value={newCustomerForm.contactWechat}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, contactWechat: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：wechat_id"
                  />
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <FileText className="w-4 h-4 text-orange-600" />
                备注信息
              </h3>
              <div>
                <Label className="text-xs text-gray-500 mb-1">备注</Label>
                <Textarea
                  className="min-h-20"
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：VIP客户，主要服务北美市场，要求品质稳定..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveNewCustomer}>
              <Plus className="w-4 h-4 mr-2" />
              保存客户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑客户对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              编辑客户
            </DialogTitle>
            <DialogDescription>
              请填写客户的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          {/* 🔥 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Building2 className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户代码 *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.code}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：COSUN"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.companyName}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, companyName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：福建高盛达富建材有限公司"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.companyNameEn}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, companyNameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：FUJIAN GOSUNDA FU"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.country}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">所属行业</Label>
                  <Select
                    value={editCustomerForm?.industry}
                    onValueChange={(value) => {
                      setEditCustomerForm({ ...editCustomerForm, industry: value });
                      if (value === 'custom') {
                        setShowEditCustomIndustry(true);
                      } else {
                        setShowEditCustomIndustry(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择行业" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">自定义行业</SelectItem>
                    </SelectContent>
                  </Select>
                  {showEditCustomIndustry && (
                    <Input
                      className="h-9 mt-2"
                      value={editCustomIndustryInput}
                      onChange={(e) => setEditCustomIndustryInput(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="请输入自定义行业"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户类型</Label>
                  <Select
                    value={editCustomerForm?.type}
                    onValueChange={(value) => {
                      setEditCustomerForm({ ...editCustomerForm, type: value });
                      if (value === 'custom') {
                        setShowEditCustomType(true);
                      } else {
                        setShowEditCustomType(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择客户类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">自定义类型</SelectItem>
                    </SelectContent>
                  </Select>
                  {showEditCustomType && (
                    <Input
                      className="h-9 mt-2"
                      value={editCustomTypeInput}
                      onChange={(e) => setEditCustomTypeInput(e.target.value)}
                      style={{ fontSize: '13px' }}
                      placeholder="请输入自定义类型"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户等级</Label>
                  <Select
                    value={editCustomerForm?.level}
                    onValueChange={(value) => setEditCustomerForm({ ...editCustomerForm, level: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择客户等级" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerLevelOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">状态</Label>
                  <Select
                    value={editCustomerForm?.status}
                    onValueChange={(value) => setEditCustomerForm({ ...editCustomerForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司网站</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.website}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, website: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：www.example.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 mb-1">公司地址（中文）</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.address}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：福建省福州市仓山区金山工业区"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮政编码</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.postalCode}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, postalCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：350000"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">公司地址（英文）</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.addressEn}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, addressEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">信用额度（USD）</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.creditLimit}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, creditLimit: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：100000"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 mb-1">付款条款</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.paymentTerm}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, paymentTerm: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：T/T 30天账期"
                  />
                </div>
              </div>
            </div>

            {/* 联系人信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <User className="w-4 h-4 text-orange-600" />
                联系人信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">主要联系人姓名 *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactName}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：李总"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">职位</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactPosition}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactPosition: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：采购总监"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactEmail}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：contact@example.com"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">电话 *</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactPhone}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-591-8888-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactMobile}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0591-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">微信</Label>
                  <Input
                    className="h-9"
                    value={editCustomerForm?.contactWechat}
                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, contactWechat: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：wechat_id"
                  />
                </div>
              </div>
            </div>

            {/* 备注 */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <FileText className="w-4 h-4 text-orange-600" />
                备注信息
              </h3>
              <div>
                <Label className="text-xs text-gray-500 mb-1">备注</Label>
                <Textarea
                  className="min-h-20"
                  value={editCustomerForm?.notes}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：VIP客户，主要服务北美市场，要求品质稳定..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveEditCustomer}>
              <Edit className="w-4 h-4 mr-2" />
              保存客户
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              确认删除客户
            </DialogTitle>
            <DialogDescription>
              此操作不可撤销，确定要删除以下客户吗？
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">客户代码：</span>
                <span className="text-sm font-medium">{selectedCustomer.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">公司名称：</span>
                <span className="text-sm font-medium">{selectedCustomer.companyName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">主要联系人：</span>
                <span className="text-sm font-medium">{selectedCustomer.mainContact.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">累计订单：</span>
                <span className="text-sm font-medium">{selectedCustomer.businessData.totalOrders} 单</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteCustomer}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}