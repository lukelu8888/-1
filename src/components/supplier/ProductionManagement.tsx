import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Factory, TrendingUp, Upload, FileText, CheckCircle, AlertCircle, Clock, Package2, Play, Pause } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner@2.0.3';

export default function ProductionManagement() {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [productionStatus, setProductionStatus] = useState('');
  const [progressPercentage, setProgressPercentage] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const productionOrders = [
    {
      id: 'PO-2024-155',
      salesOrderId: 'SO-2024-087',
      product: 'LED筒灯 9W',
      quantity: 10000,
      startDate: '2024-11-13',
      dueDate: '2024-12-10',
      status: 'in_production',
      progress: 65,
      currentStage: '组装',
      produced: 6500,
      lastUpdate: '2024-11-17 10:30',
      updates: [
        { date: '2024-11-17', stage: '组装', progress: 65, note: '生产进度正常' },
        { date: '2024-11-15', stage: '备料', progress: 45, note: '所有物料已到位' },
        { date: '2024-11-13', stage: '开始生产', progress: 10, note: '生产已启动' },
      ],
    },
    {
      id: 'PO-2024-154',
      salesOrderId: 'SO-2024-085',
      product: 'LED轨道灯 20W',
      quantity: 3000,
      startDate: '2024-11-11',
      dueDate: '2024-12-05',
      status: 'quality_check',
      progress: 95,
      currentStage: '质量检测',
      produced: 3000,
      lastUpdate: '2024-11-16 14:15',
      updates: [
        { date: '2024-11-16', stage: '质量检测', progress: 95, note: '最终质检进行中' },
        { date: '2024-11-14', stage: '组装完成', progress: 85, note: '所有产品已组装完成' },
        { date: '2024-11-11', stage: '开始生产', progress: 10, note: '生产已启动' },
      ],
    },
    {
      id: 'PO-2024-152',
      salesOrderId: 'SO-2024-078',
      product: 'LED面板灯 300x300mm',
      quantity: 8000,
      startDate: '2024-11-05',
      dueDate: '2024-11-28',
      status: 'ready_to_ship',
      progress: 100,
      currentStage: '包装完成',
      produced: 8000,
      lastUpdate: '2024-11-17 09:00',
      qcCompleted: true,
      qcReportUrl: '/documents/qc-report-PO-2024-152.pdf',
      updates: [
        { date: '2024-11-17', stage: '待发货', progress: 100, note: '包装完成，等待发货' },
        { date: '2024-11-15', stage: '质检通过', progress: 98, note: '质量检测合格' },
        { date: '2024-11-12', stage: '组装完成', progress: 90, note: '所有产品已组装完成' },
      ],
    },
  ];

  const getStatusConfig = (status: string) => {
    const config: any = {
      in_production: { label: '生产中', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      quality_check: { label: '质检中', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      ready_to_ship: { label: '待发货', color: 'bg-green-100 text-green-800 border-green-300' },
      delayed: { label: '延期', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const handleUpdateProgress = () => {
    if (!productionStatus || !progressPercentage) {
      toast.error('请填写所有必填字段');
      return;
    }
    toast.success(`订单 ${selectedOrder?.id} 生产进度更新成功`);
    toast.info('COSUN管理员和客户已收到通知');
    setUpdateDialogOpen(false);
    setProductionStatus('');
    setProgressPercentage('');
    setUpdateNotes('');
  };

  return (
    <div className="space-y-4">
      {/* 生产概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">生产中订单</span>
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">1</p>
          <p className="text-xs text-gray-500 mt-1">平均进度 65%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">质检中</span>
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">1</p>
          <p className="text-xs text-gray-500 mt-1">平均进度 95%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待发货</span>
            <Package2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">1</p>
          <p className="text-xs text-gray-500 mt-1">已完成 100%</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">总产量</span>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">17,500</p>
          <p className="text-xs text-gray-500 mt-1">本月累计</p>
        </div>
      </div>

      {/* 生产订单表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>生产订单</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Upload className="w-3 h-3" />
                上传图片
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <FileText className="w-3 h-3" />
                导出报表
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>订单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>数量</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>生产进度</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>当前阶段</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>开始日期</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>交货日期</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const progressColor = order.progress >= 90 ? 'bg-green-600' : order.progress >= 50 ? 'bg-blue-600' : 'bg-orange-600';
                
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-blue-600">{order.id}</p>
                        <p className="text-xs text-gray-500">{order.salesOrderId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <p className="font-medium text-gray-900">{order.product}</p>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{order.produced.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">/ {order.quantity.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">进度</span>
                          <span className="text-xs font-bold text-gray-900">{order.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${progressColor} h-2 rounded-full transition-all`}
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-700">{order.currentStage}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{order.startDate}</span>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-900 font-medium">{order.dueDate}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            setSelectedOrder(order);
                            setUpdateDialogOpen(true);
                          }}
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          更新进度
                        </Button>
                        {order.qcCompleted && (
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            质检报告
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 生产流程图 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4" style={{ fontSize: '15px' }}>标准生产流程</h3>
        <div className="flex items-center justify-between">
          {[
            { stage: '备料准备', icon: Package2, color: 'bg-gray-100 text-gray-700' },
            { stage: '元件组装', icon: Factory, color: 'bg-blue-100 text-blue-700' },
            { stage: '整机组装', icon: Factory, color: 'bg-blue-100 text-blue-700' },
            { stage: '功能测试', icon: Play, color: 'bg-purple-100 text-purple-700' },
            { stage: '质量检测', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
            { stage: '包装完成', icon: Package2, color: 'bg-green-100 text-green-700' },
          ].map((step, index, arr) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-gray-700 text-center">{step.stage}</p>
                </div>
                {index < arr.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-300 mx-2" style={{ marginTop: '-24px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 更新进度对话框 */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>更新生产进度</DialogTitle>
            <DialogDescription>
              订单：{selectedOrder?.id} - {selectedOrder?.product}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 当前状态显示 */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div>
                <p className="text-xs text-gray-500 mb-1">当前进度</p>
                <p className="text-lg font-bold text-orange-600">{selectedOrder?.progress}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">当前阶段</p>
                <p className="text-sm font-medium">{selectedOrder?.currentStage}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">已生产数量</p>
                <p className="text-sm font-medium">{selectedOrder?.produced.toLocaleString()} / {selectedOrder?.quantity.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="production-status">生产阶段</Label>
                <Select value={productionStatus} onValueChange={setProductionStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material_preparation">备料准备</SelectItem>
                    <SelectItem value="component_assembly">元件组装</SelectItem>
                    <SelectItem value="assembly">整机组装</SelectItem>
                    <SelectItem value="testing">功能测试</SelectItem>
                    <SelectItem value="quality_check">质量检测</SelectItem>
                    <SelectItem value="packaging">包装</SelectItem>
                    <SelectItem value="ready_to_ship">待发货</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">完成百分比</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="update-notes">更新说明</Label>
              <Textarea
                id="update-notes"
                placeholder="例如：生产进度正常，预计按时完成..."
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="production-images">生产现场图片</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">点击上传或拖拽图片到此处</p>
                <p className="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式，最多5张</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateProgress} className="bg-orange-600 hover:bg-orange-700">
              提交更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
