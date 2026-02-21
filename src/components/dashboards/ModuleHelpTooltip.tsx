// 📚 模块定义说明组件
// Module Help Tooltip Component

import { HelpCircle } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

interface ModuleHelpTooltipProps {
  title: string;
  definition: string;
  details?: string[];
  formula?: string;
  example?: string;
}

export function ModuleHelpTooltip({ title, definition, details, formula, example }: ModuleHelpTooltipProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors ml-1.5">
          <HelpCircle className="w-3 h-3 text-slate-600" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="right" align="start">
        <div className="space-y-3">
          {/* 标题 */}
          <div className="border-b border-slate-200 pb-2">
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          </div>

          {/* 定义 */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">📖 定义：</p>
            <p className="text-xs text-slate-600 leading-relaxed">{definition}</p>
          </div>

          {/* 详细说明 */}
          {details && details.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">📝 说明：</p>
              <ul className="space-y-1">
                {details.map((detail, index) => (
                  <li key={index} className="text-xs text-slate-600 leading-relaxed">
                    • {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 计算公式 */}
          {formula && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs font-medium text-blue-900 mb-1">🧮 公式：</p>
              <p className="text-xs font-mono text-blue-700">{formula}</p>
            </div>
          )}

          {/* 应用示例 */}
          {example && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <p className="text-xs font-medium text-green-900 mb-1">💡 示例：</p>
              <p className="text-xs text-green-700 leading-relaxed">{example}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
