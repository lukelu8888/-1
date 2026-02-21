import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  FileText,
  DollarSign,
  Users,
  MessageSquare,
  FileSignature,
  Info
} from 'lucide-react';
import { workflowEngine, getWorkflowState, type WorkflowContext, type WorkflowState } from '../../utils/workflowEngineV2';

interface WorkflowStatusTrackerProps {
  inquiryNumber?: string;
  quotationNumber?: string;
  contractNumber?: string;
  currentStepId?: string;
  context?: WorkflowContext;
  onStepExecute?: (stepId: string, context: WorkflowContext) => void;
}

export function WorkflowStatusTracker({
  inquiryNumber,
  quotationNumber,
  contractNumber,
  currentStepId,
  context = {},
  onStepExecute
}: WorkflowStatusTrackerProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    stepId: string;
    timestamp: Date;
    success: boolean;
    triggersExecuted: number;
  }>>([]);
  
  // 从localStorage加载工作流状态
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);

  useEffect(() => {
    if (inquiryNumber) {
      const state = getWorkflowState(inquiryNumber);
      if (state) {
        setWorkflowState(state);
        console.log('📊 已加载工作流状态:', state);
      }
    }
  }, [inquiryNumber]);

  const stages = workflowEngine.getStages();
  const stats = workflowEngine.getWorkflowStats();

  // 获取当前步骤所在的阶段
  const getCurrentStage = () => {
    if (!currentStepId) return null;
    for (const stage of stages) {
      const step = stage.steps.find(s => s.id === currentStepId);
      if (step) return stage;
    }
    return null;
  };

  const currentStage = getCurrentStage();

  // 自动展开当前阶段
  useEffect(() => {
    if (currentStage && expandedStage !== currentStage.id) {
      setExpandedStage(currentStage.id);
    }
  }, [currentStage]);

  // 判断步骤状态（优先使用保存的工作流状态）
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' => {
    // 优先使用保存的工作流状态
    if (workflowState) {
      if (workflowState.completedSteps.includes(stepId)) return 'completed';
      if (workflowState.currentStepId === stepId) return 'current';
      return 'pending';
    }
    
    // 回退到本地执行历史
    if (!currentStepId) return 'pending';
    
    const executed = executionHistory.find(h => h.stepId === stepId);
    if (executed) return 'completed';
    
    if (stepId === currentStepId) return 'current';
    
    return 'pending';
  };

  // 获取阶段图标
  const getStageIcon = (stageId: string) => {
    const iconMap: Record<string, any> = {
      'inquiry_stage': FileText,
      'quotation_stage': DollarSign,
      'approval_stage': Users,
      'customer_feedback_stage': MessageSquare,
      'contract_stage': FileSignature
    };
    return iconMap[stageId] || FileText;
  };

  // 执行步骤
  const handleExecuteStep = async (stepId: string) => {
    if (!onStepExecute) return;

    try {
      const result = await workflowEngine.executeStep(stepId, {
        ...context,
        inquiry_number: inquiryNumber,
        quotation_number: quotationNumber,
        contract_number: contractNumber,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        setExecutionHistory(prev => [...prev, {
          stepId,
          timestamp: new Date(),
          success: true,
          triggersExecuted: result.triggersExecuted
        }]);
      }

      onStepExecute(stepId, context);
    } catch (error) {
      console.error('执行步骤失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">业务流程跟踪</h2>
          <p className="text-sm text-gray-600 mt-1">
            客户询价到合同完整流程 - {stats.totalStages} 阶段 / {stats.totalSteps} 步骤 / {stats.totalTriggers} 触发器
          </p>
        </div>
        
        {inquiryNumber && (
          <div className="text-right">
            <div className="text-sm text-gray-600">询价单号</div>
            <div className="font-mono font-bold text-blue-600">{inquiryNumber}</div>
            {quotationNumber && (
              <>
                <div className="text-sm text-gray-600 mt-2">报价单号</div>
                <div className="font-mono font-bold text-green-600">{quotationNumber}</div>
              </>
            )}
            {contractNumber && (
              <>
                <div className="text-sm text-gray-600 mt-2">合同号</div>
                <div className="font-mono font-bold text-purple-600">{contractNumber}</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 进度总览 */}
      {currentStepId && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">流程进度</div>
            <div className="text-sm font-bold text-indigo-600">
              {executionHistory.length} / {stats.totalSteps} 步骤已完成
            </div>
          </div>
          <Progress 
            value={(executionHistory.length / stats.totalSteps) * 100} 
            className="h-2"
          />
          {currentStage && (
            <div className="mt-3 text-sm text-gray-600">
              当前阶段: <span className="font-medium text-indigo-600">{currentStage.name}</span>
            </div>
          )}
        </Card>
      )}

      {/* 阶段列表 */}
      <div className="space-y-3">
        {stages.map((stage, stageIndex) => {
          const isExpanded = expandedStage === stage.id;
          const StageIcon = getStageIcon(stage.id);
          
          // 计算阶段完成度
          const completedSteps = stage.steps.filter(step => 
            executionHistory.some(h => h.stepId === step.id)
          ).length;
          const stageProgress = (completedSteps / stage.steps.length) * 100;
          
          return (
            <Card key={stage.id} className="overflow-hidden">
              {/* 阶段头部 */}
              <button
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${completedSteps === stage.steps.length 
                      ? 'bg-green-100 text-green-600' 
                      : currentStage?.id === stage.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'}
                  `}>
                    <StageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{stage.name}</div>
                    <div className="text-sm text-gray-600">{stage.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <div className="text-xs text-gray-500">
                      {completedSteps} / {stage.steps.length} 步骤
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {Math.round(stageProgress)}% 完成
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* 阶段进度条 */}
              <div className="px-4 pb-2">
                <Progress value={stageProgress} className="h-1" />
              </div>

              {/* 步骤列表 */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  {stage.steps.map((step, stepIndex) => {
                    const stepStatus = getStepStatus(step.id);
                    const isExecuted = executionHistory.some(h => h.stepId === step.id);
                    const executionInfo = executionHistory.find(h => h.stepId === step.id);

                    return (
                      <div
                        key={step.id}
                        className={`
                          p-4 border-b border-gray-100 last:border-b-0
                          ${stepStatus === 'current' ? 'bg-blue-50' : ''}
                          ${stepStatus === 'completed' ? 'bg-green-50/50' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {/* 步骤状态图标 */}
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                            ${stepStatus === 'completed' ? 'bg-green-500 text-white' : ''}
                            ${stepStatus === 'current' ? 'bg-blue-500 text-white animate-pulse' : ''}
                            ${stepStatus === 'pending' ? 'bg-gray-200 text-gray-500' : ''}
                          `}>
                            {stepStatus === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : stepStatus === 'current' ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-400" />
                            )}
                          </div>

                          {/* 步骤信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{step.action}</h4>
                              <Badge variant={
                                stepStatus === 'completed' ? 'default' :
                                stepStatus === 'current' ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {step.actor === 'customer' ? '👤 客户' :
                                 step.actor === 'sales_rep' ? '👨‍💼 业务员' :
                                 step.actor === 'regional_manager' ? '👔 区域经理' :
                                 step.actor === 'sales_director' ? '🎯 销售总监' :
                                 step.actor === 'admin_finance' ? '💰 财务' :
                                 step.actor === 'supplier' ? '🏭 供应商' :
                                 '🤖 系统'}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                            {/* 触发器信息 */}
                            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                <span>{step.triggers.length} 个触发器</span>
                              </div>
                              {step.required_fields.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{step.required_fields.length} 个必填字段</span>
                                </div>
                              )}
                            </div>

                            {/* 执行信息 */}
                            {isExecuted && executionInfo && (
                              <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-green-600 font-medium">
                                    ✅ 已执行 {executionInfo.triggersExecuted} 个触发器
                                  </span>
                                  <span className="text-gray-500">
                                    {new Date(executionInfo.timestamp).toLocaleString('zh-CN')}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 执行按钮（仅当前步骤或测试模式） */}
                            {onStepExecute && stepStatus === 'current' && (
                              <Button
                                onClick={() => handleExecuteStep(step.id)}
                                size="sm"
                                className="mt-3"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                执行此步骤
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* 执行历史 */}
      {executionHistory.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">执行历史</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExecutionHistory([])}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              清空历史
            </Button>
          </div>
          
          <div className="space-y-2">
            {executionHistory.map((item, index) => {
              const stepInfo = workflowEngine.getStepInfo(item.stepId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{stepInfo?.action || item.stepId}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.triggersExecuted} 触发器
                    </Badge>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default WorkflowStatusTracker;
