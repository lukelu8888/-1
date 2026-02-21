import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Target, Star, TrendingUp, Clock, Shield, DollarSign, 
  Package, FileCheck, AlertTriangle, CheckCircle, XCircle,
  BarChart3, Award, TrendingDown, Zap, MessageSquare, CreditCard,
  Download, Settings, Plus, Trash2, ChevronRight, ChevronDown,
  HelpCircle, Info, Eye, EyeOff
} from 'lucide-react';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useUser } from '../../contexts/UserContext';

// ============================================
// 📊 数据类型定义
// ============================================

interface SupplierData {
  id: string;
  name: string;
  
  // 基础报价信息
  fobPrice: number;
  containerType: '20GP' | '40GP' | '40HQ';
  containerQty: number;
  costPerContainer: number;
  clearance: number;
  bankFees: number;
  
  // STEP 1: 能力评估指标（不含价格）
  // 1️⃣ 质量能力 (30分)
  qualityPassRate: number; // 质量合格率 0-100%
  defectRate: number; // 缺陷率 0-100%
  qualitySystem: 'ISO9001+' | 'ISO9001' | 'None'; // 质量体系
  
  // 2️⃣ 交付能力 (25分)
  onTimeDeliveryRate: number; // 准时交付率 0-100%
  leadTime: number; // 交货周期（天）
  capacityFlexibility: 'High' | 'Medium' | 'Low'; // 产能弹性
  
  // 3️⃣ 服务响应 (20分)
  responseTime: number; // 响应时间（小时）
  communicationQuality: number; // 沟通质量 1-5
  technicalSupport: 'Excellent' | 'Good' | 'Basic' | 'None'; // 技术支持
  
  // 4️⃣ 商务条款 (15分)
  paymentTerms: string; // 付款条款
  paymentDays: number; // 账期天数
  moq: number; // 最小起订量
  priceStability: 'Stable' | 'Moderate' | 'Volatile'; // 价格稳定性
  
  // 5️⃣ 风险控制 (10分)
  financialHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor'; // 财务健康
  geographicRisk: 'Low' | 'Medium' | 'High'; // 地理风险
  compliance: 'Full' | 'Partial' | 'None'; // 合规性
  
  // 历史表现
  pastPerformance: number; // 综合历史评分 0-100
}

interface CapabilityScore {
  // 分项得分
  qualityScore: number; // 质量能力得分 0-30
  deliveryScore: number; // 交付能力得分 0-25
  serviceScore: number; // 服务响应得分 0-20
  commercialScore: number; // 商务条款得分 0-15
  riskScore: number; // 风险控制得分 0-10
  
  // 总分
  totalScore: number; // 总得分 0-100
  grade: 'A' | 'B' | 'C' | 'D'; // 等级
  qualified: boolean; // 是否合格（>=60分）
}

interface TCOCalculation {
  fob: number;
  freight: number;
  dutyBase: number;
  dutyAmount: number;
  insurance: number;
  clearance: number;
  bankFees: number;
  
  // 隐性成本
  qualityInspectionCost: number;
  expectedDefectCost: number;
  inventoryHoldingCost: number;
  communicationCost: number;
  totalHiddenCost: number;
  
  // 总成本
  totalLanded: number;
  trueTotal: number;
  tcoRanking: number;
}

interface FinalDecision {
  capabilityScore: number;
  tco: number;
  weightedScore: number; // 加权后的最终得分
  quadrant: 'Best Value' | 'Premium' | 'Budget Risk' | 'Poor Value';
  recommendation: 'Highly Recommended' | 'Recommended' | 'Acceptable' | 'Not Recommended';
}

type CustomerType = 'price-sensitive' | 'quality-first' | 'balanced';

interface WeightConfig {
  capability: number; // 能力得分权重
  price: number; // 价格（TCO）权重
}

// ============================================
// 🎯 主组件
// ============================================

export function SupplierEvaluationSystem() {
  const { quotations: allQuotations, getQuotationsByCustomer } = useSalesQuotations();
  const { user } = useUser();
  
  // 状态管理
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [quantity, setQuantity] = useState<number>(1000);
  
  // 全局费率
  const [importDutyRate, setImportDutyRate] = useState<number>(7.5);
  const [insuranceRate, setInsuranceRate] = useState<number>(2);
  const [vatRate, setVatRate] = useState<number>(0);
  
  // 客户类型选择
  const [customerType, setCustomerType] = useState<CustomerType>('balanced');
  
  // 显示控制
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quality', 'delivery', 'service', 'commercial', 'risk']));

  // 获取报价列表
  const quotations = user?.email 
    ? getQuotationsByCustomer(user.email).filter(q => 
        q.customerStatus === 'sent' || q.customerStatus === 'viewed' || 
        q.customerStatus === 'accepted' || q.customerStatus === 'rejected' ||
        q.customerStatus === 'negotiating' || q.customerStatus === 'expired'
      )
    : [];

  // ============================================
  // 🔧 工具函数
  // ============================================

  // 加载报价
  const handleLoadQuote = (quoteId: string) => {
    const quote = quotations.find(q => q.id === quoteId);
    if (!quote) return;

    setSelectedQuoteId(quoteId);
    const totalQty = quote.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 1000;
    setQuantity(totalQty);

    const regionRates: Record<string, { duty: number; vat: number }> = {
      'NA': { duty: 7.5, vat: 0 },
      'SA': { duty: 12, vat: 18 },
      'EU': { duty: 10, vat: 20 },
      'AF': { duty: 10, vat: 15 }
    };
    
    const quoteRegion = (quote.region || 'NA').toUpperCase();
    const rates = regionRates[quoteRegion] || regionRates['NA'];

    setImportDutyRate(rates.duty);
    setVatRate(rates.vat);
    setInsuranceRate(2);

    // 创建基准供应商（福建高盛达富）
    const baseSupplier: SupplierData = {
      id: quote.id,
      name: 'Fujian Gaoshengdafu (Current)',
      fobPrice: quote.totalPrice || 0,
      containerType: '40HQ',
      containerQty: 1,
      costPerContainer: 850,
      clearance: 200,
      bankFees: 50,
      
      // 质量能力
      qualityPassRate: 98,
      defectRate: 2,
      qualitySystem: 'ISO9001+',
      
      // 交付能力
      onTimeDeliveryRate: 95,
      leadTime: 30,
      capacityFlexibility: 'High',
      
      // 服务响应
      responseTime: 4,
      communicationQuality: 4.5,
      technicalSupport: 'Excellent',
      
      // 商务条款
      paymentTerms: '30% Deposit, 70% Before Shipment',
      paymentDays: 30,
      moq: 500,
      priceStability: 'Stable',
      
      // 风险控制
      financialHealth: 'Good',
      geographicRisk: 'Low',
      compliance: 'Full',
      
      pastPerformance: 88
    };

    setSuppliers([baseSupplier]);
  };

  // 添加竞争供应商
  const addCompetitor = () => {
    if (suppliers.length === 0) return;
    
    const baseSupplier = suppliers[0];
    const newSupplier: SupplierData = {
      id: `comp-${Date.now()}`,
      name: `Supplier ${String.fromCharCode(65 + suppliers.length - 1)}`,
      fobPrice: 0,
      containerType: baseSupplier.containerType,
      containerQty: baseSupplier.containerQty,
      costPerContainer: baseSupplier.costPerContainer,
      clearance: baseSupplier.clearance,
      bankFees: baseSupplier.bankFees,
      
      // 默认中等水平
      qualityPassRate: 92,
      defectRate: 8,
      qualitySystem: 'ISO9001',
      
      onTimeDeliveryRate: 85,
      leadTime: 45,
      capacityFlexibility: 'Medium',
      
      responseTime: 12,
      communicationQuality: 3.5,
      technicalSupport: 'Good',
      
      paymentTerms: '30% Deposit, 70% Before Shipment',
      paymentDays: 30,
      moq: 1000,
      priceStability: 'Moderate',
      
      financialHealth: 'Fair',
      geographicRisk: 'Medium',
      compliance: 'Partial',
      
      pastPerformance: 72
    };

    setSuppliers([...suppliers, newSupplier]);
  };

  const removeSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const updateSupplier = (id: string, field: keyof SupplierData, value: any) => {
    setSuppliers(suppliers.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // ============================================
  // 📊 STEP 1: 计算能力得分
  // ============================================

  const calculateCapabilityScore = (supplier: SupplierData): CapabilityScore => {
    // 1️⃣ 质量能力 (30分)
    let qualityScore = 0;
    
    // 质量合格率 (15分)
    if (supplier.qualityPassRate >= 98) qualityScore += 15;
    else if (supplier.qualityPassRate >= 95) qualityScore += 12;
    else if (supplier.qualityPassRate >= 90) qualityScore += 8;
    else qualityScore += 0;
    
    // 缺陷率 (10分)
    if (supplier.defectRate <= 2) qualityScore += 10;
    else if (supplier.defectRate <= 5) qualityScore += 6;
    else if (supplier.defectRate <= 10) qualityScore += 3;
    else qualityScore += 0;
    
    // 质量体系 (5分)
    if (supplier.qualitySystem === 'ISO9001+') qualityScore += 5;
    else if (supplier.qualitySystem === 'ISO9001') qualityScore += 3;
    else qualityScore += 0;
    
    // 2️⃣ 交付能力 (25分)
    let deliveryScore = 0;
    
    // 准时交付率 (15分)
    if (supplier.onTimeDeliveryRate >= 95) deliveryScore += 15;
    else if (supplier.onTimeDeliveryRate >= 90) deliveryScore += 10;
    else if (supplier.onTimeDeliveryRate >= 85) deliveryScore += 5;
    else deliveryScore += 0;
    
    // 交货周期 (6分)
    if (supplier.leadTime <= 30) deliveryScore += 6;
    else if (supplier.leadTime <= 45) deliveryScore += 4;
    else deliveryScore += 2;
    
    // 产能弹性 (4分)
    if (supplier.capacityFlexibility === 'High') deliveryScore += 4;
    else if (supplier.capacityFlexibility === 'Medium') deliveryScore += 2;
    else deliveryScore += 0;
    
    // 3️⃣ 服务响应 (20分)
    let serviceScore = 0;
    
    // 响应速度 (8分)
    if (supplier.responseTime <= 4) serviceScore += 8;
    else if (supplier.responseTime <= 12) serviceScore += 5;
    else if (supplier.responseTime <= 24) serviceScore += 2;
    else serviceScore += 0;
    
    // 沟通质量 (7分)
    serviceScore += (supplier.communicationQuality / 5) * 7;
    
    // 技术支持 (5分)
    if (supplier.technicalSupport === 'Excellent') serviceScore += 5;
    else if (supplier.technicalSupport === 'Good') serviceScore += 3;
    else if (supplier.technicalSupport === 'Basic') serviceScore += 1;
    else serviceScore += 0;
    
    // 4️⃣ 商务条款 (15分)
    let commercialScore = 0;
    
    // 付款条款 (10分)
    if (supplier.paymentDays >= 60) commercialScore += 10;
    else if (supplier.paymentDays >= 30) commercialScore += 7;
    else commercialScore += 3;
    
    // MOQ灵活性 (3分)
    if (supplier.moq <= 500) commercialScore += 3;
    else if (supplier.moq <= 1000) commercialScore += 2;
    else commercialScore += 0;
    
    // 价格稳定性 (2分)
    if (supplier.priceStability === 'Stable') commercialScore += 2;
    else if (supplier.priceStability === 'Moderate') commercialScore += 1;
    else commercialScore += 0;
    
    // 5️⃣ 风险控制 (10分)
    let riskScore = 0;
    
    // 财务健康 (5分)
    if (supplier.financialHealth === 'Excellent') riskScore += 5;
    else if (supplier.financialHealth === 'Good') riskScore += 4;
    else if (supplier.financialHealth === 'Fair') riskScore += 2;
    else riskScore += 0;
    
    // 地理风险 (3分)
    if (supplier.geographicRisk === 'Low') riskScore += 3;
    else if (supplier.geographicRisk === 'Medium') riskScore += 2;
    else riskScore += 0;
    
    // 合规性 (2分)
    if (supplier.compliance === 'Full') riskScore += 2;
    else if (supplier.compliance === 'Partial') riskScore += 1;
    else riskScore += 0;
    
    // 计算总分
    const totalScore = qualityScore + deliveryScore + serviceScore + commercialScore + riskScore;
    
    // 评级
    let grade: 'A' | 'B' | 'C' | 'D';
    if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 60) grade = 'C';
    else grade = 'D';
    
    return {
      qualityScore,
      deliveryScore,
      serviceScore,
      commercialScore,
      riskScore,
      totalScore,
      grade,
      qualified: totalScore >= 60
    };
  };

  // ============================================
  // 💰 STEP 2: 计算TCO
  // ============================================

  const calculateTCO = (supplier: SupplierData, capScore: CapabilityScore): TCOCalculation => {
    const unitFOB = supplier.fobPrice / quantity;
    const totalFreight = supplier.costPerContainer * supplier.containerQty;
    const unitFreight = totalFreight / quantity;
    
    const dutyBase = supplier.fobPrice + totalFreight;
    const dutyAmount = dutyBase * (importDutyRate / 100);
    const insurance = supplier.fobPrice * (insuranceRate / 100);
    
    const totalLanded = supplier.fobPrice + totalFreight + dutyAmount + insurance + supplier.clearance + supplier.bankFees;
    
    // 隐性成本计算
    // 质检成本：质量越差，质检成本越高
    const qualityInspectionCost = supplier.qualityPassRate < 95 
      ? supplier.fobPrice * 0.02 
      : supplier.fobPrice * 0.005;
    
    // 预期不良品成本
    const expectedDefectCost = supplier.fobPrice * (supplier.defectRate / 100) * 1.5;
    
    // 库存持有成本：交货期越长，成本越高
    const inventoryHoldingCost = supplier.leadTime > 45 
      ? supplier.fobPrice * 0.01 
      : 0;
    
    // 沟通成本：响应时间越长，沟通成本越高
    const communicationCost = supplier.responseTime > 12 
      ? supplier.fobPrice * 0.005 
      : 0;
    
    const totalHiddenCost = qualityInspectionCost + expectedDefectCost + inventoryHoldingCost + communicationCost;
    const trueTotal = totalLanded + totalHiddenCost;
    
    return {
      fob: supplier.fobPrice,
      freight: totalFreight,
      dutyBase,
      dutyAmount,
      insurance,
      clearance: supplier.clearance,
      bankFees: supplier.bankFees,
      qualityInspectionCost,
      expectedDefectCost,
      inventoryHoldingCost,
      communicationCost,
      totalHiddenCost,
      totalLanded,
      trueTotal,
      tcoRanking: 0 // 稍后计算排名
    };
  };

  // ============================================
  // 🎯 STEP 3: 最终决策
  // ============================================

  const getWeightConfig = (type: CustomerType): WeightConfig => {
    switch (type) {
      case 'price-sensitive':
        return { capability: 30, price: 70 }; // 价格敏感：价格权重70%
      case 'quality-first':
        return { capability: 60, price: 40 }; // 质量优先：能力权重60%
      case 'balanced':
      default:
        return { capability: 50, price: 50 }; // 平衡型：各50%
    }
  };

  const calculateFinalDecision = (
    capScore: CapabilityScore, 
    tco: TCOCalculation,
    tcoRanking: number,
    maxTCO: number,
    minTCO: number
  ): FinalDecision => {
    const weights = getWeightConfig(customerType);
    
    // 能力得分归一化到0-100
    const normalizedCapability = capScore.totalScore;
    
    // TCO得分归一化（成本越低，得分越高）
    const tcoRange = maxTCO - minTCO;
    const normalizedPrice = tcoRange > 0 
      ? ((maxTCO - tco.trueTotal) / tcoRange) * 100 
      : 50;
    
    // 加权得分
    const weightedScore = 
      (normalizedCapability * weights.capability / 100) + 
      (normalizedPrice * weights.price / 100);
    
    // 象限判断
    let quadrant: FinalDecision['quadrant'];
    const isHighCapability = normalizedCapability >= 70;
    const isLowPrice = normalizedPrice >= 50;
    
    if (isHighCapability && isLowPrice) quadrant = 'Best Value';
    else if (isHighCapability && !isLowPrice) quadrant = 'Premium';
    else if (!isHighCapability && isLowPrice) quadrant = 'Budget Risk';
    else quadrant = 'Poor Value';
    
    // 推荐等级
    let recommendation: FinalDecision['recommendation'];
    if (weightedScore >= 80 && capScore.qualified) recommendation = 'Highly Recommended';
    else if (weightedScore >= 65 && capScore.qualified) recommendation = 'Recommended';
    else if (weightedScore >= 50 && capScore.qualified) recommendation = 'Acceptable';
    else recommendation = 'Not Recommended';
    
    return {
      capabilityScore: normalizedCapability,
      tco: tco.trueTotal,
      weightedScore,
      quadrant,
      recommendation
    };
  };

  // ============================================
  // 📈 计算所有供应商
  // ============================================

  const calculations = suppliers.map(supplier => {
    const capScore = calculateCapabilityScore(supplier);
    const tco = calculateTCO(supplier, capScore);
    return { supplier, capScore, tco };
  });

  // 计算TCO排名
  const qualifiedCalculations = calculations.filter(c => c.capScore.qualified);
  const sortedByTCO = [...qualifiedCalculations].sort((a, b) => a.tco.trueTotal - b.tco.trueTotal);
  sortedByTCO.forEach((calc, index) => {
    calc.tco.tcoRanking = index + 1;
  });

  // 计算最终决策
  const maxTCO = Math.max(...qualifiedCalculations.map(c => c.tco.trueTotal), 0);
  const minTCO = Math.min(...qualifiedCalculations.map(c => c.tco.trueTotal), maxTCO);

  const finalDecisions = calculations.map(({ supplier, capScore, tco }) => {
    const tcoRanking = sortedByTCO.findIndex(c => c.supplier.id === supplier.id) + 1;
    const decision = calculateFinalDecision(capScore, tco, tcoRanking, maxTCO, minTCO);
    return { supplier, capScore, tco, decision };
  });

  // ============================================
  // 🎨 渲染函数
  // ============================================

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getGradeColor = (grade: 'A' | 'B' | 'C' | 'D') => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D': return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('Highly')) return 'bg-green-600 text-white';
    if (rec.includes('Recommended')) return 'bg-blue-500 text-white';
    if (rec.includes('Acceptable')) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // ============================================
  // 🖥️ UI 渲染
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* ========== 页头 ========== */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-[#F96302]">
          <div className="px-6 py-4 bg-gradient-to-r from-[#F96302] to-orange-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Target className="w-6 h-6 text-[#F96302]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Professional Supplier Evaluation System
                  </h1>
                  <p className="text-sm text-orange-100 mt-0.5">
                    3-Step Decision Framework: Capability → TCO → Final Decision
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowHelp(!showHelp)}
                variant="outline"
                size="sm"
                className="bg-white border-2 border-white hover:bg-orange-50"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {showHelp ? 'Hide' : 'Show'} Help
              </Button>
            </div>
          </div>

          {/* 帮助说明 */}
          {showHelp && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-blue-900 mb-2">📋 STEP 1: Capability Scorecard</h4>
                  <p className="text-blue-700">
                    Pure capability assessment (excluding price). Evaluates quality, delivery, service, commercial terms, and risk.
                    <span className="block font-bold mt-1">✅ Pass: ≥60 points | ❌ Fail: &lt;60 points</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-green-900 mb-2">💰 STEP 2: TCO Analysis</h4>
                  <p className="text-green-700">
                    Total Cost of Ownership calculation. Only qualified suppliers (≥60 pts) enter this stage.
                    <span className="block font-bold mt-1">Includes: FOB + Freight + Hidden Costs</span>
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-purple-900 mb-2">🎯 STEP 3: Final Decision</h4>
                  <p className="text-purple-700">
                    Weighted combination of capability and TCO. Choose your customer type to adjust weights.
                    <span className="block font-bold mt-1">🏆 Best Value = High Capability + Low Cost</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========== 报价选择 ========== */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select Quotation to Analyze
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => handleLoadQuote(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F96302] outline-none"
                >
                  <option value="">-- Select a Quotation --</option>
                  {quotations.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.quoteNumber} - {q.customerCompany} - ${q.totalPrice?.toLocaleString()} - {q.region?.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Total Quantity
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1000)}
                  className="border-2 focus:border-[#F96302]"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Customer Type (Affects Step 3 Weights)
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-[#F96302] outline-none"
                >
                  <option value="price-sensitive">💰 Price-Sensitive (Price 70% + Capability 30%)</option>
                  <option value="quality-first">⭐ Quality-First (Capability 60% + Price 40%)</option>
                  <option value="balanced">⚖️ Balanced (50% / 50%)</option>
                </select>
              </div>

              <div className="col-span-2">
                <Button
                  onClick={addCompetitor}
                  disabled={suppliers.length === 0}
                  className="w-full bg-[#F96302] hover:bg-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competitor
                </Button>
              </div>
            </div>

            {/* 费率设置 */}
            {suppliers.length > 0 && (
              <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Import Duty Rate (%)</label>
                  <Input
                    type="number"
                    value={importDutyRate}
                    onChange={(e) => setImportDutyRate(parseFloat(e.target.value) || 0)}
                    className="text-xs border-2 focus:border-[#F96302]"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Insurance Rate (%)</label>
                  <Input
                    type="number"
                    value={insuranceRate}
                    onChange={(e) => setInsuranceRate(parseFloat(e.target.value) || 0)}
                    className="text-xs border-2 focus:border-[#F96302]"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">VAT Rate (%)</label>
                  <Input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="text-xs border-2 focus:border-[#F96302]"
                    step="0.1"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-gray-600">
                    <div className="font-bold">Current Region Settings:</div>
                    <div>Duty: {importDutyRate}% | VAT: {vatRate}%</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========== 步骤导航 ========== */}
        {suppliers.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, icon: FileCheck, title: 'Capability Scorecard', color: 'blue' },
              { step: 2, icon: DollarSign, title: 'TCO Analysis', color: 'green' },
              { step: 3, icon: Award, title: 'Final Decision', color: 'purple' }
            ].map(({ step, icon: Icon, title, color }, index) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => setCurrentStep(step as 1 | 2 | 3)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 transition-all ${
                    currentStep === step
                      ? `bg-${color}-500 border-${color}-600 text-white shadow-lg scale-105`
                      : `bg-white border-gray-300 text-gray-700 hover:border-${color}-400`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs font-bold">STEP {step}</div>
                    <div className="text-sm">{title}</div>
                  </div>
                </button>
                {index < 2 && (
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ========== STEP 1: 能力评分卡 ========== */}
        {suppliers.length > 0 && currentStep === 1 && (
          <Card className="shadow-xl border-2 border-blue-500">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex items-center gap-3 text-white">
                <FileCheck className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">STEP 1: Supplier Capability Scorecard</h2>
                  <p className="text-sm text-blue-100">Pure capability assessment (price excluded). Pass threshold: ≥60 points</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left font-bold border-r border-gray-600 w-64 sticky left-0 z-10 bg-gray-800">
                        Evaluation Factor
                      </th>
                      {calculations.map(({ supplier, capScore }) => (
                        <th key={supplier.id} className="px-4 py-3 text-center font-bold border-r border-gray-600 min-w-[200px]">
                          <div className="mb-2">
                            <span className={`px-3 py-1 rounded text-xs font-bold border-2 ${getGradeColor(capScore.grade)}`}>
                              Grade {capScore.grade}
                            </span>
                          </div>
                          <div className="font-bold">{supplier.name}</div>
                          <div className="text-xs text-gray-300 mt-1">
                            Total: {capScore.totalScore.toFixed(1)}/100
                          </div>
                          {!supplier.name.includes('Current') && (
                            <button
                              onClick={() => removeSupplier(supplier.id)}
                              className="mt-2 text-xs text-red-300 hover:text-red-100"
                            >
                              <Trash2 className="w-3 h-3 inline mr-1" />
                              Remove
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 质量能力 */}
                    <tr className="bg-blue-50">
                      <td colSpan={suppliers.length + 1} className="px-4 py-2">
                        <button
                          onClick={() => toggleSection('quality')}
                          className="flex items-center gap-2 font-bold text-blue-900 hover:text-blue-700 w-full"
                        >
                          {expandedSections.has('quality') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          🔵 Quality Capability (30 points) - Weight: {calculations[0]?.capScore.qualityScore.toFixed(1)}/30
                        </button>
                      </td>
                    </tr>
                    
                    {expandedSections.has('quality') && (
                      <>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Quality Pass Rate (15 pts)
                            <div className="text-xs text-gray-500">≥98%=15 | 95-98%=12 | 90-95%=8</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.qualityPassRate}
                                onChange={(e) => updateSupplier(supplier.id, 'qualityPassRate', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className="ml-2 text-xs font-bold">%</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Defect Rate (10 pts)
                            <div className="text-xs text-gray-500">≤2%=10 | 2-5%=6 | 5-10%=3</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.defectRate}
                                onChange={(e) => updateSupplier(supplier.id, 'defectRate', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className="ml-2 text-xs font-bold">%</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Quality System (5 pts)
                            <div className="text-xs text-gray-500">ISO9001+=5 | ISO9001=3 | None=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.qualitySystem}
                                onChange={(e) => updateSupplier(supplier.id, 'qualitySystem', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="ISO9001+">ISO9001+</option>
                                <option value="ISO9001">ISO9001</option>
                                <option value="None">None</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* 交付能力 */}
                    <tr className="bg-green-50">
                      <td colSpan={suppliers.length + 1} className="px-4 py-2">
                        <button
                          onClick={() => toggleSection('delivery')}
                          className="flex items-center gap-2 font-bold text-green-900 hover:text-green-700 w-full"
                        >
                          {expandedSections.has('delivery') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          🟢 Delivery Capability (25 points) - Weight: {calculations[0]?.capScore.deliveryScore.toFixed(1)}/25
                        </button>
                      </td>
                    </tr>

                    {expandedSections.has('delivery') && (
                      <>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            On-Time Delivery Rate (15 pts)
                            <div className="text-xs text-gray-500">≥95%=15 | 90-95%=10 | 85-90%=5</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.onTimeDeliveryRate}
                                onChange={(e) => updateSupplier(supplier.id, 'onTimeDeliveryRate', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                                min="0"
                                max="100"
                              />
                              <span className="ml-2 text-xs font-bold">%</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Lead Time (6 pts)
                            <div className="text-xs text-gray-500">≤30 days=6 | ≤45 days=4 | &gt;45=2</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.leadTime}
                                onChange={(e) => updateSupplier(supplier.id, 'leadTime', parseInt(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                              />
                              <span className="ml-2 text-xs font-bold">days</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Capacity Flexibility (4 pts)
                            <div className="text-xs text-gray-500">High=4 | Medium=2 | Low=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.capacityFlexibility}
                                onChange={(e) => updateSupplier(supplier.id, 'capacityFlexibility', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="High">High</option>
                                <option value="Medium">Medium</option>
                                <option value="Low">Low</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* 服务响应 */}
                    <tr className="bg-purple-50">
                      <td colSpan={suppliers.length + 1} className="px-4 py-2">
                        <button
                          onClick={() => toggleSection('service')}
                          className="flex items-center gap-2 font-bold text-purple-900 hover:text-purple-700 w-full"
                        >
                          {expandedSections.has('service') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          🟣 Service & Response (20 points) - Weight: {calculations[0]?.capScore.serviceScore.toFixed(1)}/20
                        </button>
                      </td>
                    </tr>

                    {expandedSections.has('service') && (
                      <>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Response Time (8 pts)
                            <div className="text-xs text-gray-500">≤4h=8 | ≤12h=5 | ≤24h=2</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.responseTime}
                                onChange={(e) => updateSupplier(supplier.id, 'responseTime', parseFloat(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                                step="0.5"
                              />
                              <span className="ml-2 text-xs font-bold">hours</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Communication Quality (7 pts)
                            <div className="text-xs text-gray-500">1-5 stars × 1.4</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {renderStars(supplier.communicationQuality)}
                                <Input
                                  type="number"
                                  value={supplier.communicationQuality}
                                  onChange={(e) => updateSupplier(supplier.id, 'communicationQuality', Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                                  className="w-16 text-center border-2 focus:border-[#F96302]"
                                  step="0.5"
                                  min="0"
                                  max="5"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Technical Support (5 pts)
                            <div className="text-xs text-gray-500">Excellent=5 | Good=3 | Basic=1</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.technicalSupport}
                                onChange={(e) => updateSupplier(supplier.id, 'technicalSupport', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Basic">Basic</option>
                                <option value="None">None</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* 商务条款 */}
                    <tr className="bg-yellow-50">
                      <td colSpan={suppliers.length + 1} className="px-4 py-2">
                        <button
                          onClick={() => toggleSection('commercial')}
                          className="flex items-center gap-2 font-bold text-yellow-900 hover:text-yellow-700 w-full"
                        >
                          {expandedSections.has('commercial') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          🟡 Commercial Terms (15 points) - Weight: {calculations[0]?.capScore.commercialScore.toFixed(1)}/15
                        </button>
                      </td>
                    </tr>

                    {expandedSections.has('commercial') && (
                      <>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Payment Terms (10 pts)
                            <div className="text-xs text-gray-500">60days=10 | 30days=7 | Prepay=3</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.paymentDays}
                                onChange={(e) => updateSupplier(supplier.id, 'paymentDays', parseInt(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                              />
                              <span className="ml-2 text-xs font-bold">days</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            MOQ Flexibility (3 pts)
                            <div className="text-xs text-gray-500">≤500=3 | ≤1000=2 | &gt;1000=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <Input
                                type="number"
                                value={supplier.moq}
                                onChange={(e) => updateSupplier(supplier.id, 'moq', parseInt(e.target.value) || 0)}
                                className="w-20 text-center border-2 focus:border-[#F96302]"
                              />
                              <span className="ml-2 text-xs font-bold">pcs</span>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Price Stability (2 pts)
                            <div className="text-xs text-gray-500">Stable=2 | Moderate=1 | Volatile=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.priceStability}
                                onChange={(e) => updateSupplier(supplier.id, 'priceStability', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="Stable">Stable</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Volatile">Volatile</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* 风险控制 */}
                    <tr className="bg-red-50">
                      <td colSpan={suppliers.length + 1} className="px-4 py-2">
                        <button
                          onClick={() => toggleSection('risk')}
                          className="flex items-center gap-2 font-bold text-red-900 hover:text-red-700 w-full"
                        >
                          {expandedSections.has('risk') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          🔴 Risk Control (10 points) - Weight: {calculations[0]?.capScore.riskScore.toFixed(1)}/10
                        </button>
                      </td>
                    </tr>

                    {expandedSections.has('risk') && (
                      <>
                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Financial Health (5 pts)
                            <div className="text-xs text-gray-500">Excellent=5 | Good=4 | Fair=2</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.financialHealth}
                                onChange={(e) => updateSupplier(supplier.id, 'financialHealth', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                              </select>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Geographic Risk (3 pts)
                            <div className="text-xs text-gray-500">Low=3 | Medium=2 | High=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.geographicRisk}
                                onChange={(e) => updateSupplier(supplier.id, 'geographicRisk', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </td>
                          ))}
                        </tr>

                        <tr className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                            Compliance (2 pts)
                            <div className="text-xs text-gray-500">Full=2 | Partial=1 | None=0</div>
                          </td>
                          {calculations.map(({ supplier }) => (
                            <td key={supplier.id} className="px-4 py-2 border-r border-gray-200 text-center">
                              <select
                                value={supplier.compliance}
                                onChange={(e) => updateSupplier(supplier.id, 'compliance', e.target.value)}
                                className="px-2 py-1 border-2 border-gray-300 rounded focus:border-[#F96302] outline-none text-xs"
                              >
                                <option value="Full">Full</option>
                                <option value="Partial">Partial</option>
                                <option value="None">None</option>
                              </select>
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* 总分汇总 */}
                    <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold">
                      <td className="px-4 py-3 border-r border-gray-600 sticky left-0 z-10 bg-gray-800">
                        TOTAL CAPABILITY SCORE
                      </td>
                      {calculations.map(({ supplier, capScore }) => (
                        <td key={supplier.id} className="px-4 py-3 text-center border-r border-gray-600">
                          <div className="text-2xl font-bold">{capScore.totalScore.toFixed(1)}</div>
                          <div className="text-xs mt-1">
                            {capScore.qualified ? (
                              <span className="text-green-300">✅ QUALIFIED</span>
                            ) : (
                              <span className="text-red-300">❌ NOT QUALIFIED</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 合格性警告 */}
              <div className="mt-6 space-y-2">
                {calculations.filter(c => !c.capScore.qualified).map(({ supplier, capScore }) => (
                  <div key={supplier.id} className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                    <div className="flex items-center gap-3 text-red-800">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <div className="font-bold">{supplier.name} - NOT QUALIFIED</div>
                        <div className="text-sm">
                          Score: {capScore.totalScore.toFixed(1)}/100 (Below 60 threshold) - Will be excluded from TCO analysis
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 下一步按钮 */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={qualifiedCalculations.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                >
                  Next: TCO Analysis
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== STEP 2: TCO分析 ========== */}
        {suppliers.length > 0 && currentStep === 2 && (
          <Card className="shadow-xl border-2 border-green-500">
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600">
              <div className="flex items-center gap-3 text-white">
                <DollarSign className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">STEP 2: Total Cost of Ownership (TCO) Analysis</h2>
                  <p className="text-sm text-green-100">
                    Only qualified suppliers (≥60 points) are included. Showing {qualifiedCalculations.length} of {suppliers.length} suppliers.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {qualifiedCalculations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p className="font-bold text-lg">No Qualified Suppliers</p>
                  <p className="text-sm mt-2">All suppliers scored below 60 points. Please review capability scores in Step 1.</p>
                </div>
              ) : (
                <>
                  {/* FOB价格输入 */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-3">💰 Enter FOB Prices for Qualified Suppliers</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {qualifiedCalculations.map(({ supplier }) => (
                        <div key={supplier.id}>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            {supplier.name}
                          </label>
                          <Input
                            type="number"
                            value={supplier.fobPrice}
                            onChange={(e) => updateSupplier(supplier.id, 'fobPrice', parseFloat(e.target.value) || 0)}
                            className="border-2 focus:border-[#F96302]"
                            placeholder="FOB Price"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TCO对比表 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-800 text-white">
                          <th className="px-4 py-3 text-left font-bold border-r border-gray-600 w-64 sticky left-0 z-10 bg-gray-800">
                            Cost Component
                          </th>
                          {sortedByTCO.map(({ supplier, tco }) => (
                            <th key={supplier.id} className="px-4 py-3 text-center font-bold border-r border-gray-600 min-w-[180px]">
                              <div className="mb-2">
                                <span className={`px-3 py-1 rounded text-xs font-bold ${
                                  tco.tcoRanking === 1 ? 'bg-green-500 text-white' :
                                  tco.tcoRanking === 2 ? 'bg-blue-500 text-white' :
                                  'bg-gray-500 text-white'
                                }`}>
                                  {tco.tcoRanking === 1 ? '🥇 LOWEST TCO' :
                                   tco.tcoRanking === 2 ? '🥈 2nd Place' :
                                   `#${tco.tcoRanking}`}
                                </span>
                              </div>
                              <div>{supplier.name}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* 直接成本 */}
                        <tr className="bg-blue-50 font-bold">
                          <td colSpan={qualifiedCalculations.length + 1} className="px-4 py-2 text-blue-900">
                            💵 Direct Costs
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">FOB Price</td>
                          {sortedByTCO.map(({ supplier, tco }) => (
                            <td key={supplier.id} className="px-4 py-2 text-center border-r font-bold">
                              ${tco.fob.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Ocean Freight</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.freight} className="px-4 py-2 text-center border-r">
                              ${tco.freight.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Customs Duty ({importDutyRate}%)</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.dutyAmount} className="px-4 py-2 text-center border-r">
                              ${tco.dutyAmount.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Insurance ({insuranceRate}%)</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.insurance} className="px-4 py-2 text-center border-r">
                              ${tco.insurance.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Clearance + Bank Fees</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.clearance} className="px-4 py-2 text-center border-r">
                              ${(tco.clearance + tco.bankFees).toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-blue-100 font-bold border-b">
                          <td className="px-4 py-2 text-blue-900 border-r sticky left-0 bg-blue-100 z-10">Subtotal (Landed Cost)</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.totalLanded} className="px-4 py-2 text-center border-r text-blue-900">
                              ${tco.totalLanded.toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* 隐性成本 */}
                        <tr className="bg-orange-50 font-bold">
                          <td colSpan={qualifiedCalculations.length + 1} className="px-4 py-2 text-orange-900">
                            ⚠️ Hidden Costs (Risk-Adjusted)
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Quality Inspection Cost</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.qualityInspectionCost} className="px-4 py-2 text-center border-r text-orange-600">
                              ${tco.qualityInspectionCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Expected Defect Cost</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.expectedDefectCost} className="px-4 py-2 text-center border-r text-orange-600">
                              ${tco.expectedDefectCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Inventory Holding Cost</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.inventoryHoldingCost} className="px-4 py-2 text-center border-r text-orange-600">
                              ${tco.inventoryHoldingCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700 border-r sticky left-0 bg-white z-10">Communication Cost</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.communicationCost} className="px-4 py-2 text-center border-r text-orange-600">
                              ${tco.communicationCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>
                        <tr className="bg-orange-100 font-bold border-b">
                          <td className="px-4 py-2 text-orange-900 border-r sticky left-0 bg-orange-100 z-10">Total Hidden Costs</td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.totalHiddenCost} className="px-4 py-2 text-center border-r text-orange-900">
                              ${tco.totalHiddenCost.toLocaleString()}
                            </td>
                          ))}
                        </tr>

                        {/* 真实总成本 */}
                        <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold">
                          <td className="px-4 py-4 border-r sticky left-0 z-10 bg-purple-700">
                            🎯 TRUE TOTAL COST (TCO)
                          </td>
                          {sortedByTCO.map(({ tco }) => (
                            <td key={tco.trueTotal} className="px-4 py-4 text-center border-r">
                              <div className="text-2xl">${tco.trueTotal.toLocaleString()}</div>
                              {tco.tcoRanking === 1 && (
                                <div className="text-xs mt-1 text-green-200">BEST VALUE</div>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 导航按钮 */}
                  <div className="mt-6 flex justify-between">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="outline"
                      className="border-2"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      Back: Capability Score
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                    >
                      Next: Final Decision
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== STEP 3: 最终决策 ========== */}
        {suppliers.length > 0 && currentStep === 3 && (
          <Card className="shadow-xl border-2 border-purple-500">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600">
              <div className="flex items-center gap-3 text-white">
                <Award className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">STEP 3: Final Decision Matrix</h2>
                  <p className="text-sm text-purple-100">
                    Weighted scoring based on customer type: {
                      customerType === 'price-sensitive' ? '💰 Price-Sensitive (Price 70% + Capability 30%)' :
                      customerType === 'quality-first' ? '⭐ Quality-First (Capability 60% + Price 40%)' :
                      '⚖️ Balanced (50% / 50%)'
                    }
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {qualifiedCalculations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                  <p className="font-bold text-lg">No Qualified Suppliers</p>
                  <p className="text-sm mt-2">Cannot proceed to final decision without qualified suppliers.</p>
                </div>
              ) : (
                <>
                  {/* 象限图 */}
                  <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border-2 border-slate-300">
                    <h3 className="font-bold text-lg mb-4 text-center">Capability vs. TCO Positioning Map</h3>
                    <div className="relative h-96 bg-white rounded-lg border-2 border-gray-300">
                      {/* 坐标轴 */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400 transform -translate-y-1/2"></div>
                      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-400 transform -translate-x-1/2"></div>
                      
                      {/* 象限标签 */}
                      <div className="absolute top-4 right-4 text-xs font-bold text-green-600">🏆 Best Value</div>
                      <div className="absolute top-4 left-4 text-xs font-bold text-blue-600">💎 Premium</div>
                      <div className="absolute bottom-4 right-4 text-xs font-bold text-yellow-600">⚠️ Budget Risk</div>
                      <div className="absolute bottom-4 left-4 text-xs font-bold text-red-600">❌ Poor Value</div>
                      
                      {/* 坐标轴标签 */}
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500">Low TCO →</div>
                      <div className="absolute top-2 left-2 text-xs text-gray-500 transform -rotate-90 origin-top-left">
                        High Capability ↑
                      </div>
                      
                      {/* 数据点 */}
                      {finalDecisions.filter(({ capScore }) => capScore.qualified).map(({ supplier, decision }) => {
                        // 归一化坐标 (0-100)
                        const x = ((maxTCO - decision.tco) / (maxTCO - minTCO || 1)) * 80 + 10; // TCO越低，x越大
                        const y = (decision.capabilityScore / 100) * 80 + 10; // 能力越高，y越大
                        
                        return (
                          <div
                            key={supplier.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${x}%`, bottom: `${y}%` }}
                          >
                            <div className={`px-3 py-2 rounded-lg shadow-lg border-2 text-xs font-bold whitespace-nowrap ${
                              decision.quadrant === 'Best Value' ? 'bg-green-100 border-green-500 text-green-900' :
                              decision.quadrant === 'Premium' ? 'bg-blue-100 border-blue-500 text-blue-900' :
                              decision.quadrant === 'Budget Risk' ? 'bg-yellow-100 border-yellow-500 text-yellow-900' :
                              'bg-red-100 border-red-500 text-red-900'
                            }`}>
                              <div>{supplier.name}</div>
                              <div className="text-[10px] mt-0.5">Score: {decision.weightedScore.toFixed(1)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 综合评分表 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-800 text-white">
                          <th className="px-4 py-3 text-left font-bold border-r border-gray-600 sticky left-0 z-10 bg-gray-800">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-center font-bold border-r border-gray-600">
                            Capability<br/>Score
                          </th>
                          <th className="px-4 py-3 text-center font-bold border-r border-gray-600">
                            True TCO
                          </th>
                          <th className="px-4 py-3 text-center font-bold border-r border-gray-600">
                            Weighted<br/>Score
                          </th>
                          <th className="px-4 py-3 text-center font-bold border-r border-gray-600">
                            Quadrant
                          </th>
                          <th className="px-4 py-3 text-center font-bold">
                            Recommendation
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalDecisions
                          .filter(({ capScore }) => capScore.qualified)
                          .sort((a, b) => b.decision.weightedScore - a.decision.weightedScore)
                          .map(({ supplier, capScore, tco, decision }, index) => (
                            <tr key={supplier.id} className={`border-b hover:bg-gray-50 ${index === 0 ? 'bg-green-50' : ''}`}>
                              <td className="px-4 py-3 font-bold border-r sticky left-0 bg-white z-10">
                                {index === 0 && <span className="text-yellow-500 mr-2">👑</span>}
                                {supplier.name}
                              </td>
                              <td className="px-4 py-3 text-center border-r">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getGradeColor(capScore.grade)}`}>
                                  {capScore.totalScore.toFixed(1)} ({capScore.grade})
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center border-r font-bold">
                                ${tco.trueTotal.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center border-r">
                                <div className="text-lg font-bold text-purple-600">
                                  {decision.weightedScore.toFixed(1)}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center border-r">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  decision.quadrant === 'Best Value' ? 'bg-green-100 text-green-800' :
                                  decision.quadrant === 'Premium' ? 'bg-blue-100 text-blue-800' :
                                  decision.quadrant === 'Budget Risk' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {decision.quadrant}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-3 py-1 rounded text-xs font-bold ${getRecommendationColor(decision.recommendation)}`}>
                                  {decision.recommendation}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AI推荐 */}
                  {finalDecisions.length > 0 && (() => {
                    const topChoice = finalDecisions
                      .filter(({ capScore }) => capScore.qualified)
                      .sort((a, b) => b.decision.weightedScore - a.decision.weightedScore)[0];
                    
                    if (!topChoice) return null;

                    return (
                      <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-purple-600 rounded-lg">
                            <Award className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-purple-900 mb-2">
                              🤖 AI Recommendation for {
                                customerType === 'price-sensitive' ? 'Price-Sensitive Customers' :
                                customerType === 'quality-first' ? 'Quality-First Customers' :
                                'Balanced Approach Customers'
                              }
                            </h3>
                            <div className="bg-white p-4 rounded-lg border border-purple-200">
                              <p className="font-bold text-xl text-purple-900 mb-2">
                                ✅ Recommended Supplier: <span className="text-[#F96302]">{topChoice.supplier.name}</span>
                              </p>
                              <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                                <div>
                                  <div className="text-gray-600">Capability Grade</div>
                                  <div className="font-bold text-lg">{topChoice.capScore.grade} ({topChoice.capScore.totalScore.toFixed(1)}/100)</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">True TCO</div>
                                  <div className="font-bold text-lg">${topChoice.decision.tco.toLocaleString()}</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Final Score</div>
                                  <div className="font-bold text-lg text-purple-600">{topChoice.decision.weightedScore.toFixed(1)}/100</div>
                                </div>
                              </div>
                              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm text-blue-900">
                                  <strong>Why this supplier?</strong> Based on your {customerType.replace('-', ' ')} profile, 
                                  this supplier offers the best balance of {
                                    customerType === 'price-sensitive' 
                                      ? 'competitive pricing while maintaining acceptable quality standards'
                                      : customerType === 'quality-first'
                                      ? 'superior capability and reliability with reasonable cost'
                                      : 'overall value combining both capability and cost efficiency'
                                  }.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 导航按钮 */}
                  <div className="mt-6 flex justify-between">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      variant="outline"
                      className="border-2"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      Back: TCO Analysis
                    </Button>
                    <Button
                      className="bg-[#F96302] hover:bg-orange-600 text-white px-8"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
