import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Edit, Boxes, Mail, Phone, MapPin, Star, TrendingUp, Package, DollarSign, AlertCircle, CheckCircle, FileText, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商视角：下游供应商管理（我方的供应商）
 * - 管理原材料供应商
 * - 管理配件供应商
 * - 管理外协加工商
 * - 供应商评级和绩效管理
 */
export default function SubSupplierManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false); // 🔥 新增供应商对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false); // 🔥 编辑供应商对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // 🔥 删除确认对话框
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false); // 🔥 批量删除确认对话框
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]); // 🔥 选中的供应商ID列表

  // 🔥 下游供应商数据（改为状态管理）
  const [subSuppliers, setSubSuppliers] = useState([
    {
      id: 'SUP-001',
      code: 'SUP-RAW-001',
      name: '佛山陶瓷原料有限公司',
      nameEn: 'Foshan Ceramic Materials Co., Ltd.',
      category: 'raw_material', // 原材料
      type: '陶瓷原料',
      country: '中国',
      province: '广东省',
      city: '佛山市',
      rating: 'A', // 评级：S/A/B/C
      status: 'active',
      
      contact: {
        name: '张经理',
        phone: '+86-757-8888-8888',
        mobile: '+86-138-0757-8888',
        email: 'zhang@fsceramic.com',
        wechat: 'fsceramic_zhang'
      },
      
      address: '广东省佛山市禅城区陶瓷工业园',
      
      businessData: {
        cooperationStartDate: '2023-01-15',
        totalOrders: 89,
        totalAmount: 680000,
        currency: 'CNY',
        lastOrderDate: '2024-12-10',
        outstandingAmount: 45000,
        avgLeadTime: 7, // 平均交货期（天）
        onTimeDeliveryRate: 96.5, // 准时交货率
        qualityPassRate: 98.2, // 品质合格率
        priceCompetitiveness: 'high' // 价格竞争力
      },
      
      products: ['高岭土', '石英砂', '长石粉', '氧化铝'],
      certifications: ['ISO9001', 'ISO14001'],
      paymentTerms: '月结30天',
      notes: '主要原料供应商，品质稳定，价格合理。'
    },
    {
      id: 'SUP-002',
      code: 'SUP-PART-001',
      name: '温州五金配件厂',
      nameEn: 'Wenzhou Hardware Parts Factory',
      category: 'parts', // 配件
      type: '五金配件',
      country: '中国',
      province: '浙江省',
      city: '温州市',
      rating: 'A',
      status: 'active',
      
      contact: {
        name: '李总',
        phone: '+86-577-6666-6666',
        mobile: '+86-139-0577-6666',
        email: 'li@wzhardware.com',
        wechat: 'wzhardware_li'
      },
      
      address: '浙江省温州市龙湾区五金工业园',
      
      businessData: {
        cooperationStartDate: '2023-03-20',
        totalOrders: 125,
        totalAmount: 520000,
        currency: 'CNY',
        lastOrderDate: '2024-12-15',
        outstandingAmount: 32000,
        avgLeadTime: 10,
        onTimeDeliveryRate: 94.8,
        qualityPassRate: 97.5,
        priceCompetitiveness: 'medium'
      },
      
      products: ['门铰链', '门把手', '滑轨', '螺丝配件'],
      certifications: ['ISO9001'],
      paymentTerms: '货到付款',
      notes: '配件齐全，响应快速。'
    },
    {
      id: 'SUP-003',
      code: 'SUP-OEM-001',
      name: '泉州外协加工厂',
      nameEn: 'Quanzhou OEM Processing Factory',
      category: 'processing', // 外协加工
      type: '表面处理',
      country: '中国',
      province: '福建省',
      city: '泉州市',
      rating: 'B',
      status: 'active',
      
      contact: {
        name: '王厂长',
        phone: '+86-595-7777-7777',
        mobile: '+86-137-0595-7777',
        email: 'wang@qzoem.com',
        wechat: 'qzoem_wang'
      },
      
      address: '福建省泉州市晋江市工业园区',
      
      businessData: {
        cooperationStartDate: '2023-06-10',
        totalOrders: 56,
        totalAmount: 380000,
        currency: 'CNY',
        lastOrderDate: '2024-12-08',
        outstandingAmount: 28000,
        avgLeadTime: 5,
        onTimeDeliveryRate: 91.2,
        qualityPassRate: 95.8,
        priceCompetitiveness: 'high'
      },
      
      products: ['电镀', '喷涂', '抛光', '包装'],
      certifications: ['环保认证'],
      paymentTerms: '月结15天',
      notes: '加工质量有待提升，价格有优势。'
    }
  ]);

  // 🔥 新增供应商表单数据
  const [newSupplierForm, setNewSupplierForm] = useState({
    code: '',
    name: '',
    nameEn: '',
    category: 'raw_material',
    type: '',
    country: '中国',
    province: '',
    city: '',
    rating: 'C',
    status: 'evaluating',
    contactName: '',
    contactPhone: '',
    contactMobile: '',
    contactEmail: '',
    contactWechat: '',
    address: '',
    paymentTerms: '月结30天',
    notes: ''
  });

  // 🔥 自定义字段状态
  const [showCustomType, setShowCustomType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState('');

  // 🔥 预设选项列表（可扩展）
  const [supplierTypeOptions, setSupplierTypeOptions] = useState([
    '陶瓷原料', '五金配件', '电镀加工', '喷涂加工', '包装材料', '运输物流'
  ]);

  // 🔥 重置新增表单
  const resetNewSupplierForm = () => {
    setNewSupplierForm({
      code: '',
      name: '',
      nameEn: '',
      category: 'raw_material',
      type: '',
      country: '中国',
      province: '',
      city: '',
      rating: 'C',
      status: 'evaluating',
      contactName: '',
      contactPhone: '',
      contactMobile: '',
      contactEmail: '',
      contactWechat: '',
      address: '',
      paymentTerms: '月结30天',
      notes: ''
    });
    setShowCustomType(false);
    setCustomTypeInput('');
  };

  // 🔥 保存新增供应商
  const handleSaveNewSupplier = () => {
    // 🔥 处理自定义类型
    let finalType = newSupplierForm.type;
    if (newSupplierForm.type === 'custom' && customTypeInput.trim()) {
      finalType = customTypeInput.trim();
      // 添加到类型选项列表中
      if (!supplierTypeOptions.includes(finalType)) {
        setSupplierTypeOptions([...supplierTypeOptions, finalType]);
      }
    }

    // 表单验证
    if (!newSupplierForm.code) {
      toast.error('请输入供应商代码');
      return;
    }
    if (!newSupplierForm.name) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!newSupplierForm.nameEn) {
      toast.error('请输入公司名称（英文）');
      return;
    }
    if (!newSupplierForm.contactName) {
      toast.error('请输入主要联系人姓名');
      return;
    }
    if (!newSupplierForm.contactMobile) {
      toast.error('请输入联系人手机');
      return;
    }
    if (!newSupplierForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }

    // 检查供应商代码是否重复
    if (subSuppliers.some(s => s.code === newSupplierForm.code)) {
      toast.error('供应商代码已存在，请使用其他代码');
      return;
    }

    // 生成新供应商ID
    const newId = `SUP-${String(subSuppliers.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // 创建新供应商对象
    const newSupplier = {
      id: newId,
      code: newSupplierForm.code,
      name: newSupplierForm.name,
      nameEn: newSupplierForm.nameEn,
      category: newSupplierForm.category,
      type: finalType,
      country: newSupplierForm.country,
      province: newSupplierForm.province,
      city: newSupplierForm.city,
      rating: newSupplierForm.rating,
      status: newSupplierForm.status,
      contact: {
        name: newSupplierForm.contactName,
        phone: newSupplierForm.contactPhone,
        mobile: newSupplierForm.contactMobile,
        email: newSupplierForm.contactEmail,
        wechat: newSupplierForm.contactWechat
      },
      address: newSupplierForm.address,
      businessData: {
        cooperationStartDate: today,
        totalOrders: 0,
        totalAmount: 0,
        currency: 'CNY',
        lastOrderDate: '',
        outstandingAmount: 0,
        avgLeadTime: 0,
        onTimeDeliveryRate: 0,
        qualityPassRate: 0,
        priceCompetitiveness: 'medium'
      },
      products: [],
      certifications: [],
      paymentTerms: newSupplierForm.paymentTerms,
      notes: newSupplierForm.notes
    };

    // 添加到供应商列表
    setSubSuppliers([...subSuppliers, newSupplier]);

    // 显示成功提示
    toast.success(`供应商 ${newSupplierForm.name} 新增成功！`, {
      description: `供应商代码：${newSupplierForm.code} | 供应商评级：${newSupplierForm.rating}`
    });

    // 关闭对话框并重置表单
    setAddDialogOpen(false);
    resetNewSupplierForm();
  };

  // 🔥 删除供应商
  const handleDeleteSupplier = () => {
    if (!selectedSupplier) return;

    const updatedSuppliers = subSuppliers.filter(s => s.id !== selectedSupplier.id);
    setSubSuppliers(updatedSuppliers);

    toast.success(`供应商 ${selectedSupplier.name} 已删除`, {
      description: `供应商代码：${selectedSupplier.code}`
    });

    setDeleteDialogOpen(false);
    setSelectedSupplier(null);
  };

  // 🔥 批量删除供应商
  const handleBatchDeleteSuppliers = () => {
    if (selectedSupplierIds.length === 0) return;

    const updatedSuppliers = subSuppliers.filter(s => !selectedSupplierIds.includes(s.id));
    setSubSuppliers(updatedSuppliers);

    toast.success(`已删除 ${selectedSupplierIds.length} 个供应商`, {
      description: `供应商代码：${selectedSupplierIds.join(', ')}`
    });

    setBatchDeleteDialogOpen(false);
    setSelectedSupplierIds([]);
  };

  // 🔥 保存编辑供应商
  const handleSaveEditSupplier = () => {
    if (!selectedSupplier) return;

    // 🔥 处理自定义类型
    let finalType = newSupplierForm.type;
    if (newSupplierForm.type === 'custom' && customTypeInput.trim()) {
      finalType = customTypeInput.trim();
      // 添加到类型选项列表中
      if (!supplierTypeOptions.includes(finalType)) {
        setSupplierTypeOptions([...supplierTypeOptions, finalType]);
      }
    }

    // 表单验证
    if (!newSupplierForm.code) {
      toast.error('请输入供应商代码');
      return;
    }
    if (!newSupplierForm.name) {
      toast.error('请输入公司名称（中文）');
      return;
    }
    if (!newSupplierForm.nameEn) {
      toast.error('请输入公司名称（英文）');
      return;
    }
    if (!newSupplierForm.contactName) {
      toast.error('请输入主要联系人姓名');
      return;
    }
    if (!newSupplierForm.contactMobile) {
      toast.error('请输入联系人手机');
      return;
    }
    if (!newSupplierForm.contactEmail) {
      toast.error('请输入联系人邮箱');
      return;
    }

    // 检查供应商代码是否重复（排除当前编辑的供应商）
    if (subSuppliers.some(s => s.code === newSupplierForm.code && s.id !== selectedSupplier.id)) {
      toast.error('供应商代码已存在，请使用其他代码');
      return;
    }

    // 更新供应商对象
    const updatedSupplier = {
      ...selectedSupplier,
      code: newSupplierForm.code,
      name: newSupplierForm.name,
      nameEn: newSupplierForm.nameEn,
      category: newSupplierForm.category,
      type: finalType,
      country: newSupplierForm.country,
      province: newSupplierForm.province,
      city: newSupplierForm.city,
      rating: newSupplierForm.rating,
      status: newSupplierForm.status,
      contact: {
        name: newSupplierForm.contactName,
        phone: newSupplierForm.contactPhone,
        mobile: newSupplierForm.contactMobile,
        email: newSupplierForm.contactEmail,
        wechat: newSupplierForm.contactWechat
      },
      address: newSupplierForm.address,
      paymentTerms: newSupplierForm.paymentTerms,
      notes: newSupplierForm.notes
    };

    // 更新供应商列表
    const updatedSuppliers = subSuppliers.map(s =>
      s.id === selectedSupplier.id ? updatedSupplier : s
    );
    setSubSuppliers(updatedSuppliers);

    // 显示成功提示
    toast.success(`供应商 ${newSupplierForm.name} 更新成功！`, {
      description: `供应商代码：${newSupplierForm.code} | 供应商评级：${newSupplierForm.rating}`
    });

    // 关闭对话框并重置表单
    setEditDialogOpen(false);
    setSelectedSupplier(null);
    resetNewSupplierForm();
  };

  const categories = [
    { id: 'all', label: '全部', count: subSuppliers.length },
    { id: 'raw_material', label: '原材料', count: subSuppliers.filter(s => s.category === 'raw_material').length },
    { id: 'parts', label: '配件', count: subSuppliers.filter(s => s.category === 'parts').length },
    { id: 'processing', label: '外协加工', count: subSuppliers.filter(s => s.category === 'processing').length },
  ];

  const getCategoryBadge = (category: string) => {
    const config: any = {
      raw_material: { label: '原材料', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      parts: { label: '配件', color: 'bg-green-100 text-green-800 border-green-300' },
      processing: { label: '外协加工', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    };
    return config[category] || config.raw_material;
  };

  const getRatingBadge = (rating: string) => {
    const config: any = {
      S: { label: 'S级', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '⭐⭐⭐' },
      A: { label: 'A级', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '⭐⭐' },
      B: { label: 'B级', color: 'bg-green-100 text-green-800 border-green-300', icon: '⭐' },
      C: { label: 'C级', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: '' },
    };
    return config[rating] || config.C;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      active: { label: '合作中', color: 'bg-green-100 text-green-800 border-green-300' },
      inactive: { label: '暂停合作', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      evaluating: { label: '考察中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    };
    return config[status] || config.active;
  };

  const filteredSuppliers = subSuppliers.filter(supplier => {
    const matchSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       supplier.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || supplier.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Boxes className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>下游供应商管理</h2>
              <p className="text-xs text-gray-500">管理我方的原材料供应商、配件供应商和外协加工商</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            新增供应商
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">供应商总数</span>
            <Boxes className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{subSuppliers.length}</p>
          <p className="text-xs text-gray-500 mt-1">A级及以上: {subSuppliers.filter(s => ['S', 'A'].includes(s.rating)).length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计采购订单</span>
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {subSuppliers.reduce((sum, s) => sum + s.businessData.totalOrders, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">本月新增: 28</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">累计采购金额</span>
            <DollarSign className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ¥{(subSuppliers.reduce((sum, s) => sum + s.businessData.totalAmount, 0) / 10000).toFixed(1)}万
          </p>
          <p className="text-xs text-gray-500 mt-1">CNY</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">平均准时率</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(subSuppliers.reduce((sum, s) => sum + s.businessData.onTimeDeliveryRate, 0) / subSuppliers.length).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">品质合格率: {(subSuppliers.reduce((sum, s) => sum + s.businessData.qualityPassRate, 0) / subSuppliers.length).toFixed(1)}%</p>
        </div>
      </div>

      {/* 分类过滤 + 搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* 分类筛选 */}
        <div className="flex items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                filterCategory === cat.id
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              style={{ fontSize: '13px' }}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索供应商名称或代码..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>

          {/* 🔥 批量删除按钮 */}
          {selectedSupplierIds.length > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 h-9">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-700">
                已选中 <span className="font-bold text-orange-600">{selectedSupplierIds.length}</span> 个
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

      {/* 供应商列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>
                  <Checkbox
                    checked={selectedSupplierIds.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSupplierIds(filteredSuppliers.map(s => s.id));
                      } else {
                        setSelectedSupplierIds([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>供应商代码</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>供应商名称</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>分类</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>评级</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>联系人</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>采购订单</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>准时率</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>品质率</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier, index) => {
                const categoryBadge = getCategoryBadge(supplier.category);
                const ratingBadge = getRatingBadge(supplier.rating);
                const statusBadge = getStatusBadge(supplier.status);
                const isSelected = selectedSupplierIds.includes(supplier.id);
                
                return (
                  <TableRow key={supplier.id} className="hover:bg-gray-50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSupplierIds([...selectedSupplierIds, supplier.id]);
                            } else {
                              setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supplier.id));
                            }
                          }}
                        />
                        <span className="text-xs text-gray-500">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-blue-600">{supplier.code}</p>
                        <p className="text-xs text-gray-500">{supplier.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-xs text-gray-500">{supplier.city}, {supplier.province}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${categoryBadge.color}`}>
                        {categoryBadge.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${ratingBadge.color}`}>
                        {ratingBadge.label} {ratingBadge.icon}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{supplier.contact.name}</p>
                        <p className="text-xs text-gray-500">{supplier.contact.mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className="font-medium">{supplier.businessData.totalOrders}</span>
                      <span className="text-gray-500 ml-1">单</span>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <div>
                        <p className={`font-medium ${supplier.businessData.onTimeDeliveryRate >= 95 ? 'text-green-600' : 'text-orange-600'}`}>
                          {supplier.businessData.onTimeDeliveryRate}%
                        </p>
                        <p className="text-xs text-gray-500">{supplier.businessData.avgLeadTime}天</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className={`font-medium ${supplier.businessData.qualityPassRate >= 97 ? 'text-green-600' : 'text-orange-600'}`}>
                        {supplier.businessData.qualityPassRate}%
                      </span>
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
                            setSelectedSupplier(supplier);
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
                          title="编辑供应商"
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            // 预填充编辑表单
                            setNewSupplierForm({
                              code: supplier.code,
                              name: supplier.name,
                              nameEn: supplier.nameEn,
                              category: supplier.category,
                              type: supplier.type,
                              country: supplier.country,
                              province: supplier.province,
                              city: supplier.city,
                              rating: supplier.rating,
                              status: supplier.status,
                              contactName: supplier.contact.name,
                              contactPhone: supplier.contact.phone,
                              contactMobile: supplier.contact.mobile,
                              contactEmail: supplier.contact.email,
                              contactWechat: supplier.contact.wechat,
                              address: supplier.address,
                              paymentTerms: supplier.paymentTerms,
                              notes: supplier.notes
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
                            setSelectedSupplier(supplier);
                            setDeleteDialogOpen(true);
                          }}
                          title="删除供应商"
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

      {/* 供应商详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-600" />
              供应商详情 - {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>
              供应商代码：{selectedSupplier?.code} | 评级：{selectedSupplier?.rating}级
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Boxes className="w-4 h-4" />
                  基本信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">公司名称：</span>
                    <span className="font-medium ml-2">{selectedSupplier.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">英文名称：</span>
                    <span className="font-medium ml-2">{selectedSupplier.nameEn}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">供应类型：</span>
                    <span className="font-medium ml-2">{selectedSupplier.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">合作开始：</span>
                    <span className="font-medium ml-2">{selectedSupplier.businessData.cooperationStartDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">地址：</span>
                    <span className="font-medium ml-2">{selectedSupplier.address}</span>
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
                    <span className="text-gray-500">联系人：</span>
                    <span className="font-medium ml-2">{selectedSupplier.contact.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">手机：</span>
                    <span className="font-medium ml-2">{selectedSupplier.contact.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">电话：</span>
                    <span className="font-medium ml-2">{selectedSupplier.contact.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">邮箱：</span>
                    <span className="font-medium ml-2">{selectedSupplier.contact.email}</span>
                  </div>
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
                    <p className="text-xs text-gray-600 mb-1">准时交货率</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedSupplier.businessData.onTimeDeliveryRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">品质合格率</p>
                    <p className="text-2xl font-bold text-green-600">{selectedSupplier.businessData.qualityPassRate}%</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">平均交期</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedSupplier.businessData.avgLeadTime}</p>
                    <p className="text-xs text-gray-500">天</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">累计订单：</span>
                    <span className="font-medium ml-2">{selectedSupplier.businessData.totalOrders} 单</span>
                  </div>
                  <div>
                    <span className="text-gray-500">累计金额：</span>
                    <span className="font-medium ml-2">¥{(selectedSupplier.businessData.totalAmount / 10000).toFixed(1)}万</span>
                  </div>
                  <div>
                    <span className="text-gray-500">付款条款：</span>
                    <span className="font-medium ml-2">{selectedSupplier.paymentTerms}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">价格竞争力：</span>
                    <Badge className={`ml-2 h-5 px-2 text-xs ${
                      selectedSupplier.businessData.priceCompetitiveness === 'high' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSupplier.businessData.priceCompetitiveness === 'high' ? '高' : '中'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 主要产品 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">主要供应产品</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.products.map((product: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 资质认证 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  资质认证
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSupplier.certifications.map((cert: string, idx: number) => (
                    <Badge key={idx} className="px-3 py-1 bg-green-100 text-green-800">
                      ✓ {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 备注 */}
              {selectedSupplier.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    备注：
                  </p>
                  <p className="text-sm text-gray-800">{selectedSupplier.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                if (selectedSupplier) {
                  // 预填充编辑表单
                  setNewSupplierForm({
                    code: selectedSupplier.code,
                    name: selectedSupplier.name,
                    nameEn: selectedSupplier.nameEn,
                    category: selectedSupplier.category,
                    type: selectedSupplier.type,
                    country: selectedSupplier.country,
                    province: selectedSupplier.province,
                    city: selectedSupplier.city,
                    rating: selectedSupplier.rating,
                    status: selectedSupplier.status,
                    contactName: selectedSupplier.contact.name,
                    contactPhone: selectedSupplier.contact.phone,
                    contactMobile: selectedSupplier.contact.mobile,
                    contactEmail: selectedSupplier.contact.email,
                    contactWechat: selectedSupplier.contact.wechat,
                    address: selectedSupplier.address,
                    paymentTerms: selectedSupplier.paymentTerms,
                    notes: selectedSupplier.notes
                  });
                  // 关闭详情对话框，打开编辑对话框
                  setDetailDialogOpen(false);
                  setEditDialogOpen(true);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑供应商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增供应商对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-600" />
              新增供应商
            </DialogTitle>
            <DialogDescription>
              请填写供应商的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          {/* 🔥 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Boxes className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应商代码 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.code}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SUP-RAW-002"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.name}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：佛山陶瓷原料有限公司"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.nameEn}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, nameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：Foshan Ceramic Materials Co"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应商分类 *</Label>
                  <Select
                    value={newSupplierForm.category}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, category: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">原材料</SelectItem>
                      <SelectItem value="parts">配件</SelectItem>
                      <SelectItem value="processing">外协加工</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应类型</Label>
                  <Select
                    value={newSupplierForm.type}
                    onValueChange={(value) => {
                      setNewSupplierForm({ ...newSupplierForm, type: value });
                      if (value === 'custom') {
                        setShowCustomType(true);
                      } else {
                        setShowCustomType(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选��类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierTypeOptions.map((option) => (
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
                  <Label className="text-xs text-gray-500 mb-1">供应商评级</Label>
                  <Select
                    value={newSupplierForm.rating}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, rating: value })}
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
                    value={newSupplierForm.status}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">合作中</SelectItem>
                      <SelectItem value="evaluating">考察中</SelectItem>
                      <SelectItem value="inactive">暂停合作</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.country}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">省份</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.province}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, province: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：广东省"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">城市</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.city}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, city: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：佛山市"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">公司地址</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.address}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：广东省佛山市禅城区陶瓷工业园"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">付款条款</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.paymentTerms}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, paymentTerms: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：月结30天"
                  />
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
                    value={newSupplierForm.contactName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：张经理"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">电话</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactPhone}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-757-8888-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactMobile}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0757-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactEmail}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：zhang@fsceramic.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">微信</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactWechat}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactWechat: e.target.value })}
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
                  value={newSupplierForm.notes}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：主要原料供应商，品质稳定，价格合理..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveNewSupplier}>
              <Plus className="w-4 h-4 mr-2" />
              保存供应商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 批量删除确认对话框 */}
      <Dialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认批量删除
            </DialogTitle>
            <DialogDescription className="text-left">
              您即将删除 <span className="font-bold text-red-600">{selectedSupplierIds.length}</span> 个供应商，此操作不可恢复！
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
            <p className="text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                删除供应商将同时移除：
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>供应商基本信息</li>
                  <li>联系人信息</li>
                  <li>历史合作记录</li>
                  <li>相关业务数据</li>
                </ul>
              </span>
            </p>
          </div>

          <div className="bg-gray-100 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-gray-600 mb-2">即将删除的供应商：</p>
            <div className="space-y-1">
              {selectedSupplierIds.map(id => {
                const supplier = subSuppliers.find(s => s.id === id);
                return supplier ? (
                  <div key={id} className="text-sm text-gray-800 flex items-center gap-2">
                    <span className="text-red-600">•</span>
                    <span className="font-medium">{supplier.name}</span>
                    <span className="text-xs text-gray-500">({supplier.code})</span>
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
              onClick={handleBatchDeleteSuppliers}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 单条删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              确认删除供应商
            </DialogTitle>
            <DialogDescription className="text-left">
              您即将删除供应商 <span className="font-bold text-red-600">{selectedSupplier?.name}</span>，此操作不可恢复！
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4">
                <p className="text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    删除供应商将同时移除：
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>供应商基本信息</li>
                      <li>联系人信息</li>
                      <li>历史合作记录（{selectedSupplier.businessData.totalOrders} 个订单）</li>
                      <li>相关业务数据（累计 ¥{(selectedSupplier.businessData.totalAmount / 10000).toFixed(1)}万）</li>
                    </ul>
                  </span>
                </p>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-2">供应商信息：</p>
                <div className="space-y-1 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">代码：</span>
                    <span className="font-medium">{selectedSupplier.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">名称：</span>
                    <span className="font-medium">{selectedSupplier.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">评级：</span>
                    <span className="font-medium">{selectedSupplier.rating}级</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">合作开始：</span>
                    <span className="font-medium">{selectedSupplier.businessData.cooperationStartDate}</span>
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
              onClick={handleDeleteSupplier}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑供应商对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-600" />
              编辑供应商
            </DialogTitle>
            <DialogDescription>
              请填写供应商的基本信息和联系人信息
            </DialogDescription>
          </DialogHeader>

          {/* 🔥 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-1">
            {/* 基本信息 */}
            <div className="space-y-3 mb-5">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 pb-2 border-b">
                <Boxes className="w-4 h-4 text-orange-600" />
                基本信息
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应商代码 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.code}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, code: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：SUP-RAW-002"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（中文） *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.name}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：佛山陶瓷原料有限公司"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">公司名称（英文） *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.nameEn}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, nameEn: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：Foshan Ceramic Materials Co"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应商分类 *</Label>
                  <Select
                    value={newSupplierForm.category}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, category: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_material">原材料</SelectItem>
                      <SelectItem value="parts">配件</SelectItem>
                      <SelectItem value="processing">外协加工</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">供应类型</Label>
                  <Select
                    value={newSupplierForm.type}
                    onValueChange={(value) => {
                      setNewSupplierForm({ ...newSupplierForm, type: value });
                      if (value === 'custom') {
                        setShowCustomType(true);
                      } else {
                        setShowCustomType(false);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierTypeOptions.map((option) => (
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
                  <Label className="text-xs text-gray-500 mb-1">供应商评级</Label>
                  <Select
                    value={newSupplierForm.rating}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, rating: value })}
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
                    value={newSupplierForm.status}
                    onValueChange={(value) => setNewSupplierForm({ ...newSupplierForm, status: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="请选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">合作中</SelectItem>
                      <SelectItem value="evaluating">考察中</SelectItem>
                      <SelectItem value="inactive">暂停合作</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">国家/地区</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.country}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, country: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：中国"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">省份</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.province}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, province: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：广东省"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500 mb-1">城市</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.city}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, city: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：佛山市"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">公司地址</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.address}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：广东省佛山市禅城区陶瓷工业园"
                  />
                </div>

                <div className="col-span-3">
                  <Label className="text-xs text-gray-500 mb-1">付款条款</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.paymentTerms}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, paymentTerms: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：月结30天"
                  />
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
                    value={newSupplierForm.contactName}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactName: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：张经理"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">电话</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactPhone}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactPhone: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-757-8888-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">手机 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactMobile}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactMobile: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：+86-138-0757-8888"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">邮箱 *</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactEmail}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactEmail: e.target.value })}
                    style={{ fontSize: '13px' }}
                    placeholder="例如：zhang@fsceramic.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1">微信</Label>
                  <Input
                    className="h-9"
                    value={newSupplierForm.contactWechat}
                    onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contactWechat: e.target.value })}
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
                  value={newSupplierForm.notes}
                  onChange={(e) => setNewSupplierForm({ ...newSupplierForm, notes: e.target.value })}
                  style={{ fontSize: '13px' }}
                  placeholder="例如：主要原料供应商，品质稳定，价格合理..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleSaveEditSupplier}>
              <Plus className="w-4 h-4 mr-2" />
              保存供应商
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}