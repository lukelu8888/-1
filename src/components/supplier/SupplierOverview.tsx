import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Package, Factory, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, FileCheck, ArrowRight, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export default function SupplierOverview() {
  const stats = [
    {
      title: '活跃订单',
      value: '12',
      unit: '笔',
      change: '+3',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '生产中',
      value: '8',
      unit: '批',
      change: '4待开始',
      icon: Factory,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: '本月完成',
      value: '15',
      unit: '笔',
      change: '+25%',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '预计收入',
      value: '$248,500',
      unit: 'USD',
      change: '+18%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  const pendingTasks = [
    { id: 1, task: '确认采购订单 #PO-2024-156', type: 'urgent', time: '2小时前', category: '订单确认' },
    { id: 2, task: '更新订单 #SO-2024-089 的生产进度', type: 'normal', time: '5小时前', category: '进度更新' },
    { id: 3, task: '上传订单 #SO-2024-075 的质检报告', type: 'urgent', time: '1天前', category: '质检报告' },
    { id: 4, task: '更新订单 #SO-2024-067 的物流信息', type: 'normal', time: '2天前', category: '物流信息' },
  ];

  const recentOrders = [
    {
      id: 'PO-2024-156',
      product: 'LED面板灯 600x600mm',
      quantity: '5,000',
      unit: '件',
      value: '$45,000',
      status: 'pending_confirmation',
      statusLabel: '待确认',
      dueDate: '2024-12-15',
    },
    {
      id: 'PO-2024-155',
      product: 'LED筒灯 9W',
      quantity: '10,000',
      unit: '件',
      value: '$32,000',
      status: 'in_production',
      statusLabel: '生产中',
      dueDate: '2024-12-10',
      progress: 65,
    },
    {
      id: 'PO-2024-154',
      product: 'LED轨道灯 20W',
      quantity: '3,000',
      unit: '件',
      value: '$28,500',
      status: 'quality_check',
      statusLabel: '质检中',
      dueDate: '2024-12-05',
      progress: 95,
    },
  ];

  const getStatusColor = (status: string) => {
    const statusConfig: any = {
      pending_confirmation: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_production: 'bg-blue-100 text-blue-800 border-blue-300',
      quality_check: 'bg-purple-100 text-purple-800 border-purple-300',
      ready_to_ship: 'bg-green-100 text-green-800 border-green-300',
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-5">
      {/* Stats Grid - 紧凑卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-1">{stat.title}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <span className="text-xs text-gray-500">{stat.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 待办任务 - 表格形式 */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>待办任务</h3>
                <Badge variant="destructive" className="h-5 px-2 text-xs">4</Badge>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                查看全部
                <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-9" style={{ fontSize: '12px' }}>任务内容</TableHead>
                  <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>类别</TableHead>
                  <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>优先级</TableHead>
                  <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTasks.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="py-2.5" style={{ fontSize: '13px' }}>
                      <p className="font-medium text-gray-900">{item.task}</p>
                    </TableCell>
                    <TableCell className="py-2.5" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{item.category}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      {item.type === 'urgent' ? (
                        <Badge variant="destructive" className="h-5 px-2 text-xs">紧急</Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 px-2 text-xs border-gray-300">普通</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-right" style={{ fontSize: '12px' }}>
                      <span className="text-gray-500">{item.time}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 生产概览 - 简洁数据卡 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="border-b border-gray-200 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>生产概览</h3>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">活跃产线</p>
                <Factory className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">6 <span className="text-sm text-gray-500">/ 8</span></p>
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">今日产量</p>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">2,340 <span className="text-sm text-gray-500">件</span></p>
            </div>
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-600">待质检批次</p>
                <FileCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-gray-900">3 <span className="text-sm text-gray-500">批次</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 最新采购订单 - 表格形式 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>最新采购订单</h3>
              <span className="text-xs text-gray-500">来自COSUN的最新订单</span>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              查看全部
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9" style={{ fontSize: '12px' }}>订单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品名称</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>数量</TableHead>
                <TableHead className="h-9 w-28 text-right" style={{ fontSize: '12px' }}>金额</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>交期</TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>进度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="py-3" style={{ fontSize: '13px' }}>
                    <span className="font-medium text-blue-600">{order.id}</span>
                  </TableCell>
                  <TableCell className="py-3" style={{ fontSize: '13px' }}>
                    <span className="text-gray-900">{order.product}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                    <span className="font-medium text-gray-900">{order.quantity}</span>
                    <span className="text-gray-500 ml-1">{order.unit}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                    <span className="font-medium text-gray-900">{order.value}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge className={`h-5 px-2 text-xs border ${getStatusColor(order.status)}`}>
                      {order.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3" style={{ fontSize: '12px' }}>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {order.dueDate}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {order.progress !== undefined ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">生产进度</span>
                          <span className="text-xs font-medium text-gray-900">{order.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}