import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Search, Plus, Eye, Package, Truck, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

/**
 * 🔥 供应商视角：大货样管理（Bulk Samples）
 * 
 * 业务流程：
 * 1. 产前样批准 → 开始生产大货
 * 2. 大货生产到一定阶段 → 抽取大货样
 * 3. 大货样寄送给客户COSUN
 * 4. 客户品质确认
 * 5. 批准 → 继续生产并发货
 * 6. 拒绝 → 调整生产参数
 */
export default function BulkSamples() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // 🔥 大货样数据
  const bulkSamples = [
    {
      id: 'BS-2024-001',
      customerOrderNo: 'PO-2024-152',
      productionOrderNo: 'PROD-2024-088',
      productName: '抛光砖 600x600mm',
      specification: '尺寸: 600x600mm, 颜色: 米黄色',
      quantity: 3,
      status: 'pending_sampling', // 待抽样
      
      production: {
        batchNo: 'BATCH-20241215-001',
        totalQuantity: 50000,
        currentProgress: 35,
        samplingDate: null
      },
      
      shipping: {
        shippedDate: null,
        logisticsCompany: null,
        trackingNumber: null
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: null,
        comments: null
      }
    },
    {
      id: 'BS-2024-002',
      customerOrderNo: 'PO-2024-148',
      productionOrderNo: 'PROD-2024-082',
      productName: '木纹砖 200x1000mm',
      specification: '尺寸: 200x1000mm, 纹理: 橡木色',
      quantity: 4,
      status: 'shipped',
      
      production: {
        batchNo: 'BATCH-20241210-002',
        totalQuantity: 15000,
        currentProgress: 80,
        samplingDate: '2024-12-14'
      },
      
      shipping: {
        shippedDate: '2024-12-15',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF2234567890'
      },
      
      feedback: {
        receivedDate: null,
        approvalStatus: 'pending',
        comments: null
      }
    },
    {
      id: 'BS-2024-003',
      customerOrderNo: 'PO-2024-142',
      productionOrderNo: 'PROD-2024-075',
      productName: '马赛克瓷砖 300x300mm',
      specification: '尺寸: 300x300mm, 款式: 混合色',
      quantity: 3,
      status: 'approved',
      
      production: {
        batchNo: 'BATCH-20241205-003',
        totalQuantity: 20000,
        currentProgress: 100,
        samplingDate: '2024-12-08'
      },
      
      shipping: {
        shippedDate: '2024-12-09',
        logisticsCompany: '顺丰速运',
        trackingNumber: 'SF3345678901'
      },
      
      feedback: {
        receivedDate: '2024-12-11',
        approvalStatus: 'approved',
        comments: '品质稳定，批准发货'
      }
    }
  ];

  const getStatusConfig = (status: string) => {
    const config: any = {
      pending_sampling: { label: '待抽样', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      ready_to_ship: { label: '待寄送', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      shipped: { label: '已寄送', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      approved: { label: '已批准', color: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: '需调整', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const tabs = [
    { id: 'pending', label: '待抽样', icon: Clock, count: bulkSamples.filter(s => s.status === 'pending_sampling').length },
    { id: 'shipped', label: '已寄送', icon: Truck, count: bulkSamples.filter(s => s.status === 'shipped').length },
    { id: 'approved', label: '已批准', icon: CheckCircle, count: bulkSamples.filter(s => s.status === 'approved').length },
    { id: 'all', label: '全部', icon: FileText, count: bulkSamples.length },
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
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>大货样管理</h2>
              <p className="text-xs text-gray-500">管理大货生产的样品抽检、寄送和品质确认</p>
            </div>
          </div>
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4" />
            新建大货样
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待抽样</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {bulkSamples.filter(s => s.status === 'pending_sampling').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已寄送</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {bulkSamples.filter(s => s.status === 'shipped').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已批准</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {bulkSamples.filter(s => s.status === 'approved').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">总计</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{bulkSamples.length}</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索大货样编号、产品名称或订单号..."
            className="pl-9 h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Tab + 表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>大货样编号</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>客户订单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>生产批次</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>生产进度</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>抽样日期</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>物流信息</TableHead>
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulkSamples.map((sample) => {
                const statusConfig = getStatusConfig(sample.status);
                
                return (
                  <TableRow key={sample.id} className="hover:bg-gray-50">
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <p className="font-medium text-blue-600">{sample.id}</p>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium">{sample.customerOrderNo}</p>
                        <p className="text-xs text-gray-500">{sample.productionOrderNo}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{sample.productName}</p>
                        <p className="text-xs text-gray-500">{sample.specification}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-700">{sample.production.batchNo}</p>
                        <p className="text-xs text-gray-500">{sample.production.totalQuantity.toLocaleString()} 件</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-bold text-orange-600">{sample.production.currentProgress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-orange-600 h-1.5 rounded-full"
                            style={{ width: `${sample.production.currentProgress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{sample.production.samplingDate || '-'}</span>
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
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          详情
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
    </div>
  );
}
