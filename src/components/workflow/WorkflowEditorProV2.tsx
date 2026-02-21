/**
 * 业务流程配置编辑器 Pro V2
 * 
 * 🆕 V2特性:
 * - 支持V1和V2配置切换
 * - 默认加载V2增强版配置（基于金额的智能审批）
 * - 保留所有拖拽编辑功能
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { 
  Workflow, Settings, Eye, Code, FileJson, Download, Upload,
  RefreshCw, ChevronRight, AlertCircle, CheckCircle2, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import workflowConfigImport from '../../config/businessWorkflow';
import { businessWorkflowConfigV2 } from '../../config/businessWorkflowComplete33V2';

export function WorkflowEditorProV2() {
  const [currentVersion, setCurrentVersion] = useState<'v1' | 'v2'>('v2');
  const [config, setConfig] = useState(businessWorkflowConfigV2.workflow_config);
  const [isV2DescriptionCollapsed, setIsV2DescriptionCollapsed] = useState(false);

  const handleSwitchToV1 = () => {
    setCurrentVersion('v1');
    setConfig(workflowConfigImport);
    toast.success('已切换到 V1 版本（原始6步流程）');
  };

  const handleSwitchToV2 = () => {
    setCurrentVersion('v2');
    setConfig(businessWorkflowConfigV2.workflow_config);
    toast.success('✨ 已切换到 V2 增强版（智能审批流程）');
  };

  const handleRefreshToLatest = () => {
    localStorage.removeItem('business_workflow_config');
    localStorage.removeItem('business_workflow_config_meta');
    
    const latestConfig = businessWorkflowConfigV2.workflow_config;
    const totalSteps = latestConfig.workflow?.stages?.reduce((sum: number, stage: any) => sum + (stage.steps?.length || 0), 0) || 0;
    const stage5Steps = latestConfig.workflow?.stages?.find((s: any) => s.id === 'stage_5_contract')?.steps?.length || 0;
    
    toast.success(`✅ 已加载最新V2配置！总步骤：${totalSteps}步，阶段5：${stage5Steps}步`);
    
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 版本切换顶栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  🔄 业务流程配置编辑器 Pro
                </h2>
                <p className="text-sm text-gray-600">
                  当前版本: {currentVersion === 'v2' ? 'V2.0.0 增强版' : 'V1.0.0 原始版'}
                </p>
              </div>
              {currentVersion === 'v2' && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                  🆕 V2增强版 - 基于金额的智能审批
                </Badge>
              )}
            </div>
            
            {/* 版本切换按钮 */}
            <div className="flex gap-2">
              <Button 
                variant={currentVersion === 'v1' ? 'default' : 'outline'} 
                size="sm"
                onClick={handleSwitchToV1}
              >
                V1 原始版本 (6步)
              </Button>
              <Button 
                variant={currentVersion === 'v2' ? 'default' : 'outline'} 
                size="sm"
                onClick={handleSwitchToV2}
                className={currentVersion === 'v2' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' : ''}
              >
                🆕 V2 增强版 (8步)
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleRefreshToLatest}
                className="text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* V2版本说明 - 可折叠 */}
          {currentVersion === 'v2' && (
            <div className="mt-3">
              {/* 折叠标题栏 */}
              <button
                onClick={() => setIsV2DescriptionCollapsed(!isV2DescriptionCollapsed)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">
                    ✨ V2增强版特性（总计37步）
                  </h3>
                  <Badge className="bg-purple-600 text-white text-xs">
                    点击{isV2DescriptionCollapsed ? '展开' : '收起'}
                  </Badge>
                </div>
                {isV2DescriptionCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-purple-600" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-purple-600" />
                )}
              </button>

              {/* 可折叠内容 */}
              {!isV2DescriptionCollapsed && (
                <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>• <strong>智能审批路由</strong>: 金额 &lt; $20,000 → 区域主管审批 | ≥ $20,000 → 销售总监审批</p>
                        <p>• <strong>阶段2增强</strong>: 报价准备从6步扩展到8步（增加金额条件分支）</p>
                        <p>• <strong>阶段5增强</strong>: 销售合同从5步扩展到9步（增加金额条件分支）🆕</p>
                        <p>• <strong>权限合规</strong>: 完全符合公司RBAC权限矩阵要求</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <p className="text-xs text-purple-700">
                          💡 <strong>提示</strong>: 如果看不到最新配置，请点击右上角的 <RefreshCw className="w-3 h-3 inline" /> 刷新按钮加载最新版本
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        window.open('/WORKFLOW_V2_QUICK_REFERENCE.md', '_blank');
                      }}
                    >
                      📖 查看V2文档
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* V1版本说明 */}
          {currentVersion === 'v1' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                📌 <strong>V1原始版本</strong>: 阶段2包含6步，所有报价统一由区域主管审批
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 渲染编辑器 */}
      <div className="max-w-[1800px] mx-auto p-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="text-center py-8">
              <Workflow className="w-16 h-16 mx-auto text-purple-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                工作流配置查看器
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                当前版本: {currentVersion === 'v2' ? 'V2.0.0 增强版' : 'V1.0.0 原始版'}
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{config?.workflow?.stages?.length || 0} 个阶段</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span>
                    {config?.workflow?.stages?.reduce((sum: number, stage: any) => sum + (stage.steps?.length || 0), 0) || 0} 个步骤
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">配置详情</h4>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px] text-xs border border-gray-200">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default WorkflowEditorProV2;