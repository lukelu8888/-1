import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { Search, Plus, Eye, Package, Image as ImageIcon, FileText, Link as LinkIcon, Edit, Trash2, Send, Upload, File, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner@2.0.3';
import { loadSupplierCategories, saveSupplierCategories } from '../../../data/industryTemplates';
import { getActiveSupplierCustomers } from '../../../data/supplierCustomers'; // 🔥 导入供应商客户数据

/**
 * 🔥 供应商视角：客户来样管理
 * - 客户送来的样品登记
 * - 来样照片、尺寸、分析报告
 * - 关联询价单和产前样
 * - 文件上传和邮件发送功能
 */
export default function CustomerSamples() {
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false); // 🔥 新增编辑对话框
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 🔥 批量选择状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 新增来样表单
  const [sampleForm, setSampleForm] = useState({
    photos: [] as File[],
    customer: '',
    productName: '',
    productCategory: '',
    quantity: '',
    description: '',
    relatedRFQ: '',
    notes: '',
  });

  // 🔥 编辑表单
  const [editForm, setEditForm] = useState({
    id: '',
    customer: '',
    productName: '',
    productCategory: '',
    quantity: '',
    description: '',
    relatedRFQ: '',
    notes: '',
    status: 'pending',
  });

  // 🔥 发送表单
  const [sendForm, setSendForm] = useState({
    method: 'email',
    recipient: '',
    subject: '',
    message: '',
  });

  // 🔥 动态加载供应商自定义的产品分类
  const supplierCategories = loadSupplierCategories();

  // 🔥 客户列表（从供应商客户管理模块获取）
  // 数据来源：/data/supplierCustomers.ts
  // 说明：这些是分配给当前供应商账户的客户，不是Admin CRM的客户
  const supplierCustomers = getActiveSupplierCustomers();
  const customerList = supplierCustomers.map(customer => ({
    id: customer.id,
    name: customer.companyName,
    nameEn: customer.companyNameEn,
    region: customer.region,
    country: customer.country,
    city: customer.city,
    status: customer.status
  }));

  // 🔥 模拟询价单数据（实际应从后端获取）
  const [availableRFQs, setAvailableRFQs] = useState([
    {
      id: 'RFQ-2024-045',
      customer: '福建高盛达富建材有限公司',
      productName: '马赛克瓷砖',
      date: '2024-11-20',
      status: 'processing'
    },
    {
      id: 'RFQ-2024-058',
      customer: '福建高盛达富建材有限公司',
      productName: '抛光砖',
      date: '2024-12-10',
      status: 'processing'
    },
    {
      id: 'RFQ-2024-062',
      customer: '福建高盛达富建材有限公司',
      productName: '大理石瓷砖',
      date: '2024-12-15',
      status: 'quoted'
    },
    {
      id: 'RFQ-2024-071',
      customer: '福建高盛达富建材有限公司',
      productName: '钢制门框',
      date: '2024-12-18',
      status: 'processing'
    },
    {
      id: 'RFQ-2024-075',
      customer: '福建高盛达富建材有限公司',
      productName: '不锈钢水槽',
      date: '2024-12-18',
      status: 'new'
    },
  ]);

  // 🔥 来样数据 - 改为状态管理
  const [samples, setSamples] = useState([
    {
      id: 'SAMPLE-2024-001',
      sampleNo: 'COSUN-SAMPLE-1128',
      customer: '福建高盛达富建材有限公司',
      productName: '马赛克瓷砖（来样定制）',
      productCategory: '建材陶瓷',
      receivedDate: '2024-11-28',
      receivedBy: '业务部-陈经理',
      
      sampleInfo: {
        quantity: 3,
        description: '300x300mm 混合色马赛克',
        photos: 3,
        measurements: '已测量',
        analysis: '已完成'
      },
      
      relatedRFQ: 'RFQ-2024-045',
      relatedPreSample: 'PPS-2024-005',
      relatedProduct: 'PROD-2024-004',
      
      status: 'in_development',
      notes: '客户要求保持色彩搭配，调整尺寸为300x300',

      analysisReport: {
        material: '陶瓷',
        size: '300x300x8mm',
        weight: '0.8kg/片',
        color: '混合色（米白、灰蓝、浅咖）',
        finish: '哑光',
        strength: '符合国标',
        waterAbsorption: '< 0.5%',
      }
    },
    {
      id: 'SAMPLE-2024-002',
      sampleNo: 'COSUN-SAMPLE-1215',
      customer: '福建高盛达富建材有限公司',
      productName: '抛光砖（来样定制）',
      productCategory: '建材陶瓷',
      receivedDate: '2024-12-15',
      receivedBy: '业务部-王经理',
      
      sampleInfo: {
        quantity: 5,
        description: '600x600mm 米黄色抛光砖',
        photos: 4,
        measurements: '已测量',
        analysis: '进行中'
      },
      
      relatedRFQ: 'RFQ-2024-058',
      relatedPreSample: null,
      relatedProduct: null,
      
      status: 'analyzing',
      notes: '客户要求高光度，需要技术部门进一步分析',

      analysisReport: {
        material: '陶瓷',
        size: '600x600x10mm',
        weight: '1.2kg/片',
        color: '米黄色',
        finish: '抛光',
        strength: '测试中',
        waterAbsorption: '测试中',
      }
    },
    {
      id: 'SAMPLE-2024-003',
      sampleNo: 'COSUN-SAMPLE-1218',
      customer: '福建高盛达富建材有限公司',
      productName: '大理石瓷砖（来样定制）',
      productCategory: '建材陶瓷',
      receivedDate: '2024-12-18',
      receivedBy: '业务部-陈经理',
      
      sampleInfo: {
        quantity: 2,
        description: '800x800mm 卡拉拉白大理石纹',
        photos: 6,
        measurements: '待测量',
        analysis: '待分析'
      },
      
      relatedRFQ: 'RFQ-2024-062',
      relatedPreSample: null,
      relatedProduct: null,
      
      status: 'received',
      notes: '刚收到样品，等待技术部门检验',

      analysisReport: null
    }
  ]);

  const getStatusConfig = (status: string) => {
    const config: any = {
      received: { label: '已收样', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      analyzing: { label: '分析中', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      in_development: { label: '开发中', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return config[status] || config.received;
  };

  const filteredSamples = samples.filter(sample => {
    const matchSearch = sample.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sample.sampleNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sample.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === 'all' || sample.productCategory === filterCategory;
    const matchStatus = filterStatus === 'all' || sample.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // 🔥 批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的来样');
      return;
    }
    
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个来样吗？此操作无法撤销。`)) {
      // 从列表中移除选中的来样
      setSamples(samples.filter(sample => !selectedIds.includes(sample.id)));
      toast.success(`已删除 ${selectedIds.length} 个来样`);
      setSelectedIds([]);
    }
  };

  // 🔥 处理照片选择
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setSampleForm({
        ...sampleForm,
        photos: [...sampleForm.photos, ...files]
      });
      toast.success(`已添加 ${files.length} 张照片`);
    }
  };

  // 移除照片
  const removePhoto = (index: number) => {
    const newPhotos = [...sampleForm.photos];
    newPhotos.splice(index, 1);
    setSampleForm({ ...sampleForm, photos: newPhotos });
  };

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>来样管理</h2>
              <p className="text-xs text-gray-500">客户送样登记、分析报告和开发跟进</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            新增来样
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">来样总数</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{samples.length}</p>
          <p className="text-xs text-gray-500 mt-1">本月: +2</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">分析中</span>
            <FileText className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {samples.filter(s => s.status === 'analyzing').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">待完成</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">开发中</span>
            <Edit className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {samples.filter(s => s.status === 'in_development').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">进行中</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已完成</span>
            <Package className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {samples.filter(s => s.status === 'completed').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">成功率: 100%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">平均周期</span>
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">15</p>
          <p className="text-xs text-gray-500 mt-1">天</p>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索样品编号、产品名称或客户..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
          <Button
            variant="outline"
            className="h-9 px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={handleBatchDelete}
            disabled={selectedIds.length === 0}
            style={{ fontSize: '13px' }}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            批量删除 {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 h-9" style={{ fontSize: '13px' }}>
              <SelectValue placeholder="产品类别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类别</SelectItem>
              {supplierCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32 h-9" style={{ fontSize: '13px' }}>
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="received">已收样</SelectItem>
              <SelectItem value="analyzing">分析中</SelectItem>
              <SelectItem value="in_development">开发中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 来样列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={filteredSamples.length > 0 && selectedIds.length === filteredSamples.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(filteredSamples.map(s => s.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                    <span>序号</span>
                  </div>
                </TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>样品编号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品名称</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>客户</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>产品类别</TableHead>
                <TableHead className="h-9 w-20 text-center" style={{ fontSize: '12px' }}>数量</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>收样日期</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>接收人</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>关联询价</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSamples.length > 0 ? (
                filteredSamples.map((sample, index) => {
                  const statusConfig = getStatusConfig(sample.status);
                  
                  return (
                    <TableRow key={sample.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedIds.includes(sample.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds([...selectedIds, sample.id]);
                              } else {
                                setSelectedIds(selectedIds.filter(id => id !== sample.id));
                              }
                            }}
                          />
                          <span className="text-gray-500 font-medium">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{sample.sampleNo}</p>
                          <p className="text-xs text-gray-500">{sample.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{sample.productName}</p>
                          <p className="text-xs text-gray-500">{sample.sampleInfo.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <span className="font-medium text-gray-900">{sample.customer}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <Badge variant="outline" className="h-5 px-2 text-xs">
                          {sample.productCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <span className="font-medium">{sample.sampleInfo.quantity}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">{sample.receivedDate}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <span className="text-gray-700">{sample.receivedBy}</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        {sample.relatedRFQ ? (
                          <Badge variant="outline" className="h-5 px-2 text-xs text-orange-600 border-orange-300">
                            {sample.relatedRFQ}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              setSelectedSample(sample);
                              setDetailDialogOpen(true);
                            }}
                            title="详情"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700"
                            onClick={() => {
                              setSelectedSample(sample);
                              setSendForm({
                                method: 'email',
                                recipient: '',
                                subject: `来样分析报告 - ${sample.sampleNo} ${sample.productName}`,
                                message: `尊敬的客户，\n\n附件是样品 ${sample.sampleNo} 的分析报告，请查收。\n\n样品信息：\n• 产品名称：${sample.productName}\n• 数量：${sample.sampleInfo.quantity}件\n• 描述：${sample.sampleInfo.description}\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
                              });
                              setSendDialogOpen(true);
                            }}
                            title="发送"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setSelectedSample(sample);
                              setEditForm({
                                id: sample.id,
                                customer: sample.customer,
                                productName: sample.productName,
                                productCategory: sample.productCategory,
                                quantity: sample.sampleInfo.quantity.toString(),
                                description: sample.sampleInfo.description,
                                relatedRFQ: sample.relatedRFQ || '',
                                notes: sample.notes || '',
                                status: sample.status,
                              });
                              setEditDialogOpen(true);
                            }}
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`确定要删除来样"${sample.productName}"吗？此操作无法撤销。`)) {
                                setSamples(samples.filter(s => s.id !== sample.id));
                                toast.success('删除成功！', {
                                  description: `已删除来样：${sample.sampleNo}`,
                                  duration: 3000,
                                });
                              }
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无来样数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 来样详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              来样详情 - {selectedSample?.sampleNo}
            </DialogTitle>
            <DialogDescription>
              {selectedSample?.productName}
            </DialogDescription>
          </DialogHeader>

          {selectedSample && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">样品编号：</span>
                    <span className="font-medium ml-2">{selectedSample.sampleNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">客户名称：</span>
                    <span className="font-medium ml-2">{selectedSample.customer}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">产品名称：</span>
                    <span className="font-medium ml-2">{selectedSample.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">产品类别：</span>
                    <span className="font-medium ml-2">{selectedSample.productCategory}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">收样日期：</span>
                    <span className="font-medium ml-2">{selectedSample.receivedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">接收人：</span>
                    <span className="font-medium ml-2">{selectedSample.receivedBy}</span>
                  </div>
                </div>
              </div>

              {/* 样品信息 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">样品信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">数量：</span>
                    <span className="font-medium ml-2">{selectedSample.sampleInfo.quantity} 件</span>
                  </div>
                  <div>
                    <span className="text-gray-500">照片：</span>
                    <span className="font-medium ml-2">{selectedSample.sampleInfo.photos} 张</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">描述：</span>
                    <span className="font-medium ml-2">{selectedSample.sampleInfo.description}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">测量状态：</span>
                    <Badge variant="outline" className="ml-2 h-5 px-2 text-xs">
                      {selectedSample.sampleInfo.measurements}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">分析状态：</span>
                    <Badge variant="outline" className="ml-2 h-5 px-2 text-xs">
                      {selectedSample.sampleInfo.analysis}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 分析报告 */}
              {selectedSample.analysisReport && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">📊 分析报告</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">材质：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.material}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">尺寸：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">重量：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.weight}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">颜色：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.color}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">表面处理：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.finish}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">强度：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.strength}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">吸水率：</span>
                      <span className="font-medium ml-2">{selectedSample.analysisReport.waterAbsorption}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 关联信息 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">关联信息</h4>
                <div className="space-y-2">
                  {selectedSample.relatedRFQ && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">关联询价：</span>
                      <Badge variant="outline" className="px-3 py-1">{selectedSample.relatedRFQ}</Badge>
                    </div>
                  )}
                  {selectedSample.relatedPreSample && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">产前样：</span>
                      <Badge variant="outline" className="px-3 py-1">{selectedSample.relatedPreSample}</Badge>
                    </div>
                  )}
                  {selectedSample.relatedProduct && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">产品编号：</span>
                      <Badge variant="outline" className="px-3 py-1">{selectedSample.relatedProduct}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* 备注 */}
              {selectedSample.notes && (
                <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">备注：</p>
                  <p className="text-sm text-gray-800">{selectedSample.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setDetailDialogOpen(false);
                setSendForm({
                  method: 'email',
                  recipient: '',
                  subject: `来样分析报告 - ${selectedSample.sampleNo} ${selectedSample.productName}`,
                  message: `尊敬的客户，\n\n附件是样品 ${selectedSample.sampleNo} 的分析报告，请查收。\n\n样品信息：\n• 产品名称：${selectedSample.productName}\n• 数量：${selectedSample.sampleInfo.quantity}件\n• 描述：${selectedSample.sampleInfo.description}\n\n如有任何问题，欢迎随时联系我们。\n\n此致\n敬礼！`,
                });
                setSendDialogOpen(true);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              发送报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 新增来样对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-600" />
              新增来样
            </DialogTitle>
            <DialogDescription>
              登记客户送来的样品
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 照片上传 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                />
                <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <p className="font-medium text-gray-900">点击上传样品照片</p>
                  <p className="text-xs text-gray-500">支持多张图片，JPG、PNG格式</p>
                </label>
              </div>

              {/* 已选照片列表 */}
              {sampleForm.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {sampleForm.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-200 rounded border overflow-hidden flex items-center justify-center">
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-center mt-1 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 样品信息 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium mb-3">样品信息</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customer" className="text-xs text-gray-600 mb-1 block">客户名称</Label>
                  <Select value={sampleForm.customer} onValueChange={(value) => setSampleForm({ ...sampleForm, customer: value })}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerList.map((customer) => (
                        <SelectItem key={customer.id} value={customer.name}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-xs text-gray-400">({customer.nameEn})</span>
                            </div>
                            <span className="text-xs text-gray-500">{customer.city}, {customer.country}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productCategory" className="text-xs text-gray-600 mb-1 block">产品类别</Label>
                  <Select value={sampleForm.productCategory} onValueChange={(value) => setSampleForm({ ...sampleForm, productCategory: value })}>
                    <SelectTrigger id="productCategory">
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="productName" className="text-xs text-gray-600 mb-1 block">产品名称</Label>
                  <Input
                    id="productName"
                    placeholder="输入产品名称..."
                    value={sampleForm.productName}
                    onChange={(e) => setSampleForm({ ...sampleForm, productName: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-xs text-gray-600 mb-1 block">数量</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="输入数量..."
                    value={sampleForm.quantity}
                    onChange={(e) => setSampleForm({ ...sampleForm, quantity: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="relatedRFQ" className="text-xs text-gray-600 mb-1 block">关联询价单</Label>
                  <Select 
                    value={sampleForm.relatedRFQ} 
                    onValueChange={(value) => setSampleForm({ ...sampleForm, relatedRFQ: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger id="relatedRFQ" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择询价单（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500">不关联询价单</span>
                      </SelectItem>
                      {availableRFQs.map((rfq) => (
                        <SelectItem key={rfq.id} value={rfq.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rfq.id}</span>
                            <span className="text-gray-500">-</span>
                            <span className="text-xs text-gray-600">{rfq.customer}</span>
                            <span className="text-xs text-gray-500">{rfq.productName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description" className="text-xs text-gray-600 mb-1 block">样品描述</Label>
                  <Textarea
                    id="description"
                    placeholder="输入样品详细描述..."
                    value={sampleForm.description}
                    onChange={(e) => setSampleForm({ ...sampleForm, description: e.target.value })}
                    rows={3}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="输入备注信息..."
                    value={sampleForm.notes}
                    onChange={(e) => setSampleForm({ ...sampleForm, notes: e.target.value })}
                    rows={2}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={() => {
                if (!sampleForm.customer || !sampleForm.productName) {
                  toast.error('请填写客户名称和产品名称！');
                  return;
                }
                
                // 🔥 生成新的样品编号和ID
                const newId = `SAMPLE-2024-${String(samples.length + 1).padStart(3, '0')}`;
                const today = new Date();
                const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                const newSampleNo = `${sampleForm.customer.toUpperCase()}-SAMPLE-${dateStr}`;
                
                // 🔥 创建新的样品数据
                const newSample = {
                  id: newId,
                  sampleNo: newSampleNo,
                  customer: sampleForm.customer,
                  productName: sampleForm.productName,
                  productCategory: sampleForm.productCategory || '未分类',
                  receivedDate: today.toISOString().split('T')[0],
                  receivedBy: '业务部-采购员',
                  
                  sampleInfo: {
                    quantity: parseInt(sampleForm.quantity) || 0,
                    description: sampleForm.description,
                    photos: sampleForm.photos.length,
                    measurements: '待测量',
                    analysis: '待分析'
                  },
                  
                  relatedRFQ: sampleForm.relatedRFQ || null,
                  relatedPreSample: null,
                  relatedProduct: null,
                  
                  status: 'received',
                  notes: sampleForm.notes,

                  analysisReport: null
                };
                
                // 🔥 添加到列表顶部
                setSamples([newSample, ...samples]);
                
                toast.success('来样登记成功！', {
                  description: `${sampleForm.productName} 已成功登记 - ${newSampleNo}`,
                  duration: 3000,
                });
                setAddDialogOpen(false);
                
                // 重置表单
                setSampleForm({
                  photos: [],
                  customer: '',
                  productName: '',
                  productCategory: '',
                  quantity: '',
                  description: '',
                  relatedRFQ: '',
                  notes: '',
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              确认登记
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑来样对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              编辑来样
            </DialogTitle>
            <DialogDescription>
              修改客户送来的样品信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 照片上传 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="text-center">
                <input
                  type="file"
                  id="photo-upload"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                />
                <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <p className="font-medium text-gray-900">点击上传样品照片</p>
                  <p className="text-xs text-gray-500">支持多张图片，JPG、PNG格式</p>
                </label>
              </div>

              {/* 已选照片列表 */}
              {sampleForm.photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {sampleForm.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-200 rounded border overflow-hidden flex items-center justify-center">
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-center mt-1 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 样品信息 */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium mb-3">样品信息</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-customer" className="text-xs text-gray-600 mb-1 block">客户名称</Label>
                  <Select value={editForm.customer} onValueChange={(value) => setEditForm({ ...editForm, customer: value })}>
                    <SelectTrigger id="edit-customer">
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerList.map((customer) => (
                        <SelectItem key={customer.id} value={customer.name}>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-xs text-gray-400">({customer.nameEn})</span>
                            </div>
                            <span className="text-xs text-gray-500">{customer.city}, {customer.country}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productCategory" className="text-xs text-gray-600 mb-1 block">产品类别</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={editForm.productCategory} 
                      onValueChange={(value) => {
                        if (value === '__add_new__') {
                          const newCategory = prompt('请输入新的产品类别名称：');
                          if (newCategory && newCategory.trim()) {
                            const updatedCategories = [...supplierCategories, newCategory.trim()];
                            saveSupplierCategories(updatedCategories);
                            setEditForm({ ...editForm, productCategory: newCategory.trim() });
                            toast.success(`已添加新类别："${newCategory.trim()}"`);
                            // 刷新页面以重新加载类别
                            window.location.reload();
                          }
                        } else {
                          setEditForm({ ...editForm, productCategory: value });
                        }
                      }}
                    >
                      <SelectTrigger id="productCategory" style={{ fontSize: '13px' }} className="flex-1">
                        <SelectValue placeholder="选择类别" />
                      </SelectTrigger>
                      <SelectContent>
                        {supplierCategories.length === 0 ? (
                          <SelectItem value="__placeholder__" disabled>
                            暂无类别，请先添加
                          </SelectItem>
                        ) : (
                          supplierCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))
                        )}
                        <div className="border-t my-1"></div>
                        <SelectItem value="__add_new__">
                          <div className="flex items-center gap-2 text-orange-600">
                            <Plus className="w-3 h-3" />
                            <span>添加新类别</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="productName" className="text-xs text-gray-600 mb-1 block">产品名称</Label>
                  <Input
                    id="productName"
                    placeholder="输入产品名称..."
                    value={editForm.productName}
                    onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="quantity" className="text-xs text-gray-600 mb-1 block">数量</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="输入数量..."
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div>
                  <Label htmlFor="relatedRFQ" className="text-xs text-gray-600 mb-1 block">关联询价单</Label>
                  <Select 
                    value={editForm.relatedRFQ || 'none'} 
                    onValueChange={(value) => setEditForm({ ...editForm, relatedRFQ: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger id="relatedRFQ" style={{ fontSize: '13px' }}>
                      <SelectValue placeholder="选择询价单（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-gray-500">不关联询价单</span>
                      </SelectItem>
                      {availableRFQs.map((rfq) => (
                        <SelectItem key={rfq.id} value={rfq.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rfq.id}</span>
                            <span className="text-gray-500">-</span>
                            <span className="text-xs text-gray-600">{rfq.customer}</span>
                            <span className="text-xs text-gray-500">{rfq.productName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description" className="text-xs text-gray-600 mb-1 block">样品描述</Label>
                  <Textarea
                    id="description"
                    placeholder="输入样品详细描述..."
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    style={{ fontSize: '13px' }}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes" className="text-xs text-gray-600 mb-1 block">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="输入备注信息..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={2}
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={() => {
                if (!editForm.customer || !editForm.productName) {
                  toast.error('请填写客户名称和产品名称！');
                  return;
                }
                
                // 🔥 更新列表中的数据
                setSamples(samples.map(sample => {
                  if (sample.id === editForm.id) {
                    return {
                      ...sample,
                      customer: editForm.customer,
                      productName: editForm.productName,
                      productCategory: editForm.productCategory || sample.productCategory,
                      sampleInfo: {
                        ...sample.sampleInfo,
                        quantity: parseInt(editForm.quantity) || sample.sampleInfo.quantity,
                        description: editForm.description || sample.sampleInfo.description,
                      },
                      relatedRFQ: editForm.relatedRFQ || sample.relatedRFQ,
                      notes: editForm.notes || sample.notes,
                      status: editForm.status || sample.status,
                    };
                  }
                  return sample;
                }));
                
                toast.success('来样信息修改成功！', {
                  description: `${editForm.productName} 的信息已成功修改`,
                  duration: 3000,
                });
                setEditDialogOpen(false);
                
                // 重置表单
                setEditForm({
                  id: '',
                  customer: '',
                  productName: '',
                  productCategory: '',
                  quantity: '',
                  description: '',
                  relatedRFQ: '',
                  notes: '',
                  status: 'pending',
                });
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 发送报告对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              发送来样报告
            </DialogTitle>
            <DialogDescription>
              {selectedSample?.sampleNo} - {selectedSample?.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 发送方式 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-medium mb-3 block">发送方式</Label>
              <RadioGroup value={sendForm.method} onValueChange={(value) => setSendForm({ ...sendForm, method: value })}>
                <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:border-orange-300 transition-colors">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Send className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">📧 电子邮件</p>
                      <p className="text-xs text-gray-500">通过邮件发送分析报告</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:border-orange-300 transition-colors opacity-50 cursor-not-allowed">
                  <RadioGroupItem value="system" id="system" disabled />
                  <Label htmlFor="system" className="flex items-center gap-2 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">💬 系统消息</p>
                      <p className="text-xs text-gray-500">通过站内消息发送（即将推出）</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 收件人信息 */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="recipient" className="text-sm font-medium mb-2 block">
                  收件人邮箱 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder="example@email.com"
                  value={sendForm.recipient}
                  onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-sm font-medium mb-2 block">
                  邮件主题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="输入邮件主题..."
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium mb-2 block">邮件内容</Label>
                <Textarea
                  id="message"
                  placeholder="输入邮件正文..."
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  rows={10}
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>

            {/* 附件预览 */}
            {selectedSample && (
              <div className="border rounded-lg p-4 bg-orange-50">
                <Label className="text-sm font-medium mb-2 block">📎 附件内容</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    <ImageIcon className="w-8 h-8 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">样品照片</p>
                      <p className="text-xs text-gray-500">{selectedSample.sampleInfo.photos} 张</p>
                    </div>
                  </div>
                  {selectedSample.analysisReport && (
                    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                      <FileText className="w-8 h-8 text-orange-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">分析报告</p>
                        <p className="text-xs text-gray-500">PDF格式</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={async () => {
                if (!sendForm.recipient) {
                  toast.error('❌ 请填写收件人信息');
                  return;
                }
                if (!sendForm.subject) {
                  toast.error('❌ 请填写邮件主题');
                  return;
                }

                if (sendForm.method === 'email') {
                  try {
                    toast.loading('📧 正在发送邮件...', { id: 'sending-email' });

                    const { projectId, publicAnonKey } = await import('../../../utils/supabase/info');
                    
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/send-product-materials`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${publicAnonKey}`,
                        },
                        body: JSON.stringify({
                          to: sendForm.recipient,
                          subject: sendForm.subject,
                          message: sendForm.message,
                          productInfo: {
                            code: selectedSample.sampleNo,
                            name: selectedSample.productName,
                            nameEn: selectedSample.productName,
                            specification: selectedSample.sampleInfo.description,
                            category: '来样分析',
                          },
                          files: [
                            {
                              name: `样品照片 (${selectedSample.sampleInfo.photos}张)`,
                              size: `${selectedSample.sampleInfo.photos}张`,
                              category: 'images',
                            },
                            selectedSample.analysisReport ? {
                              name: '分析报告.pdf',
                              size: '1.2 MB',
                              category: 'specs',
                            } : null
                          ].filter(Boolean),
                        }),
                      }
                    );

                    const responseText = await response.text();
                    let result;
                    try {
                      result = JSON.parse(responseText);
                    } catch (parseError) {
                      console.error('❌ JSON解析失败:', parseError);
                      throw new Error(`服务器返回了无效的响应格式`);
                    }

                    toast.dismiss('sending-email');

                    if (!response.ok || !result.success) {
                      console.error('❌ 邮件发送失败:', result);
                      
                      if (result.error && result.error.includes('RESEND_API_KEY')) {
                        toast.error('⚙️ 邮件服务未配置', {
                          description: '请在Supabase Dashboard中设置RESEND_API_KEY环境变量。',
                          duration: 10000,
                        });
                      } else {
                        toast.error('❌ 邮件发送失败', {
                          description: result.error || '请检查网络连接或联系管理员',
                          duration: 6000,
                        });
                      }
                      return;
                    }

                    console.log('✅ 邮件发送成功:', result);
                    
                    toast.success(`✅ 邮件发送成功！`, {
                      description: `已将 ${selectedSample.sampleNo} 的分析报告发送到 ${sendForm.recipient}`,
                      duration: 5000,
                    });

                  } catch (error) {
                    console.error('❌ 邮件发送异常:', error);
                    toast.dismiss('sending-email');
                    toast.error('❌ 邮件发送异常', {
                      description: `${error.message}`,
                      duration: 8000,
                    });
                    return;
                  }
                } else {
                  toast.success(`✅ 发送成功！`, {
                    description: `已将 ${selectedSample.sampleNo} 的分析报告发送给 ${sendForm.recipient}`,
                    duration: 5000,
                  });
                }
                
                setSendDialogOpen(false);
                
                // 重置表单
                setSendForm({
                  method: 'email',
                  recipient: '',
                  subject: '',
                  message: '',
                });
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}