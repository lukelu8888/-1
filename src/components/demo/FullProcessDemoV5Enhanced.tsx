/**
 * 🎯 全流程演示 V5 Enhanced - 可视化编辑器版本
 * 
 * 新增特性：
 * - ✅ 步骤聚焦模式（点击步骤高亮，其他半透明）
 * - ✅ 右侧详情编辑面板（显示并可编辑步骤信息）
 * - ✅ 上下文关系可视化（高亮上下游连接）
 * - ✅ 实时保存（直接在泳道图界面编辑）
 * - ✅ 表单字段编辑器
 * - ✅ 通知配置编辑器
 * - ✅ 上下游步骤关系展示
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Edit2,
  Save,
  Plus,
  Trash2,
  ChevronRight,
  ArrowRight,
  Bell,
  FileText,
  Users,
  RotateCcw,
} from 'lucide-react';

// 🔥 导入V5的真实步骤数据
import { getAllSteps } from './FullProcessDemoV5';

// 定义步骤接口
interface Step {
  id: number;
  role: string;
  stageId: number;
  stageName: string;
  title: string;
  action: string;
  time: string;
  nextStepId?: number;
  status?: StepStatus;
  statusDetails?: StatusDetails;
}

// 步骤状态类型
interface StepStatus {
  type: 'draft' | 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'warning' | 'blocked' | 'partial';
  label: string;
  icon: string;
  color: string;
}

// 状态详情
interface StatusDetails {
  operator?: string;
  completedTime?: string;
  progress?: number;
  amount?: string;
  quantity?: string;
  location?: string;
  attachments?: string[];
  remarks?: string;
  fields?: StatusField[];
  notification?: {
    message: string;
    messageEn?: string;
    notifier: string;
    notifierEn?: string;
    recipients?: string[];
  };
}

// 业务字段状态
interface StatusField {
  label: string;
  labelEn?: string;
  value: string;
  valueEn?: string;
  status?: 'pending' | 'completed' | 'uploaded' | 'waiting' | 'paid' | 'approved' | 'rejected' | 'processing' | 'confirmed';
  statusLabel?: string;
  statusLabelEn?: string;
  statusColor?: string;
  icon?: string;
}

// 预定义状态配置
const statusConfig: Record<string, StepStatus> = {
  completed: { type: 'completed', label: '已完成', icon: '✅', color: '#10B981' },
  approved: { type: 'approved', label: '已批准', icon: '✓', color: '#22C55E' },
  in_progress: { type: 'in_progress', label: '进行中', icon: '⏳', color: '#F59E0B' },
  pending: { type: 'pending', label: '待处理', icon: '⏱️', color: '#6B7280' },
  rejected: { type: 'rejected', label: '已驳回', icon: '❌', color: '#EF4444' },
  warning: { type: 'warning', label: '需注意', icon: '⚠️', color: '#F97316' },
  blocked: { type: 'blocked', label: '已阻塞', icon: '🚫', color: '#DC2626' },
  draft: { type: 'draft', label: '草稿', icon: '📝', color: '#9CA3AF' },
  partial: { type: 'partial', label: '部分完成', icon: '◐', color: '#3B82F6' },
};

// 角色配置
const roles = [
  { id: 'customer', name: '客户', color: '#8B5CF6', icon: '👤' },
  { id: 'sales', name: '业务员', color: '#10B981', icon: '💼' },
  { id: 'regional_manager', name: '区域业务主管', color: '#06B6D4', icon: '👨‍💼' },
  { id: 'sales_director', name: '销售总监', color: '#EF4444', icon: '👔' },
  { id: 'procurement', name: '采购员', color: '#F59E0B', icon: '📦' },
  { id: 'supplier', name: '供应商', color: '#EAB308', icon: '🏭' },
  { id: 'finance', name: '财务专员', color: '#3B82F6', icon: '💰' },
  { id: 'finance_director', name: '财务总监', color: '#DC2626', icon: '💵' },
  { id: 'qc', name: '验货员', color: '#14B8A6', icon: '🔍' },
  { id: 'inspection', name: '商检机构', color: '#6B7280', icon: '📋' },
  { id: 'forwarder', name: '货代', color: '#0891B2', icon: '🚢' },
  { id: 'truck_company', name: '拖车公司', color: '#71717A', icon: '🚛' },
  { id: 'truck_driver', name: '拖车司机', color: '#737373', icon: '🚗' },
  { id: 'customs_broker', name: '报关行', color: '#64748B', icon: '📄' },
  { id: 'customs', name: '海关', color: '#DC2626', icon: '🛂' },
];

// 阶段配置
const stages = [
  { id: 1, name: '询价报价', color: '#3B82F6', stepCount: 15 },
  { id: 2, name: '销售合同', color: '#8B5CF6', stepCount: 8 },
  { id: 3, name: '采购合同', color: '#F59E0B', stepCount: 12 },
  { id: 4, name: '生产质检', color: '#10B981', stepCount: 9 },
  { id: 5, name: '验货完货', color: '#EF4444', stepCount: 4 },
  { id: 6, name: '尾款催收', color: '#EC4899', stepCount: 11 },
  { id: 7, name: '商检订舱', color: '#6366F1', stepCount: 10 },
  { id: 8, name: '拖车装柜', color: '#FBBF24', stepCount: 8 },
  { id: 9, name: '装柜报关', color: '#14B8A6', stepCount: 5 },
  { id: 10, name: '报关开船', color: '#3B82F6', stepCount: 5 },
  { id: 11, name: '海运跟踪', color: '#06B6D4', stepCount: 5 },
  { id: 12, name: '到港清关', color: '#10B981', stepCount: 6 },
  { id: 13, name: '验货反馈', color: '#22C55E', stepCount: 4 },
];

export function FullProcessDemoV5Enhanced() {
  // 状态管理
  const [steps, setSteps] = useState<Step[]>(getAllSteps(statusConfig));
  const [focusedStepId, setFocusedStepId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // 计算步骤位置
  const getStepPosition = (step: Step) => {
    const roleIndex = roles.findIndex(r => r.name === step.role);
    const y = 120 + roleIndex * 49 + 24.5;
    
    // 计算x位置（基于阶段和在阶段中的位置）
    const stageSteps = steps.filter(s => s.stageId === step.stageId);
    const stepIndexInStage = stageSteps.findIndex(s => s.id === step.id);
    const stageStartX = 200 + (step.stageId - 1) * 140;
    const stepSpacing = 140 / (stageSteps.length + 1);
    const x = stageStartX + (stepIndexInStage + 1) * stepSpacing;
    
    return { x, y };
  };

  // 渲染连接线
  const renderConnections = () => {
    return steps
      .filter(step => step.nextStepId)
      .map(step => {
        const nextStep = steps.find(s => s.id === step.nextStepId);
        if (!nextStep) return null;

        const start = getStepPosition(step);
        const end = getStepPosition(nextStep);

        // 判断是否是聚焦步骤的上下游
        const isRelated = focusedStepId && (
          step.id === focusedStepId || 
          step.nextStepId === focusedStepId ||
          (focusedStepId && steps.find(s => s.id === focusedStepId)?.nextStepId === step.id)
        );

        return (
          <line
            key={`${step.id}-${step.nextStepId}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={isRelated ? '#F97316' : '#CBD5E1'}
            strokeWidth={isRelated ? 3 : 1.5}
            markerEnd={isRelated ? 'url(#arrowhead-active)' : 'url(#arrowhead-normal)'}
            className={isRelated ? 'transition-all duration-300' : ''}
            opacity={focusedStepId && !isRelated ? 0.3 : 1}
          />
        );
      });
  };

  // 点击步骤处理
  const handleStepClick = (stepId: number) => {
    setFocusedStepId(stepId);
    setIsEditMode(false);
  };

  // 关闭详情面板
  const handleClosePanel = () => {
    setFocusedStepId(null);
    setIsEditMode(false);
  };

  // 获取上下游步骤
  const getUpstreamSteps = (stepId: number) => {
    return steps.filter(s => s.nextStepId === stepId);
  };

  const getDownstreamSteps = (stepId: number) => {
    const step = steps.find(s => s.id === stepId);
    return step?.nextStepId ? steps.filter(s => s.id === step.nextStepId) : [];
  };

  // 更新步骤数据
  const updateStep = (stepId: number, updates: Partial<Step>) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  // 详情编辑面板组件
  const StepDetailPanel = ({ stepId }: { stepId: number }) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return null;

    const roleInfo = roles.find(r => r.name === step.role);
    const upstreamSteps = getUpstreamSteps(stepId);
    const downstreamSteps = getDownstreamSteps(stepId);

    return (
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 overflow-hidden flex flex-col border-l-4 border-orange-500">
        {/* 头部 */}
        <div
          className="flex-shrink-0 px-6 py-4 border-b border-gray-200"
          style={{ background: `linear-gradient(135deg, ${roleInfo?.color}15 0%, ${roleInfo?.color}05 100%)` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ backgroundColor: roleInfo?.color }}
              >
                {step.id}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className="text-white"
                    style={{ backgroundColor: roleInfo?.color }}
                  >
                    {step.role}
                  </Badge>
                  {step.status && (
                    <Badge
                      className="text-white"
                      style={{ backgroundColor: step.status.color }}
                    >
                      {step.status.icon} {step.status.label}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500">{step.stageName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="text-gray-600 hover:text-orange-600"
              >
                {isEditMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePanel}
                className="text-gray-600 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{step.action}</p>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 基本信息 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold text-gray-900">基本信息</h4>
            </div>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">步骤名称</label>
                {isEditMode ? (
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    className="text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">执行动作</label>
                {isEditMode ? (
                  <Textarea
                    value={step.action}
                    onChange={(e) => updateStep(step.id, { action: e.target.value })}
                    className="text-sm"
                    rows={2}
                  />
                ) : (
                  <div className="text-sm text-gray-700">{step.action}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">操作时间</label>
                  <div className="text-sm text-gray-700">{step.time}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">操作人</label>
                  <div className="text-sm text-gray-700">{step.statusDetails?.operator || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 表单字段 */}
          {step.statusDetails?.fields && step.statusDetails.fields.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">表单字段</h4>
                </div>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newField: StatusField = {
                        label: '新字段',
                        value: '',
                        icon: '📝',
                      };
                      updateStep(step.id, {
                        statusDetails: {
                          ...step.statusDetails,
                          fields: [...(step.statusDetails?.fields || []), newField],
                        },
                      });
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {step.statusDetails.fields.map((field, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isEditMode ? (
                          <div className="space-y-2">
                            <Input
                              value={field.label}
                              onChange={(e) => {
                                const newFields = [...(step.statusDetails?.fields || [])];
                                newFields[index] = { ...field, label: e.target.value };
                                updateStep(step.id, {
                                  statusDetails: { ...step.statusDetails, fields: newFields },
                                });
                              }}
                              className="text-xs"
                              placeholder="字段名称"
                            />
                            <Input
                              value={field.value}
                              onChange={(e) => {
                                const newFields = [...(step.statusDetails?.fields || [])];
                                newFields[index] = { ...field, value: e.target.value };
                                updateStep(step.id, {
                                  statusDetails: { ...step.statusDetails, fields: newFields },
                                });
                              }}
                              className="text-xs"
                              placeholder="字段值"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              {field.icon && <span className="text-sm">{field.icon}</span>}
                              <span className="text-xs text-gray-600">{field.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {field.value}
                              </span>
                              {field.status && field.statusLabel && (
                                <Badge
                                  className="text-white text-xs"
                                  style={{ backgroundColor: field.statusColor || '#6B7280' }}
                                >
                                  {field.statusLabel}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {isEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newFields = step.statusDetails?.fields?.filter((_, i) => i !== index) || [];
                            updateStep(step.id, {
                              statusDetails: { ...step.statusDetails, fields: newFields },
                            });
                          }}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 通知信息 */}
          {step.statusDetails?.notification && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-gray-900">通知信息</h4>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {isEditMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">通知内容</label>
                      <Textarea
                        value={step.statusDetails.notification.message}
                        onChange={(e) => {
                          updateStep(step.id, {
                            statusDetails: {
                              ...step.statusDetails,
                              notification: {
                                ...step.statusDetails?.notification!,
                                message: e.target.value,
                              },
                            },
                          });
                        }}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">通知方</label>
                      <Input
                        value={step.statusDetails.notification.notifier}
                        onChange={(e) => {
                          updateStep(step.id, {
                            statusDetails: {
                              ...step.statusDetails,
                              notification: {
                                ...step.statusDetails?.notification!,
                                notifier: e.target.value,
                              },
                            },
                          });
                        }}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-2 mb-2">
                      <Bell className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{step.statusDetails.notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>通知方: {step.statusDetails.notification.notifier}</span>
                    </div>
                    {step.statusDetails.notification.recipients && step.statusDetails.notification.recipients.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.statusDetails.notification.recipients.map((recipient, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {recipient}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 上下游关系 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-orange-600" />
              <h4 className="font-semibold text-gray-900">流程关系</h4>
            </div>
            <div className="space-y-3">
              {/* 上游步骤 */}
              {upstreamSteps.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 block mb-2">上游步骤</label>
                  <div className="space-y-2">
                    {upstreamSteps.map(upStep => {
                      const upRoleInfo = roles.find(r => r.name === upStep.role);
                      return (
                        <div
                          key={upStep.id}
                          className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                          onClick={() => handleStepClick(upStep.id)}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: upRoleInfo?.color }}
                          >
                            {upStep.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{upStep.title}</div>
                            <div className="text-xs text-gray-600">{upStep.role}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 当前步骤 */}
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 border-2 border-orange-500 rounded-lg">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: roleInfo?.color }}
                  >
                    {step.id}
                  </div>
                  <span className="text-sm font-semibold text-orange-900">当前步骤</span>
                </div>
              </div>

              {/* 下游步骤 */}
              {downstreamSteps.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 block mb-2">下游步骤</label>
                  <div className="space-y-2">
                    {downstreamSteps.map(downStep => {
                      const downRoleInfo = roles.find(r => r.name === downStep.role);
                      return (
                        <div
                          key={downStep.id}
                          className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                          onClick={() => handleStepClick(downStep.id)}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: downRoleInfo?.color }}
                          >
                            {downStep.id}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{downStep.title}</div>
                            <div className="text-xs text-gray-600">{downStep.role}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 备注 */}
          {step.statusDetails?.remarks && (
            <div>
              <label className="text-xs text-gray-500 block mb-2">备注</label>
              {isEditMode ? (
                <Textarea
                  value={step.statusDetails.remarks}
                  onChange={(e) => {
                    updateStep(step.id, {
                      statusDetails: {
                        ...step.statusDetails,
                        remarks: e.target.value,
                      },
                    });
                  }}
                  className="text-sm"
                  rows={3}
                />
              ) : (
                <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  {step.statusDetails.remarks}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        {isEditMode && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setIsEditMode(false);
                  // 这里可以添加保存逻辑
                  console.log('保存步骤数据:', step);
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                保存更改
              </Button>
              <Button
                onClick={() => setIsEditMode(false)}
                variant="outline"
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className={`max-w-[2100px] mx-auto ${focusedStepId ? 'mr-[480px]' : ''} transition-all duration-300`}>
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🏊 全流程泳道图 V5 Enhanced - 可视化编辑器
              </h1>
              <p className="text-gray-600">
                点击任意步骤查看详情 • 右侧面板可编辑配置 • 橙色高亮显示上下游关系
              </p>
            </div>
            <div className="flex items-center gap-3">
              {focusedStepId && (
                <Badge className="bg-orange-600 text-white">
                  已选中步骤 {focusedStepId}
                </Badge>
              )}
              <Button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                variant="outline"
                size="sm"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-16 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                variant="outline"
                size="sm"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setZoomLevel(1)}
                variant="outline"
                size="sm"
                title="重置缩放"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="outline"
                size="sm"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-6 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm text-gray-700">聚焦步骤</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-300"></div>
              <span className="text-sm text-gray-700">其他步骤</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-orange-500"></div>
              <span className="text-sm text-gray-700">关联连线</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-700">点击步骤查看详情</span>
            </div>
          </div>
        </div>

        {/* 泳道图 */}
        <Card className="p-6 overflow-auto bg-white shadow-xl">
          <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
            <svg
              ref={svgRef}
              width="2020"
              height="855"
              className="border border-gray-200 rounded-lg"
            >
              {/* 定义箭头 */}
              <defs>
                <marker
                  id="arrowhead-normal"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#CBD5E1" />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#F97316" />
                </marker>
              </defs>

              {/* 背景 */}
              <rect
                x="0"
                y="0"
                width="2020"
                height="855"
                fill="transparent"
                onClick={handleClosePanel}
                style={{ cursor: 'default' }}
              />

              {/* 阶段头部 */}
              {stages.map((stage, index) => (
                <g key={stage.id}>
                  <rect
                    x={200 + index * 140}
                    y={20}
                    width={140}
                    height={80}
                    fill={stage.color}
                    rx="8"
                    opacity="0.9"
                  />
                  <text
                    x={200 + index * 140 + 70}
                    y={50}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {stage.name}
                  </text>
                  <text
                    x={200 + index * 140 + 70}
                    y={75}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                  >
                    {stage.stepCount}步
                  </text>
                </g>
              ))}

              {/* 角色泳道 */}
              {roles.map((role, index) => (
                <g key={role.id}>
                  {/* 泳道背景 */}
                  <rect
                    x="0"
                    y={120 + index * 49}
                    width="2020"
                    height="49"
                    fill={index % 2 === 0 ? '#F8FAFC' : '#FFFFFF'}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                  
                  {/* 角色标签 */}
                  <rect
                    x="10"
                    y={120 + index * 49 + 10}
                    width="170"
                    height="29"
                    fill={role.color}
                    rx="6"
                    opacity="0.9"
                  />
                  <text
                    x="25"
                    y={120 + index * 49 + 28}
                    fill="white"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {role.icon} {role.name}
                  </text>
                </g>
              ))}

              {/* 连接线 */}
              {renderConnections()}

              {/* 步骤圆圈 */}
              {steps.map(step => {
                const pos = getStepPosition(step);
                const roleInfo = roles.find(r => r.name === step.role);
                const isFocused = step.id === focusedStepId;
                const isRelated = focusedStepId && (
                  step.id === focusedStepId ||
                  step.nextStepId === focusedStepId ||
                  steps.find(s => s.id === focusedStepId)?.nextStepId === step.id
                );
                
                return (
                  <g key={step.id} className="group">
                    {/* 步骤圆圈 */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isFocused ? 18 : 13}
                      fill={isFocused ? '#F97316' : roleInfo?.color}
                      stroke={isFocused ? '#FB923C' : '#CBD5E1'}
                      strokeWidth={isFocused ? 3 : 1.5}
                      className={isFocused ? 'animate-pulse cursor-pointer' : 'cursor-pointer'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepClick(step.id);
                      }}
                      opacity={focusedStepId && !isRelated ? 0.3 : 1}
                    />
                    {/* 状态指示外环 */}
                    {step.status && isFocused && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={22}
                        fill="none"
                        stroke={step.status.color}
                        strokeWidth="2"
                        strokeDasharray="2,2"
                        className="opacity-80"
                      />
                    )}
                    {/* 步骤编号 */}
                    <text
                      x={pos.x}
                      y={pos.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isFocused ? '16' : '13'}
                      fontWeight="bold"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepClick(step.id);
                      }}
                      opacity={focusedStepId && !isRelated ? 0.3 : 1}
                    >
                      {step.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>
      </div>

      {/* 详情面板 */}
      {focusedStepId && <StepDetailPanel stepId={focusedStepId} />}
    </div>
  );
}

export default FullProcessDemoV5Enhanced;