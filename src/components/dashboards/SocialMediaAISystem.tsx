// 🎯 AI驱动的社媒客户开发系统 - 完整版
// 原有功能 + 3大新增功能完整整合

import { useState } from 'react';
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import { 
  Bot, Sparkles, Target, Users, TrendingUp, Zap,
  Copy, ExternalLink, CheckCircle, AlertCircle,
  Clock, Calendar, BarChart3, MessageSquare,
  ThumbsUp, Star, Hash, ArrowRight, BookOpen,
  Rocket, Lightbulb, Database, Search, Eye,
  Shield, Users2, Radio, Monitor, Film, Wand2,
  Scissors, Play, Download, UserPlus
} from "lucide-react";
import { User } from "../../lib/rbac-config";
import { LiveStreamManagement } from './LiveStreamManagement'; // 🔥 导入直播管理组件
import SeedingCampaignCenterEnhanced from '../admin/SeedingCampaignCenterEnhanced'; // 🔥 导入种草营销中心
import CustomerIntakeSystem from '../admin/CustomerIntakeSystem'; // 🔥 导入客户录入与评估系统
import { 
  ALL_TARGET_CUSTOMERS, 
  SOCIAL_PLATFORMS, 
  AI_TOOLS, 
  EXECUTION_WORKFLOW,
  VIDEO_TOOLS,
  LIVESTREAM_SYSTEM
} from './SocialMediaAISystemData';

import React from 'react';

interface SocialMediaAISystemProps {
  user: User;
}

export function SocialMediaAISystem({ user }: SocialMediaAISystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomerType, setSelectedCustomerType] = useState('Retailer');
  const [selectedPlatform, setSelectedPlatform] = useState('LinkedIn');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // 导航到AI内容工作台
  const navigateToAIStudio = () => {
    console.log('🚀 Navigating to AI Content Studio...');
    // 通过window.location进行导航
    window.location.hash = 'ai-content-studio';
    // 或者尝试通过事件通信
    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'ai-content-studio' } }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(id);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const selectedCustomer = ALL_TARGET_CUSTOMERS.find(c => c.type === selectedCustomerType);
  const selectedPlatformData = SOCIAL_PLATFORMS.find(p => p.platform === selectedPlatform);

  return (
    <div className="space-y-3 p-3 bg-slate-50">
      {/* 🎯 系统标题 */}
      <div className="rounded-lg p-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Bot className="size-6" />
              AI驱动的社媒客户开发系统 - 完整版
            </h1>
            <p className="text-sm text-blue-100">
              6类客户 + 6大平台 + AI工具 + 视频制作 + 多平台直播 + 种草营销 + 客户录入评估 - ChatGPT + Gemini 全方位解决方案
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-blue-100">月度目标</p>
              <p className="text-2xl font-bold">20+</p>
              <p className="text-xs text-blue-100">新客户</p>
            </div>
            <div className="text-right bg-white/20 rounded px-4 py-2">
              <p className="text-xs text-blue-100">转化率</p>
              <p className="text-2xl font-bold">40%</p>
              <p className="text-xs text-blue-100">社媒→成交</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 核心Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-10 w-full">
          <TabsTrigger value="overview">系统概览</TabsTrigger>
          <TabsTrigger value="customers">目标客户</TabsTrigger>
          <TabsTrigger value="platforms">社媒策略</TabsTrigger>
          <TabsTrigger value="ai-tools">AI工具</TabsTrigger>
          <TabsTrigger value="video">视频制作</TabsTrigger>
          <TabsTrigger value="livestream">直播系统</TabsTrigger>
          <TabsTrigger value="seeding">种草营销</TabsTrigger>
          <TabsTrigger value="customer-intake">客户录入 🔥</TabsTrigger>
          <TabsTrigger value="workflow">执行流程</TabsTrigger>
          <TabsTrigger value="plan">30天计划</TabsTrigger>
        </TabsList>

        {/* Tab 1: 系统概览 */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <Card className="p-3 border-blue-300 bg-white">
              <Target className="size-8 text-blue-600 mb-2" />
              <p className="text-xs text-slate-600">目标客户类型</p>
              <p className="text-2xl font-bold text-slate-900">6类</p>
              <p className="text-xs text-green-600">新增验货+代理采购</p>
            </Card>
            <Card className="p-3 border-purple-300 bg-white">
              <Hash className="size-8 text-purple-600 mb-2" />
              <p className="text-xs text-slate-600">社媒平台</p>
              <p className="text-2xl font-bold text-slate-900">6个</p>
              <p className="text-xs text-green-600">全渠道覆盖</p>
            </Card>
            <Card className="p-3 border-green-300 bg-white">
              <Film className="size-8 text-green-600 mb-2" />
              <p className="text-xs text-slate-600">视频工具</p>
              <p className="text-2xl font-bold text-slate-900">8+</p>
              <p className="text-xs text-green-600">AI生成+编辑</p>
            </Card>
            <Card className="p-3 border-orange-300 bg-white">
              <Radio className="size-8 text-orange-600 mb-2" />
              <p className="text-xs text-slate-600">直播系统</p>
              <p className="text-2xl font-bold text-slate-900">完整</p>
              <p className="text-xs text-green-600">多平台+官网</p>
            </Card>
          </div>

          {/* 新增功能亮点 */}
          <Card className="p-4 border-cyan-300 bg-cyan-50">
            <h3 className="text-sm font-bold text-cyan-900 mb-3">🆕 4大新增功能亮点</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-5 text-cyan-600" />
                  <Users2 className="size-5 text-indigo-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">2类新客户类型</h4>
                <p className="text-xs text-slate-600 mb-2">验货服务买家 + 找中国代理采购商</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 平均订单$28K-$55K</li>
                  <li>• 转化率40%-48%</li>
                  <li>• 5步开发策略</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <Wand2 className="size-5 text-purple-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 mb-1">视频制作工具集</h4>
                <p className="text-xs text-slate-600 mb-2">AI视频生成 + 专业编辑</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• Runway ML（AI生成）</li>
                  <li>• CapCut（免费剪辑）⭐</li>
                  <li>• 10倍效率提升</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <Monitor className="size-5 text-green-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 mb-1">多平台直播系统</h4>
                <p className="text-xs text-slate-600 mb-2">StreamYard + 官网集成</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 一键多平台推流</li>
                  <li>• 官网LIVE Banner</li>
                  <li>• 20-50潜客/场</li>
                </ul>
              </div>
              <div className="bg-white p-3 rounded">
                <Sparkles className="size-5 text-orange-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900 mb-1">种草营销中心</h4>
                <p className="text-xs text-slate-600 mb-2">B2B2C反向拉动策略</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• 终端消费者→经销商</li>
                  <li>• 3种执行方式管理</li>
                  <li>• ROI目标: 3:1</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 预期效果 */}
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">📈 月度KPI目标（增强后）</h3>
            <div className="grid grid-cols-7 gap-2">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-xs text-slate-600">潜客发现</p>
                <p className="text-xl font-bold text-blue-600">350</p>
                <Badge className="bg-green-500 text-white text-xs">+50</Badge>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <p className="text-xs text-slate-600">有效连接</p>
                <p className="text-xl font-bold text-green-600">200</p>
                <Badge className="bg-green-500 text-white text-xs">+20</Badge>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <p className="text-xs text-slate-600">深度对话</p>
                <p className="text-xl font-bold text-purple-600">70</p>
                <Badge className="bg-green-500 text-white text-xs">+10</Badge>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <p className="text-xs text-slate-600">视频发布</p>
                <p className="text-xl font-bold text-orange-600">20</p>
                <Badge className="bg-cyan-500 text-white text-xs">新增</Badge>
              </div>
              <div className="text-center p-2 bg-pink-50 rounded">
                <p className="text-xs text-slate-600">直播场次</p>
                <p className="text-xl font-bold text-pink-600">4</p>
                <Badge className="bg-cyan-500 text-white text-xs">新增</Badge>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <p className="text-xs text-slate-600">BANT认证</p>
                <p className="text-xl font-bold text-yellow-600">25</p>
                <Badge className="bg-green-500 text-white text-xs">+5</Badge>
              </div>
              <div className="text-center p-2 bg-red-50 rounded">
                <p className="text-xs text-slate-600">成交客户</p>
                <p className="text-xl font-bold text-red-600">5-8</p>
                <Badge className="bg-green-500 text-white text-xs">+2</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: 目标客户（6类） */}
        <TabsContent value="customers" className="space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {ALL_TARGET_CUSTOMERS.map(customer => {
              const Icon = customer.icon;
              const isSelected = selectedCustomerType === customer.type;
              return (
                <button
                  key={customer.type}
                  onClick={() => setSelectedCustomerType(customer.type)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <Icon className="size-6 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs font-bold text-slate-900">{customer.label}</p>
                  {customer.isNew && (
                    <Badge className="mt-1 bg-cyan-500 text-white text-xs">新增</Badge>
                  )}
                  <p className="text-xs text-slate-600 mt-1">{customer.avgOrderValue}</p>
                </button>
              );
            })}
          </div>

          {/* 客户详细信息 */}
          {selectedCustomer && (
            <Card className="p-4 border-slate-300 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {selectedCustomer.label} ({selectedCustomer.type})
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>订单: {selectedCustomer.avgOrderValue}</span>
                    <span>转化率: {selectedCustomer.conversionRate}</span>
                    <span>LTV: {selectedCustomer.ltv}</span>
                  </div>
                </div>
                <Badge className="bg-blue-500 text-white">{selectedCustomer.value}价值</Badge>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <CheckCircle className="size-3 text-green-600" />
                    客户特征
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {selectedCustomer.characteristics.map((char, idx) => (
                      <li key={idx}>• {char}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <AlertCircle className="size-3 text-orange-600" />
                    核心痛点
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {selectedCustomer.painPoints.map((pain, idx) => (
                      <li key={idx} className="text-red-600">• {pain}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Star className="size-3 text-yellow-600" />
                    理想画像
                  </h4>
                  <div className="space-y-1 text-xs text-slate-700">
                    {Object.entries(selectedCustomer.idealProfile).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key}:</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Target className="size-3 text-purple-600" />
                    社媒信号
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {selectedCustomer.socialSignals.map((signal, idx) => (
                      <li key={idx}>• {signal}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 新增客户的5步发策略 */}
              {selectedCustomer.developmentStrategy && (
                <div className="mt-3 bg-blue-50 p-3 rounded">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1">
                    <Rocket className="size-4 text-blue-600" />
                    5步开发策略
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedCustomer.developmentStrategy.map((strategy, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex-1 text-center p-2 bg-white rounded">
                          <p className="text-xs font-semibold text-slate-900">Step {strategy.step}</p>
                          <p className="text-xs text-slate-600">{strategy.name}</p>
                          <p className="text-xs text-blue-600">{strategy.action}</p>
                        </div>
                        {idx < selectedCustomer.developmentStrategy.length - 1 && (
                          <ArrowRight className="size-4 text-slate-400" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: 社媒策略 */}
        <TabsContent value="platforms" className="space-y-3">
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">📱 6大社媒平台优先级</h3>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map(platform => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.platform}
                    onClick={() => setSelectedPlatform(platform.platform)}
                    className={`w-full p-2 rounded border-2 transition-all flex items-center justify-between ${
                      selectedPlatform === platform.platform
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-500 text-white text-xs">#{platform.priority}</Badge>
                      <Icon className="size-5" />
                      <span className="text-sm font-bold text-slate-900">{platform.platform}</span>
                      <span className="text-xs text-slate-600">{platform.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={platform.effectiveness} className="w-20 h-2" />
                      <span className="text-xs font-bold text-green-600">{platform.effectiveness}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 平台详细策略 */}
          {selectedPlatformData && (
            <Card className="p-4 border-slate-300 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <selectedPlatformData.icon className="size-5" />
                    {selectedPlatformData.platform} 完整策略
                  </h3>
                  <p className="text-xs text-slate-600">{selectedPlatformData.description || '社交媒体营销策略'}</p>
                </div>
                <Badge className="bg-blue-500 text-white">优先级 #{selectedPlatformData.priority || '1'}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-2 bg-blue-50 rounded">
                  <h4 className="text-xs font-bold text-blue-900 mb-1">AI应用场景</h4>
                  <div className="space-y-1">
                    {(selectedPlatformData.aiUseCases || selectedPlatformData.contentIdeas || []).map((useCase, idx) => (
                      <div key={idx} className="text-xs text-slate-700">
                        <CheckCircle className="size-3 text-blue-600 inline mr-1" />
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-green-50 rounded">
                  <h4 className="text-xs font-bold text-green-900 mb-1">每日行动清单</h4>
                  <div className="space-y-1">
                    {(selectedPlatformData.dailyActions || selectedPlatformData.engagementTactics?.map(action => ({ action, target: '✓' })) || []).map((action, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{typeof action === 'string' ? action : action.action}</span>
                        <span className="text-green-600">{typeof action === 'object' ? action.target : '✓'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {Object.entries(selectedPlatformData.successMetrics || selectedPlatformData.kpis || {}).map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600">{key}</p>
                    <p className="text-sm font-bold text-blue-600">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 4: AI工具 */}
        <TabsContent value="ai-tools" className="space-y-3">
          {/* 🌟 NEW: AI内容生成工作台 CTA */}
          <Card className="p-4 border-purple-300 bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wand2 className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                    🚀 AI内容生成工作台 - 一键生成营销文案
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">全新上线！</Badge>
                  </h3>
                  <p className="text-xs text-slate-600 mb-2">
                    告别手动写文案！6大模板涵盖产品描述、开发信、LinkedIn帖子、视频脚本等所有场景，节省80%时间
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-3 text-green-600" />
                      <span className="text-slate-700">产品描述生成</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-3 text-green-600" />
                      <span className="text-slate-700">客户开发邮件</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-3 text-green-600" />
                      <span className="text-slate-700">社媒帖子</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="size-3 text-green-600" />
                      <span className="text-slate-700">视频脚本</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3 text-yellow-600" />
                      <span className="text-slate-700 font-semibold">6个专业模板</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg gap-2"
                  onClick={navigateToAIStudio}
                >
                  <Sparkles className="size-4" />
                  立即使用工作台
                  <ArrowRight className="size-4" />
                </Button>
                <p className="text-xs text-center text-purple-700 font-semibold">
                  ⚡ 2秒生成，一键复制，立即可用
                </p>
              </div>
            </div>
          </Card>

          {/* 原有AI工具列表 */}
          {AI_TOOLS.map(tool => {
            const Icon = tool.icon;
            return (
              <Card key={tool.name} className="p-4 border-slate-300 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <Icon className="size-6 text-blue-600" />
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-600">{tool.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">应用场景</h4>
                    <div className="space-y-1">
                      {(tool.use_cases || []).map((useCase, idx) => (
                        <div key={idx} className="text-xs text-slate-700">
                          <Sparkles className="size-3 text-blue-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">AI提示词模板</h4>
                    <div className="space-y-1">
                      {(tool.prompts || []).map((prompt, idx) => (
                        <div key={idx} className="flex items-start gap-1 text-xs text-slate-700">
                          <ThumbsUp className="size-3 text-green-600 mt-0.5" />
                          <span>{prompt.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {(tool.prompts || []).map((promptData, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200 mb-2">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{promptData.title}</h5>
                        <p className="text-xs text-slate-600">模板ID: {promptData.id}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(promptData.prompt, `${tool.name}-${idx}`)}
                        className="h-6 text-xs"
                      >
                        {copiedPrompt === `${tool.name}-${idx}` ? (
                          <>
                            <CheckCircle className="size-3 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {promptData.prompt}
                      </pre>
                    </div>
                  </div>
                ))}
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab 5: 视频制作工具（新增） */}
        <TabsContent value="video" className="space-y-3">
          {/* AI视频生成 */}
          <Card className="p-4 border-purple-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Wand2 className="size-6 text-purple-600" />
              AI视频生成工具
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {((VIDEO_TOOLS.find(cat => cat.category === 'AI视频生成')?.tools) || []).map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <div key={idx} className="p-3 bg-purple-50 rounded border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-purple-600" />
                        <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                      </div>
                      {tool.recommended && <Badge className="bg-purple-500 text-white text-xs">推荐</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                    <div className="space-y-1 mb-2">
                      {(tool.useCases || []).map((useCase, fidx) => (
                        <div key={fidx} className="text-xs text-slate-700">
                          <CheckCircle className="size-3 text-purple-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{tool.pricing}</span>
                      <Badge variant="outline" className="text-xs">{tool.difficulty}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 视频编辑工具 */}
          <Card className="p-4 border-blue-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scissors className="size-6 text-blue-600" />
              视频编辑工具
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {((VIDEO_TOOLS.find(cat => cat.category === '视频编辑')?.tools) || []).map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-5 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900">{tool.name}</h4>
                      </div>
                      {tool.name === 'CapCut' && <Badge className="bg-green-500 text-white text-xs">免费⭐</Badge>}
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{tool.description}</p>
                    <div className="space-y-1 mb-2">
                      {(tool.useCases || []).map((useCase, fidx) => (
                        <div key={fidx} className="text-xs text-slate-700">
                          <CheckCircle className="size-3 text-blue-600 inline mr-1" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{tool.pricing}</span>
                      <Badge variant="outline" className="text-xs">{tool.difficulty}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 6: 直播系统（新增） - 完整直播管理系统 */}
        <TabsContent value="livestream" className="space-y-3">
          {/* 🎬 完整的直播管理系统 */}
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <Radio className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">🎬 直播管理系统 - 后台管理</h3>
                <p className="text-sm text-slate-600">创建直播 · 数据分析 · 实时监控 · 订单管理</p>
              </div>
            </div>
          </div>
          
          <LiveStreamManagement />
          
          {/* 分隔线 */}
          <div className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 rounded-lg p-4 border-2 border-dashed border-slate-300 my-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-300 shadow-sm">
                <span className="text-sm font-semibold text-slate-700">⬆️ 直播管理后台</span>
                <span className="text-xs text-slate-500">vs</span>
                <span className="text-sm font-semibold text-slate-700">⬇️ 直播策略指南</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-400 to-transparent" />
            </div>
            <p className="text-xs text-center text-slate-600 mt-2">
              上方是完整的直播管理系统，下方是直播策略参考指南
            </p>
          </div>

          {/* 多平台直播策略指南 */}
          <Card className="p-4 border-red-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Radio className="size-6 text-red-600" />
              多平台直播策略指南
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {(LIVESTREAM_SYSTEM.platforms || []).map((platform, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded text-center">
                  <Radio className="size-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="text-sm font-bold text-slate-900 text-center mb-1">{platform}</h4>
                  <p className="text-xs text-slate-600 text-center">实时互动</p>
                </div>
              ))}
            </div>
          </Card>

          {/* StreamYard */}
          <Card className="p-4 border-purple-300 bg-purple-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="size-6 text-purple-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{LIVESTREAM_SYSTEM.tool?.name || 'StreamYard'}</h3>
                  <p className="text-xs text-slate-600">多平台同步直播工具</p>
                </div>
              </div>
              <Badge className="bg-purple-500 text-white">强烈推荐⭐⭐⭐</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white p-3 rounded">
                <h4 className="text-xs font-bold text-slate-900 mb-2">核心功能</h4>
                <div className="space-y-1">
                  {(LIVESTREAM_SYSTEM.tool?.features || []).map((feature, idx) => (
                    <div key={idx} className="text-xs text-slate-700">
                      <CheckCircle className="size-3 text-purple-600 inline mr-1" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3 rounded">
                <h4 className="text-xs font-bold text-slate-900 mb-2">设置步骤</h4>
                <div className="space-y-2">
                  {['注册账号', '连接社媒', '创建Broadcast', '选择平台', 'Go Live'].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded">
              <span className="text-xs text-slate-600">{LIVESTREAM_SYSTEM.tool?.pricing || '免费版 + $20/月专业版'}</span>
              <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                <ExternalLink className="size-3 mr-1" />
                访问官网
              </Button>
            </div>
          </Card>

          {/* 官网集成 */}
          <Card className="p-4 border-green-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3">🌐 官网直播集成</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded border border-green-200 text-center">
                <p className="text-xs font-bold text-slate-900">LIVE Banner首页</p>
                <p className="text-xs text-slate-600 mt-1">直播时首页顶部显示</p>
              </div>
              <div className="p-3 bg-green-50 rounded border border-green-200 text-center">
                <p className="text-xs font-bold text-slate-900">嵌入式播放器</p>
                <p className="text-xs text-slate-600 mt-1">官网专属直播页面</p>
              </div>
            </div>
          </Card>

          {/* 直播内容策略 */}
          <Card className="p-4 border-yellow-300 bg-yellow-50">
            <h3 className="text-base font-bold text-slate-900 mb-3">📅 直播内容策略</h3>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded">
                <h4 className="text-xs font-bold text-slate-900 mb-2">直播频率与时长</h4>
                <div className="flex items-center gap-4 text-xs text-slate-700">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3 text-yellow-600" />
                    <span>{LIVESTREAM_SYSTEM.frequency || '每月2-4场'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3 text-yellow-600" />
                    <span>{LIVESTREAM_SYSTEM.duration || '30-60分钟'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <h4 className="text-xs font-bold text-slate-900 mb-2">内容主题</h4>
                <div className="space-y-1">
                  {(LIVESTREAM_SYSTEM.topics || []).map((topic, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-3 rounded">
                <h4 className="text-xs font-bold text-slate-900 mb-2">预期效果</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(LIVESTREAM_SYSTEM.expectedResults || {}).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-slate-600">{key}</p>
                      <p className="text-sm font-bold text-yellow-600">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 7: 种草营销中心 - B2B2C反向拉动策略 */}
        <TabsContent value="seeding" className="space-y-3">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">🌱 种草营销管理中心</h3>
                <p className="text-sm text-slate-600">终端拉动策略：通过C端影响B端，让经销商感受到市场需求</p>
              </div>
            </div>
          </div>
          
          <SeedingCampaignCenterEnhanced userRole={user.role} />
        </TabsContent>

        {/* Tab 8: 客户录入 🔥 */}
        <TabsContent value="customer-intake" className="space-y-3">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-lg p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <UserPlus className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">🔥 客户录入与评估系统</h3>
                <p className="text-sm text-slate-600">自动化客户录入、评估与分类，提高开发效率</p>
              </div>
            </div>
          </div>
          
          <CustomerIntakeSystem userRole={user.role} />
        </TabsContent>

        {/* Tab 9: 执行流程 */}
        <TabsContent value="workflow" className="space-y-3">
          <Card className="p-3 border-slate-300 bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-2">🎯 7步执行流程</h3>
            <div className="space-y-3">
              {EXECUTION_WORKFLOW.map(step => {
                const Icon = step.icon;
                return (
                  <div key={step.step} className="p-3 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Icon className="size-4" />
                          {step.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                          <Clock className="size-3" />
                          <span>{step.duration}</span>
                          <span>•</span>
                          <span>工具: {(step.tools || []).join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-10">
                      <ul className="space-y-0.5 mb-2">
                        {(step.actions || []).map((action, tidx) => (
                          <li key={tidx} className="flex items-start gap-1 text-xs text-slate-700">
                            <span className="text-blue-600">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>

                      {step.output && (
                        <div className="bg-green-50 p-2 rounded border border-green-200 mt-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="size-3 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">交付物: {step.output}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 10: 30天计划 */}
        <TabsContent value="plan" className="space-y-3">
          <Card className="p-4 border-blue-300 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-3">📅 30天落地执行计划（增强版）</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { week: '第1周', focus: '内容准备+直播策划', tasks: ['制作6个短视频', '生成15个帖子', '策划首场直播', '优化社媒主页'] },
                { week: '第2周', focus: '直播执行+客户开发', tasks: ['执行1场多平台直播', '开发50个潜客', '发送100个连接', '发布直播片段'] },
                { week: '第3周', focus: '深度跟进+内容营销', tasks: ['跟进直播潜客', '发布回顾文章', '剪辑精华视频', '继续日常开发'] },
                { week: '第4周', focus: '转化成交+月度复盘', tasks: ['推进报价样品', '数据分析优化', '规划下月直播', '制定下月计划'] }
              ].map((week, idx) => (
                <Card key={idx} className="p-3 border-blue-200 bg-blue-50">
                  <h4 className="text-sm font-bold text-blue-900 mb-1">{week.week}</h4>
                  <p className="text-xs text-blue-700 mb-2">{week.focus}</p>
                  <ul className="space-y-1">
                    {week.tasks.map((task, tidx) => (
                      <li key={tidx} className="text-xs text-slate-700 flex items-start gap-1">
                        <CheckCircle className="size-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Card>

          {/* 成功关键因素 */}
          <Card className="p-3 border-green-300 bg-green-50">
            <h3 className="text-sm font-bold text-green-900 mb-2">🏆 成功的5个关键因素</h3>
            <div className="grid grid-cols-5 gap-2">
              {[
                { factor: '精准定位', desc: '专注高价值客户', icon: Target },
                { factor: 'AI赋能', desc: '10倍效率提升', icon: Bot },
                { factor: '视频优先', desc: '互动率高10倍', icon: Film },
                { factor: '直播引流', desc: '20-50潜客/场', icon: Radio },
                { factor: '持续执行', desc: '每天2-3小时', icon: Clock }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="text-center p-2 bg-white rounded">
                    <Icon className="size-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-900">{item.factor}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 立即开始 */}
          <Card className="p-4 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-orange-900 mb-1">🚀 立即开始你的AI社媒客户开发之旅！</h3>
                <p className="text-xs text-orange-700">
                  完整系统已就绪：6类客户 + 6大平台 + AI工具 + 视频制作 + 多平台直播
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Rocket className="size-4" />
                开始执行
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}