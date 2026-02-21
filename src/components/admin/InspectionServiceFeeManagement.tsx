// 🔥 验货服务费管理组件
// 专门处理 Type B 和 Type E 业务的验货服务费账单与收款

import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  DollarSign, FileText, CheckCircle, AlertCircle, Clock, TrendingUp,
  Plus, Send, Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface InspectionOrder {
  id: string;
  orderNumber: string;
  businessType: string;
  customerName: string;
  customerType: string;
  productName: string;
  inspectionFee?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  contactEmail?: string;
  requestDate: string;
}

interface InspectionServiceFeeManagementProps {
  orders: InspectionOrder[];
  stats: {
    totalFees: number;
    paidFees: number;
    unpaidFees: number;
  };
}

export default function InspectionServiceFeeManagement({ orders, stats }: InspectionServiceFeeManagementProps) {
  
  // 🔥 同步到财务模块
  const handleSyncToFinance = () => {
    const unpaidOrders = orders.filter(
      o => (o.businessType === 'inspection-only' || o.businessType === 'agency') 
        && o.inspectionFee 
        && o.paymentStatus !== 'paid'
    );
    
    // 保存到财务应收账款
    const accountsReceivable = unpaidOrders.map(order => ({
      id: `AR-${order.orderNumber}`,
      type: 'inspection_service',
      invoiceNumber: order.invoiceNumber || `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      customer: order.customerName,
      amount: order.inspectionFee,
      currency: 'USD',
      dueDate: order.invoiceDate 
        ? new Date(new Date(order.invoiceDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      createdAt: order.invoiceDate || order.requestDate,
      description: `验货服务费 - ${order.productName}`
    }));
    
    // 保存到localStorage
    const existing = JSON.parse(localStorage.getItem('accountsReceivable') || '[]');
    // 去重
    const merged = [...existing];
    accountsReceivable.forEach(ar => {
      if (!existing.find((e: any) => e.id === ar.id)) {
        merged.push(ar);
      }
    });
    localStorage.setItem('accountsReceivable', JSON.stringify(merged));
    
    toast.success('验货服务费已同步到财务模块！', {
      description: `${unpaidOrders.length}笔待收款已添加到应收账款`,
      duration: 3000
    });
  };

  // 生成发票
  const handleGenerateInvoice = (orderNumber: string) => {
    toast.success('服务费发票已生成！', {
      description: `发票编号: INV-${orderNumber}`,
      duration: 2000
    });
  };

  // 发送催款通知
  const handleSendReminder = (customerEmail: string) => {
    toast.success('催款通知已发送！', {
      description: `已向 ${customerEmail} 发送付款提醒`,
      duration: 2000
    });
  };

  // 确认收款
  const handleConfirmPayment = (orderNumber: string) => {
    toast.success('收款已确认！', {
      description: `${orderNumber} 的验货服务费已收到`,
      duration: 2000
    });
  };

  // 筛选需要显示的订单（只显示Type B和Type E）
  const serviceFeeOrders = orders.filter(order => 
    (order.businessType === 'inspection-only' || order.businessType === 'agency') 
    && order.inspectionFee
  );

  return (
    <div className="space-y-3">
      {/* 服务费总览卡片 */}
      <Card className="border-emerald-200 bg-emerald-50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="size-10 text-emerald-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900" style={{ fontSize: '15px' }}>
                验货服务费管理
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                管理Type B和Type E业务的验货服务费账单与收款
              </p>
            </div>
          </div>
          
          {/* 服务费统计卡片 */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="bg-white border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <FileText className="size-4 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 h-5 px-2 text-xs">总费用</Badge>
              </div>
              <p className="text-2xl font-bold text-gray-900">${stats.totalFees.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">所有验货费用</p>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="size-4 text-green-600" />
                <Badge className="bg-green-100 text-green-700 h-5 px-2 text-xs">已收款</Badge>
              </div>
              <p className="text-2xl font-bold text-green-600">${stats.paidFees.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">已到账金额</p>
            </div>
            
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="size-4 text-orange-600" />
                <Badge className="bg-orange-100 text-orange-700 h-5 px-2 text-xs">待收款</Badge>
              </div>
              <p className="text-2xl font-bold text-orange-600">${stats.unpaidFees.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">待支付金额</p>
            </div>
            
            <div className="bg-white border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="size-4 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700 h-5 px-2 text-xs">收款率</Badge>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalFees > 0 ? ((stats.paidFees / stats.totalFees) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">已收款比例</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 服务费账单列表 */}
      <Card>
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
              服务费账单明细
            </h4>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleSyncToFinance}
              >
                <Send className="size-3.5 mr-1.5" />
                同步到财务
              </Button>
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs">
                <Plus className="size-3.5 mr-1.5" />
                生成账单
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 text-xs">订单编号</TableHead>
                <TableHead className="h-9 text-xs">客户名称</TableHead>
                <TableHead className="h-9 text-xs">业务类型</TableHead>
                <TableHead className="h-9 text-xs">产品名称</TableHead>
                <TableHead className="h-9 text-xs">服务费</TableHead>
                <TableHead className="h-9 text-xs">发票编号</TableHead>
                <TableHead className="h-9 text-xs">账单日期</TableHead>
                <TableHead className="h-9 text-xs">付款状态</TableHead>
                <TableHead className="h-9 text-xs text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceFeeOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="py-3">
                    <span className="font-medium text-blue-600 text-xs">{order.orderNumber}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{order.customerName}</p>
                      <p className="text-gray-500 text-xs">{order.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs h-5 px-2 ${
                        order.businessType === 'inspection-only' 
                          ? 'bg-purple-50 text-purple-700 border-purple-300' 
                          : 'bg-orange-50 text-orange-700 border-orange-300'
                      }`}
                    >
                      {order.businessType === 'inspection-only' ? 'Type E - 纯验货' : 'Type B - 客户采购'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs">{order.productName}</TableCell>
                  <TableCell className="py-3">
                    <span className="font-semibold text-emerald-600 text-sm">
                      ${order.inspectionFee?.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-xs">
                    {order.invoiceNumber ? (
                      <span className="font-mono text-gray-900">{order.invoiceNumber}</span>
                    ) : (
                      <Badge variant="outline" className="text-xs h-5 px-2 bg-gray-100">
                        待生成
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-xs text-gray-600">
                    {order.invoiceDate || '-'}
                  </TableCell>
                  <TableCell className="py-3">
                    {order.paymentStatus === 'paid' ? (
                      <Badge className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="size-3 mr-1" />
                        已收款
                      </Badge>
                    ) : order.paymentStatus === 'partial' ? (
                      <Badge className="text-xs h-5 px-2 bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock className="size-3 mr-1" />
                        部分收款
                      </Badge>
                    ) : (
                      <Badge className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-300">
                        <AlertCircle className="size-3 mr-1" />
                        待收款
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      {!order.invoiceNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleGenerateInvoice(order.orderNumber)}
                        >
                          <FileText className="size-3.5 mr-1" />
                          生成发票
                        </Button>
                      )}
                      {order.invoiceNumber && order.paymentStatus !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600"
                          onClick={() => handleSendReminder(order.contactEmail || '')}
                        >
                          <Bell className="size-3.5 mr-1" />
                          催款
                        </Button>
                      )}
                      {order.paymentStatus !== 'paid' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600"
                          onClick={() => handleConfirmPayment(order.orderNumber)}
                        >
                          <CheckCircle className="size-3.5 mr-1" />
                          确认收款
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {serviceFeeOrders.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="size-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">暂无验货服务费账单</p>
            <p className="text-gray-400 text-xs mt-1">Type B 和 Type E 业务会在此显示</p>
          </div>
        )}
      </Card>
    </div>
  );
}
