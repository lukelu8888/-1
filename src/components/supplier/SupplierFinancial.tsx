import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Eye, Calendar, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

export default function SupplierFinancial() {
  const [activeTab, setActiveTab] = useState('all');

  const financialStats = [
    {
      title: '应收总额',
      value: '$248,500',
      unit: 'USD',
      change: '12笔',
      icon: DollarSign,
      color: 'text-blue-600',
    },
    {
      title: '本月已收',
      value: '$125,000',
      unit: 'USD',
      change: '+18%',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: '待收款项',
      value: '$95,000',
      unit: 'USD',
      change: '8张发票',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: '年度收入',
      value: '$1.2M',
      unit: 'USD',
      change: '+25%',
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
  ];

  const payments = [
    {
      id: 'INV-2024-089',
      orderId: 'PO-2024-152',
      customer: 'COSUN', // 🔥 供应商视角：客户就是COSUN（福建高盛达富建材）
      endCustomer: 'Homek Building Supplies', // 最终客户（COSUN的客户）
      amount: 45000,
      dueDate: '2024-11-25',
      status: 'pending',
      invoiceDate: '2024-11-17',
      paymentTerms: '账期30天',
      daysRemaining: 8,
    },
    {
      id: 'INV-2024-087',
      orderId: 'PO-2024-150',
      customer: 'COSUN', // 🔥 供应商视角：客户就是COSUN
      endCustomer: 'BuildMart USA', // 最终客户
      amount: 32000,
      dueDate: '2024-11-20',
      status: 'pending',
      invoiceDate: '2024-11-12',
      paymentTerms: '账期30天',
      daysRemaining: 3,
    },
    {
      id: 'INV-2024-085',
      orderId: 'PO-2024-148',
      customer: 'COSUN', // 🔥 供应商视角：客户就是COSUN
      endCustomer: 'Global Imports Inc.', // 最终客户
      amount: 28500,
      dueDate: '2024-11-15',
      status: 'paid',
      paidDate: '2024-11-14',
      invoiceDate: '2024-11-08',
      paymentTerms: '账期30天',
    },
    {
      id: 'INV-2024-082',
      orderId: 'PO-2024-145',
      customer: 'COSUN', // 🔥 供应商视角：客户就是COSUN
      endCustomer: 'ABC Trading Co.', // 最终客户
      amount: 18500,
      dueDate: '2024-11-10',
      status: 'paid',
      paidDate: '2024-11-09',
      invoiceDate: '2024-11-01',
      paymentTerms: '账期30天',
    },
  ];

  const getStatusConfig = (status: string) => {
    const config: any = {
      pending: { label: '待收款', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      paid: { label: '已收款', color: 'bg-green-100 text-green-800 border-green-300' },
      overdue: { label: '逾期', color: 'bg-red-100 text-red-800 border-red-300' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  const getCurrentPayments = () => {
    switch (activeTab) {
      case 'pending': return pendingPayments;
      case 'paid': return paidPayments;
      default: return payments;
    }
  };

  return (
    <div className="space-y-4">
      {/* 财务概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {financialStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2.5 rounded-lg bg-${stat.color.split('-')[1]}-50`}>
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

      {/* 发票表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>发票管理</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Download className="w-3 h-3" />
                导出报表
              </Button>
            </div>
          </div>

          {/* Tab导航 */}
          <div className="flex items-center">
            {[
              { id: 'all', label: '全部发票', count: payments.length },
              { id: 'pending', label: '待收款', count: pendingPayments.length },
              { id: 'paid', label: '已收款', count: paidPayments.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={{ fontSize: '13px', fontWeight: 500 }}
              >
                {tab.label}
                <Badge variant="outline" className="h-5 px-1.5 min-w-5 text-xs">
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>发票号</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>订单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户名称</TableHead>
                <TableHead className="h-9 w-32 text-right" style={{ fontSize: '12px' }}>发票金额</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>开票日期</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>到期日期</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>账期</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentPayments().map((payment) => {
                const statusConfig = getStatusConfig(payment.status);
                
                return (
                  <TableRow key={payment.id} className="hover:bg-gray-50">
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <p className="font-medium text-blue-600">{payment.id}</p>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <span className="text-gray-600">{payment.orderId}</span>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '13px' }}>
                      <div>
                        <p className="font-medium text-gray-900">{payment.customer}</p>
                        <p className="text-xs text-gray-500">经由COSUN</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                      <span className="font-bold text-gray-900">${payment.amount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{payment.invoiceDate}</span>
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-900 font-medium">{payment.dueDate}</span>
                      </div>
                      {payment.status === 'pending' && payment.daysRemaining !== undefined && (
                        <p className={`text-xs mt-0.5 ${
                          payment.daysRemaining <= 3 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          剩余{payment.daysRemaining}天
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-3" style={{ fontSize: '12px' }}>
                      <span className="text-gray-600">{payment.paymentTerms}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                      {payment.paidDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.paidDate}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          查看
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          下载
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

      {/* 财务说明 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '14px' }}>财务说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">发票处理流程</p>
              <p className="text-xs text-gray-600">订单完成后，COSUN财务部会开具发票并通知您</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">账期说明</p>
              <p className="text-xs text-gray-600">标准账期为30天，特殊情况可协商调整</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">收款确认</p>
              <p className="text-xs text-gray-600">COSUN收到客户款项后会及时安排供应商付款</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">结算方式</p>
              <p className="text-xs text-gray-600">支持电汇(T/T)、信用证(L/C)等多种方式</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}