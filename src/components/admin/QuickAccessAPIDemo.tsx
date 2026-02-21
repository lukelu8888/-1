import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Code2, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface QuickAccessAPIDemoProps {
  onNavigate: () => void;
}

export default function QuickAccessAPIDemo({ onNavigate }: QuickAccessAPIDemoProps) {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              社交媒体API系统
              <span className="px-2 py-0.5 rounded text-xs bg-green-500 text-white font-medium">
                NEW
              </span>
            </div>
            <p className="text-sm font-normal text-blue-700">Social Media API Integration</p>
          </div>
        </CardTitle>
        <CardDescription className="text-blue-800">
          全新开发的社交媒体API集成系统已经上线！现已整合到社交媒体营销模块中
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>账号管理：</strong>连接并管理LinkedIn、Facebook、Instagram等平台账号</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>一键发布：</strong>同时发布内容到多个社交媒体平台</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>UTM追踪：</strong>自动生成追踪链接，监控转化效果</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>数据分析：</strong>查看发布历史和平台数据统计</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button 
            onClick={onNavigate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            前往社交媒体营销
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-white/50 rounded-lg p-3 text-xs text-blue-800 border border-blue-200">
          <p className="font-medium mb-1">💡 提示：</p>
          <p>当前为演示版本，所有功能完全可用。等申请到真实API密钥后，即可切换到生产环境。</p>
        </div>
      </CardContent>
    </Card>
  );
}