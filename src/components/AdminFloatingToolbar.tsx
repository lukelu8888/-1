import React, { useState } from 'react';
import { Settings, Wrench, X, ChevronUp, Workflow, FileText, Play } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { Badge } from './ui/badge';

interface AdminFloatingToolbarProps {
  onNavigateToWorkflowEditor?: () => void;
  onNavigateToFormManager?: () => void;
  onNavigateToStatusSimulator?: () => void;
}

export function AdminFloatingToolbar({ onNavigateToWorkflowEditor, onNavigateToFormManager, onNavigateToStatusSimulator }: AdminFloatingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentUser } = useAuth();

  // 🔒 只有Admin角色才显示
  if (!currentUser || currentUser.role !== 'Admin') {
    return null;
  }

  const handleNavigateToWorkflow = () => {
    if (onNavigateToWorkflowEditor) {
      onNavigateToWorkflowEditor();
    } else {
      window.location.hash = 'workflow-editor-pro';
    }
    setIsExpanded(false);
  };

  const handleNavigateToFormManager = () => {
    if (onNavigateToFormManager) {
      onNavigateToFormManager();
    } else {
      window.location.hash = 'form-manager';
    }
    setIsExpanded(false);
  };

  const handleNavigateToStatusSimulator = () => {
    if (onNavigateToStatusSimulator) {
      onNavigateToStatusSimulator();
    } else {
      window.location.hash = 'status-flow-simulator-v4';
    }
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 展开的工具面板 */}
      {isExpanded && (
        <div className="mb-3 bg-white rounded-lg shadow-2xl border-2 border-red-200 p-4 w-80 animate-in slide-in-from-bottom-5">
          {/* 标题 */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Admin工具</h3>
                <p className="text-xs text-gray-500">系统管理员专用</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 工具列表 */}
          <div className="space-y-2">
            {/* 业务流程编辑器 Pro */}
            <button
              onClick={handleNavigateToWorkflow}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">
                      业务流程编辑器
                    </span>
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs px-1.5 py-0">
                      PRO
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    配置业务流程、阶段、步骤
                  </p>
                </div>
              </div>
            </button>

            {/* 表单管理器 */}
            <button
              onClick={handleNavigateToFormManager}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block mb-1">
                    表单管理器
                  </span>
                  <p className="text-xs text-gray-600">
                    管理和编辑表单
                  </p>
                </div>
              </div>
            </button>

            {/* 状态模拟器 */}
            <button
              onClick={handleNavigateToStatusSimulator}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-600 to-lime-600 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-green-700">
                      状态流转模拟器
                    </span>
                    <Badge className="bg-gradient-to-r from-green-600 to-lime-600 text-white border-0 text-xs px-1.5 py-0">
                      V4
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    ✅ 前进/后退/编辑/删除
                  </p>
                </div>
              </div>
            </button>

            {/* 可以添加更多工具 */}
            <button
              onClick={() => {
                window.location.hash = 'admin-login';
                setIsExpanded(false);
              }}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 block mb-1">
                    Admin Portal
                  </span>
                  <p className="text-xs text-gray-600">
                    进入管理员控制台
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* 底部提示 */}
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 text-center">
              💡 提示：这些工具仅对系统管理员可见
            </p>
          </div>
        </div>
      )}

      {/* 浮动按钮 */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white border-2 border-white"
        title="Admin工具"
      >
        {isExpanded ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <Wrench className="h-6 w-6" />
        )}
      </Button>

      {/* 脉冲效果 */}
      {!isExpanded && (
        <div className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
      )}
    </div>
  );
}