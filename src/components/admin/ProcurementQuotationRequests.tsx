import React, { useState } from 'react';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { useUser } from '../../contexts/UserContext';
import { Clock, Package, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { ProductSupplierDistributionDialog } from './ProductSupplierDistributionDialog';

/**
 * 📋 采购员 - 报价请求管理
 * 
 * 业务流程：
 * 1. 业务员从客户询价单推送报价请求到采购部
 * 2. 采购员在此查看所有待处理的报价请求
 * 3. 采购员可以接受请求，然后向供应商发起采购询价（XJ）
 * 
 * 权限隔离：
 * - 采购员看不到客户信息（customerName已匿名化为"客户A/B/C"）
 * - 采购员只能看到产品需求和目标价格
 */

export function ProcurementQuotationRequests() {
  const { user } = useUser();
  const { 
    quotationRequests, 
    getPendingQuotationRequests,
    updateQuotationRequest 
  } = useQuotationRequests();

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'quoted'>('all');
  
  // 🔥 新增：产品-供应商分发对话框状态
  const [isDistributionDialogOpen, setIsDistributionDialogOpen] = useState(false);
  const [selectedQuotationRequest, setSelectedQuotationRequest] = useState<any>(null);


  // 🔥 获取采购员可见的报价请求（所有未分配的或分配给自己的）
  const getProcurementRequests = () => {
    let requests = quotationRequests.filter(
      r => !r.assignedTo || r.assignedTo === user?.email
    );

    if (selectedStatus !== 'all') {
      requests = requests.filter(r => r.status === selectedStatus);
    }

    return requests.sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  };

  const procurementRequests = getProcurementRequests();
  const pendingCount = quotationRequests.filter(r => r.status === 'pending' && !r.assignedTo).length;
  const myProcessingCount = quotationRequests.filter(r => r.status === 'processing' && r.assignedTo === user?.email).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <Clock className="w-3 h-3 text-yellow-600" />
            <span className="text-yellow-700">待处理</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs">
            <Package className="w-3 h-3 text-blue-600" />
            <span className="text-blue-700">处理中</span>
          </div>
        );
      case 'quoted':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-green-700">已报价</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs">
            <XCircle className="w-3 h-3 text-gray-600" />
            <span className="text-gray-700">已取消</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    updateQuotationRequest(requestId, {
      status: 'processing',
      assignedTo: user?.email,
      assignedToName: user?.name,
      assignedDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      
      {/* 📊 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">待接单</p>
              <p className="text-2xl text-gray-900">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">我的处理中</p>
              <p className="text-2xl text-gray-900">{myProcessingCount}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">全部请求</p>
              <p className="text-2xl text-gray-900">{quotationRequests.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* 📋 报价请求列表 */}
      <div className="bg-white border border-gray-300 rounded-lg">
        
        {/* 标题栏 */}
        <div className="border-b border-gray-300 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-black mb-1">报价请求池</h2>
              <p className="text-xs text-gray-600">QUOTATION REQUEST POOL</p>
            </div>
            
            {/* 状态筛选 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1.5 text-xs border rounded ${
                  selectedStatus === 'all' 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSelectedStatus('pending')}
                className={`px-3 py-1.5 text-xs border rounded ${
                  selectedStatus === 'pending' 
                    ? 'bg-yellow-500 text-white border-yellow-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                待处理 ({pendingCount})
              </button>
              <button
                onClick={() => setSelectedStatus('processing')}
                className={`px-3 py-1.5 text-xs border rounded ${
                  selectedStatus === 'processing' 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                处理中
              </button>
              <button
                onClick={() => setSelectedStatus('quoted')}
                className={`px-3 py-1.5 text-xs border rounded ${
                  selectedStatus === 'quoted' 
                    ? 'bg-green-500 text-white border-green-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                已报价
              </button>
            </div>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-36">请求编号</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-24">状态</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700">产品清单</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-24">总数量</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-28">期望报价日</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-24">请求人</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-gray-700 w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {procurementRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">暂无报价请求</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {procurementRequests.map((request) => {
                const totalQty = request.items.reduce((sum, item) => sum + item.quantity, 0);
                
                return (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                    {/* 请求编号 */}
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-black">{request.requestNumber}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {request.createdDate}
                      </div>
                    </td>
                    
                    {/* 状态 */}
                    <td className="px-4 py-3">
                      {getStatusBadge(request.status)}
                    </td>
                    
                    {/* 产品清单 */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {request.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-gray-900">{item.modelNo || item.productName}</span>
                            <span className="text-gray-500 ml-2">x {item.quantity}</span>
                          </div>
                        ))}
                        {request.items.length > 2 && (
                          <div className="text-xs text-gray-500">
                            ...还有 {request.items.length - 2} 项
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 总数量 */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{totalQty}</div>
                      <div className="text-xs text-gray-500">{request.items.length}项</div>
                    </td>
                    
                    {/* 期望报价日 */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">{request.expectedQuoteDate}</div>
                    </td>
                    
                    {/* 请求人 */}
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-900">{request.requestedByName || '业务员'}</div>
                    </td>
                    
                    {/* 操作 */}
                    <td className="px-4 py-3">
                      {request.status === 'pending' && !request.assignedTo && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-7"
                        >
                          接单
                        </Button>
                      )}
                      {request.status === 'processing' && request.assignedTo === user?.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-gray-300"
                          onClick={() => {
                            setSelectedQuotationRequest(request);
                            setIsDistributionDialogOpen(true);
                          }}
                        >
                          创建XJ
                        </Button>
                      )}
                      {request.status === 'quoted' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-gray-600"
                        >
                          查看
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔍 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded p-4 text-xs">
          <div className="font-mono">
            <div>全部报价请求: {quotationRequests.length}</div>
            <div>待处理: {pendingCount}</div>
            <div>当前用户: {user?.email}</div>
            <div className="mt-2 text-gray-600">
              最新请求: {quotationRequests[0]?.requestNumber || '无'}
            </div>
          </div>
        </div>
      )}
      
      {/* 🔥 新增：产品-供应商分发对话框 */}
      <ProductSupplierDistributionDialog
        open={isDistributionDialogOpen}
        onClose={() => {
          setIsDistributionDialogOpen(false);
          setSelectedQuotationRequest(null);
        }}
        quotationRequest={selectedQuotationRequest}
      />
    </div>
  );
}