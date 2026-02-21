import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, Download, Eye, Plus, FileText, CheckCircle2, 
  Clock, AlertCircle, XCircle, FileSignature, Package, Ship
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// 单个文档接口
interface Document {
  documentNumber: string;
  issueDate: string;
  status: string;
  pdfUrl?: string;
}

// 提单信息接口
interface BillOfLading {
  blNumber: string;
  vessel: string;
  voyage: string;
  issueDate: string;
  status: 'pending' | 'issued';
}

// 订单单证组接口（一个订单号对应的所有单证）
interface OrderDocumentGroup {
  contractNumber: string;         // 销售合同号（同时也是订单号）
  customerName: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  paymentTerms: '30-70' | '100';  // 付款条款
  
  // 销售合同
  salesContract?: Document & {
    validUntil?: string;           // 合同有效期
  };
  
  // 商业发票
  commercialInvoice?: Document & {
    dueDate?: string;              // 付款到期日
  };
  
  // 装箱清单
  packingList?: Document;
  
  // 提单
  billOfLading?: BillOfLading;
}

export default function InvoiceManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 模拟单证数据
  const mockDocuments: OrderDocumentGroup[] = [
    // 订单1：完整单证（30-70付款）
    {
      contractNumber: 'SC-NA-251018-0001',
      customerName: 'ABC Trading Ltd.',
      amount: 125000,
      currency: 'USD',
      paymentTerms: '30-70',
      salesContract: {
        documentNumber: 'SC-NA-251018-0001',
        issueDate: '2025-10-18',
        validUntil: '2026-10-18',
        status: 'signed',
        pdfUrl: '#'
      },
      commercialInvoice: {
        documentNumber: 'CI-NA-251113-0001',
        issueDate: '2025-11-13',
        dueDate: '2025-12-10',
        status: 'issued',
        pdfUrl: '#'
      },
      packingList: {
        documentNumber: 'PL-NA-251113-0001',
        issueDate: '2025-11-13',
        status: 'completed',
        pdfUrl: '#'
      },
      billOfLading: {
        blNumber: 'MAEU123456789',
        vessel: 'MAERSK HONAM',
        voyage: 'V.2025-11',
        issueDate: '2025-11-13',
        status: 'issued'
      }
    },
    
    // 订单2：完整单证（100%预付）
    {
      contractNumber: 'SC-NA-251104-0001',
      customerName: 'HomeStyle Warehouse',
      amount: 89000,
      currency: 'USD',
      paymentTerms: '30-70',
      salesContract: {
        documentNumber: 'SC-NA-251104-0001',
        issueDate: '2025-11-04',
        validUntil: '2026-11-04',
        status: 'signed',
        pdfUrl: '#'
      },
      commercialInvoice: {
        documentNumber: 'CI-NA-251108-0001',
        issueDate: '2025-11-08',
        dueDate: '2025-11-28',
        status: 'paid',
        pdfUrl: '#'
      },
      packingList: {
        documentNumber: 'PL-NA-251108-0001',
        issueDate: '2025-11-08',
        status: 'completed',
        pdfUrl: '#'
      },
      billOfLading: {
        blNumber: 'MAEU987654321',
        vessel: 'MSC OSCAR',
        voyage: 'V.2025-11',
        issueDate: '2025-11-08',
        status: 'issued'
      }
    },
    
    // 订单3：已签合同，待发货（缺物流单证）
    {
      contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub',
      amount: 156000,
      currency: 'USD',
      paymentTerms: '30-70',
      salesContract: {
        documentNumber: 'SC-NA-251115-0001',
        issueDate: '2025-11-15',
        validUntil: '2026-11-15',
        status: 'signed',
        pdfUrl: '#'
      }
    },
    
    // 订单4：小额订单（100%预付）
    {
      contractNumber: 'SC-NA-251116-0001',
      customerName: 'Quick Buy Co.',
      amount: 4500,
      currency: 'USD',
      paymentTerms: '100',
      salesContract: {
        documentNumber: 'SC-NA-251116-0001',
        issueDate: '2025-11-16',
        validUntil: '2026-11-16',
        status: 'signed',
        pdfUrl: '#'
      },
      commercialInvoice: {
        documentNumber: 'CI-NA-251120-0001',
        issueDate: '2025-11-20',
        dueDate: '2025-12-20',
        status: 'paid',
        pdfUrl: '#'
      },
      packingList: {
        documentNumber: 'PL-NA-251120-0001',
        issueDate: '2025-11-20',
        status: 'completed',
        pdfUrl: '#'
      },
      billOfLading: {
        blNumber: 'COSU7654321',
        vessel: 'COSCO SHIPPING',
        voyage: 'V.2025-11',
        issueDate: '2025-11-20',
        status: 'issued'
      }
    },
    
    // 订单5：欧洲订单
    {
      contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH',
      amount: 45000,
      currency: 'EUR',
      paymentTerms: '30-70',
      salesContract: {
        documentNumber: 'SC-EU-251101-0001',
        issueDate: '2025-11-01',
        validUntil: '2026-11-01',
        status: 'signed',
        pdfUrl: '#'
      },
      commercialInvoice: {
        documentNumber: 'CI-EU-251105-0001',
        issueDate: '2025-11-05',
        dueDate: '2025-12-05',
        status: 'paid',
        pdfUrl: '#'
      },
      packingList: {
        documentNumber: 'PL-EU-251105-0001',
        issueDate: '2025-11-05',
        status: 'completed',
        pdfUrl: '#'
      },
      billOfLading: {
        blNumber: 'MSCU8765432',
        vessel: 'MSC GULSUN',
        voyage: 'V.2025-11',
        issueDate: '2025-11-05',
        status: 'issued'
      }
    }
  ];

  // 过滤数据
  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter(group => {
      const matchesSearch = 
        group.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.salesContract?.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.commercialInvoice?.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || 
        group.salesContract?.status === filterStatus ||
        group.commercialInvoice?.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, filterStatus]);

  // 获取合同状态配置
  const getContractStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '草稿', color: 'bg-slate-50 text-slate-700 border-slate-200' },
      signed: { label: '已签', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      cancelled: { label: '取消', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  // 获取发票状态配置
  const getInvoiceStatusConfig = (status: string) => {
    const configs = {
      draft: { label: '草稿', color: 'bg-slate-50 text-slate-700 border-slate-200' },
      issued: { label: '已开', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      paid: { label: '已付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      overdue: { label: '逾期', color: 'bg-rose-50 text-rose-700 border-rose-200' },
      cancelled: { label: '取消', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  // 获取物流单证状态配置
  const getLogisticsStatusConfig = (status: string) => {
    const configs = {
      pending: { label: '待制作', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      issued: { label: '已签发', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  // 获取货币符号
  const getCurrencySymbol = (currency: string) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', CNY: '¥' };
    return symbols[currency as keyof typeof symbols] || currency;
  };

  return (
    <div className="space-y-3 p-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">单证管理中心</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">管理销售合同、商业发票、装箱清单和提单</p>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <Input
            placeholder="搜索合同号、客户、发票号..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-[11px] border-gray-300"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[100px] h-7 text-[11px] border-gray-300">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" style={{ fontSize: '11px' }}>全部</SelectItem>
            <SelectItem value="draft" style={{ fontSize: '11px' }}>草稿</SelectItem>
            <SelectItem value="signed" style={{ fontSize: '11px' }}>已签</SelectItem>
            <SelectItem value="issued" style={{ fontSize: '11px' }}>已开</SelectItem>
            <SelectItem value="paid" style={{ fontSize: '11px' }}>已付</SelectItem>
            <SelectItem value="cancelled" style={{ fontSize: '11px' }}>取消</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" className="h-7 text-[11px] bg-[#F96302] hover:bg-[#E55A02] px-2.5">
          <Plus className="w-3 h-3 mr-1" />
          新建合同
        </Button>
      </div>

      {/* 单证表格 */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[130px]">销售合同号</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[150px]">客户</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[90px]">金额</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[80px] text-center">付款条款</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[100px] text-center bg-blue-50">合同状态</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[120px] text-center bg-emerald-50 border-l-2 border-emerald-200">商业发票</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[110px] text-center bg-orange-50 border-l-2 border-orange-200">装箱清单</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium w-[120px] text-center bg-purple-50 border-l-2 border-purple-200">提单</TableHead>
                <TableHead className="h-8 py-2 text-[11px] text-gray-600 font-medium text-right w-[80px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p className="text-sm">暂无单证记录</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((group) => (
                  <TableRow key={group.contractNumber} className="hover:bg-gray-50">
                    {/* 销售合同号 */}
                    <TableCell className="py-2">
                      <div className="flex items-center gap-1">
                        <FileSignature className="w-3 h-3 text-blue-600" />
                        <p className="text-[11px] font-medium text-blue-600">
                          {group.contractNumber}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {group.salesContract?.issueDate}
                      </p>
                    </TableCell>

                    {/* 客户 */}
                    <TableCell className="py-2">
                      <p className="text-[11px] text-gray-900">{group.customerName}</p>
                    </TableCell>

                    {/* 金额 */}
                    <TableCell className="py-2">
                      <p className="text-[12px] font-bold text-gray-900">
                        {getCurrencySymbol(group.currency)}{group.amount.toLocaleString()}
                      </p>
                    </TableCell>

                    {/* 付款条款 */}
                    <TableCell className="py-2 text-center">
                      <Badge className={`h-5 px-2 text-[10px] border ${
                        group.paymentTerms === '100' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {group.paymentTerms === '100' ? '100%预付' : '30/70'}
                      </Badge>
                    </TableCell>

                    {/* 合同状态 */}
                    <TableCell className="py-2 bg-blue-50/30 text-center">
                      {group.salesContract ? (
                        <Badge className={`h-5 px-2 text-[10px] border ${getContractStatusConfig(group.salesContract.status).color}`}>
                          {getContractStatusConfig(group.salesContract.status).label}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-gray-400">-</span>
                      )}
                    </TableCell>

                    {/* 商业发票 */}
                    <TableCell className="py-2 bg-emerald-50/30 border-l-2 border-emerald-200 text-center">
                      {group.commercialInvoice ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-emerald-600">
                            {group.commercialInvoice.documentNumber}
                          </p>
                          <Badge className={`h-4 px-1.5 text-[9px] border ${getInvoiceStatusConfig(group.commercialInvoice.status).color}`}>
                            {getInvoiceStatusConfig(group.commercialInvoice.status).label}
                          </Badge>
                        </div>
                      ) : (
                        <Button size="sm" className="h-5 px-2 text-[10px] bg-[#F96302] hover:bg-[#E55A02]">
                          开票
                        </Button>
                      )}
                    </TableCell>

                    {/* 装箱清单 */}
                    <TableCell className="py-2 bg-orange-50/30 border-l-2 border-orange-200 text-center">
                      {group.packingList ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-orange-600">
                            {group.packingList.documentNumber}
                          </p>
                          <Badge className={`h-4 px-1.5 text-[9px] border ${getLogisticsStatusConfig(group.packingList.status).color}`}>
                            {getLogisticsStatusConfig(group.packingList.status).label}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">待制作</span>
                      )}
                    </TableCell>

                    {/* 提单 */}
                    <TableCell className="py-2 bg-purple-50/30 border-l-2 border-purple-200 text-center">
                      {group.billOfLading ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-medium text-purple-600">
                            {group.billOfLading.blNumber}
                          </p>
                          <Badge className={`h-4 px-1.5 text-[9px] border ${getLogisticsStatusConfig(group.billOfLading.status).color}`}>
                            {getLogisticsStatusConfig(group.billOfLading.status).label}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400">待签发</span>
                      )}
                    </TableCell>

                    {/* 操作 */}
                    <TableCell className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="下载清关包">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="查看详情">
                          <Eye className="w-3 h-3" />
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

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>共 {filteredDocuments.length} 个订单</span>
        <div className="flex items-center gap-4">
          <span>销售合同: {filteredDocuments.filter(g => g.salesContract).length}</span>
          <span>商业发票: {filteredDocuments.filter(g => g.commercialInvoice).length}</span>
          <span>装箱清单: {filteredDocuments.filter(g => g.packingList).length}</span>
          <span>提单: {filteredDocuments.filter(g => g.billOfLading).length}</span>
        </div>
      </div>
    </div>
  );
}
