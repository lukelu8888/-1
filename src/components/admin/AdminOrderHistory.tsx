/**
 * 🔥 订单历史 - 显示已完成的历史订单
 * 功能：查看所有已完成、已取消的历史订单记录
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Eye, Download, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useSalesContracts } from '../../contexts/SalesContractContext';
import { toast } from 'sonner@2.0.3';

export default function AdminOrderHistory() {
  const { contracts, clearAllContracts } = useSalesContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 🔥 筛选已完成的订单（客户已确认的订单进入历史）
  const historicalContracts = contracts.filter(c => 
    c.approvalStatus === 'customer_confirmed'
  );

  // 🔥 搜索和筛选
  const filteredContracts = historicalContracts.filter(contract => {
    const matchSearch = !searchTerm || 
      contract.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customerInfo.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCustomer = filterCustomer === 'all' || contract.customerInfo.companyName === filterCustomer;
    
    const matchDate = (!dateFrom || new Date(contract.createdAt) >= new Date(dateFrom)) &&
                      (!dateTo || new Date(contract.createdAt) <= new Date(dateTo));
    
    return matchSearch && matchCustomer && matchDate;
  });

  // 🔥 获取所有客户列表
  const allCustomers = Array.from(new Set(historicalContracts.map(c => c.customerInfo.companyName)));

  // 🔥 清空所有订单历史
  const handleClearAllHistory = () => {
    if (window.confirm('⚠️ 确定要清空所有订单历史吗？\n\n此操作不可恢复！\n\n这将删除所有已确认的历史订单记录。')) {
      clearAllContracts();
      toast.success('✅ 已清空所有订单历史！');
    }
  };

  // 🔥 计算总金额
  const totalAmount = filteredContracts.reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
      <div className="p-4 space-y-4">
        {/* 🔥 搜索和筛选区域 */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder="搜索合同号、报价单号、客户名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* 客户筛选 */}
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            className="h-9 px-3 text-xs border border-gray-300 rounded-md bg-white"
          >
            <option value="all">全部客户</option>
            {allCustomers.map(customer => (
              <option key={customer} value={customer}>{customer}</option>
            ))}
          </select>

          {/* 日期筛选 */}
          <div className="flex gap-2 items-center">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-xs w-36"
            />
            <span className="text-xs text-gray-500">至</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-xs w-36"
            />
          </div>

          {/* 🔥 清空按钮 */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllHistory}
            disabled={historicalContracts.length === 0}
            className="gap-1 bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清空历史
          </Button>
        </div>

        {/* 🔥 统计信息 */}
        <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-xs text-gray-600">历史订单总数：</span>
            <span className="text-sm font-semibold text-gray-900">{filteredContracts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">总金额：</span>
            <span className="text-sm font-semibold text-green-600">${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* 🔥 表格 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs">合同号</TableHead>
                <TableHead className="text-xs">报价单号</TableHead>
                <TableHead className="text-xs">客户</TableHead>
                <TableHead className="text-xs">区域</TableHead>
                <TableHead className="text-xs">总金额</TableHead>
                <TableHead className="text-xs">创建日期</TableHead>
                <TableHead className="text-xs">确认日期</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500 text-xs">
                    暂无订单历史记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map(contract => (
                  <TableRow key={contract.id} className="hover:bg-gray-50">
                    <TableCell className="text-xs font-mono">{contract.contractNumber}</TableCell>
                    <TableCell className="text-xs font-mono">{contract.quotationNumber}</TableCell>
                    <TableCell className="text-xs">{contract.customerInfo.companyName}</TableCell>
                    <TableCell className="text-xs">
                      <Badge className="h-5 px-2 text-xs">
                        {contract.region === 'NA' ? '北美' : contract.region === 'SA' ? '南美' : '欧非'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">${contract.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {new Date(contract.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {contract.customerConfirmedAt ? new Date(contract.customerConfirmedAt).toLocaleDateString('zh-CN') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className="h-5 px-2 text-xs bg-green-100 text-green-700 border-green-300">
                        已确认
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
