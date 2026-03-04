import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileText, Eye, ChevronRight, Building2, Award, X } from 'lucide-react';
import homeDepotRealTemplates from '../config/formTemplatesHomeDepotReal';
import { FormTemplatePreview } from './workflow/FormTemplatePreview';
import { FormTemplate } from '../config/formTemplates';

// Home Depot 品牌色
const homeDepotBrandColors = {
  primary: '#F96302',      // Home Depot 橙色
  secondary: '#FF8C42',    // 浅橙色
  accent: '#FFA500',       // 金橙色
  lightBg: '#FFF8F0',      // 浅橙背景
  darkText: '#333333'      // 深灰文字
};

export default function RealHomeDepotDemo({ onClose }: { onClose?: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white py-8 px-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${homeDepotBrandColors.primary} 0%, ${homeDepotBrandColors.accent} 50%, ${homeDepotBrandColors.primary} 100%)` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur p-4 rounded-xl">
                <Building2 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                  HOME DEPOT 商业文档
                  <Award className="w-8 h-8" style={{ color: homeDepotBrandColors.secondary }} />
                </h1>
                <p className="text-orange-100 text-lg">
                  The Home Depot | 100% 真实的 B2B 商业文档 | 采购订单、发票、装箱单、提单、对账单等完整单据
                </p>
              </div>
            </div>
            {onClose && (
              <Button 
                onClick={onClose}
                variant="ghost"
                size="lg"
                className="text-white hover:bg-white/20 hover:text-white flex items-center gap-2 px-6 py-3 text-base font-bold"
              >
                <X className="w-6 h-6" />
                关闭
              </Button>
            )}
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mt-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">{homeDepotRealTemplates.length}</div>
                <div className="text-orange-100 text-sm">真实文档模板</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100%</div>
                <div className="text-orange-100 text-sm">真实度</div>
              </div>
              <div>
                <div className="text-3xl font-bold">Letter</div>
                <div className="text-orange-100 text-sm">美国标准纸张</div>
              </div>
              <div>
                <div className="text-3xl font-bold">B2B</div>
                <div className="text-orange-100 text-sm">商业贸易</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文档列表 */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 gap-6">
          {homeDepotRealTemplates.map((template, index) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-8"
              style={{ borderLeftColor: homeDepotBrandColors.primary }}
            >
              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
                  {/* 序号 */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${homeDepotBrandColors.primary} 0%, ${homeDepotBrandColors.accent} 100%)` }}>
                      <span className="text-3xl font-black">{index + 1}</span>
                    </div>
                  </div>

                  {/* 文档信息 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                          {template.name}
                        </h3>
                        <p className="text-lg font-bold mb-2" style={{ color: homeDepotBrandColors.primary }}>
                          {template.name_en}
                        </p>
                      </div>
                      <Badge className="text-white text-sm px-4 py-1" style={{ backgroundColor: homeDepotBrandColors.secondary }}>
                        真实文档
                      </Badge>
                    </div>

                    <p className="text-gray-600 mb-4 text-base">
                      {template.description}
                    </p>

                    {/* 文档特性 */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="rounded-lg p-3" style={{ backgroundColor: homeDepotBrandColors.lightBg }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: homeDepotBrandColors.primary }}>文档类型</div>
                        <div className="text-sm font-bold text-gray-900">{template.type}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: homeDepotBrandColors.lightBg }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: homeDepotBrandColors.primary }}>所有者</div>
                        <div className="text-sm font-bold text-gray-900">
                          {template.owner === 'customer' ? 'Home Depot' : template.owner === 'cosun' ? 'Cosun' : template.owner}
                        </div>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFF4E6' }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: homeDepotBrandColors.secondary }}>纸张规格</div>
                        <div className="text-sm font-bold text-gray-900">
                          {template.layout?.pageSize || 'Letter'} (8.5" × 11")
                        </div>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: '#FFF4E6' }}>
                        <div className="text-xs font-semibold mb-1" style={{ color: homeDepotBrandColors.secondary }}>区块数量</div>
                        <div className="text-sm font-bold text-gray-900">
                          {template.sections.length} 个区块
                        </div>
                      </div>
                    </div>

                    {/* 关键字段展示 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-xs font-bold text-gray-500 mb-2 uppercase">关键字段包含</div>
                      <div className="flex flex-wrap gap-2">
                        {template.sections.slice(0, 3).map((section) => (
                          section.fields.slice(0, 3).map((field) => (
                            <Badge key={field.id} variant="outline" className="text-xs">
                              {field.label}
                            </Badge>
                          ))
                        ))}
                        {template.sections.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.sections.length - 3} 更多区块...
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setSelectedTemplate(template)}
                        className="text-white font-bold shadow-lg"
                        size="lg"
                        style={{ backgroundColor: homeDepotBrandColors.primary }}
                      >
                        <Eye className="w-5 h-5 mr-2" />
                        预览真实文档
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-2 font-bold"
                        style={{ 
                          borderColor: homeDepotBrandColors.secondary,
                          color: homeDepotBrandColors.secondary
                        }}
                      >
                        查看字段详情
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部装饰条 */}
              <div className="h-2" style={{ background: `linear-gradient(90deg, ${homeDepotBrandColors.primary} 0%, ${homeDepotBrandColors.accent} 50%, ${homeDepotBrandColors.secondary} 100%)` }} />
            </div>
          ))}
        </div>

        {/* 说明文字 */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border-t-4" style={{ borderTopColor: homeDepotBrandColors.primary }}>
          <h3 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-7 h-7" style={{ color: homeDepotBrandColors.primary }} />
            关于 Home Depot 商业文档系统
          </h3>
          <div className="space-y-3 text-gray-700 leading-relaxed">
            <p>
              <strong style={{ color: homeDepotBrandColors.primary }}>✓ 100% 真实格式：</strong>
              这些模板基于 The Home Depot 实际使用的 B2B 商业文档，包含所有真实的字段、格式和业务逻辑。涵盖从采购订单到收货确认的完整供应链流程。
            </p>
            <p>
              <strong style={{ color: homeDepotBrandColors.primary }}>✓ 完整的业务流程：</strong>
              包含采购订单(PO)、供应商发票、装箱单、提单、对账单、付款通知、收货确认单、询价单(INQ)等全套单据。覆盖采购、物流、财务全流程。
            </p>
            <p>
              <strong style={{ color: homeDepotBrandColors.secondary }}>✓ 符合北美标准：</strong>
              使用 Letter 尺寸 (8.5" × 11")，符合美国商业文档规范。包含 FOB Terms、Payment Terms、Warranty 等美国零售业标准字段。
            </p>
            <p>
              <strong style={{ color: homeDepotBrandColors.secondary }}>✓ 可直接使用：</strong>
              这些模板可以直接用于实际的 B2B 供应链管理，适用于建材、五金、家装、电气等 Home Depot 经营的所有品类。支持多种贸易条款和支付方式。
            </p>
            <p>
              <strong style={{ color: homeDepotBrandColors.accent }}>✓ Home Depot 品牌风格：</strong>
              采用 Home Depot 标志性橙色(#F96302)为主色调，象征活力与专业；简洁明快的设计风格，体现北美零售巨头的效率与标准化管理理念。
            </p>
          </div>
        </div>
      </div>

      {/* 预览对话框 */}
      {selectedTemplate && (
        <FormTemplatePreview
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}
