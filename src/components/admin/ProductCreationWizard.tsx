import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { 
  ChevronLeft, ChevronRight, Check, AlertCircle, Info, Package, 
  Globe, FileText, Image, Video, DollarSign, Truck, Eye, Save,
  Layers, Zap, Home, Lock, HardHat, Lightbulb, Wrench, ShoppingCart,
  Upload, X, Star, CheckCircle2, MapPin, Award, Box, Plus
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { productCategories, getLevel2Categories, getLevel3Categories } from '../../data/productCategories';
import { toast } from 'sonner@2.0.3';

interface ProductCreationWizardProps {
  onComplete?: () => void;
}

export default function ProductCreationWizard({ onComplete }: ProductCreationWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    // Step 1: 行业分类
    industry: '',
    productLine: '',
    productType: '',
    
    // Step 2: 目标市场
    primaryMarket: '',
    secondaryMarkets: [],
    excludedMarkets: [],
    productStandard: '',
    voltage: '',
    threadStandard: '',
    certifications: [],
    
    // Step 3: 基本信息
    productNameEN: '',
    productNameES: '',
    productNameFR: '',
    sku: '',
    shortDescription: '',
    detailedDescription: '',
    
    // Step 4: 媒体资源
    mainImage: null,
    galleryImages: [],
    videos: [],
    
    // Step 5: 技术参数
    dimensions: { length: '', width: '', height: '', unit: 'cm' },
    weight: { net: '', gross: '', unit: 'kg' },
    material: '',
    finish: '',
    color: '',
    // 行业专属参数（动态）
    industryParams: {},
    
    // Step 6: 定价库存
    fobPrice: { tier1: '', tier2: '', tier3: '', tier4: '' },
    moq: '',
    leadTime: '',
    stock: '',
    
    // Step 7: 包装物流
    innerPacking: { type: '', dimensions: '', weight: '' },
    outerPacking: { pcsPerCarton: '', dimensions: '', weight: '' },
    containerLoad: { gp20: '', gp40: '', hq40: '' },
    hsCode: '',
    
    // Step 8: 状态
    status: 'draft',
    visibility: 'public'
  });

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // 使用完整的行业分类数据（从外部导入）
  const industries = productCategories;

  // 图标映射：将类目ID映射到图标组件
  const getCategoryIcon = (categoryId: string) => {
    const iconMap: Record<string, any> = {
      'appliances': ShoppingCart,
      'bath': Home,
      'building-materials': Layers,
      'doors-windows': Lock,
      'electrical': Lightbulb,
      'flooring': Layers,
      'hardware': Wrench,
      'heating-cooling': Zap,
      'kitchen': ShoppingCart,
      'lawn-garden': Home,
      'paint': Package,
      'plumbing': Home,
      'storage-organization': Box,
      'tools': Wrench
    };
    return iconMap[categoryId] || Package;
  };

  // 市场选项
  const markets = [
    { 
      id: 'north-america', 
      label: '北美市场', 
      enLabel: 'North America',
      countries: 'USA, Canada, Mexico',
      flag: '🇺🇸',
      standards: ['ANSI', 'NSF', 'UL', 'CSA'],
      voltage: '110V / 60Hz',
      thread: 'NPT'
    },
    { 
      id: 'south-america', 
      label: '南美市场', 
      enLabel: 'South America',
      countries: 'Brazil, Argentina, Chile, Colombia',
      flag: '🇧🇷',
      standards: ['ABNT', 'IRAM', 'NCh'],
      voltage: '220V / 50Hz',
      thread: 'Metric'
    },
    { 
      id: 'europe-africa', 
      label: '欧非市场', 
      enLabel: 'Europe & Africa',
      countries: 'EU, UK, South Africa, Nigeria',
      flag: '🇪🇺',
      standards: ['CE', 'EN', 'BS', 'SABS'],
      voltage: '230V / 50Hz',
      thread: 'BSP'
    },
    { 
      id: 'universal', 
      label: '通用市场', 
      enLabel: 'Universal Market',
      countries: 'No specific market restriction',
      flag: '🌍',
      standards: ['ISO'],
      voltage: 'Multiple',
      thread: 'Multiple'
    }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('提交产品数据:', formData);
    
    // 显示成功提示
    toast.success('产品发布成功！', {
      description: `产品 "${formData.productNameEN || 'New Product'}" 已成功发布到网站`,
      duration: 3000,
    });
    
    // 延迟后返回产品列表
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  };

  const handleSaveDraft = () => {
    console.log('保存草稿:', formData);
    
    // 显示成功提示
    toast.success('草稿保存成功！', {
      description: `产品草稿已保存，您可以稍后继续编辑`,
      duration: 3000,
    });
    
    // 延迟后返回产品列表
    setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1500);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // 根据选择的行业获取二级类目（产品线）
  const getProductLines = () => {
    return getLevel2Categories(formData.industry);
  };

  // 根据选择的产品线获取三级类目
  const getProductTypes = () => {
    if (!formData.industry || !formData.productLine) return [];
    return getLevel3Categories(formData.industry, formData.productLine);
  };

  // 步骤配置
  const steps = [
    { id: 1, label: '行业分类', icon: Layers },
    { id: 2, label: '目标市场', icon: Globe },
    { id: 3, label: '基本信息', icon: FileText },
    { id: 4, label: '媒体资源', icon: Image },
    { id: 5, label: '技术参数', icon: Zap },
    { id: 6, label: '定价库存', icon: DollarSign },
    { id: 7, label: '包装物流', icon: Truck },
    { id: 8, label: '预览发布', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 顶部进度条 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
                产品创建向导
              </h1>
              <p className="text-gray-500" style={{ fontSize: '12px' }}>
                步骤 {currentStep} / {totalSteps}: {steps[currentStep - 1].label}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (onComplete) {
                  onComplete();
                }
              }}
              style={{ fontSize: '12px' }}
            >
              <X className="w-4 h-4 mr-1" />
              取消并返回
            </Button>
          </div>
          
          {/* 进度条 */}
          <Progress value={progressPercentage} className="h-2 mb-4" />
          
          {/* 步骤导航 */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? 'bg-green-600 border-green-600 text-white' 
                        : isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`mt-2 text-center ${isActive ? 'text-blue-600' : 'text-gray-500'}`} style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>
                      {step.label}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} style={{ marginTop: '-28px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          
          {/* Step 1: 行业分类 */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  选择产品行业分类
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  选择产品所属的行业，系统将自动加载对应的参数模板
                </p>
              </div>

              {/* 行业选择 */}
              <div className="mb-6">
                <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                  一级行业分类 <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {industries.map((industry) => {
                    const Icon = getCategoryIcon(industry.id);
                    const isSelected = formData.industry === industry.id;
                    
                    return (
                      <div
                        key={industry.id}
                        onClick={() => updateFormData('industry', industry.id)}
                        className={`p-4 border-2 rounded cursor-pointer transition-all hover:border-blue-400 ${
                          isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`} style={{ fontSize: '13px', fontWeight: 600 }}>
                              {industry.label}
                            </p>
                            <p className="text-gray-500" style={{ fontSize: '11px' }}>
                              {industry.enLabel}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 产品线选择 */}
              {formData.industry && (
                <div className="mb-6 animate-in fade-in duration-300">
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    二级产品线 <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getProductLines().map((line) => {
                      const isSelected = formData.productLine === line.id;
                      
                      return (
                        <div
                          key={line.id}
                          onClick={() => updateFormData('productLine', line.id)}
                          className={`p-3 border-2 rounded cursor-pointer transition-all text-center hover:border-blue-400 ${
                            isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                          }`}
                        >
                          <p className={`mb-0.5 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                            {line.label}
                          </p>
                          <p className="text-gray-500" style={{ fontSize: '10px' }}>
                            {line.enLabel}
                          </p>
                          {isSelected && (
                            <div className="mt-2">
                              <Badge className="h-5 px-2 bg-blue-600 text-white" style={{ fontSize: '10px' }}>
                                已选择
                              </Badge>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 智能提示 */}
              {formData.industry && formData.productLine && (
                <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      分类选择完成
                    </p>
                    <p className="text-green-700" style={{ fontSize: '11px' }}>
                      系统已加载"{industries.find(i => i.id === formData.industry)?.label}"行业的专属参数模板，点击"下一步"继续
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 目标市场 */}
          {currentStep === 2 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  设置目标市场
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  选择产品的主要目标市场，系统将根据市场自动配置认证要求和技术标准
                </p>
              </div>

              {/* 主目标市场 */}
              <div className="mb-6">
                <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                  主目标市场 <span className="text-red-500">*</span>
                  <span className="text-gray-500 ml-2" style={{ fontSize: '11px', fontWeight: 400 }}>
                    （单选，决定产品标准和认证要求）
                  </span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {markets.map((market) => {
                    const isSelected = formData.primaryMarket === market.id;
                    
                    return (
                      <div
                        key={market.id}
                        onClick={() => updateFormData('primaryMarket', market.id)}
                        className={`p-4 border-2 rounded cursor-pointer transition-all hover:border-blue-400 ${
                          isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: '32px' }}>{market.flag}</span>
                            <div>
                              <p className={`mb-0.5 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`} style={{ fontSize: '14px', fontWeight: 600 }}>
                                {market.label}
                              </p>
                              <p className="text-gray-500" style={{ fontSize: '11px' }}>
                                {market.enLabel}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="space-y-2 pt-3 border-t border-gray-200">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-600" style={{ fontSize: '11px' }}>{market.countries}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Award className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-gray-600 mb-1" style={{ fontSize: '11px' }}>认证标准：</p>
                              <div className="flex flex-wrap gap-1">
                                {market.standards.map((std) => (
                                  <Badge key={std} variant="outline" className="h-5 px-2" style={{ fontSize: '10px' }}>
                                    {std}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          {formData.industry === 'electrical' && (
                            <div className="flex items-start gap-2">
                              <Zap className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-600" style={{ fontSize: '11px' }}>电压：{market.voltage}</p>
                            </div>
                          )}
                          {formData.industry === 'sanitary' && (
                            <div className="flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-600" style={{ fontSize: '11px' }}>螺纹标准：{market.thread}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 智能推荐 */}
              {formData.primaryMarket && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 mb-2" style={{ fontSize: '12px', fontWeight: 600 }}>
                        智能配置提示
                      </p>
                      <ul className="space-y-1">
                        <li className="text-blue-700 flex items-start gap-2" style={{ fontSize: '11px' }}>
                          <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <span>已自动配置{markets.find(m => m.id === formData.primaryMarket)?.label}的认证标准要求</span>
                        </li>
                        {formData.industry === 'electrical' && (
                          <li className="text-blue-700 flex items-start gap-2" style={{ fontSize: '11px' }}>
                            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>已自动设置电压规格为 {markets.find(m => m.id === formData.primaryMarket)?.voltage}</span>
                          </li>
                        )}
                        {formData.industry === 'sanitary' && (
                          <li className="text-blue-700 flex items-start gap-2" style={{ fontSize: '11px' }}>
                            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>已自动设置螺纹标准为 {markets.find(m => m.id === formData.primaryMarket)?.thread}</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 次要市场（可选） */}
              {formData.primaryMarket && (
                <div className="mb-6">
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    次要适销市场 <span className="text-gray-500" style={{ fontSize: '11px', fontWeight: 400 }}>(可选，多选)</span>
                  </Label>
                  <p className="text-gray-500 mb-3" style={{ fontSize: '11px' }}>
                    除主目标市场外，该产品还可能适销的其他市场
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="caribbean" />
                      <label htmlFor="caribbean" className="flex-1 cursor-pointer" style={{ fontSize: '12px' }}>
                        加勒比海地区 (Caribbean)
                      </label>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="central-america" />
                      <label htmlFor="central-america" className="flex-1 cursor-pointer" style={{ fontSize: '12px' }}>
                        中美洲 (Central America)
                      </label>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="middle-east" />
                      <label htmlFor="middle-east" className="flex-1 cursor-pointer" style={{ fontSize: '12px' }}>
                        中东地区 (Middle East)
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 基本信息 */}
          {currentStep === 3 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  填写产品基本信息
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  请填写产品的名称、编号和描述信息（支持多语言）
                </p>
              </div>

              <div className="space-y-5">
                {/* SKU编号 */}
                <div>
                  <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    产品SKU编号 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="例如: GSD-TAP-NA-001"
                      value={formData.sku}
                      onChange={(e) => updateFormData('sku', e.target.value)}
                      className="flex-1"
                      style={{ fontSize: '12px' }}
                    />
                    <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                      自动生成
                    </Button>
                  </div>
                  <p className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                    建议格式：品牌-产品线-市场-序号（如：GSD-TAP-NA-001）
                  </p>
                </div>

                {/* 产品名称（多语言） */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                      产品名称（英语） <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="Kitchen Faucet with Pull-Down Sprayer"
                      value={formData.productNameEN}
                      onChange={(e) => updateFormData('productNameEN', e.target.value)}
                      style={{ fontSize: '12px' }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        产品名称（西班牙语）
                      </Label>
                      <Input
                        placeholder="Grifo de Cocina con Rociador"
                        value={formData.productNameES}
                        onChange={(e) => updateFormData('productNameES', e.target.value)}
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        产品名称（法语）
                      </Label>
                      <Input
                        placeholder="Robinet de Cuisine"
                        value={formData.productNameFR}
                        onChange={(e) => updateFormData('productNameFR', e.target.value)}
                        style={{ fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 简短描述 */}
                <div>
                  <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    简短描述（SEO用） <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="一句话概括产品特点，用于搜索引擎展示和产品列表（建议80-160字符）"
                    value={formData.shortDescription}
                    onChange={(e) => updateFormData('shortDescription', e.target.value)}
                    rows={2}
                    className="resize-none"
                    style={{ fontSize: '12px' }}
                  />
                  <p className="text-gray-500 mt-1 text-right" style={{ fontSize: '11px' }}>
                    {formData.shortDescription.length} / 160
                  </p>
                </div>

                {/* 详细描述 */}
                <div>
                  <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    详细描述 <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    placeholder="详细描述产品的功能、特点、应用场景、优势等&#10;&#10;建议包含：&#10;• 产品核心特点&#10;• 主要功能&#10;• 应用场景&#10;• 产品优势&#10;• 适用范围"
                    value={formData.detailedDescription}
                    onChange={(e) => updateFormData('detailedDescription', e.target.value)}
                    rows={8}
                    className="resize-none"
                    style={{ fontSize: '12px' }}
                  />
                </div>

                {/* 产品标签 */}
                <div>
                  <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    产品标签
                  </Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="输入标签后按回车"
                      style={{ fontSize: '12px' }}
                    />
                    <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                      添加
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                      厨房水龙头 <X className="w-3 h-3 ml-1 cursor-pointer" />
                    </Badge>
                    <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                      抽拉式 <X className="w-3 h-3 ml-1 cursor-pointer" />
                    </Badge>
                    <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                      NSF认证 <X className="w-3 h-3 ml-1 cursor-pointer" />
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 媒体资源 */}
          {currentStep === 4 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  上传产品媒体资源
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  上传产品图片、视频和技术文档（支持批量上传）
                </p>
              </div>

              <div className="space-y-6">
                {/* 主图上传 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    产品主图 <span className="text-red-500">*</span>
                    <span className="text-gray-500 ml-2" style={{ fontSize: '11px', fontWeight: 400 }}>
                      （用于列表页展示，建议1200x1200px，白底或场景图）
                    </span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center hover:border-blue-400 cursor-pointer bg-gray-50">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-900 mb-1" style={{ fontSize: '13px', fontWeight: 600 }}>
                      点击上传或拖拽文件到此处
                    </p>
                    <p className="text-gray-500" style={{ fontSize: '11px' }}>
                      支持 JPG, PNG, WEBP 格式，建议文件大小不超过2MB
                    </p>
                  </div>
                </div>

                {/* 详情图库 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    产品详情图库 <span className="text-red-500">*</span>
                    <span className="text-gray-500 ml-2" style={{ fontSize: '11px', fontWeight: 400 }}>
                      （建议6-10张，展示产品细节、尺寸、应用场景等）
                    </span>
                  </Label>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 cursor-pointer bg-gray-50">
                        <div className="text-center">
                          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                          <p className="text-gray-500" style={{ fontSize: '10px' }}>上传图片</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" style={{ fontSize: '11px' }}>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    批量上传图片（支持拖拽）
                  </Button>
                </div>

                {/* 产品视频 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    产品视频
                    <span className="text-gray-500 ml-2" style={{ fontSize: '11px', fontWeight: 400 }}>
                      （可选，建议上传产品展示视频、安装教程等）
                    </span>
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center hover:border-purple-400 cursor-pointer bg-purple-50/30">
                    <Video className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                    <p className="text-gray-900 mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      上传视频文件或输入YouTube/Vimeo链接
                    </p>
                    <p className="text-gray-500 mb-3" style={{ fontSize: '11px' }}>
                      支持 MP4, MOV 格式，建议文件大小不超过100MB
                    </p>
                    <div className="flex gap-2 max-w-md mx-auto">
                      <Input placeholder="或粘贴视频链接" style={{ fontSize: '11px' }} />
                      <Button size="sm" style={{ fontSize: '11px' }}>添加</Button>
                    </div>
                  </div>
                </div>

                {/* 技术文档 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    技术文档与证书
                    <span className="text-gray-500 ml-2" style={{ fontSize: '11px', fontWeight: 400 }}>
                      （规格表、CAD图纸、认证证书等）
                    </span>
                  </Label>
                  <div className="space-y-2">
                    <div className="border border-gray-200 rounded p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>产品规格表 (Spec Sheet)</p>
                          <p className="text-gray-500" style={{ fontSize: '11px' }}>PDF格式，可下载</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        上传
                      </Button>
                    </div>
                    <div className="border border-gray-200 rounded p-3 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>认证证书</p>
                          <p className="text-gray-500" style={{ fontSize: '11px' }}>NSF, CE, UL等认证</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                        <Upload className="w-3.5 h-3.5 mr-1" />
                        上传
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: 技术参数 */}
          {currentStep === 5 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  填写技术参数
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  根据选择的行业分类，填写产品技术规格参数
                </p>
              </div>

              <div className="space-y-6">
                {/* 通用参数 */}
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <h3 className="text-gray-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Box className="w-4 h-4" />
                    通用参数
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 尺寸 */}
                    <div className="md:col-span-2">
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        产品尺寸 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input placeholder="长" style={{ fontSize: '12px' }} />
                        </div>
                        <span className="text-gray-400 flex items-center">×</span>
                        <div className="flex-1">
                          <Input placeholder="宽" style={{ fontSize: '12px' }} />
                        </div>
                        <span className="text-gray-400 flex items-center">×</span>
                        <div className="flex-1">
                          <Input placeholder="高" style={{ fontSize: '12px' }} />
                        </div>
                        <Select defaultValue="cm">
                          <SelectTrigger className="w-24" style={{ fontSize: '12px' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cm" style={{ fontSize: '12px' }}>cm</SelectItem>
                            <SelectItem value="mm" style={{ fontSize: '12px' }}>mm</SelectItem>
                            <SelectItem value="inch" style={{ fontSize: '12px' }}>inch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 重量 */}
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        净重 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="2.5" style={{ fontSize: '12px' }} />
                        <Select defaultValue="kg">
                          <SelectTrigger className="w-20" style={{ fontSize: '12px' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg" style={{ fontSize: '12px' }}>kg</SelectItem>
                            <SelectItem value="lb" style={{ fontSize: '12px' }}>lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        毛重 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="3.2" style={{ fontSize: '12px' }} />
                        <Select defaultValue="kg">
                          <SelectTrigger className="w-20" style={{ fontSize: '12px' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg" style={{ fontSize: '12px' }}>kg</SelectItem>
                            <SelectItem value="lb" style={{ fontSize: '12px' }}>lb</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 材质 */}
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        主材质 <span className="text-red-500">*</span>
                      </Label>
                      <Select>
                        <SelectTrigger style={{ fontSize: '12px' }}>
                          <SelectValue placeholder="选择材质" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brass" style={{ fontSize: '12px' }}>黄铜 (Brass)</SelectItem>
                          <SelectItem value="stainless" style={{ fontSize: '12px' }}>不锈钢 (Stainless Steel)</SelectItem>
                          <SelectItem value="zinc" style={{ fontSize: '12px' }}>锌合金 (Zinc Alloy)</SelectItem>
                          <SelectItem value="plastic" style={{ fontSize: '12px' }}>塑料 (Plastic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 表面处理 */}
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        表面处理
                      </Label>
                      <Select>
                        <SelectTrigger style={{ fontSize: '12px' }}>
                          <SelectValue placeholder="选择表面处理" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chrome" style={{ fontSize: '12px' }}>镀铬 (Chrome Plated)</SelectItem>
                          <SelectItem value="brushed" style={{ fontSize: '12px' }}>拉丝 (Brushed)</SelectItem>
                          <SelectItem value="painted" style={{ fontSize: '12px' }}>烤漆 (Painted)</SelectItem>
                          <SelectItem value="pvd" style={{ fontSize: '12px' }}>PVD镀膜</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 行业专属参数（以卫浴为例） */}
                {formData.industry === 'sanitary' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <h3 className="text-blue-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                      <Zap className="w-4 h-4" />
                      卫浴产品专属参数
                      <Badge className="h-5 px-2 bg-blue-600 text-white ml-2" style={{ fontSize: '10px' }}>
                        根据行业自动加载
                      </Badge>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          阀芯类型 <span className="text-red-500">*</span>
                        </Label>
                        <Select>
                          <SelectTrigger style={{ fontSize: '12px' }}>
                            <SelectValue placeholder="选择阀芯类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ceramic35" style={{ fontSize: '12px' }}>陶瓷阀芯 35mm</SelectItem>
                            <SelectItem value="ceramic40" style={{ fontSize: '12px' }}>陶瓷阀芯 40mm</SelectItem>
                            <SelectItem value="cartridge" style={{ fontSize: '12px' }}>卡盒式阀芯</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          进水接口 <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue={formData.primaryMarket === 'north-america' ? 'npt' : 'bsp'}>
                          <SelectTrigger style={{ fontSize: '12px' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="npt" style={{ fontSize: '12px' }}>NPT 1/2" (北美标准)</SelectItem>
                            <SelectItem value="bsp" style={{ fontSize: '12px' }}>BSP 1/2" (欧洲标准)</SelectItem>
                            <SelectItem value="metric" style={{ fontSize: '12px' }}>公制 G1/2"</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.primaryMarket === 'north-america' && (
                          <p className="text-blue-600 mt-1 flex items-center gap-1" style={{ fontSize: '10px' }}>
                            <Info className="w-3 h-3" />
                            已根据北美市场自动选择NPT螺纹
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          水流量 <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="1.5" 
                            defaultValue={formData.primaryMarket === 'north-america' ? '1.5' : '2.5'}
                            style={{ fontSize: '12px' }} 
                          />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>GPM</span>
                        </div>
                        {formData.primaryMarket === 'north-america' && (
                          <p className="text-orange-600 mt-1 flex items-center gap-1" style={{ fontSize: '10px' }}>
                            <AlertCircle className="w-3 h-3" />
                            北美市场限流要求：≤1.5 GPM
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          铅含量 <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input placeholder="≤0.25" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>%</span>
                        </div>
                        {formData.primaryMarket === 'north-america' && (
                          <p className="text-green-600 mt-1 flex items-center gap-1" style={{ fontSize: '10px' }}>
                            <CheckCircle2 className="w-3 h-3" />
                            符合NSF-61低铅标准
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          工作压力范围
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input placeholder="0.05" style={{ fontSize: '12px' }} />
                          <span className="text-gray-400">-</span>
                          <Input placeholder="0.6" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>MPa</span>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          耐久性测试
                        </Label>
                        <div className="flex gap-2">
                          <Input placeholder="500000" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600 whitespace-nowrap" style={{ fontSize: '12px' }}>次开关</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 行业专属参数（以电气为例） */}
                {formData.industry === 'electrical' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <h3 className="text-yellow-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                      <Zap className="w-4 h-4" />
                      电气产品专属参数
                      <Badge className="h-5 px-2 bg-yellow-600 text-white ml-2" style={{ fontSize: '10px' }}>
                        根据行业自动加载
                      </Badge>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          额定电压 <span className="text-red-500">*</span>
                        </Label>
                        <Select defaultValue={formData.primaryMarket === 'north-america' ? '110v' : '220v'}>
                          <SelectTrigger style={{ fontSize: '12px' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="110v" style={{ fontSize: '12px' }}>110V / 60Hz (北美)</SelectItem>
                            <SelectItem value="220v" style={{ fontSize: '12px' }}>220V / 50Hz (欧洲/亚洲)</SelectItem>
                            <SelectItem value="dual" style={{ fontSize: '12px' }}>110-240V (通用)</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.primaryMarket && (
                          <p className="text-blue-600 mt-1 flex items-center gap-1" style={{ fontSize: '10px' }}>
                            <Info className="w-3 h-3" />
                            已根据市场自动设置电压规格
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          额定功率 <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex gap-2">
                          <Input placeholder="60" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>W</span>
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          防护等级
                        </Label>
                        <Select>
                          <SelectTrigger style={{ fontSize: '12px' }}>
                            <SelectValue placeholder="选择防护等级" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ip20" style={{ fontSize: '12px' }}>IP20 (室内干燥)</SelectItem>
                            <SelectItem value="ip44" style={{ fontSize: '12px' }}>IP44 (防溅水)</SelectItem>
                            <SelectItem value="ip65" style={{ fontSize: '12px' }}>IP65 (防尘防水)</SelectItem>
                            <SelectItem value="ip67" style={{ fontSize: '12px' }}>IP67 (防浸水)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                          认证要求 <span className="text-red-500">*</span>
                        </Label>
                        <div className="space-y-2">
                          {formData.primaryMarket === 'north-america' && (
                            <>
                              <div className="flex items-center gap-2">
                                <Checkbox id="ul" defaultChecked />
                                <label htmlFor="ul" style={{ fontSize: '12px' }}>UL认证 (北美必需)</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox id="etl" />
                                <label htmlFor="etl" style={{ fontSize: '12px' }}>ETL认证</label>
                              </div>
                            </>
                          )}
                          {formData.primaryMarket === 'europe-africa' && (
                            <>
                              <div className="flex items-center gap-2">
                                <Checkbox id="ce" defaultChecked />
                                <label htmlFor="ce" style={{ fontSize: '12px' }}>CE认证 (欧洲必需)</label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox id="rohs" defaultChecked />
                                <label htmlFor="rohs" style={{ fontSize: '12px' }}>RoHS认证</label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 应用场景 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    应用场景标签
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="residential" />
                      <label htmlFor="residential" style={{ fontSize: '11px' }}>住宅</label>
                    </div>
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="commercial" />
                      <label htmlFor="commercial" style={{ fontSize: '11px' }}>商业</label>
                    </div>
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="hotel" />
                      <label htmlFor="hotel" style={{ fontSize: '11px' }}>酒店</label>
                    </div>
                    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50">
                      <Checkbox id="hospital" />
                      <label htmlFor="hospital" style={{ fontSize: '11px' }}>医院</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: 定价库存 */}
          {currentStep === 6 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  设置定价与库存
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  设置B2B阶梯定价、MOQ、交期和库存信息
                </p>
              </div>

              <div className="space-y-6">
                {/* FOB阶梯定价 */}
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h3 className="text-green-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <DollarSign className="w-4 h-4" />
                    FOB价格（阶梯定价）
                    <Badge className="h-5 px-2 bg-green-600 text-white ml-2" style={{ fontSize: '10px' }}>
                      福州/厦门港
                    </Badge>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '11px' }}>100-499 PCS</Label>
                        <div className="flex gap-2">
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>$</span>
                          <Input placeholder="12.50" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>/PC</span>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '11px' }}>500-999 PCS</Label>
                        <div className="flex gap-2">
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>$</span>
                          <Input placeholder="11.80" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>/PC</span>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '11px' }}>1000-4999 PCS</Label>
                        <div className="flex gap-2">
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>$</span>
                          <Input placeholder="11.20" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>/PC</span>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block" style={{ fontSize: '11px' }}>5000+ PCS (整柜)</Label>
                        <div className="flex gap-2">
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>$</span>
                          <Input placeholder="10.50" style={{ fontSize: '12px' }} />
                          <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>/PC</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-green-300 rounded p-3">
                      <p className="text-green-900 mb-2" style={{ fontSize: '11px', fontWeight: 600 }}>
                        💡 智能定价建议
                      </p>
                      <p className="text-green-700" style={{ fontSize: '11px' }}>
                        根据成本分析，建议各档位价格折扣为：5% → 10% → 15% → 20%
                      </p>
                    </div>
                  </div>
                </div>

                {/* MOQ与交期 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                      最小起订量 (MOQ) <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input placeholder="100" style={{ fontSize: '12px' }} />
                      <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>PCS</span>
                    </div>
                    <p className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                      建议: 常规产品100 PCS，定制产品500 PCS
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                      生产交期 <span className="text-red-500">*</span>
                    </Label>
                    <Select>
                      <SelectTrigger style={{ fontSize: '12px' }}>
                        <SelectValue placeholder="选择交期" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days" style={{ fontSize: '12px' }}>3-7天 (现货)</SelectItem>
                        <SelectItem value="30days" style={{ fontSize: '12px' }}>25-30天 (常规订单)</SelectItem>
                        <SelectItem value="45days" style={{ fontSize: '12px' }}>35-45天 (大货)</SelectItem>
                        <SelectItem value="60days" style={{ fontSize: '12px' }}>45-60天 (定制)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 库存管理 */}
                <div>
                  <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    库存管理
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="mb-2 block text-gray-600" style={{ fontSize: '11px' }}>
                        当前库存
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="1000" style={{ fontSize: '12px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>PCS</span>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block text-gray-600" style={{ fontSize: '11px' }}>
                        安全库存
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="200" style={{ fontSize: '12px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>PCS</span>
                      </div>
                    </div>
                    <div>
                      <Label className="mb-2 block text-gray-600" style={{ fontSize: '11px' }}>
                        库存状态
                      </Label>
                      <Select defaultValue="available">
                        <SelectTrigger style={{ fontSize: '12px' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available" style={{ fontSize: '12px' }}>✅ 现货充足</SelectItem>
                          <SelectItem value="limited" style={{ fontSize: '12px' }}>⚠️ 库存紧张</SelectItem>
                          <SelectItem value="production" style={{ fontSize: '12px' }}>⏳ 需要生产</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 样品价格 */}
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <h3 className="text-purple-900 mb-3" style={{ fontSize: '13px', fontWeight: 600 }}>
                    样品政策
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        单个样品价格
                      </Label>
                      <div className="flex gap-2">
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>$</span>
                        <Input placeholder="35.00" style={{ fontSize: '12px' }} />
                      </div>
                      <p className="text-gray-500 mt-1" style={{ fontSize: '10px' }}>
                        通常为成本价的3-5倍
                      </p>
                    </div>
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        样品费抵扣规则
                      </Label>
                      <Input placeholder="首单≥500PCS全额抵扣" style={{ fontSize: '12px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: 包装物流 */}
          {currentStep === 7 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  包装与物流信息
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  设置产品包装规格和货柜装载信息
                </p>
              </div>

              <div className="space-y-6">
                {/* 内包装 */}
                <div className="bg-orange-50 border border-orange-200 rounded p-4">
                  <h3 className="text-orange-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Package className="w-4 h-4" />
                    内包装（单个产品）
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        包装类型
                      </Label>
                      <Select>
                        <SelectTrigger style={{ fontSize: '12px' }}>
                          <SelectValue placeholder="选择包装类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="colorbox" style={{ fontSize: '12px' }}>彩盒 (Color Box)</SelectItem>
                          <SelectItem value="whitebox" style={{ fontSize: '12px' }}>白盒 (White Box)</SelectItem>
                          <SelectItem value="blister" style={{ fontSize: '12px' }}>吸塑 (Blister Pack)</SelectItem>
                          <SelectItem value="foam" style={{ fontSize: '12px' }}>泡沫盒 (Foam Box)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        内盒尺寸
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="长" style={{ fontSize: '11px' }} />
                        <span className="text-gray-400 flex items-center">×</span>
                        <Input placeholder="宽" style={{ fontSize: '11px' }} />
                        <span className="text-gray-400 flex items-center">×</span>
                        <Input placeholder="高" style={{ fontSize: '11px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '11px' }}>cm</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        内盒毛重
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="3.2" style={{ fontSize: '12px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>kg</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        条形码 (EAN/UPC)
                      </Label>
                      <Input placeholder="6901234567890" style={{ fontSize: '12px' }} />
                    </div>
                  </div>
                </div>

                {/* 外包装 */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <h3 className="text-blue-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Box className="w-4 h-4" />
                    外包装（纸箱）
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        装箱数量 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="10" style={{ fontSize: '12px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>PCS/CTN</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        外箱尺寸 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="60" style={{ fontSize: '11px' }} />
                        <span className="text-gray-400 flex items-center">×</span>
                        <Input placeholder="40" style={{ fontSize: '11px' }} />
                        <span className="text-gray-400 flex items-center">×</span>
                        <Input placeholder="35" style={{ fontSize: '11px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '11px' }}>cm</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        外箱毛重 <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input placeholder="32" style={{ fontSize: '12px' }} />
                        <span className="flex items-center text-gray-600" style={{ fontSize: '12px' }}>kg</span>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        纸箱材质
                      </Label>
                      <Select>
                        <SelectTrigger style={{ fontSize: '12px' }}>
                          <SelectValue placeholder="选择材质" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5layer" style={{ fontSize: '12px' }}>5层瓦楞纸</SelectItem>
                          <SelectItem value="7layer" style={{ fontSize: '12px' }}>7层瓦楞纸</SelectItem>
                          <SelectItem value="double" style={{ fontSize: '12px' }}>双层加固</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 货柜装载量 */}
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h3 className="text-green-900 mb-4 flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                    <Truck className="w-4 h-4" />
                    货柜装载量（自动计算）
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white border border-green-300 rounded">
                      <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>20' GP</p>
                      <p className="text-green-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>2,800</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>280箱 × 10PCS</p>
                    </div>
                    <div className="text-center p-4 bg-white border border-green-300 rounded">
                      <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>40' GP</p>
                      <p className="text-green-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>5,800</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>580箱 × 10PCS</p>
                    </div>
                    <div className="text-center p-4 bg-white border border-green-300 rounded">
                      <p className="text-gray-600 mb-2" style={{ fontSize: '11px' }}>40' HQ</p>
                      <p className="text-green-900 mb-1" style={{ fontSize: '20px', fontWeight: 700 }}>6,500</p>
                      <p className="text-gray-500" style={{ fontSize: '10px' }}>650箱 × 10PCS</p>
                    </div>
                  </div>
                  <p className="text-green-700 mt-3 text-center" style={{ fontSize: '11px' }}>
                    💡 系统根据外箱尺寸自动计算，实际装载量可能因堆叠方式略有差异
                  </p>
                </div>

                {/* HS编码 */}
                <div>
                  <Label className="mb-2 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                    HS海关编码 <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input placeholder="8481.80.9000" style={{ fontSize: '12px' }} />
                    <Button variant="outline" size="sm" style={{ fontSize: '11px' }}>
                      查询编码
                    </Button>
                  </div>
                  <p className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>
                    海关编码用于报关，请确保准确填写
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: 预览发布 */}
          {currentStep === 8 && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-gray-900 mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                  预览与发布
                </h2>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  最后检查产品信息，确认无误后发布
                </p>
              </div>

              <div className="space-y-4">
                {/* 完整度检查 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-blue-900 mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                        产品信息完整度：92%
                      </h3>
                      <p className="text-blue-700 mb-3" style={{ fontSize: '12px' }}>
                        所有必填项已完成，建议补充以下可选项以提升产品吸引力
                      </p>
                      <Progress value={92} className="h-3 mb-3" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-green-300 rounded p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>基本信息</p>
                        <p className="text-green-600" style={{ fontSize: '10px' }}>100% 完成</p>
                      </div>
                    </div>
                    <div className="bg-white border border-green-300 rounded p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>目标市场</p>
                        <p className="text-green-600" style={{ fontSize: '10px' }}>100% 完成</p>
                      </div>
                    </div>
                    <div className="bg-white border border-green-300 rounded p-3 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>技术参数</p>
                        <p className="text-green-600" style={{ fontSize: '10px' }}>100% 完成</p>
                      </div>
                    </div>
                    <div className="bg-white border border-yellow-300 rounded p-3 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>媒体资源</p>
                        <p className="text-yellow-600" style={{ fontSize: '10px' }}>建议添加产品视频</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 产品信息预览卡片 */}
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4">
                    <h3 className="flex items-center gap-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                      <Eye className="w-5 h-5" />
                      产品预览
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 左侧：产品图片 */}
                      <div className="md:col-span-1">
                        <div className="aspect-square bg-gray-100 rounded border-2 border-gray-200 flex items-center justify-center">
                          <Image className="w-16 h-16 text-gray-400" />
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square bg-gray-100 rounded border border-gray-200" />
                          ))}
                        </div>
                      </div>

                      {/* 右侧：产品信息 */}
                      <div className="md:col-span-2">
                        <div className="flex items-start gap-3 mb-4">
                          <Badge className="h-6 px-3 bg-blue-600 text-white" style={{ fontSize: '11px' }}>
                            🇺🇸 北美市场
                          </Badge>
                          <Badge className="h-6 px-3 bg-green-600 text-white" style={{ fontSize: '11px' }}>
                            ✅ 已发布
                          </Badge>
                        </div>
                        
                        <h3 className="text-gray-900 mb-2" style={{ fontSize: '18px', fontWeight: 700 }}>
                          {formData.productNameEN || 'Kitchen Faucet with Pull-Down Sprayer'}
                        </h3>
                        <p className="text-gray-600 mb-1" style={{ fontSize: '12px' }}>
                          SKU: {formData.sku || 'GSD-TAP-NA-001'}
                        </p>
                        <p className="text-gray-500 mb-4" style={{ fontSize: '12px' }}>
                          {formData.shortDescription || '高品质厨房水龙头，符合NSF-61标准...'}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded border border-gray-200">
                          <div>
                            <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>MOQ</p>
                            <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>100 PCS</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>交期</p>
                            <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 600 }}>25-30天</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>FOB价格</p>
                            <p className="text-green-600" style={{ fontSize: '14px', fontWeight: 600 }}>$10.50 - $12.50</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1" style={{ fontSize: '11px' }}>库存状态</p>
                            <p className="text-green-600" style={{ fontSize: '14px', fontWeight: 600 }}>✅ 现货充足</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                            <Award className="w-3 h-3 mr-1" />
                            NSF-61认证
                          </Badge>
                          <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                            陶瓷阀芯
                          </Badge>
                          <Badge variant="outline" className="h-6 px-3" style={{ fontSize: '11px' }}>
                            1.5 GPM
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 发布设置 */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
                    发布设置
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        产品状态
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 border-2 border-blue-600 rounded bg-blue-50">
                          <input type="radio" name="status" value="published" defaultChecked />
                          <div className="flex-1">
                            <p className="text-blue-900" style={{ fontSize: '12px', fontWeight: 600 }}>立即发布</p>
                            <p className="text-blue-700" style={{ fontSize: '11px' }}>产品将立即在网站上展示给对应市场的客户</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50">
                          <input type="radio" name="status" value="draft" />
                          <div className="flex-1">
                            <p className="text-gray-900" style={{ fontSize: '12px', fontWeight: 600 }}>保存为草稿</p>
                            <p className="text-gray-500" style={{ fontSize: '11px' }}>暂不发布，稍后继续编辑</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block" style={{ fontSize: '12px', fontWeight: 600 }}>
                        可见性设置
                      </Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-gray-50">
                          <Checkbox id="public" defaultChecked />
                          <label htmlFor="public" className="flex-1" style={{ fontSize: '12px' }}>
                            所有注册客户可见
                          </label>
                        </div>
                        <div className="flex items-center gap-2 p-3 border border-gray-200 rounded hover:bg-gray-50">
                          <Checkbox id="vip" />
                          <label htmlFor="vip" className="flex-1" style={{ fontSize: '12px' }}>
                            仅VIP客户可见
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 底部操作按钮 */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              style={{ fontSize: '12px' }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                style={{ fontSize: '12px' }}
              >
                保存草稿
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                  style={{ fontSize: '12px' }}
                >
                  下一步
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700"
                  style={{ fontSize: '12px' }}
                >
                  <Save className="w-4 h-4 mr-1" />
                  发布产品
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
