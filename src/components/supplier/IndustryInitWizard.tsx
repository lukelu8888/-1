import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { industryTemplates, saveSupplierCategories, markIndustryInitialized, saveSelectedIndustry } from '../../data/industryTemplates';
import { toast } from 'sonner@2.0.3';

/**
 * 🎯 行业初始化向导
 * - 首次使用时引导供应商选择行业
 * - 自动初始化该行业的标准产品分类
 */
interface IndustryInitWizardProps {
  open: boolean;
  onComplete: () => void;
}

export default function IndustryInitWizard({ open, onComplete }: IndustryInitWizardProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const handleSelectIndustry = (industryId: string) => {
    setSelectedIndustry(industryId);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedIndustry) return;

    const template = industryTemplates.find(t => t.id === selectedIndustry);
    if (!template) return;

    // 保存选择的行业
    saveSelectedIndustry(selectedIndustry);

    // 保存产品分类
    if (template.categories.length > 0) {
      saveSupplierCategories(template.categories);
    } else {
      // 自定义模式，初始化为空数组
      saveSupplierCategories([]);
    }

    // 标记初始化完成
    markIndustryInitialized();

    // 显示成功提示
    if (selectedIndustry === 'custom') {
      toast.success('已进入自定义模式！请在"系统设置 > 产品类别管理"中添加您的分类');
    } else {
      toast.success(`已初始化${template.name}行业分类！共${template.categories.length}个类别`);
    }

    // 通知父组件完成
    onComplete();
  };

  const handleBack = () => {
    setStep('select');
    setSelectedIndustry(null);
  };

  const selectedTemplate = selectedIndustry ? industryTemplates.find(t => t.id === selectedIndustry) : null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-6 h-6 text-orange-600" />
                欢迎使用技术中心！
              </DialogTitle>
              <DialogDescription className="text-base">
                为了更好地管理您的产品资料，请先选择您的主营行业
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {industryTemplates.map((industry) => (
                  <button
                    key={industry.id}
                    onClick={() => handleSelectIndustry(industry.id)}
                    className={`p-5 border-2 rounded-xl transition-all hover:shadow-lg hover:scale-105 text-left ${
                      industry.id === 'custom'
                        ? 'border-purple-300 bg-purple-50 hover:border-purple-500'
                        : 'border-gray-200 bg-white hover:border-orange-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{industry.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>
                            {industry.name}
                          </h3>
                          {industry.id === 'custom' && (
                            <Badge className="h-5 px-2 text-xs bg-purple-100 text-purple-800">
                              灵活
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{industry.nameEn}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{industry.description}</p>
                        {industry.categories.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1.5">预设分类：</p>
                            <div className="flex flex-wrap gap-1">
                              {industry.categories.slice(0, 4).map((cat) => (
                                <Badge key={cat} variant="outline" className="h-5 px-2 text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {industry.categories.length > 4 && (
                                <Badge variant="outline" className="h-5 px-2 text-xs text-gray-500">
                                  +{industry.categories.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">💡</div>
                  <div className="flex-1 text-sm text-blue-800">
                    <p className="font-medium mb-1">温馨提示：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 选择行业后将自动初始化该行业的标准产品分类</li>
                      <li>• 初始化后仍可在"系统设置"中自由添加、编辑或删除分类</li>
                      <li>• 选择"自定义"可完全自己设置产品分类</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                确认行业选择
              </DialogTitle>
              <DialogDescription>
                请确认您选择的行业信息
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="py-4 space-y-4">
                {/* 行业信息 */}
                <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{selectedTemplate.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedTemplate.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{selectedTemplate.nameEn}</p>
                      <p className="text-sm text-gray-700">{selectedTemplate.description}</p>
                    </div>
                  </div>
                </div>

                {/* 产品分类列表 */}
                {selectedTemplate.categories.length > 0 ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span>📦</span>
                      将为您初始化以下产品分类
                      <Badge className="h-5 px-2 text-xs bg-orange-100 text-orange-800">
                        {selectedTemplate.categories.length}个类别
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {selectedTemplate.categories.map((category, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2.5 bg-gray-50 rounded border border-gray-200"
                        >
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-800">{category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-purple-300 rounded-lg p-6 bg-purple-50">
                    <div className="text-center">
                      <div className="text-4xl mb-3">⚙️</div>
                      <h4 className="font-semibold mb-2 text-purple-900">自定义模式</h4>
                      <p className="text-sm text-purple-700 mb-3">
                        您将完全自主管理产品分类
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-800">
                          初始化后请前往"系统设置 &gt; 产品类别管理"添加分类
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 提示信息 */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 mt-0.5">⚠️</div>
                    <div className="flex-1 text-sm text-yellow-800">
                      <p className="font-medium mb-1">注意事项：</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 初始化完成后，您随时可以在"系统设置 &gt; 产品类别管理"中修改</li>
                        <li>• 可以添加新分类、编辑名称、删除不需要的分类</li>
                        <li>• 分类的修改不会影响已有的产品数据</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleBack}>
                返回重选
              </Button>
              <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleConfirm}>
                <Check className="w-4 h-4 mr-2" />
                确认并开始使用
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}