import React, { useState } from 'react';
import { 
  LayoutGrid, Code, Wand2, Eye, FileText, Zap, 
  CheckCircle2, XCircle, AlertCircle, ArrowRight, 
  Layers, Settings, Palette, Box, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
// ❌ 已禁用：文件不存在
// import { FormLibraryManagementPro } from './FormLibraryManagementPro';
import { UltimateFormDesigner } from './UltimateFormDesigner';
import AdvancedFormDemo from '../AdvancedFormDemo';

// 🔥 表单工具类型定义
type FormTool = 'library' | 'designer' | 'builder' | 'compare';

// 🔥 表单工具配置
const FORM_TOOLS = {
  library: {
    id: 'library' as FormTool,
    name: '表单库管理中心Pro',
    nameEn: 'Form Library Management Pro',
    icon: '📚',
    color: 'blue',
    description: '管理所有业务表单模板，支持预览、编辑、导出',
    features: [
      '12个预置商业表单模板',
      '实时预览和PDF导出',
      'THE COSUN BM品牌风格',
      '表单分类管理',
      '快速搜索和筛选',
    ],
    pros: [
      '✅ 开箱即用，12个真实商业表单',
      '✅ 完全符合THE COSUN BM品牌规范',
      '✅ 一键导出PDF，即刻可用',
      '✅ 表单预览和管理界面美观',
      '✅ 适合快速使用现成模板',
    ],
    cons: [
      '❌ 不支持自定义创建新表单',
      '❌ 只能使用预置的12个模板',
      '❌ 无法修改表单结构',
      '❌ 灵活性较低',
    ],
    bestFor: '需要快速使用标准商业表单的业务场景',
    difficulty: '⭐ 简单',
  },
  designer: {
    id: 'designer' as FormTool,
    name: '可视化表单设计器Pro',
    nameEn: 'Visual Form Designer Pro',
    icon: '🎨',
    color: 'purple',
    description: '可视化拖拽设计表单，所见即所得',
    features: [
      '拖拽式表单设计',
      '实时预览效果',
      '组件库支持',
      '样式自定义',
      '布局网格系统',
    ],
    pros: [
      '✅ 可视化操作，无需代码',
      '✅ 所见即所得，实时预览',
      '✅ 丰富的组件库',
      '✅ 支持自定义样式',
      '✅ 适合设计师和业务人员',
    ],
    cons: [
      '❌ 高级功能需要学习',
      '❌ 复杂布局配置困难',
      '❌ 灵活性不如代码方式',
      '❌ 导出格式有限',
    ],
    bestFor: '需要自定义表单设计但不想写代码的用户',
    difficulty: '⭐⭐ 中等',
  },
  builder: {
    id: 'builder' as FormTool,
    name: '终极表单DIY工作台',
    nameEn: 'Ultimate Form Builder',
    icon: '⚡',
    color: 'orange',
    description: '终极灵活性，支持无限网格、任意定位、代码级控制',
    features: [
      '无限列数网格布局',
      '每个模块可任意定位',
      '精确到像素的控制',
      '完整的样式系统',
      'JSON配置导入导出',
    ],
    pros: [
      '✅ 终极灵活性，任意布局',
      '✅ 支持无限列数和行数',
      '✅ 每个模块位置大小随意调整',
      '✅ 完全符合真实商业表单格式',
      '✅ JSON配置，可编程',
      '✅ 适合复杂表单和高级用户',
    ],
    cons: [
      '❌ 学习曲线陡峭',
      '❌ 需要理解网格布局概念',
      '❌ 配置复杂，不适合快速上手',
      '❌ 需要技术背景',
    ],
    bestFor: '需要完全自定义复杂表单的高级用户和开发者',
    difficulty: '⭐⭐⭐ 困难',
  },
};

// 🔥 表单管理中心主组件
export default function FormManagementHub() {
  const [currentTool, setCurrentTool] = useState<FormTool>('compare');
  const [showDemo, setShowDemo] = useState(false);

  // 如果正在演示高级表单构建器
  if (showDemo) {
    return <AdvancedFormDemo onClose={() => setShowDemo(false)} />;
  }

  // 如果选择了具体工具
  if (currentTool === 'library') {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentTool('compare')}
                className="text-white hover:bg-blue-500"
              >
                ← 返回工具对比
              </Button>
              <div className="w-px h-8 bg-blue-400" />
              <div>
                <h2 className="text-xl">📚 表单库管理中心Pro</h2>
                <p className="text-sm text-blue-100">Form Library Management Pro</p>
              </div>
            </div>
          </div>
        </div>
        {/* ❌ 已禁用：FormLibraryManagementPro 组件不存在 */}
        <div className="p-8 text-center text-gray-500">
          <p>表单库管理中心Pro组件暂不可用</p>
        </div>
      </div>
    );
  }

  if (currentTool === 'designer') {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentTool('compare')}
                className="text-white hover:bg-purple-500"
              >
                ← 返回工具对比
              </Button>
              <div className="w-px h-8 bg-purple-400" />
              <div>
                <h2 className="text-xl">🎨 可视化表单设计器Pro</h2>
                <p className="text-sm text-purple-100">Visual Form Designer Pro</p>
              </div>
            </div>
          </div>
        </div>
        <UltimateFormDesigner />
      </div>
    );
  }

  if (currentTool === 'builder') {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDemo(true)}
                className="bg-[#F96302] hover:bg-[#E55502] text-white"
              >
                ← 返回工具对比
              </Button>
              <div className="w-px h-8 bg-orange-400" />
              <div>
                <h2 className="text-xl">⚡ 终极表单DIY工作台</h2>
                <p className="text-sm text-orange-100">Ultimate Form Builder</p>
              </div>
            </div>
          </div>
        </div>
        <AdvancedFormDemo onClose={() => setCurrentTool('compare')} />
      </div>
    );
  }

  // 默认显示对比页面
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-[#F96302] to-orange-600 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl mb-2">🚀 表单管理中心 · 工具对比</h1>
            <p className="text-lg text-orange-100">Form Management Hub · Tool Comparison</p>
            <p className="text-sm text-orange-200 mt-2">
              三大表单工具，满足从简单到复杂的所有业务需求
            </p>
          </div>

          {/* 快速导航 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {Object.values(FORM_TOOLS).map((tool) => (
              <Card 
                key={tool.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                onClick={() => setCurrentTool(tool.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{tool.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-white mb-1">{tool.name}</h3>
                      <p className="text-xs text-orange-100">{tool.nameEn}</p>
                      <Badge className="mt-2 bg-white/20 text-white border-0">
                        {tool.difficulty}
                      </Badge>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/60" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto p-8">
        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {Object.values(FORM_TOOLS).map((tool) => (
            <Card 
              key={tool.id}
              className={`border-2 border-${tool.color}-200 hover:shadow-xl transition-all`}
            >
              <CardHeader className={`bg-${tool.color}-50 border-b-2 border-${tool.color}-200`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl mb-2">{tool.icon}</div>
                    <CardTitle className="text-gray-900">{tool.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {tool.nameEn}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`border-${tool.color}-400 text-${tool.color}-700 bg-${tool.color}-100`}
                  >
                    {tool.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* 描述 */}
                <p className="text-sm text-gray-700 mb-4">{tool.description}</p>

                {/* 核心功能 */}
                <div className="mb-4">
                  <h4 className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                    <Zap className="w-4 h-4 text-orange-600" />
                    核心功能
                  </h4>
                  <div className="space-y-1">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${tool.color}-500 mt-1.5`} />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 最适合 */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-700">
                        <strong>最适合：</strong> {tool.bestFor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 进入工具 */}
                <Button
                  onClick={() => setCurrentTool(tool.id)}
                  className={`w-full bg-${tool.color}-600 hover:bg-${tool.color}-700 text-white`}
                  style={{ 
                    backgroundColor: tool.color === 'orange' ? '#F96302' : undefined,
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  进入工具
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 详细对比表 */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="bg-gray-50 border-b-2 border-gray-200">
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-[#F96302]" />
              详细功能对比表
            </CardTitle>
            <CardDescription>
              深入对比三大表单工具的优势和劣势，帮助您选择最合适的工具
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-4 text-sm text-gray-700">对比维度</th>
                    <th className="text-left p-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        📚 表单库管理中心Pro
                      </div>
                    </th>
                    <th className="text-left p-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        🎨 可视化表单设计器Pro
                      </div>
                    </th>
                    <th className="text-left p-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        ⚡ 终极表单DIY工作台
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 优势 */}
                  <tr className="border-b border-gray-200">
                    <td className="p-4 bg-green-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <strong className="text-sm text-gray-900">核心优势</strong>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.library.pros.map((pro, index) => (
                          <div key={index} className="text-xs text-gray-700">{pro}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.designer.pros.map((pro, index) => (
                          <div key={index} className="text-xs text-gray-700">{pro}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.builder.pros.map((pro, index) => (
                          <div key={index} className="text-xs text-gray-700">{pro}</div>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* 劣势 */}
                  <tr className="border-b border-gray-200">
                    <td className="p-4 bg-red-50">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <strong className="text-sm text-gray-900">局限性</strong>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.library.cons.map((con, index) => (
                          <div key={index} className="text-xs text-gray-700">{con}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.designer.cons.map((con, index) => (
                          <div key={index} className="text-xs text-gray-700">{con}</div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="space-y-1">
                        {FORM_TOOLS.builder.cons.map((con, index) => (
                          <div key={index} className="text-xs text-gray-700">{con}</div>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* 使用场景 */}
                  <tr className="border-b border-gray-200">
                    <td className="p-4 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5 text-blue-600" />
                        <strong className="text-sm text-gray-900">适用场景</strong>
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-xs text-gray-700">
                        ✓ 需要标准商业表单<br/>
                        ✓ 快速上手使用<br/>
                        ✓ 无需修改表单结构<br/>
                        ✓ 适合业务人员
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-xs text-gray-700">
                        ✓ 需要自定义表单<br/>
                        ✓ 可视化操作<br/>
                        ✓ 中等复杂度<br/>
                        ✓ 适合设计师和产品
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-xs text-gray-700">
                        ✓ 复杂表单定制<br/>
                        ✓ 完全控制布局<br/>
                        ✓ 高级功能需求<br/>
                        ✓ 适合开发者
                      </div>
                    </td>
                  </tr>

                  {/* 学习成本 */}
                  <tr className="border-b border-gray-200">
                    <td className="p-4 bg-yellow-50">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-yellow-600" />
                        <strong className="text-sm text-gray-900">学习成本</strong>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        ⭐ 低 - 5分钟上手
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        ⭐⭐ 中 - 30分钟上手
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-red-100 text-red-700 border-red-300">
                        ⭐⭐⭐ 高 - 2小时学习
                      </Badge>
                    </td>
                  </tr>

                  {/* 灵活性 */}
                  <tr>
                    <td className="p-4 bg-purple-50">
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-600" />
                        <strong className="text-sm text-gray-900">灵活性</strong>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-blue-500 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">低灵活性</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-purple-500 rounded" />
                        <div className="w-4 h-4 bg-purple-500 rounded" />
                        <div className="w-4 h-4 bg-purple-500 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                        <div className="w-4 h-4 bg-gray-200 rounded" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">中等灵活性</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <div className="w-4 h-4 bg-orange-500 rounded" />
                        <div className="w-4 h-4 bg-orange-500 rounded" />
                        <div className="w-4 h-4 bg-orange-500 rounded" />
                        <div className="w-4 h-4 bg-orange-500 rounded" />
                        <div className="w-4 h-4 bg-orange-500 rounded" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">终极灵活性</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 推荐引导 */}
        <Card className="mt-6 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ArrowRight className="w-6 h-6 text-[#F96302]" />
              如何选择合适的工具？
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="text-sm text-gray-900 mb-2">如果您是业务人员</h3>
                <p className="text-xs text-gray-600 mb-3">
                  需要快速使用标准商业表单，不需要修改表单结构
                </p>
                <Button
                  size="sm"
                  onClick={() => setCurrentTool('library')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  使用表单库管理中心
                </Button>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="text-sm text-gray-900 mb-2">如果您是设计师/产品</h3>
                <p className="text-xs text-gray-600 mb-3">
                  需要自定义表单设计，但不想写代码
                </p>
                <Button
                  size="sm"
                  onClick={() => setCurrentTool('designer')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  使用可视化设计器
                </Button>
              </div>

              <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="text-sm text-gray-900 mb-2">如果您是开发者</h3>
                <p className="text-xs text-gray-600 mb-3">
                  需要完全自定义复杂表单，要求最高灵活性
                </p>
                <Button
                  size="sm"
                  onClick={() => setCurrentTool('builder')}
                  className="w-full bg-[#F96302] hover:bg-[#E55502] text-white"
                >
                  使用终极DIY工作台
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}