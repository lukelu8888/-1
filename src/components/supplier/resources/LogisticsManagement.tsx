import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Edit, Truck, Mail, Phone, MapPin, Star, TrendingUp, Package, DollarSign, Clock, Globe, AlertCircle, Trash2, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商视角：物流公司管理
 * - 管理快递公司（样品寄送）
 * - 管理货运公司（大货运输）
 * - 管理国际物流（跨国运输）
 * - 物流商评级和运费管理
 */
export default function LogisticsManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [selectedLogistics, setSelectedLogistics] = useState<any>(null);
  const [selectedLogisticsIds, setSelectedLogisticsIds] = useState<string[]>([]);

  // 🔥 物流公司数据（改为状态管理）
  const [logisticsPartners, setLogisticsPartners] = useState([
    {
      id: 'LOG-001',
      code: 'SF-EXPRESS',
      name: '顺丰速运',
      nameEn: 'SF Express',
      type: 'express', // 快递
      serviceType: '国内快递 + 国际快递',
      country: '中国',
      rating: 'A',
      status: 'active',
      
      contact: {
        name: '李客户经理',
        phone: '+86-400-111-1111',
        mobile: '+86-138-0000-1111',
        email: 'vip@sf-express.com',
        customerCode: 'VIP-8888'
      },
      
      serviceScope: {
        domestic: true,
        international: true,
        regions: ['全国', '亚洲', '北美', '欧洲']
      },
      
      businessData: {
        cooperationStartDate: '2023-01-10',
        totalShipments: 256,
        totalAmount: 125000,
        currency: 'CNY',
        lastShipmentDate: '2024-12-17',
        avgDeliveryTime: 2.5,
        onTimeRate: 98.5,
        damageRate: 0.2,
        monthlyDiscount: 8.5
      },
      
      services: [
        { name: '样品快递', price: '首重 ¥25/kg, 续重 ¥12/kg', timeframe: '1-2天' },
        { name: '国际快递', price: '首重 $35/kg, 续重 $18/kg', timeframe: '3-5天' },
        { name: '代收货款', price: '手续费 2%', timeframe: '-' }
      ],
      
      advantages: ['速度快', '网络广', '服务好', '系统完善'],
      notes: '主力快递商，用于样品寄送，月结有折扣。'
    },
    {
      id: 'LOG-002',
      code: 'ZTO-EXPRESS',
      name: '中通快递',
      nameEn: 'ZTO Express',
      type: 'express',
      serviceType: '国内快递',
      country: '中国',
      rating: 'B',
      status: 'active',
      
      contact: {
        name: '王业务员',
        phone: '+86-400-222-2222',
        mobile: '+86-139-0000-2222',
        email: 'business@zto.com',
        customerCode: 'BIZ-6688'
      },
      
      serviceScope: {
        domestic: true,
        international: false,
        regions: ['全国']
      },
      
      businessData: {
        cooperationStartDate: '2023-03-15',
        totalShipments: 189,
        totalAmount: 68000,
        currency: 'CNY',
        lastShipmentDate: '2024-12-16',
        avgDeliveryTime: 3.2,
        onTimeRate: 94.5,
        damageRate: 0.5,
        monthlyDiscount: 7.8
      },
      
      services: [
        { name: '经济快递', price: '首重 ¥18/kg, 续重 ¥8/kg', timeframe: '2-4天' },
        { name: '标准快递', price: '首重 ¥22/kg, 续重 ¥10/kg', timeframe: '2-3天' }
      ],
      
      advantages: ['价格优惠', '网点多'],
      notes: '备用快递商，价格有优势，适合国内样品寄送。'
    },
    {
      id: 'LOG-003',
      code: 'FEDEX',
      name: '联邦快递',
      nameEn: 'FedEx',
      type: 'international',
      serviceType: '国际快递 + 国际货运',
      country: '美国',
      rating: 'A',
      status: 'active',
      
      contact: {
        name: 'Johnson Manager',
        phone: '+1-800-463-3339',
        mobile: '+86-137-0000-3333',
        email: 'johnson.wang@fedex.com',
        customerCode: 'CN-VIP-9999'
      },
      
      serviceScope: {
        domestic: false,
        international: true,
        regions: ['全球']
      },
      
      businessData: {
        cooperationStartDate: '2023-02-20',
        totalShipments: 98,
        totalAmount: 285000,
        currency: 'USD',
        lastShipmentDate: '2024-12-15',
        avgDeliveryTime: 4.5,
        onTimeRate: 97.8,
        damageRate: 0.3,
        monthlyDiscount: 8.2
      },
      
      services: [
        { name: '国际快递', price: '$38/kg起', timeframe: '3-5天' },
        { name: '国际货运', price: '按CBM计算', timeframe: '15-25天' },
        { name: '清关服务', price: '包含', timeframe: '-' }
      ],
      
      advantages: ['全球网络', '时效稳定', '清关能力强', '追踪系统完善'],
      notes: '主力国际物流商，用于北美和欧洲市场样品和货物运输。'
    },
    {
      id: 'LOG-004',
      code: 'COSCO-SHIPPING',
      name: '中远海运',
      nameEn: 'COSCO Shipping',
      type: 'freight',
      serviceType: '海运 + 陆运',
      country: '中国',
      rating: 'A',
      status: 'active',
      
      contact: {
        name: '陈经理',
        phone: '+86-400-888-8888',
        mobile: '+86-136-0000-4444',
        email: 'chen.manager@cosco.com',
        customerCode: 'BULK-5588'
      },
      
      serviceScope: {
        domestic: true,
        international: true,
        regions: ['全球海运', '国内陆运']
      },
      
      businessData: {
        cooperationStartDate: '2023-04-01',
        totalShipments: 45,
        totalAmount: 680000,
        currency: 'USD',
        lastShipmentDate: '2024-12-10',
        avgDeliveryTime: 28,
        onTimeRate: 92.5,
        damageRate: 0.8,
        monthlyDiscount: 0
      },
      
      services: [
        { name: '整柜海运', price: '按航线报价', timeframe: '25-35天' },
        { name: '拼箱海运', price: '按CBM报价', timeframe: '30-40天' },
        { name: '陆运配送', price: '按公里报价', timeframe: '3-7天' }
      ],
      
      advantages: ['价格实惠', '承载能力强', '航线齐全'],
      notes: '大货海运主力，适合整柜和拼箱运输。'
    }
  ]);

  // 🔥 新增物流商表单数据
  const [newLogisticsForm, setNewLogisticsForm] = useState({
    code: '',
    name: '',
    nameEn: '',
    type: 'express',
    serviceType: '',
    country: '中国',
    rating: 'C',
    status: 'active',
    contactName: '',
    contactPhone: '',
    contactMobile: '',
    contactEmail: '',
    customerCode: '',
    notes: ''
  });

  // 🔥 重置新增表单
  const resetNewLogisticsForm = () => {
    setNewLogisticsForm({
      code: '',
      name: '',
      nameEn: '',
      type: 'express',
      serviceType: '',
      country: '中国',
      rating: 'C',
      status: 'active',
      contactName: '',
      contactPhone: '',
      contactMobile: '',
      contactEmail: '',
      customerCode: '',
      notes: ''
    });
  };

  // 🔥 保存新增物流商
  const handleSaveNewLogistics = () => {
    // 表单验证
    if (!newLogisticsForm.code) {
      toast.error('请输入物流代码');
      return;
    }
    if (!newLogisticsForm.name) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!newLogisticsForm.nameEn) {
      toast.error('请输入公司名称（英文）');
      return;
    }
    if (!newLogisticsForm.contactName) {
      toast.error('请输入联系人姓名');
      return;
    }
    if (!newLogisticsForm.contactMobile) {
      toast.error('请输入联系人手机');
      return;
    }
    if (!newLogisticsForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }

    // 检查物流代码是否重复
    if (logisticsPartners.some(l => l.code === newLogisticsForm.code)) {
      toast.error('物流代码已存在，请使用其他代码');
      return;
    }

    // 生成新物流商ID
    const newId = `LOG-${String(logisticsPartners.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // 创建新物流商对象
    const newLogistics = {
      id: newId,
      code: newLogisticsForm.code,
      name: newLogisticsForm.name,
      nameEn: newLogisticsForm.nameEn,
      type: newLogisticsForm.type,
      serviceType: newLogisticsForm.serviceType,
      country: newLogisticsForm.country,
      rating: newLogisticsForm.rating,
      status: newLogisticsForm.status,
      contact: {
        name: newLogisticsForm.contactName,
        phone: newLogisticsForm.contactPhone,
        mobile: newLogisticsForm.contactMobile,
        email: newLogisticsForm.contactEmail,
        customerCode: newLogisticsForm.customerCode
      },
      serviceScope: {
        domestic: true,
        international: newLogisticsForm.type === 'international',
        regions: []
      },
      businessData: {
        cooperationStartDate: today,
        totalShipments: 0,
        totalAmount: 0,
        currency: 'CNY',
        lastShipmentDate: '',
        avgDeliveryTime: 0,
        onTimeRate: 0,
        damageRate: 0,
        monthlyDiscount: 0
      },
      services: [],
      advantages: [],
      notes: newLogisticsForm.notes
    };

    // 添加到物流商列表
    setLogisticsPartners([...logisticsPartners, newLogistics]);

    // 显示成功提示
    toast.success(`物流商 ${newLogisticsForm.name} 新增成功！`, {
      description: `物流代码：${newLogisticsForm.code} | 评级：${newLogisticsForm.rating}`
    });

    // 关闭对话框并重置表单
    setAddDialogOpen(false);
    resetNewLogisticsForm();
  };

  // 🔥 保存编辑物流商
  const handleSaveEditLogistics = () => {
    if (!selectedLogistics) return;

    // 表单验证
    if (!newLogisticsForm.code) {
      toast.error('请输入物流代码');
      return;
    }
    if (!newLogisticsForm.name) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!newLogisticsForm.nameEn) {
      toast.error('请输入公司名称（英文）');
      return;
    }
    if (!newLogisticsForm.contactName) {
      toast.error('请输入联系人姓名');
      return;
    }
    if (!newLogisticsForm.contactMobile) {
      toast.error('请输入联系人手机');
      return;
    }
    if (!newLogisticsForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }

    // 检查物流代码是否重复（排除当前编辑的物流商）
    if (logisticsPartners.some(l => l.code === newLogisticsForm.code && l.id !== selectedLogistics.id)) {
      toast.error('物流代码已存在，请使用其他代码');
      return;
    }

    // 更新物流商对象
    const updatedLogistics = {
      ...selectedLogistics,
      code: newLogisticsForm.code,
      name: newLogisticsForm.name,
      nameEn: newLogisticsForm.nameEn,
      type: newLogisticsForm.type,
      serviceType: newLogisticsForm.serviceType,
      country: newLogisticsForm.country,
      rating: newLogisticsForm.rating,
      status: newLogisticsForm.status,
      contact: {
        ...selectedLogistics.contact,
        name: newLogisticsForm.contactName,
        phone: newLogisticsForm.contactPhone,
        mobile: newLogisticsForm.contactMobile,
        email: newLogisticsForm.contactEmail,
        customerCode: newLogisticsForm.customerCode
      },
      notes: newLogisticsForm.notes
    };

    // 更新物流商列表
    const updatedList = logisticsPartners.map(l =>
      l.id === selectedLogistics.id ? updatedLogistics : l
    );
    setLogisticsPartners(updatedList);

    // 显示成功提示
    toast.success(`物流商 ${newLogisticsForm.name} 更新成功！`, {
      description: `物流代码：${newLogisticsForm.code} | 评级：${newLogisticsForm.rating}`
    });

    // 关闭对话框并重置表单
    setEditDialogOpen(false);
    setSelectedLogistics(null);
    resetNewLogisticsForm();
  };

  // 🔥 删除物流商
  const handleDeleteLogistics = () => {
    if (!selectedLogistics) return;

    const updatedList = logisticsPartners.filter(l => l.id !== selectedLogistics.id);
    setLogisticsPartners(updatedList);

    toast.success(`物流商 ${selectedLogistics.name} 已删除`, {
      description: `物流代码：${selectedLogistics.code}`
    });

    setDeleteDialogOpen(false);
    setSelectedLogistics(null);
  };

  // 🔥 批量删除物流商
  const handleBatchDeleteLogistics = () => {
    if (selectedLogisticsIds.length === 0) return;

    const updatedList = logisticsPartners.filter(l => !selectedLogisticsIds.includes(l.id));
    setLogisticsPartners(updatedList);

    toast.success(`已删除 ${selectedLogisticsIds.length} 个物流商`, {
      description: `物流代码：${selectedLogisticsIds.join(', ')}`
    });

    setBatchDeleteDialogOpen(false);
    setSelectedLogisticsIds([]);
  };

  const types = [
    { id: 'all', label: '全部', count: logisticsPartners.length },
    { id: 'express', label: '快递', count: logisticsPartners.filter(l => l.type === 'express').length },
    { id: 'international', label: '国际物流', count: logisticsPartners.filter(l => l.type === 'international').length },
    { id: 'freight', label: '货运', count: logisticsPartners.filter(l => l.type === 'freight').length },
  ];

  const getTypeBadge = (type: string) => {
    const config: any = {
      express: { label: '快递', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      international: { label: '国际物流', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      freight: { label: '货运', color: 'bg-green-100 text-green-800 border-green-300' },
    };
    return config[type] || config.express;
  };

  const getRatingBadge = (rating: string) => {
    const config: any = {
      S: { label: 'S级', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      A: { label: 'A级', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      B: { label: 'B级', color: 'bg-green-100 text-green-800 border-green-300' },
      C: { label: 'C级', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    return config[rating] || config.C;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      active: { label: '合作中', color: 'bg-green-100 text-green-800 border-green-300' },
      inactive: { label: '暂停合作', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    return config[status] || config.active;
  };

  const filteredLogistics = logisticsPartners.filter(logistics => {
    const matchSearch = logistics.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       logistics.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || logistics.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>物流公司管理</h2>
              <p className="text-xs text-gray-500">管理快递、货运和国际物流合作伙伴</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            新增物流商
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">物流商总数</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{logisticsPartners.length}</p>
          <p className="text-xs text-gray-500 mt-1">A级: {logisticsPartners.filter(l => l.rating === 'A').length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计发货单</span>
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {logisticsPartners.reduce((sum, l) => sum + l.businessData.totalShipments, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">本月: 68</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计运费</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">¥115.8万</p>
          <p className="text-xs text-gray-500 mt-1">本月: ¥12.5万</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">平均准时率</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(logisticsPartners.reduce((sum, l) => sum + l.businessData.onTimeRate, 0) / logisticsPartners.length).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">破损率: {(logisticsPartners.reduce((sum, l) => sum + l.businessData.damageRate, 0) / logisticsPartners.length).toFixed(1)}%</p>
        </div>
      </div>

      {/* 类型过滤 + 搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          {types.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filterType === type.id
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              style={{ fontSize: '13px' }}
            >
              {type.label} ({type.count})
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索物流公司名称或代码..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* 🔥 批量删除按钮 */}
          {selectedLogisticsIds.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 h-9">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-700">
                已选中 <span className="font-bold text-orange-600">{selectedLogisticsIds.length}</span> 个
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 ml-2"
                onClick={() => setBatchDeleteDialogOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 物流商列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>
                  <Checkbox
                    checked={selectedLogisticsIds.length === filteredLogistics.length && filteredLogistics.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLogisticsIds(filteredLogistics.map(l => l.id));
                      } else {
                        setSelectedLogisticsIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>物流代码</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>物流公司</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>类型</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>评级</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>服务范围</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>发货单数</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>准时率</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>平均时效</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogistics.map((logistics, index) => {
                const typeBadge = getTypeBadge(logistics.type);
                const ratingBadge = getRatingBadge(logistics.rating);
                const statusBadge = getStatusBadge(logistics.status);
                const isSelected = selectedLogisticsIds.includes(logistics.id);
                
                return (
                  <TableRow key={logistics.id} className="hover:bg-gray-50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLogisticsIds([...selectedLogisticsIds, logistics.id]);
                            } else {
                              setSelectedLogisticsIds(selectedLogisticsIds.filter(id => id !== logistics.id));
                            }
                          }}
                        />
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-blue-600">{logistics.code}</p>
                        <p className="text-xs text-gray-500">{logistics.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{logistics.name}</p>
                        <p className="text-xs text-gray-500">{logistics.nameEn}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${typeBadge.color}`}>
                        {typeBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${ratingBadge.color}`}>
                        {ratingBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <div className="flex flex-wrap gap-1">
                        {logistics.serviceScope.regions.slice(0, 2).map((region: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                            {region}
                          </Badge>
                        ))}
                        {logistics.serviceScope.regions.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            +{logistics.serviceScope.regions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className="font-medium">{logistics.businessData.totalShipments}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className={`font-medium ${logistics.businessData.onTimeRate >= 95 ? 'text-green-600' : 'text-orange-600'}`}>
                        {logistics.businessData.onTimeRate}%
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium">{logistics.businessData.avgDeliveryTime}</p>
                        <p className="text-xs text-gray-500">天</p>
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
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedLogistics(logistics);
                            setDetailDialogOpen(true);
                          }}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="编辑物流商"
                          onClick={() => {
                            setSelectedLogistics(logistics);
                            setNewLogisticsForm({
                              code: logistics.code,
                              name: logistics.name,
                              nameEn: logistics.nameEn,
                              type: logistics.type,
                              serviceType: logistics.serviceType,
                              country: logistics.country,
                              rating: logistics.rating,
                              status: logistics.status,
                              contactName: logistics.contact.name,
                              contactPhone: logistics.contact.phone,
                              contactMobile: logistics.contact.mobile,
                              contactEmail: logistics.contact.email,
                              customerCode: logistics.contact.customerCode,
                              notes: logistics.notes
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-orange-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            setSelectedLogistics(logistics);
                            setDeleteDialogOpen(true);
                          }}
                          title="删除物流商"
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

      {/* 物流商详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              物流商详情 - {selectedLogistics?.name}
            </DialogTitle>
            <DialogDescription>
              物流代码：{selectedLogistics?.code} | 评级：{selectedLogistics?.rating}级
            </DialogDescription>
          </DialogHeader>

          {selectedLogistics && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  基本信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">公司名称：</span>
                    <span className="font-medium ml-2">{selectedLogistics.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">英文名称：</span>
                    <span className="font-medium ml-2">{selectedLogistics.nameEn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">服务类型：</span>
                    <span className="font-medium ml-2">{selectedLogistics.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">合作开始：</span>
                    <span className="font-medium ml-2">{selectedLogistics.businessData.cooperationStartDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">客户代码：</span>
                    <span className="font-medium ml-2">{selectedLogistics.contact.customerCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">月结折扣：</span>
                    <span className="font-medium ml-2">
                      {selectedLogistics.businessData.monthlyDiscount > 0 
                        ? `${selectedLogistics.businessData.monthlyDiscount}折`
                        : '按实际报价'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 联系方式 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  联系方式
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">客户经理：</span>
                    <span className="font-medium ml-2">{selectedLogistics.contact.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">手机：</span>
                    <span className="font-medium ml-2">{selectedLogistics.contact.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">客服电话：</span>
                    <span className="font-medium ml-2">{selectedLogistics.contact.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">邮箱：</span>
                    <span className="font-medium ml-2">{selectedLogistics.contact.email}</span>
                  </div>
                </div>
              </div>

              {/* 服务范围 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  服务范围
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLogistics.serviceScope.regions.map((region: string, idx: number) => (
                    <Badge key={idx} className="px-3 py-1 bg-blue-100 text-blue-800">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 服务项目和价格 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  服务项目和价格
                </h4>
                <div className="space-y-2">
                  {selectedLogistics.services.map((service: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.price}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {service.timeframe}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* 绩效数据 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  绩效数据
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">准时率</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedLogistics.businessData.onTimeRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">破损率</p>
                    <p className="text-2xl font-bold text-green-600">{selectedLogistics.businessData.damageRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">平均时效</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedLogistics.businessData.avgDeliveryTime}</p>
                    <p className="text-xs text-gray-500">天</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">累计发货：</span>
                    <span className="font-medium ml-2">{selectedLogistics.businessData.totalShipments} 单</span>
                  </div>
                  <div>
                    <span className="text-gray-500">累计运费：</span>
                    <span className="font-medium ml-2">
                      {selectedLogistics.businessData.currency === 'CNY' ? '¥' : '$'}
                      {(selectedLogistics.businessData.totalAmount / (selectedLogistics.businessData.currency === 'CNY' ? 10000 : 1000)).toFixed(1)}
                      {selectedLogistics.businessData.currency === 'CNY' ? '万' : 'K'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">最后发货：</span>
                    <span className="font-medium ml-2">{selectedLogistics.businessData.lastShipmentDate}</span>
                  </div>
                </div>
              </div>

              {/* 优势特点 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">优势特点</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLogistics.advantages.map((adv: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1">
                      ✓ {adv}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              {selectedLogistics.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">备注：</p>
                  <p className="text-sm text-gray-800">{selectedLogistics.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (selectedLogistics) {
                  setNewLogisticsForm({
                    code: selectedLogistics.code,
                    name: selectedLogistics.name,
                    nameEn: selectedLogistics.nameEn,
                    type: selectedLogistics.type,
                    serviceType: selectedLogistics.serviceType,
                    country: selectedLogistics.country,
                    rating: selectedLogistics.rating,
                    status: selectedLogistics.status,
                    contactName: selectedLogistics.contact.name,
                    contactPhone: selectedLogistics.contact.phone,
                    contactMobile: selectedLogistics.contact.mobile,
                    contactEmail: selectedLogistics.contact.email,
                    customerCode: selectedLogistics.contact.customerCode,
                    notes: selectedLogistics.notes
                  });
                  setDetailDialogOpen(false);
                  setEditDialogOpen(true);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑物流商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增物流商对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              新增物流商
            </DialogTitle>
            <DialogDescription>
              请填写物流商的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Truck className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流代码 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.code}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SF-EXPRESS"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.name}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, name: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：顺丰速运"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.nameEn}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, nameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SF Express"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流类型 *</Label>
                  <Select
                    value={newLogisticsForm.type}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, type: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">快递</SelectItem>
                      <SelectItem value="international">国际物流</SelectItem>
                      <SelectItem value="freight">货运</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">服务类型</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.serviceType}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, serviceType: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：国内快递 + 国际快递"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.country}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流商评级</Label>
                  <Select
                    value={newLogisticsForm.rating}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, rating: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择评级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S级（优秀）</SelectItem>
                      <SelectItem value="A">A级（良好）</SelectItem>
                      <SelectItem value="B">B级（一般）</SelectItem>
                      <SelectItem value="C">C级（考察中）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">合作状态</Label>
                  <Select
                    value={newLogisticsForm.status}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">合作中</SelectItem>
                      <SelectItem value="inactive">暂停合作</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 联系人信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Phone className="w-4 h-4 text-orange-600" />
                联系人信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">联系人姓名 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactName}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：李客户经理"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客服电话</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactPhone}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-400-111-1111"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactMobile}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0000-1111"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactEmail}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：vip@sf-express.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户代码</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.customerCode}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, customerCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：VIP-8888"
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
                  value={newLogisticsForm.notes}
                  onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：主力快递商，用于样品寄送，月结有折扣..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveNewLogistics}>
              <Plus className="w-4 h-4 mr-2" />
              保存物流商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑物流商对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              编辑物流商
            </DialogTitle>
            <DialogDescription>
              请填写物流商的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Truck className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流代码 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.code}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SF-EXPRESS"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.name}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, name: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：顺丰速运"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.nameEn}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, nameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SF Express"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流类型 *</Label>
                  <Select
                    value={newLogisticsForm.type}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, type: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">快递</SelectItem>
                      <SelectItem value="international">国际物流</SelectItem>
                      <SelectItem value="freight">货运</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">服务类型</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.serviceType}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, serviceType: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：国内快递 + 国际快递"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.country}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">物流商评级</Label>
                  <Select
                    value={newLogisticsForm.rating}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, rating: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择评级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S级（优秀）</SelectItem>
                      <SelectItem value="A">A级（良好）</SelectItem>
                      <SelectItem value="B">B级（一般）</SelectItem>
                      <SelectItem value="C">C级（考察中）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">合作状态</Label>
                  <Select
                    value={newLogisticsForm.status}
                    onValueChange={(value) => setNewLogisticsForm({ ...newLogisticsForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">合作中</SelectItem>
                      <SelectItem value="inactive">暂停合作</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 联系人信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Phone className="w-4 h-4 text-orange-600" />
                联系人信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">联系人姓名 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactName}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：李客户经理"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客服电话</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactPhone}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-400-111-1111"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactMobile}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0000-1111"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.contactEmail}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：vip@sf-express.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">客户代码</Label>
                  <Input
                    className="h-9"
                    value={newLogisticsForm.customerCode}
                    onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, customerCode: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：VIP-8888"
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
                  value={newLogisticsForm.notes}
                  onChange={(e) => setNewLogisticsForm({ ...newLogisticsForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：主力快递商，用于样品寄送，月结有折扣..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveEditLogistics}>
              <Plus className="w-4 h-4 mr-2" />
              保存物流商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 单条删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除物流商
            </DialogTitle>
            <DialogDescription className="text-left">
              您即将删除物流商 <span className="font-bold text-red-600">{selectedLogistics?.name}</span>，此操作不可恢复！
            </DialogDescription>
          </DialogHeader>

          {selectedLogistics && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
                <p className="text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    删除物流商将同时移除：
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>物流商基本信息</li>
                      <li>联系人信息</li>
                      <li>历史发货记录（{selectedLogistics.businessData.totalShipments} 单）</li>
                      <li>相关业务数据</li>
                    </ul>
                  </span>
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">物流商信息：</p>
                <div className="space-y-1 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">代码：</span>
                    <span className="font-medium">{selectedLogistics.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">名称：</span>
                    <span className="font-medium">{selectedLogistics.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">评级：</span>
                    <span className="font-medium">{selectedLogistics.rating}级</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteLogistics}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量删除确认对话框 */}
      <Dialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认批量删除
            </DialogTitle>
            <DialogDescription className="text-left">
              您即将删除 <span className="font-bold text-red-600">{selectedLogisticsIds.length}</span> 个物流商，此操作不可恢复！
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
            <p className="text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                删除物流商将同时移除：
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>物流商基本信息</li>
                  <li>联系人信息</li>
                  <li>历史发货记录</li>
                  <li>相关业务数据</li>
                </ul>
              </span>
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-gray-600 mb-2">即将删除的物流商：</p>
            <div className="space-y-1">
              {selectedLogisticsIds.map(id => {
                const logistics = logisticsPartners.find(l => l.id === id);
                return logistics ? (
                  <div key={id} className="text-sm text-gray-800 flex items-center gap-2">
                    <span className="text-red-600">•</span>
                    <span className="font-medium">{logistics.name}</span>
                    <span className="text-xs text-gray-500">({logistics.code})</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleBatchDeleteLogistics}
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
