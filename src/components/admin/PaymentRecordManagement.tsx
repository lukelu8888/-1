import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit2, DollarSign, Calendar, CheckCircle, Building2, Truck, FileText } from 'lucide-react';

/**
 * 💸 付款记录管理 - Admin Portal
 * 
 * 功能：记录所有对外付款（供应商货款、服务商费用等）
 * 关系：N个付款记录 → 1个应付账款（N:1）
 * 支持：付款核销、状态联动
 */

interface PaymentRecord {
  id: string;
  paymentNo: string; // 付款编号：FK-{REGION}-YYMMDD-XXXX
  payableNo: string; // 关联应付账款编号
  payableId: string;
  
  // 收款方信息
  payeeType: 'supplier' | 'service_provider';
  payeeId: string;
  payeeName: string;
  serviceType?: string;
  
  // 付款信息
  amount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  paymentMethod: 'T/T' | 'L/C' | 'Western Union' | 'PayPal' | 'Alipay' | 'Cash';
  
  // 银行信息
  bankName?: string;
  accountNumber?: string;
  transactionNo?: string; // 银行交易流水号
  
  // 时间
  paymentDate: string;
  createdDate: string;
  
  // 状态
  status: 'pending' | 'completed' | 'failed'; // 待确认、已完成、失败
  
  // 其他
  region: 'NA' | 'SA' | 'EMEA';
  notes?: string;
  attachments?: string[]; // 付款凭证附件
  operator: string; // 操作人
}

// 模拟数据
const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'PM001',
    paymentNo: 'FK-NA-250125-0001',
    payableNo: 'YF-NA-250122-0001',
    payableId: 'PAY001',
    payeeType: 'supplier',
    payeeId: 'SUP001',
    payeeName: '东莞市华强电器有限公司',
    amount: 20000.00,
    currency: 'USD',
    paymentMethod: 'T/T',
    bankName: 'Bank of China',
    accountNumber: '****1234',
    transactionNo: 'TXN20250125001',
    paymentDate: '2025-01-25',
    createdDate: '2025-01-25',
    status: 'completed',
    region: 'NA',
    notes: '采购订单定金30%',
    operator: 'Admin'
  },
  {
    id: 'PM002',
    paymentNo: 'FK-NA-250121-0002',
    payableNo: 'YF-NA-250119-0003',
    payableId: 'PAY003',
    payeeType: 'service_provider',
    payeeId: 'SP005',
    payeeName: '广州市天力报关有限公司',
    serviceType: 'customs',
    amount: 800.00,
    currency: 'USD',
    paymentMethod: 'T/T',
    bankName: 'Industrial and Commercial Bank of China',
    accountNumber: '****5678',
    transactionNo: 'TXN20250121001',
    paymentDate: '2025-01-21',
    createdDate: '2025-01-21',
    status: 'completed',
    region: 'EMEA',
    notes: '报关费用全额支付',
    operator: 'Admin'
  },
  {
    id: 'PM003',
    paymentNo: 'FK-NA-250120-0003',
    payableNo: 'YF-NA-250117-0005',
    payableId: 'PAY005',
    payeeType: 'service_provider',
    payeeId: 'SP003',
    payeeName: '深圳市SGS检验有限公司',
    serviceType: 'inspection',
    amount: 650.00,
    currency: 'USD',
    paymentMethod: 'T/T',
    bankName: 'China Construction Bank',
    accountNumber: '****9012',
    transactionNo: 'TXN20250120001',
    paymentDate: '2025-01-20',
    createdDate: '2025-01-20',
    status: 'completed',
    region: 'NA',
    notes: '验货费用',
    operator: 'Admin'
  },
  {
    id: 'PM004',
    paymentNo: 'FK-SA-250123-0004',
    payableNo: 'YF-SA-250118-0004',
    payableId: 'PAY004',
    payeeType: 'supplier',
    payeeId: 'SUP003',
    payeeName: '佛山市顺德区美家卫浴有限公司',
    amount: 28600.00,
    currency: 'USD',
    paymentMethod: 'T/T',
    bankName: 'Agricultural Bank of China',
    accountNumber: '****3456',
    transactionNo: '',
    paymentDate: '2025-01-23',
    createdDate: '2025-01-23',
    status: 'pending',
    region: 'SA',
    notes: '100%预付款，待银行确认',
    operator: 'Admin'
  },
  {
    id: 'PM005',
    paymentNo: 'FK-NA-250122-0005',
    payableNo: 'YF-NA-250120-0002',
    payableId: 'PAY002',
    payeeType: 'service_provider',
    payeeId: 'SP001',
    payeeName: '深圳市鹏程国际货运代理有限公司',
    serviceType: 'forwarder',
    amount: 1600.00,
    currency: 'USD',
    paymentMethod: 'T/T',
    bankName: 'Bank of Communications',
    accountNumber: '****7890',
    transactionNo: 'TXN20250122001',
    paymentDate: '2025-01-22',
    createdDate: '2025-01-22',
    status: 'completed',
    region: 'NA',
    notes: '海运费50%定金',
    operator: 'Admin'
  },
];

export default function PaymentRecordManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payeeTypeFilter, setPayeeTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    return mockPaymentRecords.filter(record => {
      const matchSearch = 
        record.paymentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.payableNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.transactionNo && record.transactionNo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchPayeeType = payeeTypeFilter === 'all' || record.payeeType === payeeTypeFilter;
      const matchRegion = regionFilter === 'all' || record.region === regionFilter;
      const matchMethod = methodFilter === 'all' || record.paymentMethod === methodFilter;
      
      return matchSearch && matchStatus && matchPayeeType && matchRegion && matchMethod;
    });
  }, [searchTerm, statusFilter, payeeTypeFilter, regionFilter, methodFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = mockPaymentRecords.reduce((sum, r) => sum + r.amount, 0);
    const completed = mockPaymentRecords.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.amount, 0);
    const pending = mockPaymentRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const count = mockPaymentRecords.length;

    return { total, completed, pending, count };
  }, []);

  // 状态标签
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
      pending: '待确认',
      completed: '已完成',
      failed: '失败',
    };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // 收款方类型标签
  const getPayeeTypeBadge = (type: string, serviceType?: string) => {
    if (type === 'supplier') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          <Building2 className="w-3 h-3" />
          供应商
        </span>
      );
    } else {
      const serviceLabels: Record<string, string> = {
        forwarder: '货代',
        trucking: '拖车',
        customs: '报关',
        inspection: '验货',
        warehouse: '仓储',
      };
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          <Truck className="w-3 h-3" />
          {serviceType ? serviceLabels[serviceType] : '服务商'}
        </span>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部标题 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">💸 付款记录管理</h1>
            <p className="text-xs text-gray-500 mt-1">
              Payment Records Management - 所有对外付款记录（供应商+服务商）
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-[14px] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              导出明细
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[14px] bg-[#F96302] text-white rounded-lg hover:bg-[#E55A02] transition-colors">
              <Plus className="w-4 h-4" />
              新增付款
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">总付款金额</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ${stats.total.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">已完成付款</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                ${stats.completed.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">待确认付款</p>
              <p className="text-xl font-bold text-yellow-600 mt-1">
                ${stats.pending.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">付款笔数</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {stats.count} 笔
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="px-6 py-3 bg-white border-y border-gray-200">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索付款编号、收款方、应付编号、交易流水号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96302] focus:border-transparent"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96302]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待确认</option>
            <option value="completed">已完成</option>
            <option value="failed">失败</option>
          </select>

          {/* 收款方类型筛选 */}
          <select
            value={payeeTypeFilter}
            onChange={(e) => setPayeeTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96302]"
          >
            <option value="all">全部类型</option>
            <option value="supplier">供应商</option>
            <option value="service_provider">服务商</option>
          </select>

          {/* 付款方式筛选 */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96302]"
          >
            <option value="all">全部方式</option>
            <option value="T/T">T/T</option>
            <option value="L/C">L/C</option>
            <option value="PayPal">PayPal</option>
          </select>

          {/* 区域筛选 */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F96302]"
          >
            <option value="all">全部区域</option>
            <option value="NA">北美</option>
            <option value="SA">南美</option>
            <option value="EMEA">欧非</option>
          </select>
        </div>
      </div>

      {/* 付款记录列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  收款方
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  关联应付
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款方式
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  银行/账号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  付款日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{record.paymentNo}</span>
                      <span className="text-xs text-gray-500">{record.region}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">{record.payeeName}</span>
                      {getPayeeTypeBadge(record.payeeType, record.serviceType)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                      {record.payableNo}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-gray-900">
                      {record.currency} ${record.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {record.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col text-xs text-gray-600">
                      <span>{record.bankName}</span>
                      <span className="text-gray-400">{record.accountNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{record.paymentDate}</span>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="查看详情">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="编辑">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="凭证">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无付款记录</p>
          </div>
        )}
      </div>
    </div>
  );
}