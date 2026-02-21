// 🔗 业务流程集成可视化面板
// Integration Flow Visualization Panel

import React from 'react';
import { 
  Layers, XCircle, FileSignature, Ship, DollarSign, Zap, 
  ClipboardList, ArrowRight, CheckCircle2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface IntegrationFlowPanelProps {
  onClose: () => void;
}

export function IntegrationFlowPanel({ onClose }: IntegrationFlowPanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg shadow-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-blue-900" style={{ fontSize: '14px' }}>🔗 业务流程集成架构 - Event-Driven Documentation System</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="h-6"
          style={{ fontSize: '12px' }}
        >
          <XCircle className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 集成流程图 */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        {/* 订单管理模块 */}
        <div className="bg-white rounded-lg border-2 border-purple-300 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileSignature className="h-4 w-4 text-purple-600" />
            <div className="font-bold text-purple-900" style={{ fontSize: '14px' }}>订单管理</div>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium text-gray-700 mb-1" style={{ fontSize: '12px' }}>📤 触发事件:</div>
            <div className="bg-purple-100 rounded px-2 py-1 text-purple-900 font-mono" style={{ fontSize: '11px' }}>
              CONTRACT_SIGNED
            </div>
            <div className="bg-purple-100 rounded px-2 py-1 text-purple-900 font-mono" style={{ fontSize: '11px' }}>
              SHIPPING_NOTICE_ISSUED
            </div>
          </div>
          <div className="mt-2 text-gray-600" style={{ fontSize: '11px' }}>
            → 合同签订自动创建13项单证任务
          </div>
        </div>

        {/* 发货管理模块 */}
        <div className="bg-white rounded-lg border-2 border-indigo-300 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Ship className="h-4 w-4 text-indigo-600" />
            <div className="font-bold text-indigo-900" style={{ fontSize: '14px' }}>发货管理</div>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium text-gray-700 mb-1" style={{ fontSize: '12px' }}>📤 触发事件:</div>
            <div className="bg-indigo-100 rounded px-2 py-1 text-indigo-900 font-mono" style={{ fontSize: '11px' }}>
              CUSTOMS_CLEARED
            </div>
            <div className="bg-indigo-100 rounded px-2 py-1 text-indigo-900 font-mono" style={{ fontSize: '11px' }}>
              VESSEL_DEPARTED
            </div>
          </div>
          <div className="mt-2 text-gray-600" style={{ fontSize: '11px' }}>
            → 报关完成提醒上传D05/D06
          </div>
        </div>

        {/* 财务管理模块 */}
        <div className="bg-white rounded-lg border-2 border-green-300 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div className="font-bold text-green-900" style={{ fontSize: '14px' }}>财务管理</div>
          </div>
          <div className="space-y-1.5">
            <div className="font-medium text-gray-700 mb-1" style={{ fontSize: '12px' }}>📤 触发事件:</div>
            <div className="bg-green-100 rounded px-2 py-1 text-green-900 font-mono" style={{ fontSize: '11px' }}>
              PAYMENT_RECEIVED
            </div>
            <div className="bg-green-100 rounded px-2 py-1 text-green-900 font-mono" style={{ fontSize: '11px' }}>
              FX_SETTLED
            </div>
          </div>
          <div className="mt-2 text-gray-600" style={{ fontSize: '11px' }}>
            → 收汇结汇自动生成D13/D01
          </div>
        </div>

        {/* 事件总线 */}
        <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg border-2 border-orange-400 p-3 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-orange-600" />
            <div className="font-bold text-orange-900" style={{ fontSize: '14px' }}>事件总线</div>
          </div>
          <div className="space-y-1">
            <div className="text-orange-800 font-mono bg-white/50 rounded px-1.5 py-0.5" style={{ fontSize: '11px' }}>
              EventBus
            </div>
            <div className="text-orange-700" style={{ fontSize: '11px' }}>
              • 解耦模块<br/>
              • 异步通信<br/>
              • 日志记录
            </div>
          </div>
        </div>

        {/* 单证系统 */}
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg border-2 border-pink-400 p-3 shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-4 w-4 text-pink-600" />
            <div className="font-bold text-pink-900" style={{ fontSize: '14px' }}>单证系统</div>
          </div>
          <div className="space-y-1">
            <div className="text-pink-800 font-mono bg-white/50 rounded px-1.5 py-0.5" style={{ fontSize: '11px' }}>
              DocumentationService
            </div>
            <div className="text-pink-700" style={{ fontSize: '11px' }}>
              📥 监听8种事件<br/>
              ⚙️ 自动处理13项单证<br/>
              📊 实时UI更新
            </div>
          </div>
        </div>
      </div>

      {/* 数据流向箭头 */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-purple-400"></div>
          <ArrowRight className="h-4 w-4 text-purple-600" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-indigo-400"></div>
          <ArrowRight className="h-4 w-4 text-indigo-600" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-green-400"></div>
          <ArrowRight className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-0.5 bg-orange-400"></div>
          <ArrowRight className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-0.5 bg-pink-400"></div>
          <CheckCircle2 className="h-4 w-4 text-pink-600" />
        </div>
      </div>

      {/* 8种业务事件详情 */}
      <div className="mb-4 bg-white rounded-lg border border-gray-200 p-3">
        <div className="font-bold text-gray-900 mb-2" style={{ fontSize: '14px' }}>📡 8种核心业务事件</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { event: 'CONTRACT_SIGNED', desc: '合同签订', trigger: '订单管理', action: '创建13项单证任务 + 生成D02/D04/D10', color: 'purple' },
            { event: 'PROCUREMENT_PAID', desc: '采购付款', trigger: '采购管理', action: '生成D07采购发票', color: 'yellow' },
            { event: 'SHIPPING_NOTICE_ISSUED', desc: '出货通知', trigger: '订单管理', action: '提醒物流部上传D03', color: 'cyan' },
            { event: 'CUSTOMS_CLEARED', desc: '报关完成', trigger: '发货管理', action: '提醒报关行上传D05/D06', color: 'indigo' },
            { event: 'VESSEL_DEPARTED', desc: '开船', trigger: '发货管理', action: '提醒货代上传D09', color: 'blue' },
            { event: 'PAYMENT_RECEIVED', desc: '收汇确认', trigger: '财务管理', action: '关联D11收汇水单', color: 'green' },
            { event: 'FX_SETTLED', desc: '结汇完成', trigger: '财务管理', action: '关联D12 + 生成D13 + 检查D01', color: 'emerald' },
            { event: 'DOCS_READY_FOR_TAX_REFUND', desc: '单证齐全可退税', trigger: '单证系统', action: '通知财务部提交退税', color: 'pink' },
          ].map((item, idx) => (
            <div key={idx} className={`bg-${item.color}-50 border border-${item.color}-200 rounded p-2`}>
              <div className="font-mono font-bold mb-1" style={{ fontSize: '12px', color: `var(--${item.color}-700)` }}>
                {item.event}
              </div>
              <div className="text-gray-700 mb-0.5" style={{ fontSize: '11px' }}>
                📍 {item.desc}
              </div>
              <div className="text-gray-600 mb-0.5" style={{ fontSize: '11px' }}>
                🔹 触发者: {item.trigger}
              </div>
              <div className="text-gray-600" style={{ fontSize: '11px' }}>
                ⚡ 响应: {item.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 集成状态说明 */}
      <div className="grid grid-cols-3 gap-2" style={{ fontSize: '12px' }}>
        <div className="bg-white rounded border border-blue-200 p-2">
          <div className="font-bold text-blue-900 mb-1">✅ 已集成功能</div>
          <div className="text-gray-700 space-y-0.5">
            • 事件总线 (EventBus)<br/>
            • 单证服务 (DocumentationService)<br/>
            • UI事件监听 (useBusinessEvent)<br/>
            • 实时通知 (Toast)<br/>
            • 13项单证自动化逻辑
          </div>
        </div>
        <div className="bg-white rounded border border-yellow-200 p-2">
          <div className="font-bold text-yellow-900 mb-1">⏳ 待完成集成</div>
          <div className="text-gray-700 space-y-0.5">
            • App.tsx初始化服务<br/>
            • Supabase数据表创建<br/>
            • 订单模块事件发布<br/>
            • 发货/财务模块事件发布<br/>
            • 采购模块事件发布
          </div>
        </div>
        <div className="bg-white rounded border border-green-200 p-2">
          <div className="font-bold text-green-900 mb-1">📚 完整文档</div>
          <div className="text-gray-700 space-y-0.5">
            • /docs/documentation-integration-architecture.md<br/>
            • /docs/integration-quick-start.md<br/>
            • /docs/HOW-TO-INTEGRATE-DOCUMENTATION.md<br/>
            • /lib/business-event-bus.ts<br/>
            • /lib/services/documentation-service.ts
          </div>
        </div>
      </div>

      {/* 快速开始按钮 */}
      <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
        <div className="text-gray-600" style={{ fontSize: '12px' }}>
          💡 提示：点击右侧按钮查看详细集成文档
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6"
            style={{ fontSize: '12px' }}
            onClick={() => window.open('/docs/HOW-TO-INTEGRATE-DOCUMENTATION.md')}
          >
            📖 集成指南
          </Button>
          <Button 
            size="sm" 
            className="h-6 text-white"
            style={{ background: '#F96302', fontSize: '12px' }}
            onClick={() => {
              console.log('🚀 开始集成业务流程...');
              alert('请按照 /docs/HOW-TO-INTEGRATE-DOCUMENTATION.md 中的步骤进行集成');
            }}
          >
            🚀 开始集成
          </Button>
        </div>
      </div>
    </div>
  );
}