import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Download, Eye, Edit2, DollarSign, Calendar, Building2, Truck, AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * 💰 应付账款管理 - Admin Portal
 * 
 * 功能：统一管理对供应商和服务商的应付账款
 * 支持：供应商货款、服务商服务费等
 * 关系：1个应付账款 → N个付款记录（1:N）
 * 状态联动：未付款 → 部分付款 → 已付清
 */

interface PayableAccount {
  id: string;
  payableNo: string; // 应付编号：YF-{REGION}-YYMMDD-XXXX
  payeeType: 'supplier' | 'service_provider'; // 收款方类型
  payeeId: string;
  payeeName: string;
  serviceType?: string; // 服务商类型（如果是服务商）
  
  // 关联单据
  sourceType: 'purchase_order' | 'service_order' | 'shipment'; // 来源单据类型
  sourceNo: string; // 来源单据编号
  
  // 金额信息
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  currency: 'USD' | 'EUR' | 'CNY';
  
  // 状态
  status: 'unpaid' | 'partial' | 'paid'; // 未付款、部分付款、已付清
  
  // 时间
  dueDate: string; // 应付日期
  createdDate: string;
  lastPaymentDate?: string; // 最后付款日期
  
  // 其他
  region: 'NA' | 'SA' | 'EMEA';
  notes?: string;
  paymentCount: number; // 付款次数
}

// 模拟数据
const mockPayables: PayableAccount[] = [
  {
    id: 'PAY001',
    payableNo: 'YF-NA-250122-0001',
    payeeType: 'supplier',
    payeeId: 'SUP001',
    payeeName: '东莞市华强电器有限公司',
    sourceType: 'purchase_order',
    sourceNo: 'PO-NA-250115-0001',
    totalAmount: 45800.00,
    paidAmount: 20000.00,
    unpaidAmount: 25800.00,
    currency: 'USD',
    status: 'partial',
    dueDate: '2025-02-15',
    createdDate: '2025-01-22',
    lastPaymentDate: '2025-01-25',
    region: 'NA',
    notes: '已付定金，余款装船后7天内支付',
    paymentCount: 1
  },
  {
    id: 'PAY002',
    payableNo: 'YF-NA-250120-0002',
    payeeType: 'service_provider',
    payeeId: 'SP001',
    payeeName: '深圳市鹏程国际货运代理有限公司',
    serviceType: 'forwarder',
    sourceType: 'shipment',
    sourceNo: 'SHIP-NA-250118-0001',
    totalAmount: 3200.00,
    paidAmount: 0,
    unpaidAmount: 3200.00,
    currency: 'USD',
    status: 'unpaid',
    dueDate: '2025-02-20',
    createdDate: '2025-01-20',
    region: 'NA',
    notes: '海运费用，提单签发后付款',
    paymentCount: 0
  },
  {
    id: 'PAY003',
    payableNo: 'YF-EMEA-250119-0003',
    payeeType: 'service_provider',
    payeeId: 'SP005',
    payeeName: '广州市天力报关有限公司',
    serviceType: 'customs',
    sourceType: 'shipment',
    sourceNo: 'SHIP-EMEA-250117-0002',
    totalAmount: 800.00,
    paidAmount: 800.00,
    unpaidAmount: 0,
    currency: 'USD',
    status: 'paid',
    dueDate: '2025-02-10',
    createdDate: '2025-01-19',
    lastPaymentDate: '2025-01-21',
    region: 'EMEA',
    notes: '报关费用，已结清',
    paymentCount: 1
  },
  {
    id: 'PAY004',
    payableNo: 'YF-SA-250118-0004',
    payeeType: 'supplier',
    payeeId: 'SUP003',
    payeeName: '佛山市顺德区美家卫浴有限公司',
    sourceType: 'purchase_order',
    sourceNo: 'PO-SA-250110-0002',
    totalAmount: 28600.00,
    paidAmount: 0,
    unpaidAmount: 28600.00,
    currency: 'USD',
    status: 'unpaid',
    dueDate: '2025-02-28',
    createdDate: '2025-01-18',
    region: 'SA',
    notes: '100%预付款，待客户付款后支付',
    paymentCount: 0
  },
  {
    id: 'PAY005',
    payableNo: 'YF-NA-250117-0005',
    payeeType: 'service_provider',
    payeeId: 'SP003',
    payeeName: '深圳市SGS检验有限公司',
    serviceType: 'inspection',
    sourceType: 'service_order',
    sourceNo: 'INS-NA-250115-0001',
    totalAmount: 650.00,
    paidAmount: 650.00,
    unpaidAmount: 0,
    currency: 'USD',
    status: 'paid',
    dueDate: '2025-02-05',
    createdDate: '2025-01-17',
    lastPaymentDate: '2025-01-20',
    region: 'NA',
    notes: '验货费用，已支付',
    paymentCount: 1
  },
];

export default function PayableManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payeeTypeFilter, setPayeeTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // 筛选逻辑
  const filteredPayables = useMemo(() => {
    return mockPayables.filter(payable => {
      const matchSearch = 
        payable.payableNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payable.payeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payable.sourceNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || payable.status === statusFilter;
      const matchPayeeType = payeeTypeFilter === 'all' || payable.payeeType === payeeTypeFilter;
      const matchRegion = regionFilter === 'all' || payable.region === regionFilter;
      
      return matchSearch && matchStatus && matchPayeeType && matchRegion;
    });
  }, [searchTerm, statusFilter, payeeTypeFilter, regionFilter]);

  // 统计数据
  const stats = useMemo(() => {
    const total = mockPayables.reduce((sum, p) => sum + p.totalAmount, 0);
    const unpaid = mockPayables.reduce((sum, p) => sum + p.unpaidAmount, 0);
    const paid = mockPayables.reduce((sum, p) => sum + p.paidAmount, 0);
    const overdueCount = mockPayables.filter(p => 
      p.status !== 'paid' && new Date(p.dueDate) < new Date()
    ).length;

    return { total, unpaid, paid, overdueCount };
  }, []);

  // 状态标签
  const getStatusBadge = (status: string) => {
    const styles = {
      unpaid: 'bg-red-100 text-red-700 border-red-200',
      partial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      paid: 'bg-green-100 text-green-700 border-green-200',
    };
    const labels = {
      unpaid: '未付款',
      partial: '部分付款',
      paid: '已付清',
    };
    const icons = {
      unpaid: AlertCircle,
      partial: Clock,
      paid: CheckCircle,
    };
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
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
            <h1 className="text-xl font-semibold text-gray-900">💰 应付账款管理</h1>
            <p className="text-xs text-gray-500 mt-1">
              Accounts Payable Management - 统一管理供应商和服务商应付款项
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-[14px] bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              导出报表
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-[14px] bg-[#F96302] text-white rounded-lg hover:bg-[#E55A02] transition-colors">
              <Plus className="w-4 h-4" />
              新增应付款
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">总应付金额</p>
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
              <p className="text-xs text-gray-500">未付金额</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                ${stats.unpaid.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">已付金额</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                ${stats.paid.toLocaleString()}
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
              <p className="text-xs text-gray-500">逾期账款</p>
              <p className="text-xl font-bold text-orange-600 mt-1">
                {stats.overdueCount} 笔
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
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
              placeholder="搜索应付编号、收款方名称、来源单据..."
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
            <option value="unpaid">未付款</option>
            <option value="partial">部分付款</option>
            <option value="paid">已付清</option>
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

          <button className="flex items-center gap-2 px-3 py-2 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            高级筛选
          </button>
        </div>
      </div>

      {/* 应付账款列表 */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  应付编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  收款方
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  来源单据
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  总金额
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  已付金额
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">
                  未付金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  应付日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  状态
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayables.map((payable) => (
                <tr key={payable.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-900">{payable.payableNo}</span>
                      <span className="text-[10px] text-gray-500">{payable.region}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-gray-900">{payable.payeeName}</span>
                      {getPayeeTypeBadge(payable.payeeType, payable.serviceType)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-900">{payable.sourceNo}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-gray-900">
                      {payable.currency} ${payable.totalAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-green-600 font-medium">
                      ${payable.paidAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-red-600 font-medium">
                      ${payable.unpaidAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-900">{payable.dueDate}</span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(payable.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="查看详情">
                        <Eye className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors" title="编辑">
                        <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                      {payable.status !== 'paid' && (
                        <button className="px-2 py-1 bg-[#F96302] text-white rounded text-[10px] hover:bg-[#E55A02] transition-colors">
                          付款
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayables.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xs text-gray-500">暂无应付账款数据</p>
          </div>
        )}
      </div>
    </div>
  );
}