import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner@2.0.3';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  User,
  Calendar,
  ChevronRight,
  Download,
  X,
  Paperclip,
  Activity
} from 'lucide-react';

// ==================== 类型定义 ====================

interface NodeInfo {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  phase?: string;
  order?: number;
  requiresFiles: boolean;
  fileTypes: string[];
  businessFields: string[];
}

interface NodeProgress {
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'failed';
  completedAt?: string;
  operator?: string;
  notes?: string;
  files?: { name: string; url: string; uploadedAt: string }[];
}

interface PhaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phaseInfo: {
    id: string;
    label: string;
    description: string;
    color: string;
  };
  nodes: Array<{
    nodeId: string;
    nodeInfo: NodeInfo;
    progress?: NodeProgress;
  }>;
  completion: number;
  onOpenNodeDetails: (nodeId: string, nodeInfo: NodeInfo, progress?: NodeProgress) => void;
}

// ==================== 主组件 ====================

export default function PhaseDetailsModal({
  isOpen,
  onClose,
  phaseInfo,
  nodes,
  completion,
  onOpenNodeDetails
}: PhaseDetailsModalProps) {
  // 获取状态统计
  const stats = {
    total: nodes.length,
    completed: nodes.filter(n => n.progress?.status === 'completed').length,
    inProgress: nodes.filter(n => n.progress?.status === 'in_progress').length,
    pending: nodes.filter(n => !n.progress || n.progress.status === 'pending').length,
    delayed: nodes.filter(n => n.progress?.status === 'delayed').length
  };

  // 获取状态颜色
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delayed': return 'text-red-600 bg-red-50 border-red-200';
      case 'failed': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-400 bg-gray-50 border-gray-200';
    }
  };

  // 获取状态显示
  const getStatusDisplay = (status?: string) => {
    const statusMap = {
      'completed': { label: '已完成', icon: CheckCircle2 },
      'in_progress': { label: '进行中', icon: Clock },
      'delayed': { label: '延误', icon: AlertCircle },
      'failed': { label: '失败', icon: X },
      'pending': { label: '待处理', icon: Clock }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {phaseInfo.label}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">{phaseInfo.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`bg-${phaseInfo.color}-50 text-${phaseInfo.color}-700 border-${phaseInfo.color}-200`}>
                {nodes.length} 个节点
              </Badge>
              <Button variant="outline" size="sm" className="h-8">
                <Download className="w-3 h-3 mr-1.5" />
                导出
              </Button>
            </div>
          </div>

          {/* 阶段进度条 */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">整体进度</span>
              <span className="text-sm font-semibold text-gray-900">{completion}%</span>
            </div>
            <Progress value={completion} className="h-2" />
          </div>

          {/* 快速统计 */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">总节点</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600">已完成</p>
                  <p className="text-xl font-semibold text-green-900 mt-1">{stats.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600">进行中</p>
                  <p className="text-xl font-semibold text-blue-900 mt-1">{stats.inProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">待处理</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600">延误</p>
                  <p className="text-xl font-semibold text-red-900 mt-1">{stats.delayed}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* 节点列表 */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="grid grid-cols-2 gap-4">
            {nodes.map(({ nodeId, nodeInfo, progress }) => {
              const status = progress?.status || 'pending';
              const statusDisplay = getStatusDisplay(status);
              const StatusIcon = statusDisplay.icon;
              const Icon = nodeInfo.icon;

              return (
                <Card
                  key={nodeId}
                  className={`border-2 ${getStatusColor(status)} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => onOpenNodeDetails(nodeId, nodeInfo, progress)}
                >
                  <CardHeader className="py-3 px-4 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {/* 节点图标 */}
                        <div className={`w-10 h-10 rounded-lg bg-${nodeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 text-${nodeInfo.color}-600`} />
                        </div>
                        
                        {/* 节点信息 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900">{nodeInfo.label}</h4>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{nodeInfo.description}</p>
                          
                          {/* 状态标签 */}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getStatusColor(status)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusDisplay.label}
                            </Badge>
                            {nodeInfo.order && (
                              <Badge variant="secondary" className="text-xs">
                                #{nodeInfo.order}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 查看按钮 */}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="py-3 px-4 space-y-3">
                    {/* 完成信息 */}
                    {progress?.completedAt && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">完成时间：</span>
                        <span className="text-gray-900 font-medium">{progress.completedAt}</span>
                      </div>
                    )}
                    
                    {progress?.operator && (
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">操作人：</span>
                        <span className="text-gray-900 font-medium">{progress.operator}</span>
                      </div>
                    )}

                    {/* 业务字段 */}
                    {nodeInfo.businessFields && nodeInfo.businessFields.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <div className="flex items-center gap-1 mb-1.5">
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700">业务字段</span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {nodeInfo.businessFields.length}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {nodeInfo.businessFields.slice(0, 4).map((field, idx) => (
                            <span key={idx} className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {field}
                            </span>
                          ))}
                          {nodeInfo.businessFields.length > 4 && (
                            <span className="text-xs text-gray-500 px-2 py-0.5">
                              +{nodeInfo.businessFields.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 文件信息 */}
                    {nodeInfo.requiresFiles && (
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <div className="flex items-center gap-1 mb-1.5">
                          <Paperclip className="w-3 h-3 text-orange-600" />
                          <span className="text-xs font-medium text-orange-700">必传文件</span>
                          <Badge variant="secondary" className="text-xs ml-auto bg-orange-100 text-orange-700">
                            {nodeInfo.fileTypes.length} 种
                          </Badge>
                        </div>
                        
                        {/* 已上传文件 */}
                        {progress?.files && progress.files.length > 0 ? (
                          <div className="space-y-1">
                            {progress.files.slice(0, 2).map((file, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded border border-orange-200">
                                <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-900 truncate flex-1">{file.name}</span>
                              </div>
                            ))}
                            {progress.files.length > 2 && (
                              <p className="text-xs text-gray-500 pl-2">+{progress.files.length - 2} 个文件</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {nodeInfo.fileTypes.slice(0, 3).map((type, idx) => (
                              <span key={idx} className="text-xs text-orange-700 bg-white px-2 py-0.5 rounded border border-orange-200">
                                {type}
                              </span>
                            ))}
                            {nodeInfo.fileTypes.length > 3 && (
                              <span className="text-xs text-orange-600 px-2 py-0.5">
                                +{nodeInfo.fileTypes.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 上传按钮 */}
                        {(status === 'completed' || status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 h-7 text-xs border-orange-300 hover:bg-orange-100 text-orange-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info(`上传 ${nodeInfo.label} 文件`);
                            }}
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            上传文件
                          </Button>
                        )}
                      </div>
                    )}

                    {/* 备注 */}
                    {progress?.notes && (
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <p className="text-xs text-blue-900 line-clamp-2">{progress.notes}</p>
                      </div>
                    )}

                    {/* 查看详情按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenNodeDetails(nodeId, nodeInfo, progress);
                      }}
                    >
                      查看完整详情
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
