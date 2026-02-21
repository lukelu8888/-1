import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  Database, TrendingUp, Users, Target, Sparkles, Save, 
  Calculator, Brain, Activity, Plus, Edit3, Trash2, 
  CheckCircle2, AlertCircle, Info, HelpCircle, FileText,
  BarChart3, DollarSign, Calendar, Rocket, Shield
} from 'lucide-react';

// 🔥 数据结构定义
interface HistoricalData {
  lastYear: number;
  twoYearsAgo: number;
  threeYearsAgo: number;
  monthlyData: Array<{ month: string; sales: number; year: number }>;
}

interface MarketData {
  totalSize: number;
  ourShare: number;
  targetShare: number;
  industryGrowth: number;
  competitorAvgGrowth: number;
  seasonalFactors: Array<{ month: string; factor: number }>;
}

interface ResourceData {
  salesTeam: number;
  avgDealsPerPerson: number;
  avgDealSize: number;
  conversionRate: number;
  avgSalesCycle: number;
  targetSalesCycle: number;
}

interface StrategicData {
  newProducts: number;
  newProductRevenue: number;
  newRegions: number;
  newRegionRevenue: number;
  majorClients: number;
  clientAvgRevenue: number;
  partnerships: number;
  partnershipRevenue: number;
}

interface ExecutionStrategy {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  targetContribution: number;
  expectedRevenue: number;
  timeline: string;
  actions: Array<{
    action: string;
    owner: string;
    frequency: string;
    kpi: string;
    status: string;
  }>;
}

export default function SalesDataManagementCenter() {
  // 🔥 状态管理
  const [activeTab, setActiveTab] = useState('historical');
  const [showCalculationLogic, setShowCalculationLogic] = useState(false);
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<ExecutionStrategy | null>(null);

  // 🔥 从localStorage加载数据
  const loadData = () => {
    const saved = localStorage.getItem('sales_management_data');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      historical: {
        lastYear: 15980000,
        twoYearsAgo: 14200000,
        threeYearsAgo: 12800000,
        monthlyData: []
      },
      market: {
        totalSize: 218000000,
        ourShare: 8.5,
        targetShare: 9.2,
        industryGrowth: 14.2,
        competitorAvgGrowth: 12.3,
        seasonalFactors: [
          { month: '1月', factor: 0.95 },
          { month: '2月', factor: 0.85 },
          { month: '3月', factor: 1.05 },
          { month: '4月', factor: 1.0 },
          { month: '5月', factor: 0.98 },
          { month: '6月', factor: 1.02 },
          { month: '7月', factor: 0.92 },
          { month: '8月', factor: 0.88 },
          { month: '9月', factor: 1.03 },
          { month: '10月', factor: 1.08 },
          { month: '11月', factor: 1.12 },
          { month: '12月', factor: 1.18 }
        ]
      },
      resource: {
        salesTeam: 5,
        avgDealsPerPerson: 24,
        avgDealSize: 62000,
        conversionRate: 28,
        avgSalesCycle: 18,
        targetSalesCycle: 15
      },
      strategic: {
        newProducts: 3,
        newProductRevenue: 800000,
        newRegions: 1,
        newRegionRevenue: 600000,
        majorClients: 8,
        clientAvgRevenue: 250000,
        partnerships: 2,
        partnershipRevenue: 400000
      },
      strategies: []
    };
  };

  const [data, setData] = useState(loadData());

  // 🔥 保存数据
  useEffect(() => {
    localStorage.setItem('sales_management_data', JSON.stringify(data));
  }, [data]);

  // 🔥 ==================== 核心计算逻辑 ====================

  // 1️⃣ 历史数据分析 - 支撑度计算
  const calculateHistoricalSupport = () => {
    const { lastYear, twoYearsAgo, threeYearsAgo } = data.historical;
    
    // 计算年均增长率
    const growth1 = ((lastYear - twoYearsAgo) / twoYearsAgo) * 100;
    const growth2 = ((twoYearsAgo - threeYearsAgo) / threeYearsAgo) * 100;
    const avgGrowth = (growth1 + growth2) / 2;
    
    // 计算数据稳定性（变异系数）
    const mean = (growth1 + growth2) / 2;
    const variance = ((growth1 - mean) ** 2 + (growth2 - mean) ** 2) / 2;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / Math.abs(mean)) * 100; // 变异系数
    
    // 支撑度计算逻辑：
    // - 基础分：70分
    // - 增长率加分：avgGrowth > 10% 加20分，5-10% 加15分，0-5% 加10分
    // - 稳定性加分：cv < 20% 加10分，20-40% 加5分
    let support = 70;
    
    if (avgGrowth > 10) support += 20;
    else if (avgGrowth > 5) support += 15;
    else if (avgGrowth > 0) support += 10;
    
    if (cv < 20) support += 10;
    else if (cv < 40) support += 5;
    
    return {
      score: Math.min(support, 100),
      avgGrowth: parseFloat(avgGrowth.toFixed(1)),
      stability: cv < 20 ? '高' : cv < 40 ? '中' : '低',
      detail: `年均增长${avgGrowth.toFixed(1)}%，数据稳定性${cv < 20 ? '优秀' : cv < 40 ? '良好' : '一般'}`
    };
  };

  // 2️⃣ 市场环境分析 - 机会度计算
  const calculateMarketOpportunity = () => {
    const { totalSize, ourShare, targetShare, industryGrowth, competitorAvgGrowth } = data.market;
    
    // 计算市场空间
    const currentRevenue = totalSize * (ourShare / 100);
    const targetRevenue = totalSize * (targetShare / 100);
    const growthSpace = ((targetRevenue - currentRevenue) / currentRevenue) * 100;
    
    // 机会度计算逻辑：
    // - 基础分：60分
    // - 行业增长加分：industryGrowth > 12% 加15分，8-12% 加10分，4-8% 加5分
    // - 市场空间加分：growthSpace > 15% 加15分，10-15% 加10分，5-10% 加5分
    // - 竞争优势加分：我们目标增长 > 竞争对手平均增长 加10分
    let opportunity = 60;
    
    if (industryGrowth > 12) opportunity += 15;
    else if (industryGrowth > 8) opportunity += 10;
    else if (industryGrowth > 4) opportunity += 5;
    
    if (growthSpace > 15) opportunity += 15;
    else if (growthSpace > 10) opportunity += 10;
    else if (growthSpace > 5) opportunity += 5;
    
    const ourTargetGrowth = ((targetRevenue - currentRevenue) / currentRevenue) * 100;
    if (ourTargetGrowth > competitorAvgGrowth) opportunity += 10;
    
    return {
      score: Math.min(opportunity, 100),
      growthSpace: parseFloat(growthSpace.toFixed(1)),
      marketSize: totalSize,
      detail: `行业增长${industryGrowth}%，市场空间${growthSpace.toFixed(1)}%，具备良好增长机会`
    };
  };

  // 3️⃣ 资源能力评估 - 执行力计算
  const calculateExecutionCapacity = () => {
    const { salesTeam, avgDealsPerPerson, avgDealSize, conversionRate, avgSalesCycle, targetSalesCycle } = data.resource;
    
    // 计算团队产能
    const annualCapacity = salesTeam * avgDealsPerPerson * avgDealSize;
    
    // 执行力计算逻辑：
    // - 基础分：65分
    // - 转化率加分：> 30% 加15分，25-30% 加12分，20-25% 加8分，15-20% 加5分
    // - 人均产能加分：avgDealsPerPerson > 25 加10分，20-25 加7分，15-20 加4分
    // - 流程效率加分：avgSalesCycle接近targetSalesCycle 加10分
    let execution = 65;
    
    if (conversionRate > 30) execution += 15;
    else if (conversionRate > 25) execution += 12;
    else if (conversionRate > 20) execution += 8;
    else if (conversionRate > 15) execution += 5;
    
    if (avgDealsPerPerson > 25) execution += 10;
    else if (avgDealsPerPerson > 20) execution += 7;
    else if (avgDealsPerPerson > 15) execution += 4;
    
    const cycleEfficiency = 1 - Math.abs(avgSalesCycle - targetSalesCycle) / avgSalesCycle;
    execution += Math.round(cycleEfficiency * 10);
    
    return {
      score: Math.min(execution, 100),
      capacity: annualCapacity,
      efficiency: conversionRate,
      detail: `团队年产能$${(annualCapacity / 1000000).toFixed(1)}M，转化率${conversionRate}%，执行能力强`
    };
  };

  // 4️⃣ 战略举措支撑 - 增长性计算
  const calculateStrategicGrowth = () => {
    const { newProducts, newProductRevenue, newRegions, newRegionRevenue, 
            majorClients, clientAvgRevenue, partnerships, partnershipRevenue } = data.strategic;
    
    // 计算战略增量收入
    const totalStrategicRevenue = newProductRevenue + newRegionRevenue + 
                                   (majorClients * clientAvgRevenue) + partnershipRevenue;
    
    // 增长性计算逻辑：
    // - 基础分：60分
    // - 新产品加分：有新产品 +10分，每个产品贡献 > $500K 额外+5分
    // - 新区域加分：有新区域 +10分，预期收入 > $500K 额外+5分
    // - 大客户加分：> 5个 +10分，平均单价 > $200K 额外+5分
    // - 战略合作加分：有合作 +5分
    let growth = 60;
    
    if (newProducts > 0) {
      growth += 10;
      if (newProductRevenue / newProducts > 500000) growth += 5;
    }
    
    if (newRegions > 0) {
      growth += 10;
      if (newRegionRevenue / newRegions > 500000) growth += 5;
    }
    
    if (majorClients > 5) {
      growth += 10;
      if (clientAvgRevenue > 200000) growth += 5;
    }
    
    if (partnerships > 0) growth += 5;
    
    return {
      score: Math.min(growth, 100),
      totalRevenue: totalStrategicRevenue,
      initiatives: newProducts + newRegions + partnerships,
      detail: `战略举措预计贡献$${(totalStrategicRevenue / 1000000).toFixed(1)}M增量收入`
    };
  };

  // 5️⃣ 综合可达成度计算
  const calculateOverallAchievability = () => {
    const historical = calculateHistoricalSupport();
    const market = calculateMarketOpportunity();
    const execution = calculateExecutionCapacity();
    const strategic = calculateStrategicGrowth();
    
    // 加权平均：历史25%，市场25%，执行30%，战略20%
    const overall = (
      historical.score * 0.25 +
      market.score * 0.25 +
      execution.score * 0.30 +
      strategic.score * 0.20
    );
    
    return {
      score: Math.round(overall),
      components: { historical, market, execution, strategic },
      recommendation: overall >= 85 ? '目标设定合理，可达成性高' :
                      overall >= 70 ? '目标略有挑战，需强化执行' :
                      '目标设定偏高，建议调整'
    };
  };

  // 🔥 ==================== AI预测算法 ====================

  // 销售预测算法
  const calculateForecast = (baseValue: number, months: number, type: 'conservative' | 'normal' | 'optimistic' = 'normal') => {
    const historical = calculateHistoricalSupport();
    const market = calculateMarketOpportunity();
    
    // 基础增长率 = (历史平均增长 + 市场增长) / 2
    const baseGrowthRate = (historical.avgGrowth + market.growthSpace) / 2 / 100;
    
    // 获取当前月份的季节性因素
    const currentMonth = new Date().getMonth();
    const targetMonth = (currentMonth + months) % 12;
    const seasonalFactor = data.market.seasonalFactors[targetMonth]?.factor || 1.0;
    
    // 预测值计算
    let predicted = baseValue * (1 + baseGrowthRate * (months / 12)) * seasonalFactor;
    
    // 置信区间
    let confidence = 90;
    let min = predicted * 0.92;
    let max = predicted * 1.08;
    
    if (type === 'conservative') {
      predicted *= 0.95;
      confidence = 95;
      min = predicted * 0.95;
      max = predicted * 1.05;
    } else if (type === 'optimistic') {
      predicted *= 1.05;
      confidence = 85;
      min = predicted * 0.90;
      max = predicted * 1.10;
    }
    
    return {
      predicted: Math.round(predicted),
      confidence,
      min: Math.round(min),
      max: Math.round(max),
      growth: parseFloat(((predicted - baseValue) / baseValue * 100).toFixed(1))
    };
  };

  // 🔥 计算结果展示
  const results = calculateOverallAchievability();

  // 🔥 渲染函数
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSaveHistorical = (formData: any) => {
    setData({
      ...data,
      historical: {
        ...data.historical,
        ...formData
      }
    });
    toast.success('✅ 历史数据已保存');
  };

  const handleSaveMarket = (formData: any) => {
    setData({
      ...data,
      market: {
        ...data.market,
        ...formData
      }
    });
    toast.success('✅ 市场数据已保存');
  };

  const handleSaveResource = (formData: any) => {
    setData({
      ...data,
      resource: {
        ...data.resource,
        ...formData
      }
    });
    toast.success('✅ 资源数据已保存');
  };

  const handleSaveStrategic = (formData: any) => {
    setData({
      ...data,
      strategic: {
        ...data.strategic,
        ...formData
      }
    });
    toast.success('✅ 战略数据已保存');
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Database className="size-8 text-blue-600" />
            销售数据管理与计算中心
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Data Management
            </Badge>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            数据录入 · 逻辑计算 · 预测算法 · 策略管理 · 科学决策
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCalculationLogic(true)}
        >
          <Calculator className="size-4 mr-1.5" />
          查看计算逻辑
        </Button>
      </div>

      {/* 🔥 综合评估结果仪表盘 */}
      <Card className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="size-8" />
          <div>
            <h2 className="text-xl font-bold">综合可达成度评估</h2>
            <p className="text-sm text-blue-100">基于历史、市场、资源、战略四维度科学计算</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="text-center bg-white/10 rounded-lg p-4">
            <p className="text-4xl font-bold mb-2">{results.components.historical.score}%</p>
            <p className="text-sm text-blue-100">历史数据支撑</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4">
            <p className="text-4xl font-bold mb-2">{results.components.market.score}%</p>
            <p className="text-sm text-blue-100">市场机会度</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4">
            <p className="text-4xl font-bold mb-2">{results.components.execution.score}%</p>
            <p className="text-sm text-blue-100">团队执行力</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg p-4">
            <p className="text-4xl font-bold mb-2">{results.components.strategic.score}%</p>
            <p className="text-sm text-blue-100">战略增长性</p>
          </div>
          <div className="text-center bg-yellow-400 text-slate-900 rounded-lg p-4">
            <p className="text-4xl font-bold mb-2">{results.score}%</p>
            <p className="text-sm font-semibold">综合可达成度</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/20 rounded-lg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            {results.recommendation}
          </p>
        </div>
      </Card>

      {/* 🔥 数据录入Tabs */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="historical">
              <TrendingUp className="size-4 mr-2" />
              历史数据
            </TabsTrigger>
            <TabsTrigger value="market">
              <Activity className="size-4 mr-2" />
              市场环境
            </TabsTrigger>
            <TabsTrigger value="resource">
              <Users className="size-4 mr-2" />
              团队资源
            </TabsTrigger>
            <TabsTrigger value="strategic">
              <Rocket className="size-4 mr-2" />
              战略规划
            </TabsTrigger>
          </TabsList>

          {/* 历史数据录入 */}
          <TabsContent value="historical" className="space-y-4 mt-4">
            <HistoricalDataForm data={data.historical} onSave={handleSaveHistorical} result={results.components.historical} />
          </TabsContent>

          {/* 市场环境录入 */}
          <TabsContent value="market" className="space-y-4 mt-4">
            <MarketDataForm data={data.market} onSave={handleSaveMarket} result={results.components.market} />
          </TabsContent>

          {/* 团队资源录入 */}
          <TabsContent value="resource" className="space-y-4 mt-4">
            <ResourceDataForm data={data.resource} onSave={handleSaveResource} result={results.components.execution} />
          </TabsContent>

          {/* 战略规划录入 */}
          <TabsContent value="strategic" className="space-y-4 mt-4">
            <StrategicDataForm data={data.strategic} onSave={handleSaveStrategic} result={results.components.strategic} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* 🔥 计算逻辑说明对话框 */}
      <CalculationLogicDialog 
        open={showCalculationLogic} 
        onClose={() => setShowCalculationLogic(false)}
      />
    </div>
  );
}

// 🔥 ==================== 子组件 ====================

// 历史数据表单
function HistoricalDataForm({ data, onSave, result }: any) {
  const [formData, setFormData] = useState(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-5 text-blue-600" />
          <h3 className="font-semibold">历史销售数据录入</h3>
        </div>
        <Badge className={`${result.score >= 90 ? 'bg-green-100 text-green-700' : result.score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          支撑度: {result.score}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>去年销售额（USD）</Label>
          <Input
            type="number"
            value={formData.lastYear}
            onChange={(e) => setFormData({ ...formData, lastYear: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 15980000"
          />
        </div>
        <div>
          <Label>两年前销售额（USD）</Label>
          <Input
            type="number"
            value={formData.twoYearsAgo}
            onChange={(e) => setFormData({ ...formData, twoYearsAgo: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 14200000"
          />
        </div>
        <div>
          <Label>三年前销售额（USD）</Label>
          <Input
            type="number"
            value={formData.threeYearsAgo}
            onChange={(e) => setFormData({ ...formData, threeYearsAgo: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 12800000"
          />
        </div>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="size-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-blue-900 mb-1">计算结果</p>
            <p className="text-sm text-blue-700">{result.detail}</p>
            <p className="text-xs text-blue-600 mt-1">
              年均增长率: {result.avgGrowth}% · 数据稳定性: {result.stability}
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={() => onSave(formData)} className="w-full">
        <Save className="size-4 mr-2" />
        保存历史数据
      </Button>
    </div>
  );
}

// 市场环境表单
function MarketDataForm({ data, onSave, result }: any) {
  const [formData, setFormData] = useState(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-green-600" />
          <h3 className="font-semibold">市场环境数据录入</h3>
        </div>
        <Badge className={`${result.score >= 90 ? 'bg-green-100 text-green-700' : result.score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          机会度: {result.score}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>市场总规模（USD）</Label>
          <Input
            type="number"
            value={formData.totalSize}
            onChange={(e) => setFormData({ ...formData, totalSize: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 218000000"
          />
        </div>
        <div>
          <Label>当前市场份额（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.ourShare}
            onChange={(e) => setFormData({ ...formData, ourShare: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 8.5"
          />
        </div>
        <div>
          <Label>目标市场份额（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.targetShare}
            onChange={(e) => setFormData({ ...formData, targetShare: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 9.2"
          />
        </div>
        <div>
          <Label>行业年增长率（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.industryGrowth}
            onChange={(e) => setFormData({ ...formData, industryGrowth: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 14.2"
          />
        </div>
        <div>
          <Label>竞争对手平均增长率（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.competitorAvgGrowth}
            onChange={(e) => setFormData({ ...formData, competitorAvgGrowth: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 12.3"
          />
        </div>
      </div>

      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-start gap-2">
          <Info className="size-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-green-900 mb-1">计算结果</p>
            <p className="text-sm text-green-700">{result.detail}</p>
            <p className="text-xs text-green-600 mt-1">
              市场增长空间: {result.growthSpace}% · 市场总规模: ${(result.marketSize / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={() => onSave(formData)} className="w-full">
        <Save className="size-4 mr-2" />
        保存市场数据
      </Button>
    </div>
  );
}

// 团队资源表单
function ResourceDataForm({ data, onSave, result }: any) {
  const [formData, setFormData] = useState(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-purple-600" />
          <h3 className="font-semibold">团队资源数据录入</h3>
        </div>
        <Badge className={`${result.score >= 90 ? 'bg-green-100 text-green-700' : result.score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          执行力: {result.score}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>销售团队人数</Label>
          <Input
            type="number"
            value={formData.salesTeam}
            onChange={(e) => setFormData({ ...formData, salesTeam: parseInt(e.target.value) || 0 })}
            placeholder="例如: 5"
          />
        </div>
        <div>
          <Label>人均年成单数</Label>
          <Input
            type="number"
            value={formData.avgDealsPerPerson}
            onChange={(e) => setFormData({ ...formData, avgDealsPerPerson: parseInt(e.target.value) || 0 })}
            placeholder="例如: 24"
          />
        </div>
        <div>
          <Label>平均订单金额（USD）</Label>
          <Input
            type="number"
            value={formData.avgDealSize}
            onChange={(e) => setFormData({ ...formData, avgDealSize: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 62000"
          />
        </div>
        <div>
          <Label>线索转化率（%）</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.conversionRate}
            onChange={(e) => setFormData({ ...formData, conversionRate: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 28"
          />
        </div>
        <div>
          <Label>当前销售周期（天）</Label>
          <Input
            type="number"
            value={formData.avgSalesCycle}
            onChange={(e) => setFormData({ ...formData, avgSalesCycle: parseInt(e.target.value) || 0 })}
            placeholder="例如: 18"
          />
        </div>
        <div>
          <Label>目标销售周期（天）</Label>
          <Input
            type="number"
            value={formData.targetSalesCycle}
            onChange={(e) => setFormData({ ...formData, targetSalesCycle: parseInt(e.target.value) || 0 })}
            placeholder="例如: 15"
          />
        </div>
      </div>

      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-2">
          <Info className="size-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-purple-900 mb-1">计算结果</p>
            <p className="text-sm text-purple-700">{result.detail}</p>
            <p className="text-xs text-purple-600 mt-1">
              团队年产能: ${(result.capacity / 1000000).toFixed(1)}M · 转化效率: {result.efficiency}%
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={() => onSave(formData)} className="w-full">
        <Save className="size-4 mr-2" />
        保存资源数据
      </Button>
    </div>
  );
}

// 战略规划表单
function StrategicDataForm({ data, onSave, result }: any) {
  const [formData, setFormData] = useState(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="size-5 text-orange-600" />
          <h3 className="font-semibold">战略举措数据录入</h3>
        </div>
        <Badge className={`${result.score >= 90 ? 'bg-green-100 text-green-700' : result.score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          增长性: {result.score}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>新产品线数量</Label>
          <Input
            type="number"
            value={formData.newProducts}
            onChange={(e) => setFormData({ ...formData, newProducts: parseInt(e.target.value) || 0 })}
            placeholder="例如: 3"
          />
        </div>
        <div>
          <Label>新产品预期收入（USD）</Label>
          <Input
            type="number"
            value={formData.newProductRevenue}
            onChange={(e) => setFormData({ ...formData, newProductRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 800000"
          />
        </div>
        <div>
          <Label>新区域市场数量</Label>
          <Input
            type="number"
            value={formData.newRegions}
            onChange={(e) => setFormData({ ...formData, newRegions: parseInt(e.target.value) || 0 })}
            placeholder="例如: 1"
          />
        </div>
        <div>
          <Label>新区域预期收入（USD）</Label>
          <Input
            type="number"
            value={formData.newRegionRevenue}
            onChange={(e) => setFormData({ ...formData, newRegionRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 600000"
          />
        </div>
        <div>
          <Label>重点大客户数量</Label>
          <Input
            type="number"
            value={formData.majorClients}
            onChange={(e) => setFormData({ ...formData, majorClients: parseInt(e.target.value) || 0 })}
            placeholder="例如: 8"
          />
        </div>
        <div>
          <Label>大客户平均年收入（USD）</Label>
          <Input
            type="number"
            value={formData.clientAvgRevenue}
            onChange={(e) => setFormData({ ...formData, clientAvgRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 250000"
          />
        </div>
        <div>
          <Label>战略合作伙伴数量</Label>
          <Input
            type="number"
            value={formData.partnerships}
            onChange={(e) => setFormData({ ...formData, partnerships: parseInt(e.target.value) || 0 })}
            placeholder="例如: 2"
          />
        </div>
        <div>
          <Label>合作预期收入（USD）</Label>
          <Input
            type="number"
            value={formData.partnershipRevenue}
            onChange={(e) => setFormData({ ...formData, partnershipRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="例如: 400000"
          />
        </div>
      </div>

      <Card className="p-4 bg-orange-50 border-orange-200">
        <div className="flex items-start gap-2">
          <Info className="size-5 text-orange-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-orange-900 mb-1">计算结果</p>
            <p className="text-sm text-orange-700">{result.detail}</p>
            <p className="text-xs text-orange-600 mt-1">
              战略增量: ${(result.totalRevenue / 1000000).toFixed(1)}M · 战略举措: {result.initiatives}个
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={() => onSave(formData)} className="w-full">
        <Save className="size-4 mr-2" />
        保存战略数据
      </Button>
    </div>
  );
}

// 计算逻辑说明对话框
function CalculationLogicDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-purple-600" />
            计算逻辑与算法说明
          </DialogTitle>
          <DialogDescription>
            了解系统如何科学计算各项评估指标
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 1. 历史数据支撑度 */}
          <Card className="p-4 border-2 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="size-5" />
              1. 历史数据支撑度（Historical Support Score）
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold mb-1">计算公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  支撑度 = 基础分70分 + 增长率加分(0-20分) + 稳定性加分(0-10分)
                </code>
              </div>
              <div>
                <p className="font-semibold">详细逻辑：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>计算年均增长率 = [(去年-两年前)/两年前 + (两年前-三年前)/三年前] / 2</li>
                  <li>计算变异系数CV，评估数据稳定性</li>
                  <li>增长率加分：{'>'}{`10% +20分，5-10% +15分，0-5% +10分`}</li>
                  <li>稳定性加分：CV{'<'}{`20% +10分，20-40% +5分`}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 2. 市场机会度 */}
          <Card className="p-4 border-2 border-green-200">
            <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Activity className="size-5" />
              2. 市场机会度（Market Opportunity Score）
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-green-50 p-3 rounded">
                <p className="font-semibold mb-1">计算公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  机会度 = 基础分60分 + 行业增长加分(0-15分) + 市场空间加分(0-15分) + 竞争优势加分(0-10分)
                </code>
              </div>
              <div>
                <p className="font-semibold">详细逻辑：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>计算市场增长空间 = (目标份额-当前份额)/当前份额 × 100%</li>
                  <li>行业增长：{'>'}{`12% +15分，8-12% +10分，4-8% +5分`}</li>
                  <li>市场空间：{'>'}{`15% +15分，10-15% +10分，5-10% +5分`}</li>
                  <li>竞争优势：我们目标增长{'>'}{`竞争对手 +10分`}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 3. 团队执行力 */}
          <Card className="p-4 border-2 border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Users className="size-5" />
              3. 团队执行力（Execution Capacity Score）
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-purple-50 p-3 rounded">
                <p className="font-semibold mb-1">计算公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  执行力 = 基础分65分 + 转化率加分(0-15分) + 人均产能加分(0-10分) + 流程效率加分(0-10分)
                </code>
              </div>
              <div>
                <p className="font-semibold">详细逻辑：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>计算年产能 = 团队人数 × 人均成单数 × 平均订单额</li>
                  <li>转化率：{'>'}{`30% +15分，25-30% +12分，20-25% +8分，15-20% +5分`}</li>
                  <li>人均产能：{'>'}{`25单 +10分，20-25单 +7分，15-20单 +4分`}</li>
                  <li>流程效率 = [1 - |当前周期-目标周期|/当前周期] × 10</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 4. 战略增长性 */}
          <Card className="p-4 border-2 border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
              <Rocket className="size-5" />
              4. 战略增长性（Strategic Growth Score）
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-orange-50 p-3 rounded">
                <p className="font-semibold mb-1">计算公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  增长性 = 基础分60分 + 新产品加分(0-15分) + 新区域加分(0-15分) + 大客户加分(0-15分) + 合作加分(0-5分)
                </code>
              </div>
              <div>
                <p className="font-semibold">详细逻辑：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>新产品：有产品+10分，单品贡献{'>'}{`$500K额外+5分`}</li>
                  <li>新区域：有区域+10分，预期收入{'>'}{`$500K额外+5分`}</li>
                  <li>大客户：{'>'}{`5个+10分，平均单价>$200K额外+5分`}</li>
                  <li>战略合作：有合作+5分</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 5. 综合可达成度 */}
          <Card className="p-4 border-2 border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Brain className="size-5" />
              5. 综合可达成度（Overall Achievability）
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-indigo-50 p-3 rounded">
                <p className="font-semibold mb-1">计算公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  综合可达成度 = 历史支撑×25% + 市场机会×25% + 团队执行×30% + 战略增长×20%
                </code>
              </div>
              <div>
                <p className="font-semibold">评估标准：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>≥85分：目标设定合理，可达成性高</li>
                  <li>70-84分：目标略有挑战，需强化执行</li>
                  <li>{'<'}{`70分：目标设定偏高，建议调整`}</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* 6. AI预测算法 */}
          <Card className="p-4 border-2 border-pink-200">
            <h3 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
              <Sparkles className="size-5" />
              6. AI销售预测算法
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-pink-50 p-3 rounded">
                <p className="font-semibold mb-1">预测公式：</p>
                <code className="text-xs bg-white px-2 py-1 rounded block">
                  预测值 = 基准值 × (1 + 增长率×月数/12) × 季节性因子
                </code>
              </div>
              <div>
                <p className="font-semibold">详细说明：</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>基础增长率 = (历史平均增长 + 市场增长空间) / 2</li>
                  <li>季节性因子：根据历史数据统计各月销售权重</li>
                  <li>置信区间：保守±5%（95%置信），正常±8%（90%置信），乐观±10%（85%置信）</li>
                  <li>预测类型：保守×0.95、正常×1.0、乐观×1.05</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>我了解了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
