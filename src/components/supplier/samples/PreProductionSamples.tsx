import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Upload, Send, CheckCircle, XCircle, Clock, Package, Truck, MessageSquare, Calendar, Image as ImageIcon, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner@2.0.3';

/**
 * 🔥 供应商视角：产前样管理（Pre-production Samples）
 * 
 * 业务流程：
 * 1. 收到客户订单 → 制作产前样
 * 2. 产前样制作完成 → 上传照片/寄送样品
 * 3. 客户COSUN收到 → 品质确认
 * 4. 需要修改 → 重新制作（可能多轮）
 * 5. 客户批准 → 进入生产阶段
 */
export default function PreProductionSamples() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);

  // 🔥 产前样数据
  const preProductionSamples = [
    {
      id: 'PPS-2024-001',
      customerOrderNo: 'PO-2024-152', // 关联客户订单号
      salesOrderNo: 'SO-2024-088', // 客户的销售单号
      customer: 'COSUN',
      productName: '抛光砖 600x600mm',
      specification: '尺寸: 600x600mm, 颜色: 米黄色',
      quantity: 5, // 样品数量
      round: 1, // 第几轮样品
      status: 'pending_production', // 待制作
      
      requestDate: '2024-12-15',
      requiredDate: '2024-12-22',
      
      production: {
        startDate: null,
        completedDate: null,
        responsiblePerson: '李工',
        workshop: '样品车间A'
      },
      
      shipping: {
        shippedDate: null,
        logisticsCompany: null,
        trackingNumber: null,
        estimatedArrival: null
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: null, // approved / rejected / pending
        comments: null,
        images: []
      },
      
      images: [],
      notes: '客户要求颜色必须与色卡一致',
      priority: 'high'
    },
    {
      id: 'PPS-2024-002',
      customerOrderNo: 'PO-2024-150',
      salesOrderNo: 'SO-2024-085',
      customer: 'COSUN',
      productName: '大理石瓷砖 800x800mm',
      specification: '尺寸: 800x800mm, 纹理: 卡拉拉白',
      quantity: 3,
      round: 1,
      status: 'in_production', // 制作中
      
      requestDate: '2024-12-10',
      requiredDate: '2024-12-18',
      
      production: {
        startDate: '2024-12-12',
        completedDate: null,
        responsiblePerson: '王工',
        workshop: '样品车间B'
      },
      
      shipping: {
        shippedDate: null,
        logisticsCompany: null,
        trackingNumber: null,
        estimatedArrival: null
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: null,
        comments: null,
        images: []
      },
      
      images: [],
      notes: '',
      priority: 'medium'
    },
    {
      id: 'PPS-2024-003',
      customerOrderNo: 'PO-2024-148',
      salesOrderNo: 'SO-2024-082',
      customer: 'COSUN',
      productName: '木纹砖 200x1000mm',
      specification: '尺寸: 200x1000mm, 纹理: 橡木色',
      quantity: 4,
      round: 1,
      status: 'ready_to_ship', // 待寄送
      
      requestDate: '2024-12-08',
      requiredDate: '2024-12-15',
      
      production: {
        startDate: '2024-12-09',
        completedDate: '2024-12-13',
        responsiblePerson: '张工',
        workshop: '样品车间A'
      },
      
      shipping: {
        shippedDate: null,
        logisticsCompany: null,
        trackingNumber: null,
        estimatedArrival: null
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: null,
        comments: null,
        images: []
      },
      
      images: ['sample1.jpg', 'sample2.jpg', 'sample3.jpg'],
      notes: '',
      priority: 'medium'
    },
    {
      id: 'PPS-2024-004',
      customerOrderNo: 'PO-2024-145',
      salesOrderNo: 'SO-2024-078',
      customer: 'COSUN',
      productName: '仿古砖 300x300mm',
      specification: '尺寸: 300x300mm, 风格: 复古灰',
      quantity: 6,
      round: 1,
      status: 'shipped', // 已寄送
      
      requestDate: '2024-12-05',
      requiredDate: '2024-12-12',
      
      production: {
        startDate: '2024-12-06',
        completedDate: '2024-12-10',
        responsiblePerson: '李工',
        workshop: '样品车间B'
      },
      
      shipping: {
        shippedDate: '2024-12-11',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF1234567890',
        estimatedArrival: '2024-12-13'
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: 'pending',
        comments: null,
        images: []
      },
      
      images: ['sample1.jpg', 'sample2.jpg'],
      notes: '',
      priority: 'medium'
    },
    {
      id: 'PPS-2024-005',
      customerOrderNo: 'PO-2024-142',
      salesOrderNo: 'SO-2024-075',
      customer: 'COSUN',
      productName: '马赛克瓷砖 300x300mm',
      specification: '尺寸: 300x300mm, 款式: 混合色',
      quantity: 3,
      round: 2, // 第二轮（第一轮被拒绝）
      status: 'approved', // 已批准
      
      requestDate: '2024-11-28',
      requiredDate: '2024-12-08',
      
      production: {
        startDate: '2024-12-02',
        completedDate: '2024-12-05',
        responsiblePerson: '王工',
        workshop: '样品车间A'
      },
      
      shipping: {
        shippedDate: '2024-12-06',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF0987654321',
        estimatedArrival: '2024-12-08'
      },
      
      feedback: {
        receivedDate: '2024-12-09',
        approvalStatus: 'approved',
        comments: '颜色搭配很好，批准投产',
        images: ['feedback1.jpg']
      },
      
      images: ['sample1.jpg', 'sample2.jpg'],
      notes: '第一轮样品颜色不符，已按客户要求调整',
      priority: 'high'
    },
    {
      id: 'PPS-2023-099',
      customerOrderNo: 'PO-2024-138',
      salesOrderNo: 'SO-2024-072',
      customer: 'COSUN',
      productName: '通体砖 600x600mm',
      specification: '尺寸: 600x600mm, 颜色: 深灰色',
      quantity: 4,
      round: 1,
      status: 'rejected', // 已拒绝
      
      requestDate: '2024-11-25',
      requiredDate: '2024-12-05',
      
      production: {
        startDate: '2024-11-26',
        completedDate: '2024-11-30',
        responsiblePerson: '张工',
        workshop: '样品车间B'
      },
      
      shipping: {
        shippedDate: '2024-12-01',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF1122334455',
        estimatedArrival: '2024-12-03'
      },
      
      feedback: {
        receivedDate: '2024-12-04',
        approvalStatus: 'rejected',
        comments: '颜色偏浅，不符合要求，需要重做',
        images: ['feedback1.jpg', 'feedback2.jpg']
      },
      
      images: ['sample1.jpg'],
      notes: '需要重新制作第二轮样品',
      priority: 'high'
    }
  ];

  const getStatusConfig = (status: string) => {
    const config: any = {
      pending_production: { label: '待制作', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      in_production: { label: '制作中', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
      ready_to_ship: { label: '待寄送', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
      shipped: { label: '已寄送', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Truck },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Clock };
  };

  const filteredSamples = preProductionSamples.filter(sample => {
    const matchSearch = sample.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sample.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       sample.customerOrderNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? ['pending_production', 'in_production'].includes(sample.status) :
      activeTab === 'ready' ? sample.status === 'ready_to_ship' :
      activeTab === 'shipped' ? sample.status === 'shipped' :
      activeTab === 'approved' ? sample.status === 'approved' :
      activeTab === 'rejected' ? sample.status === 'rejected' :
      true;
    return matchSearch && matchTab;
  });

  const tabs = [
    { id: 'pending', label: '待制作/制作中', icon: Package, count: preProductionSamples.filter(s => ['pending_production', 'in_production'].includes(s.status)).length },
    { id: 'ready', label: '待寄送', icon: Truck, count: preProductionSamples.filter(s => s.status === 'ready_to_ship').length },
    { id: 'shipped', label: '已寄送', icon: Send, count: preProductionSamples.filter(s => s.status === 'shipped').length },
    { id: 'approved', label: '已批准', icon: CheckCircle, count: preProductionSamples.filter(s => s.status === 'approved').length },
    { id: 'rejected', label: '需重做', icon: XCircle, count: preProductionSamples.filter(s => s.status === 'rejected').length },
    { id: 'all', label: '全部', icon: FileText, count: preProductionSamples.length },
  ];

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
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>产前样管理</h2>
              <p className="text-xs text-gray-500">管理客户订单的产前样品制作、寄送和确认</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4" />
            新建产前样
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待制作</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {preProductionSamples.filter(s => s.status === 'pending_production').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">制作中</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {preProductionSamples.filter(s => s.status === 'in_production').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待寄送</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {preProductionSamples.filter(s => s.status === 'ready_to_ship').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已批准</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {preProductionSamples.filter(s => s.status === 'approved').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">需重做</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {preProductionSamples.filter(s => s.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索产前样编号、产品名称或订单号..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Tab + 表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Tab导航 */}
        <div className="flex items-center border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="outline" className="h-5 px-1.5 min-w-5 text-xs">
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>产前样编号</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>客户订单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-20 text-center" style={{ fontSize: '12px' }}>轮次</TableHead>
                <TableHead className="h-9 w-20 text-center" style={{ fontSize: '12px' }}>数量</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>负责人</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>要求日期</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>物流信息</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSamples.length > 0 ? (
                filteredSamples.map((sample) => {
                  const statusConfig = getStatusConfig(sample.status);
                  
                  return (
                    <TableRow key={sample.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{sample.id}</p>
                          <p className="text-xs text-gray-500">{sample.requestDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium">{sample.customerOrderNo}</p>
                          <p className="text-xs text-gray-500">{sample.salesOrderNo}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{sample.productName}</p>
                          <p className="text-xs text-gray-500">{sample.specification}</p>
                          {sample.priority === 'high' && (
                            <Badge variant="destructive" className="mt-1 h-4 px-1.5 text-xs">紧急</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <Badge variant="outline" className={`h-5 px-2 text-xs ${sample.round > 1 ? 'bg-orange-100 text-orange-800' : ''}`}>
                          第{sample.round}轮
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center" style={{ fontSize: '13px' }}>
                        <span className="font-medium">{sample.quantity}</span>
                        <span className="text-gray-500 ml-1">件</span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium">{sample.production.responsiblePerson}</p>
                          <p className="text-xs text-gray-500">{sample.production.workshop}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className={sample.priority === 'high' ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            {sample.requiredDate}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        {sample.shipping.logisticsCompany ? (
                          <div>
                            <p className="font-medium text-xs">{sample.shipping.logisticsCompany}</p>
                            <p className="text-xs text-blue-600">{sample.shipping.trackingNumber}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">未寄送</span>
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
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setSelectedSample(sample);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            详情
                          </Button>
                          {sample.status === 'ready_to_ship' && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                              onClick={() => {
                                setSelectedSample(sample);
                                setSendDialogOpen(true);
                              }}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              寄送
                            </Button>
                          )}
                          {sample.images.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              <ImageIcon className="w-3 h-3 mr-1" />
                              照片
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>暂无产前样数据</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              产前样详情 - {selectedSample?.id}
            </DialogTitle>
            <DialogDescription>
              客户订单号：{selectedSample?.customerOrderNo} | 第{selectedSample?.round}轮样品
            </DialogDescription>
          </DialogHeader>

          {selectedSample && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">产品名称：</span>
                    <span className="font-medium ml-2">{selectedSample.productName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">产品规格：</span>
                    <span className="font-medium ml-2">{selectedSample.specification}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">样品数量：</span>
                    <span className="font-medium ml-2">{selectedSample.quantity} 件</span>
                  </div>
                  <div>
                    <span className="text-gray-500">要求日期：</span>
                    <span className="font-medium ml-2">{selectedSample.requiredDate}</span>
                  </div>
                </div>
              </div>

              {/* 制作信息 */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  制作信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">负责人：</span>
                    <span className="font-medium ml-2">{selectedSample.production.responsiblePerson}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">车间：</span>
                    <span className="font-medium ml-2">{selectedSample.production.workshop}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">开始日期：</span>
                    <span className="font-medium ml-2">{selectedSample.production.startDate || '未开始'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">完成日期：</span>
                    <span className="font-medium ml-2">{selectedSample.production.completedDate || '未完成'}</span>
                  </div>
                </div>
              </div>

              {/* 物流信息 */}
              {selectedSample.shipping.logisticsCompany && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    物流信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">物流公司：</span>
                      <span className="font-medium ml-2">{selectedSample.shipping.logisticsCompany}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">快递单号：</span>
                      <span className="font-medium ml-2 text-blue-600">{selectedSample.shipping.trackingNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">寄送日期：</span>
                      <span className="font-medium ml-2">{selectedSample.shipping.shippedDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">预计到达：</span>
                      <span className="font-medium ml-2">{selectedSample.shipping.estimatedArrival}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 客户反馈 */}
              {selectedSample.feedback.comments && (
                <div className={`border rounded-lg p-4 ${
                  selectedSample.feedback.approvalStatus === 'approved' 
                    ? 'bg-green-50 border-green-300' 
                    : 'bg-red-50 border-red-300'
                }`}>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    客户反馈
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">确认状态：</span>
                      <Badge className={`ml-2 ${
                        selectedSample.feedback.approvalStatus === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedSample.feedback.approvalStatus === 'approved' ? '✓ 已批准' : '✗ 已拒绝'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">反馈意见：</span>
                      <p className="font-medium mt-1">{selectedSample.feedback.comments}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">确认日期：</span>
                      <span className="font-medium ml-2">{selectedSample.feedback.receivedDate}</span>
                    </div>
                  </div>
                </div>
              )}

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
            {selectedSample?.status === 'ready_to_ship' && (
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => {
                setDetailDialogOpen(false);
                setSendDialogOpen(true);
              }}>
                <Send className="w-4 h-4 mr-2" />
                寄送样品
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 寄送对话框 */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>寄送产前样</DialogTitle>
            <DialogDescription>
              产前样编号：{selectedSample?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>选择物流公司</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="请选择物流公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sf">顺丰速运</SelectItem>
                  <SelectItem value="zto">中通快递</SelectItem>
                  <SelectItem value="fedex">联邦快递（国际）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>快递单号</Label>
              <Input placeholder="请输入快递单号" />
            </div>
            <div>
              <Label>收件信息</Label>
              <Textarea 
                placeholder="收件人：李总&#10;电话：+86-591-8888-8888&#10;地址：福建省福州市仓山区金山工业区" 
                rows={4}
                disabled
              />
            </div>
            <div>
              <Label>备注</Label>
              <Textarea placeholder="填写寄送备注（选填）" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => {
              toast.success('产前样已寄送！物流信息已发送给客户COSUN。');
              setSendDialogOpen(false);
            }}>
              确认寄送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
