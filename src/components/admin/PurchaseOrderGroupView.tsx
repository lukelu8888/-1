import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Package, 
  CheckCircle, 
  Truck, 
  Clock, 
  XCircle, 
  Eye,
  Download,
  Printer,
  ArrowLeft
} from 'lucide-react';
import { usePurchaseOrders, PurchaseOrder } from '../../contexts/PurchaseOrderContext';

interface PurchaseOrderGroupViewProps {
  orderGroup: string;
  onClose: () => void;
}

export function PurchaseOrderGroupView({ orderGroup, onClose }: PurchaseOrderGroupViewProps) {
  const { getPurchaseOrdersByGroup, getOrderGroupStats } = usePurchaseOrders();
  
  const groupOrders = getPurchaseOrdersByGroup(orderGroup);
  const stats = getOrderGroupStats(orderGroup);
  
  if (groupOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            订单组不存在或已删除
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const firstOrder = groupOrders[0];
  
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      producing: { label: '生产中', color: 'bg-purple-100 text-purple-800 border-purple-300' },
      shipped: { label: '已发货', color: 'bg-green-100 text-green-800 border-green-300' },
      completed: { label: '已完成', color: 'bg-gray-100 text-gray-800 border-gray-300' },
      cancelled: { label: '已取消', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge className={`h-5 px-2 text-xs border ${config.color}`}>
        {config.label}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回列表
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            打印
          </Button>
        </div>
      </div>

      {/* 订单组信息卡片 */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                订单组信息
              </CardTitle>
              <CardDescription className="mt-1">
                此订单组包含 {groupOrders.length} 个采购订单，来自同一业务需求
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">
              订单组
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">订单组号</p>
              <p className="font-semibold text-orange-600">{orderGroup}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">来源单号</p>
              <p className="font-semibold">{firstOrder.sourceRef || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">采购需求号</p>
              <p className="font-semibold">{firstOrder.requirementNo || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">创建日期</p>
              <p className="font-semibold">{firstOrder.createdDate}</p>
            </div>
          </div>
          
          {firstOrder.groupNote && (
            <div className="mt-4 p-3 bg-white rounded border border-orange-200">
              <p className="text-xs text-slate-600 mb-1">订单组备注</p>
              <p className="text-sm">{firstOrder.groupNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">总订单数</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">已确认</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">已发货</p>
                <p className="text-2xl font-bold text-green-600">{stats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">已完成</p>
                <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">订单明细</CardTitle>
          <CardDescription>订单组中所有采购订单的详细信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-32">订单号</TableHead>
                  <TableHead>供应商</TableHead>
                  <TableHead>产品信息</TableHead>
                  <TableHead className="text-right">订单金额</TableHead>
                  <TableHead className="w-28">期望交期</TableHead>
                  <TableHead className="w-24">状态</TableHead>
                  <TableHead className="w-28 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-blue-600">{order.poNumber}</p>
                        <p className="text-xs text-slate-500">
                          {index + 1}/{groupOrders.length}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.supplierName}</p>
                        <p className="text-xs text-slate-500">{order.supplierCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-slate-500 ml-2">
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-xs text-slate-400">
                            +{order.items.length - 2} 个产品
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-bold text-green-700">
                          ${order.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{order.currency}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{order.expectedDate}</p>
                        {order.actualDate && (
                          <p className="text-xs text-green-600">
                            实际: {order.actualDate}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="w-3 h-3 mr-1" />
                          详情
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 订单组摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">订单组摘要</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">总供应商数</p>
              <p className="text-lg font-bold">
                {new Set(groupOrders.map(o => o.supplierCode)).size} 家
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">总产品种类</p>
              <p className="text-lg font-bold">
                {groupOrders.reduce((sum, o) => sum + o.items.length, 0)} 种
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">总订单金额</p>
              <p className="text-lg font-bold text-green-700">
                ${groupOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">完成进度</p>
              <p className="text-lg font-bold">
                {Math.round((stats.completed / stats.total) * 100)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
