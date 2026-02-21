/**
 * 🚀 业务流程编辑器Pro - 快速访问组件
 * 可以放置在任何页面，快速跳转到Pro版编辑器
 */

import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Settings, ArrowRight, Zap, Edit2, Download } from 'lucide-react';

interface QuickAccessWorkflowProProps {
  onNavigate?: (page: string) => void;
}

export function QuickAccessWorkflowPro({ onNavigate }: QuickAccessWorkflowProProps) {
  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate('workflow-editor');
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200">
      <div className="flex items-start gap-4">
        {/* 左侧图标 */}
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
          <Settings className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '3s' }} />
        </div>

        {/* 中间内容 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              🔄 业务流程配置编辑器 Pro
            </h3>
            <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              PRO版
            </Badge>
            <Badge variant="outline" className="border-green-500 text-green-700">
              完全可编辑
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            可视化编辑业务流程，支持添加/修改/删除阶段和步骤，实时保存配置，导出多种格式文档。
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-900">实时编辑</span>
              </div>
              <p className="text-xs text-gray-600">点击即可编辑步骤信息</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-semibold text-gray-900">自动保存</span>
              </div>
              <p className="text-xs text-gray-600">修改立即保存到配置</p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-900">多格式导出</span>
              </div>
              <p className="text-xs text-gray-600">JSON/文档/流程图</p>
            </div>
          </div>

          {/* 快速统计 */}
          <div className="flex items-center gap-4 mb-4">
            <div className="text-xs">
              <span className="text-gray-600">当前配置：</span>
              <span className="font-semibold text-purple-700"> 7个阶段</span>
              <span className="text-gray-400"> · </span>
              <span className="font-semibold text-pink-700">26个步骤</span>
              <span className="text-gray-400"> · </span>
              <span className="font-semibold text-blue-700">7个角色</span>
            </div>
          </div>

          {/* CTA按钮 */}
          <Button 
            onClick={handleNavigate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Settings className="w-4 h-4 mr-2" />
            打开业务流程编辑器 Pro
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* 右侧装饰 */}
        <div className="hidden lg:block flex-shrink-0 w-32">
          <div className="bg-white/80 rounded-lg p-3 border border-purple-200">
            <p className="text-xs font-semibold text-purple-900 mb-2">✨ 新功能</p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>✅ 拖拽排序</li>
              <li>✅ 实时预览</li>
              <li>✅ 版本管理</li>
              <li>✅ 一键导出</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
