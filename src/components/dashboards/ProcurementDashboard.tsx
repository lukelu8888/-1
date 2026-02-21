import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Clock, Truck, FileText, Building2, MapPin, Calendar, DollarSign, ShoppingCart, ClipboardCheck, AlertCircle } from 'lucide-react';
import { ProcurementQuotationRequests } from '../admin/ProcurementQuotationRequests';

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
          <div className="bg-white/20 px-3 py-1 rounded">📦 23个采购订单</div>
          <div className="bg-white/20 px-3 py-1 rounded">🚢 18个待发货</div>
          <div className="bg-white/20 px-3 py-1 rounded">🔍 12个待验货</div>
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
                  <p className="text-2xl text-gray-900">23</p>
                  <p className="text-xs text-blue-600 mt-1">总额 $1,256,800</p>
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
                  <p className="text-2xl text-gray-900">18</p>
                  <p className="text-xs text-orange-600 mt-1">⚡ 5个紧急</p>
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
                  <p className="text-2xl text-gray-900">12</p>
                  <p className="text-xs text-indigo-600 mt-1">🔍 3个纯验货</p>
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
                  <p className="text-2xl text-gray-900">34</p>
                  <p className="text-xs text-purple-600 mt-1">🚢 追踪34批次</p>
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
                    <span>紧急发货 (5)</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {[
                  { order: 'SO-2024-1156', customer: 'ABC Corporation', items: '电气配件×500', deadline: '今天', urgent: true },
                  { order: 'SO-2024-1142', customer: 'Global Trade Ltd', items: '卫浴五金×300', deadline: '明天', urgent: true },
                  { order: 'SO-2024-1138', customer: 'Euro Imports', items: '门窗配件×800', deadline: '明天', urgent: false },
                  { order: 'SO-2024-1129', customer: 'Pacific Trading', items: '劳保用品×1200', deadline: '后天', urgent: false },
                  { order: 'SO-2024-1115', customer: 'Delta Exports', items: '电气开关×600', deadline: '3天后', urgent: false },
                ].map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      task.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.order}</span>
                      {task.urgent && <AlertCircle className="w-3 h-3 text-red-600" />}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.customer}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{task.items}</span>
                      <span className="text-orange-600">{task.deadline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔥 待处理采购订单 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <ShoppingCart className="w-4 h-4 text-blue-600" />
                    <span>待处理采购 (23)</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {[
                  { po: 'PO-2024-0856', supplier: '华南五金供应商', items: '电气开关×2000', amount: '$45,800', processing: false },
                  { po: 'PO-2024-0843', supplier: '东莞包装材料厂', items: '包装箱×5000', amount: '$18,600', processing: true },
                  { po: 'PO-2024-0831', supplier: '深圳塑料制品厂', items: '塑料配件×3000', amount: '$32,400', processing: false },
                  { po: 'PO-2024-0829', supplier: '广州电子配件商', items: '电子元件×1500', amount: '$67,200', processing: true },
                  { po: 'PO-2024-0815', supplier: '佛山模具工厂', items: '金属模具×100', amount: '$128,400', processing: false },
                ].map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      task.processing ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.po}</span>
                      {task.processing && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">处理中</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.supplier}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{task.items}</span>
                      <span className="text-blue-600">{task.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔥 验货任务追踪 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-200 bg-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardCheck className="w-4 h-4 text-indigo-600" />
                    <span>验货任务 (12)</span>
                  </h3>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {[
                  { id: 'INS-2024-0345', type: '纯验货服务', supplier: '东莞电子厂', status: '验货中', fee: '$350' },
                  { id: 'INS-2024-0342', type: '标准采购验货', supplier: '深圳五金厂', status: '待验货', fee: '-' },
                  { id: 'INS-2024-0338', type: '代理采购验货', supplier: '广州塑料厂', status: '验货中', fee: '-' },
                  { id: 'INS-2024-0335', type: '工程项目验货', supplier: '佛山模具厂', status: '待验货', fee: '-' },
                  { id: 'INS-2024-0332', type: '纯验货服务', supplier: '中山���子厂', status: '待开票', fee: '$280' },
                ].map((task, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2 rounded border ${
                      task.status === '验货中' ? 'bg-indigo-50 border-indigo-200' :
                      task.status === '待开票' ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{task.id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        task.status === '验货中' ? 'bg-indigo-100 text-indigo-700' :
                        task.status === '待开票' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{task.supplier}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{task.type}</span>
                      {task.fee !== '-' && <span className="text-green-600 font-semibold">{task.fee}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 📊 监控面板 - 双列 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 在途货物跟踪 - 紧凑版 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Truck className="w-4 h-4 text-purple-600" />
                  <span>在途货物跟踪（最新5批）</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { tracking: 'SHIP-2024-5623', from: '深圳', to: '洛杉矶', status: '海运中', eta: '12月15日', progress: 65 },
                  { tracking: 'SHIP-2024-5618', from: '广州', to: '纽约', status: '清关中', eta: '12月8日', progress: 85 },
                  { tracking: 'SHIP-2024-5607', from: '东莞', to: '芝加哥', status: '海运中', eta: '12月20日', progress: 45 },
                  { tracking: 'SHIP-2024-5595', from: '佛山', to: '迈阿密', status: '已发货', eta: '12月25日', progress: 20 },
                  { tracking: 'SHIP-2024-5584', from: '深圳', to: '旧金山', status: '海运中', eta: '12月18日', progress: 55 },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{item.tracking}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        item.status === '清关中' ? 'bg-orange-100 text-orange-700' :
                        item.status === '海运中' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{item.from} → {item.to}</span>
                      <span className="ml-auto text-purple-600">ETA: {item.eta}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 供应商绩效评估 - 紧凑版 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-3 border-b border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span>供应商绩效（Top 5）</span>
                </h3>
              </div>
              <div className="p-3 space-y-2">
                {[
                  { supplier: '华南五金供应商', score: 98, onTime: '99%', quality: '98%', rating: 'A+' },
                  { supplier: '东莞包装材料厂', score: 95, onTime: '97%', quality: '96%', rating: 'A' },
                  { supplier: '深圳塑料制品厂', score: 92, onTime: '95%', quality: '93%', rating: 'A' },
                  { supplier: '广州电子配件商', score: 88, onTime: '90%', quality: '91%', rating: 'B+' },
                  { supplier: '佛山模具工厂', score: 85, onTime: '88%', quality: '89%', rating: 'B' },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{item.supplier}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        item.rating.startsWith('A') ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.rating}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="block text-gray-500">评分</span>
                        <span className="font-semibold text-gray-900">{item.score}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">准时</span>
                        <span className="font-semibold text-gray-900">{item.onTime}</span>
                      </div>
                      <div>
                        <span className="block text-gray-500">质量</span>
                        <span className="font-semibold text-gray-900">{item.quality}</span>
                      </div>
                    </div>
                  </div>
                ))}
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