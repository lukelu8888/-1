import React, { useMemo, useState } from 'react';
import { Package, AlertTriangle, Clock, Truck, ShoppingCart, ClipboardCheck, AlertCircle, Building2, FileText, MapPin, CheckCircle } from 'lucide-react';
import { ProcurementQuotationRequests } from '../admin/ProcurementQuotationRequests';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { buildProcurementDashboardOverview } from '../../lib/services/procurementDashboardDataService';

interface ProcurementDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ProcurementDashboard({ user }: ProcurementDashboardProps) {
  // 🔥 采购专员工作台 - 紧凑专业版 · 全面整合验货
  const [activeTab, setActiveTab] = useState<'overview' | 'quotation-requests'>('quotation-requests');
  const { purchaseOrders } = usePurchaseOrders();

  const overview = useMemo(() => {
    return buildProcurementDashboardOverview(purchaseOrders, user.email);
  }, [purchaseOrders, user.email]);
  const { taskCenter } = overview;
  const collaborationSections = taskCenter.collaborationSections;
  const taskSections = taskCenter.taskSections;

  // 🔍 调试日志
  React.useEffect(() => {
    console.log('🔍 [ProcurementDashboard] 组件已加载');
    console.log('🔍 [ProcurementDashboard] 当前用户:', user);
    console.log('🔍 [ProcurementDashboard] 当前Tab:', activeTab);
  }, [user, activeTab]);

  return (
    <div className="p-4 space-y-4 max-w-[1800px] mx-auto">
      {/* 🎯 欢迎区域 - 紧凑版 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white flex items-center justify-between">
        <div>
          <h1 className="text-xl mb-1">采购专员工作台</h1>
          <p className="opacity-90 text-sm">欢迎回来，{user.name} · 今日采购、发货、验货任务概览</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="bg-white/20 px-3 py-1 rounded">📦 {overview.procurementContracts.length}个采购订单</div>
          <div className="bg-white/20 px-3 py-1 rounded">🧾 {overview.prAssignmentQueue.length}个PR待分配</div>
          <div className="bg-white/20 px-3 py-1 rounded">✅ {overview.cgApprovalQueue.length}个CG待审批</div>
          <div className="bg-white/20 px-3 py-1 rounded">🚢 {overview.inTransitOrders.length}个在途/待发货</div>
          <div className="bg-white/20 px-3 py-1 rounded">🔍 {overview.inspectionOrders.length}个待验货</div>
        </div>
      </div>

      {/* 🔥 Tab导航 */}
      <div className="bg-white border border-gray-300 rounded-lg">
        <div className="flex border-b border-gray-300">
          <button
            onClick={() => setActiveTab('quotation-requests')}
            className={`px-6 py-3 text-sm transition-colors ${
              activeTab === 'quotation-requests'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 报价请求池
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 工作概览
          </button>
        </div>
      </div>

      {/* 🔥 Tab内容 */}
      {activeTab === 'quotation-requests' && (
        <ProcurementQuotationRequests />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 📊 核心指标卡片 - 紧凑4列 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 待处理采购订单 */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-gray-600">待处理采购单</p>
                  </div>
                  <p className="text-2xl text-gray-900">{overview.pendingProcurement.length}</p>
                  <p className="text-xs text-blue-600 mt-1">总额 ${overview.amountTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* 待发货订单 */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-gray-600">待发货订单</p>
                  </div>
                  <p className="text-2xl text-gray-900">{overview.inTransitOrders.length}</p>
                  <p className="text-xs text-orange-600 mt-1">⚡ {overview.urgentOrders.length}个紧急</p>
                </div>
              </div>
            </div>

            {/* 🔥 待验货订单 */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                    <p className="text-xs text-gray-600">待验货订单</p>
                  </div>
                  <p className="text-2xl text-gray-900">{overview.inspectionOrders.length}</p>
                  <p className="text-xs text-indigo-600 mt-1">🧾 {overview.prAssignmentQueue.length}个PR待分配</p>
                </div>
              </div>
            </div>

            {/* 在途货物 */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-gray-600">在途货物</p>
                  </div>
                  <p className="text-2xl text-gray-900">{overview.inTransitOrders.length}</p>
                  <p className="text-xs text-purple-600 mt-1">🚢 跟踪 {overview.inTransitOrders.length} 批次</p>
                </div>
              </div>
            </div>
          </div>

          {/* 📋 核心任务区域 - 紧凑三列 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 🔥 紧急发货任务 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-orange-50">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span>紧急/待批采购 ({overview.topUrgent.length})</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {overview.topUrgent.map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      String(task.cgType || '').toLowerCase() === 'urgent' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.poNumber}</span>
                      {String(task.cgType || '').toLowerCase() === 'urgent' && <AlertCircle className="w-3 h-3 text-red-600" />}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.supplierName || '待定供应商'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{(task.items || []).slice(0, 1).map((item) => `${item.productName}×${item.quantity}`).join(', ') || '待补充明细'}</span>
                      <span className="text-orange-600">{task.procurementRequestStatus || task.status}</span>
                    </div>
                  </div>
                ))}
                {overview.topUrgent.length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无紧急或待批采购任务</div>
                )}
              </div>
            </div>

            {/* 🔥 待处理采购订单 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>待处理采购 ({overview.topPending.length})</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {overview.topPending.map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      ['pending_manager_approval', 'pending_ceo_approval'].includes(String(task.procurementRequestStatus || ''))
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.poNumber}</span>
                      {['pending_manager_approval', 'pending_ceo_approval'].includes(String(task.procurementRequestStatus || '')) && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">处理中</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.supplierName || '待定供应商'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{(task.items || []).slice(0, 1).map((item) => `${item.productName}×${item.quantity}`).join(', ') || '待补充明细'}</span>
                      <span className="text-blue-600">${Number(task.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {overview.topPending.length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无待处理采购任务</div>
                )}
              </div>
            </div>

            {/* 🔥 验货任务追踪 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                    <span>验货任务 ({overview.topInspection.length})</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {overview.topInspection.map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      String(task.qcInspectionStatus || '').toLowerCase() === 'in_progress' ? 'bg-indigo-50 border-indigo-200' :
                      String(task.qcInspectionStatus || '').toLowerCase() === 'completed' ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.poNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        String(task.qcInspectionStatus || '').toLowerCase() === 'in_progress' ? 'bg-indigo-100 text-indigo-700' :
                        String(task.qcInspectionStatus || '').toLowerCase() === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.qcInspectionStatus || '待验货'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.supplierName || '待定供应商'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{task.inspectionExecutionMode || '标准采购验货'}</span>
                      <span className="text-green-600 font-semibold">{task.qcReleaseStatus || '-'}</span>
                    </div>
                  </div>
                ))}
                {overview.topInspection.length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无待验货采购任务</div>
                )}
              </div>
            </div>
          </div>

          {/* 📊 监控面板 - 双列 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200 bg-amber-50">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>风险摘要</span>
                </h3>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="rounded border border-red-200 bg-red-50 p-3">
                  <div className="text-xs text-red-700">紧急采购</div>
                  <div className="mt-1 text-xl font-semibold text-red-900">{overview.riskSummary.urgentCount}</div>
                </div>
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <div className="text-xs text-blue-700">待审批</div>
                  <div className="mt-1 text-xl font-semibold text-blue-900">{overview.riskSummary.pendingApprovalCount}</div>
                </div>
                <div className="rounded border border-amber-200 bg-amber-50 p-3">
                  <div className="text-xs text-amber-700">待校验</div>
                  <div className="mt-1 text-xl font-semibold text-amber-900">{overview.riskSummary.pendingValidationCount}</div>
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-700">缺供应商</div>
                  <div className="mt-1 text-xl font-semibold text-gray-900">{overview.riskSummary.missingSupplierCount}</div>
                </div>
                <div className="rounded border border-purple-200 bg-purple-50 p-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-purple-700">QC阻断</div>
                      <div className="mt-1 text-xl font-semibold text-purple-900">{overview.riskSummary.qcBlockedCount}</div>
                    </div>
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200 bg-slate-50">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span>协同角色入口</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {collaborationSections.map((section) => (
                  <div key={section.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{section.label}</div>
                        <div className="mt-1 text-xs text-slate-600">{section.roles.join(' / ')}</div>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                        {section.count}
                      </div>
                    </div>
                  </div>
                ))}
                {collaborationSections.length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无待协同事项</div>
                )}
              </div>
            </div>

            {/* PR / CG 队列区块（由数据契约驱动） */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>{taskSections[0]?.label || 'PR 分配待办'}（最新5条）</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {(taskSections[0]?.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border ${
                      String(item.procurementRequestStatus || '') === 'pending_procurement_assignment'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{item.poNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        String(item.procurementRequestStatus || '') === 'pending_procurement_assignment'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.procurementRequestStatus || '待分配'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{item.customerCompany || item.customerName || '待补客户'}</span>
                      <span className="ml-auto text-blue-600">
                        {Number(item.allocatedSupplierCount || 0)}/{(item.items || []).length || 0} 已分配
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(Number(item.allocatedSupplierCount || 0) / Math.max((item.items || []).length || 1, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {(item.items || []).slice(0, 1).map((product) => `${product.productName}×${product.quantity}`).join(', ') || '待补充明细'}
                    </p>
                  </div>
                ))}
                {(taskSections[0]?.items || []).length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无待分配 PR</div>
                )}
              </div>
            </div>

            {/* CG 审批待办 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{taskSections[1]?.label || 'CG 审批待办'}（最新5条）</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {(taskSections[1]?.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border ${
                      String(item.procurementRequestStatus || '') === 'pending_ceo_approval'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{item.poNumber}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        String(item.procurementRequestStatus || '') === 'pending_ceo_approval'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.procurementRequestStatus === 'pending_ceo_approval' ? 'CEO审批' : '经理审批'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-2">{item.supplierName || '待定供应商'}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="block text-gray-500">类型</span>
                        <span className="font-semibold text-gray-900">{item.cgType || 'standard'}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">金额</span>
                        <span className="font-semibold text-gray-900">${Number(item.totalAmount || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">校验</span>
                        <span className="font-semibold text-gray-900">{item.prValidationStatus || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(taskSections[1]?.items || []).length === 0 && (
                  <div className="p-3 text-xs text-gray-500">暂无待审批 CG</div>
                )}
              </div>
            </div>
          </div>

          {/* 🔥 快捷操作 - 紧凑5列 */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>快捷操作</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <button className="p-3 rounded-lg border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <ShoppingCart className="w-5 h-5 text-blue-600 mb-1 mx-auto" />
                <span className="text-xs text-gray-900 block">创建采购单</span>
              </button>
              <button className="p-3 rounded-lg border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-center">
                <Package className="w-5 h-5 text-orange-600 mb-1 mx-auto" />
                <span className="text-xs text-gray-900 block">安排发货</span>
              </button>
              <button className="p-3 rounded-lg border-2 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
                <ClipboardCheck className="w-5 h-5 text-indigo-600 mb-1 mx-auto" />
                <span className="text-xs text-gray-900 block">验货管理</span>
              </button>
              <button className="p-3 rounded-lg border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
                <Truck className="w-5 h-5 text-purple-600 mb-1 mx-auto" />
                <span className="text-xs text-gray-900 block">跟踪物流</span>
              </button>
              <button className="p-3 rounded-lg border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-colors text-center">
                <Building2 className="w-5 h-5 text-green-600 mb-1 mx-auto" />
                <span className="text-xs text-gray-900 block">评估供应商</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
