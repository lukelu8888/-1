import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calculator, Plus, Trash2, Download, BarChart3, TrendingDown, DollarSign, Award, AlertCircle, Star, Clock, CreditCard, Shield, Package, TrendingUp, CheckCircle, XCircle, MessageSquare, Zap, FileCheck, TrendingDown as TrendingDownIcon, AlertTriangle, Target, ArrowLeft, HelpCircle, Save, FolderOpen, PieChart, ChevronDown, ChevronUp } from 'lucide-react';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useUser } from '../../contexts/UserContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as kv from '../../supabase/functions/server/kv_store';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

// 🔥 中国主要港口列表
const CHINA_PORTS = ['Yantian', 'Guangzhou', 'Shantou', 'Xiamen', 'Fuzhou', 'Ningbo', 'Shanghai', 'Qingdao', 'Dalian'];

interface SupplierData {
  id: string;
  name: string;
  fobPrice: number;
  loadingPort: string; // 🔥 装货港口
  
  // 海运费细化
  containerType: '20GP' | '40GP' | '40HQ';
  containerQty: number;
  costPerContainer: number;
  
  clearance: number;
  bankFees: number;
  isBaseQuote: boolean;
  
  // 🔥 Hidden Costs - 客户手动输入
  qualityInspectionCost: number; // 质检成本
  expectedDefectCost: number; // 预期缺陷成本
  inventoryHoldingCost: number; // 库存持有成本
  communicationCost: number; // 沟通成本
  lateDeliveryCost: number; // 延迟交付成本（新增）
  
  // 💰 利润分析 - 客户手动输入
  profitMarginPercent: number; // 目标利润率%
  
  // 🔥 核心决策因素
  qualityRating: number; // 1-5星 - 主观质量评价
  serviceRating: number; // 1-5星 - 主观服务评价
  
  // 🔥 硬性指标
  paymentTerms: string; // 账期
  leadTime: number; // 交货期
  moq: number; // 最小起订量
  certifications: string[]; // 认证
  
  // 🔥 质量与交付风险（客观数据）
  onTimeDeliveryRate: number; // 准时交货率 0-100%
  qualityPassRate: number; // 质量合格率 0-100%
  defectRate: number; // 不良品率 0-100%
  sampleProductionGap: number; // 样品与大货差异 0-10分（0=一致，10=差异大）
  
  // 🔥 服务响应
  responseTime: number; // 响应时间（小时）
  communicationScore: number; // 沟通质量 1-5星
  flexibility: number; // 灵活性 1-5星（接受小单/定制/调整）
  
  // 🔥 风险评估
  financialHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor'; // 财务健康度
  productionCapacity: number; // 产能利用率 0-100%
  geographicRisk: 'Low' | 'Medium' | 'High'; // 地理风险
  
  // 🔥 战略价值
  innovationCapability: number; // 创新能力 1-5星
  partnershipPotential: number; // 长期合作潜力 1-5星
  exclusivity: boolean; // 是否独家供应
  
  // 历史表现
  pastPerformance: number; // 综合历史评分 0-100
}

interface CostCalculation {
  fob: number;
  freight: number;
  dutyBase: number;
  dutyAmount: number;
  insurance: number;
  clearance: number;
  bankFees: number;
  subtotal: number;
  vat: number;
  totalLanded: number;
  savingsVsBase: number;
  savingsPercent: number;
  
  // 🔥 隐性成本估算
  qualityInspectionCost: number; // 质检成本
  expectedDefectCost: number; // 预期不良品成本
  inventoryHoldingCost: number; // 库存持有成本
  communicationCost: number; // 沟通成本
  lateDeliveryCost: number; // 延迟交付成本
  totalHiddenCost: number;
  trueTotal: number; // 真实总成本
  
  // 💰 利润分析
  sellingPrice: number; // 销售价 = TCO × (1 + 利润率%)
  profitAmount: number; // 利润额 = 销售价 - TCO
  roi: number; // ROI = 利润率%
  
  // 🔥 综合评分（分项）
  priceScore: number; // 价格得分 0-100
  qualityScore: number; // 质量得分 0-100
  deliveryScore: number; // 交付得分 0-100
  serviceScore: number; // 服务得分 0-100
  riskScore: number; // 风险得分 0-100（越高越低风险）
  strategicScore: number; // 战略价值 0-100
  
  // 🔥 加权总分
  overallScore: number; // 综合得分 0-100
  recommendationLevel: 'Highly Recommended' | 'Recommended' | 'Acceptable' | 'Caution' | 'Not Recommended';
}

// 🔥 评分权重配置
interface ScoreWeights {
  price: number;
  quality: number;
  delivery: number;
  service: number;
  risk: number;
  strategic: number;
}

interface ProfitAnalyzerProProps {
  onNavigate?: (view: string) => void; // 🔥 导航回调
}

export function ProfitAnalyzerPro({ onNavigate }: ProfitAnalyzerProProps) {
  const { quotations: allQuotations, getQuotationsByCustomer } = useSalesQuotations();
  const { user, userInfo } = useUser();
  
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [quantity, setQuantity] = useState<number>(1000);
  
  // 全局费率
  const [importDutyRate, setImportDutyRate] = useState<number>(7.5);
  const [insuranceRate, setInsuranceRate] = useState<number>(2);
  const [vatRate, setVatRate] = useState<number>(0);
  
  // 🔥 客户类型（影响评分权重）
  const [customerType, setCustomerType] = useState<string>('Balanced');
  
  // 🔥 评分权重（可调整）
  const [weights, setWeights] = useState<ScoreWeights>({
    price: 35,
    quality: 25,
    delivery: 20,
    service: 10,
    risk: 5,
    strategic: 5
  });
  
  // 显示模式
  const [showDecisionFactors, setShowDecisionFactors] = useState<boolean>(true);
  const [showHiddenCosts, setShowHiddenCosts] = useState<boolean>(true);
  const [showWeightsConfig, setShowWeightsConfig] = useState<boolean>(false);
  
  // 🔥 Step折叠状态
  const [isStep1Collapsed, setIsStep1Collapsed] = useState<boolean>(false);
  const [isStep2Collapsed, setIsStep2Collapsed] = useState<boolean>(false);
  const [isStep3Collapsed, setIsStep3Collapsed] = useState<boolean>(false);
  
  // 🔥 跟踪是否已初始化权重
  const [isWeightsInitialized, setIsWeightsInitialized] = useState<boolean>(false);
  
  // 🔥 问号弹窗状态和拖动
  const [showScoringModal, setShowScoringModal] = useState<boolean>(false);
  const [modalPosition, setModalPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 🔥 图表和保存功能
  const [showChartsModal, setShowChartsModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const quotations = user?.email 
    ? getQuotationsByCustomer(user.email).filter(q => 
        q.customerStatus === 'sent' || q.customerStatus === 'viewed' || 
        q.customerStatus === 'accepted' || q.customerStatus === 'rejected' ||
        q.customerStatus === 'negotiating' || q.customerStatus === 'expired'
      )
    : [];

  // 🔥 BusinessType → 权重策略映射
  const getStrategyFromBusinessType = (businessType?: string): string => {
    const mapping: Record<string, string> = {
      'Retailer': 'Balanced',             // 零售商：均衡（需平衡质量/价格/服务）
      'Wholesaler': 'Price-Sensitive',    // 批发商：价格敏感（薄利多销）
      'Importer': 'Balanced',             // 进口商：均衡
      'Distributor': 'Price-Sensitive',   // 分销商：价格敏感（中间商竞争激烈）
      'E-commerce': 'Fast-Delivery',      // 电商：快速交付
      'Brand Owner': 'Quality-First',     // 品牌商：质量优先
      'OEM Manufacturer': 'Strategic-Partnership', // 代工厂：战略伙伴
      'Chain Store': 'Risk-Averse',       // 连锁店：风险规避
      'Other': 'Balanced'
    };
    return mapping[businessType || ''] || 'Balanced';
  };
  
  // 🔥 根据客户类型设置权重预设
  const applyCustomerTypeWeights = (type: string) => {
    const weightPresets: Record<string, ScoreWeights> = {
      'Price-Sensitive': { price: 50, quality: 20, delivery: 15, service: 5, risk: 5, strategic: 5 },
      'Quality-First': { price: 15, quality: 45, delivery: 15, service: 15, risk: 5, strategic: 5 },
      'Fast-Delivery': { price: 20, quality: 20, delivery: 40, service: 10, risk: 5, strategic: 5 },
      'Strategic-Partnership': { price: 15, quality: 25, delivery: 15, service: 20, risk: 10, strategic: 15 },
      'Risk-Averse': { price: 20, quality: 25, delivery: 15, service: 15, risk: 15, strategic: 10 },
      'Balanced': { price: 35, quality: 25, delivery: 20, service: 10, risk: 5, strategic: 5 }
    };
    
    const preset = weightPresets[type] || weightPresets['Balanced'];
    setWeights(preset);
    setCustomerType(type);
  };
  
  // 🔥 恢复账户默认权重
  const resetToAccountDefault = () => {
    const defaultStrategy = getStrategyFromBusinessType(userInfo?.businessType);
    applyCustomerTypeWeights(defaultStrategy);
  };
  
  // 🔥 初始化：自动应用账户默认权重（仅首次）
  React.useEffect(() => {
    if (userInfo?.businessType && !isWeightsInitialized) {
      const defaultStrategy = getStrategyFromBusinessType(userInfo.businessType);
      applyCustomerTypeWeights(defaultStrategy);
      setIsWeightsInitialized(true);
    }
  }, [userInfo?.businessType, isWeightsInitialized]); // 只在businessType变化且未初始化时触发

  // 加载报价
  const handleLoadQuote = React.useCallback((quoteId: string) => {
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

    const baseSupplier: SupplierData = {
      id: quote.id,
      name: 'Fujian Gaoshengdafu (Current)',
      fobPrice: quote.totalPrice || 0,
      loadingPort: 'Xiamen', // 🔥 福建高盛达富默认厦门港
      containerType: '40HQ',
      containerQty: 1,
      costPerContainer: 850,
      clearance: 200,
      bankFees: 50,
      isBaseQuote: true,
      // 🔥 Hidden Costs - 初始化为0，由客户手动输入
      qualityInspectionCost: 0,
      expectedDefectCost: 0,
      inventoryHoldingCost: 0,
      communicationCost: 0,
      lateDeliveryCost: 0,
      // 💰 利润分析 - 默认30%利润率
      profitMarginPercent: 30,
      qualityRating: 4.5,
      serviceRating: 4.2,
      paymentTerms: '30 days',
      leadTime: 30,
      moq: 500,
      certifications: ['ISO9001', 'ISO14001', 'BSCI'],
      onTimeDeliveryRate: 95,
      qualityPassRate: 98,
      defectRate: 2,
      sampleProductionGap: 1,
      responseTime: 4,
      communicationScore: 4.5,
      flexibility: 4.0,
      financialHealth: 'Good',
      productionCapacity: 75,
      geographicRisk: 'Low',
      innovationCapability: 4.0,
      partnershipPotential: 4.5,
      exclusivity: false,
      pastPerformance: 88
    };

    setSuppliers([baseSupplier]);
  }, [quotations]);

  // 🔥 组件挂载时检查localStorage，自动加载报价
  React.useEffect(() => {
    const savedQuoteId = localStorage.getItem('profitAnalyzer_selectedQuoteId');
    if (savedQuoteId && quotations.length > 0) {
      console.log('🔥 [ProfitAnalyzerPro] Auto-loading quote from localStorage:', savedQuoteId);
      handleLoadQuote(savedQuoteId);
      // 🔥 清除localStorage，避免重复加载
      localStorage.removeItem('profitAnalyzer_selectedQuoteId');
    }
  }, [quotations, handleLoadQuote]);

  // 🔥 拖动弹窗处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // 🔥 ESC键关闭模态窗口
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showScoringModal) setShowScoringModal(false);
        if (showChartsModal) setShowChartsModal(false);
        if (showHistoryModal) setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showScoringModal, showChartsModal, showHistoryModal]);

  // 🔥 保存分析到后台
  const saveAnalysis = async () => {
    if (suppliers.length === 0) {
      alert('⚠️ No suppliers to save. Please add suppliers first.');
      return;
    }

    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const analysisData = {
        id: `analysis_${Date.now()}`,
        userId: user?.email || 'anonymous',
        timestamp,
        quotationId: selectedQuoteId,
        quotationNumber: quotations.find(q => q.id === selectedQuoteId)?.quotationNumber || 'N/A',
        suppliers,
        quantity,
        importDutyRate,
        insuranceRate,
        vatRate,
        customerType,
        weights,
        calculations: calculations.map(({ supplier, calc }) => ({
          supplierName: supplier.name,
          supplierId: supplier.id,
          trueTotal: calc.trueTotal,
          profit: calc.profit,
          overallScore: calc.overallScore,
          priceScore: calc.priceScore,
          qualityScore: calc.qualityScore,
          deliveryScore: calc.deliveryScore,
          serviceScore: calc.serviceScore,
          riskScore: calc.riskScore,
          strategicScore: calc.strategicScore,
          recommendationLevel: calc.recommendationLevel
        }))
      };

      // 保存到后台
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/save-profit-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(analysisData)
      });

      if (!response.ok) {
        throw new Error('Failed to save analysis');
      }

      alert('✅ Analysis saved successfully!');
    } catch (error) {
      console.error('Error saving analysis:', error);
      alert('❌ Failed to save analysis. Error: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  // 🔥 加载历史分析
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    setShowHistoryModal(true);
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-880fd43b/get-profit-analyses?userId=${user?.email}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data = await response.json();
      setSavedAnalyses(data.analyses || []);
    } catch (error) {
      console.error('Error loading history:', error);
      alert('❌ Failed to load history. Error: ' + error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 🔥 加载历史分析数据
  const loadSavedAnalysis = (analysis: any) => {
    setSuppliers(analysis.suppliers);
    setQuantity(analysis.quantity);
    setImportDutyRate(analysis.importDutyRate);
    setInsuranceRate(analysis.insuranceRate);
    setVatRate(analysis.vatRate);
    setCustomerType(analysis.customerType);
    setWeights(analysis.weights);
    setSelectedQuoteId(analysis.quotationId);
    setShowHistoryModal(false);
    alert('✅ Analysis loaded successfully!');
  };

  // 添加竞争供应商
  const addCompetitor = () => {
    if (suppliers.length === 0) return;
    
    const baseSupplier = suppliers[0];
    const newSupplier: SupplierData = {
      id: `comp-${Date.now()}`,
      name: `Supplier ${String.fromCharCode(65 + suppliers.length - 1)}`,
      fobPrice: 0,
      loadingPort: baseSupplier.loadingPort || 'Yantian', // 🔥 装货港口
      containerType: baseSupplier.containerType,
      containerQty: baseSupplier.containerQty,
      costPerContainer: baseSupplier.costPerContainer,
      clearance: baseSupplier.clearance,
      bankFees: baseSupplier.bankFees,
      isBaseQuote: false,
      // 🔥 Hidden Costs - 默认为0，由客户手动输入
      qualityInspectionCost: 0,
      expectedDefectCost: 0,
      inventoryHoldingCost: 0,
      communicationCost: 0,
      lateDeliveryCost: 0,
      // 💰 利润分析 - 默认30%利润率
      profitMarginPercent: 30,
      qualityRating: 3.5,
      serviceRating: 3.5,
      paymentTerms: '30 days',
      leadTime: 45,
      moq: 1000,
      certifications: [],
      onTimeDeliveryRate: 85,
      qualityPassRate: 92,
      defectRate: 8,
      sampleProductionGap: 3,
      responseTime: 12,
      communicationScore: 3.5,
      flexibility: 3.0,
      financialHealth: 'Fair',
      productionCapacity: 85,
      geographicRisk: 'Medium',
      innovationCapability: 3.0,
      partnershipPotential: 3.0,
      exclusivity: false,
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

  // 🔥 计算成本 + 全面评分
  const calculateCost = (supplier: SupplierData, baseTotal?: number): CostCalculation => {
    const fob = supplier.fobPrice;
    const freight = supplier.containerQty * supplier.costPerContainer;
    const dutyBase = fob + freight;
    const dutyAmount = dutyBase * (importDutyRate / 100);
    const insurance = fob * (insuranceRate / 100);
    const clearance = supplier.clearance;
    const bankFees = supplier.bankFees;
    const subtotal = fob + freight + dutyAmount + insurance + clearance + bankFees;
    const vat = subtotal * (vatRate / 100);
    const totalLanded = subtotal + vat;

    const savingsVsBase = baseTotal ? baseTotal - totalLanded : 0;
    const savingsPercent = baseTotal && baseTotal > 0 ? (savingsVsBase / baseTotal) * 100 : 0;

    // 🔥 隐性成本 - 直接使用客户输入的值
    const totalHiddenCost = supplier.qualityInspectionCost + supplier.expectedDefectCost + 
                            supplier.inventoryHoldingCost + supplier.communicationCost + 
                            supplier.lateDeliveryCost;
    const trueTotal = totalLanded + totalHiddenCost;

    // 💰 利润分析计算
    const profitMarginPercent = supplier.profitMarginPercent || 0;
    const sellingPrice = trueTotal * (1 + profitMarginPercent / 100);
    const profitAmount = sellingPrice - trueTotal;
    const roi = profitMarginPercent;

    // 🔥 价格得分（基于真实总成本）
    const lowestTrueTotal = Math.min(...suppliers.filter(s => s.fobPrice > 0).map(s => {
      const f = s.fobPrice;
      const fr = s.containerQty * s.costPerContainer;
      const db = f + fr;
      const da = db * (importDutyRate / 100);
      const ins = f * (insuranceRate / 100);
      const st = f + fr + da + ins + s.clearance + s.bankFees;
      const v = st * (vatRate / 100);
      const tl = st + v;
      // 🔥 使用客户输入的隐性成本
      const hcTotal = s.qualityInspectionCost + s.expectedDefectCost + s.inventoryHoldingCost + s.communicationCost + s.lateDeliveryCost;
      return tl + hcTotal;
    }));
    const priceScore = trueTotal > 0 ? Math.max(0, Math.min(100, 100 - ((trueTotal - lowestTrueTotal) / lowestTrueTotal * 100))) : 0;
    
    // 🔥 质量得分
    const qualityScore = (
      (supplier.qualityRating * 15) +
      (supplier.qualityPassRate * 0.4) +
      (100 - supplier.defectRate) * 0.3 +
      (10 - supplier.sampleProductionGap) * 2 +
      (supplier.pastPerformance * 0.15)
    );
    
    // 🔥 交付得分
    const deliveryScore = (
      (supplier.onTimeDeliveryRate * 0.6) +
      (Math.max(0, 100 - supplier.leadTime) * 0.4)
    );
    
    // 🔥 服务得分
    const paymentBonus = supplier.paymentTerms === '60 days' ? 15 : supplier.paymentTerms === '90 days' ? 25 : supplier.paymentTerms === 'LC' ? 10 : 0;
    const responseBonus = Math.max(0, 100 - (supplier.responseTime * 2));
    const serviceScore = Math.min(100, (
      (supplier.serviceRating * 15) +
      (supplier.communicationScore * 10) +
      (supplier.flexibility * 10) +
      (paymentBonus * 0.3) +
      (responseBonus * 0.15)
    ));
    
    // 🔥 风险得分（越高越低风险）
    const financialHealthScore = supplier.financialHealth === 'Excellent' ? 100 : supplier.financialHealth === 'Good' ? 85 : supplier.financialHealth === 'Fair' ? 60 : 30;
    const geoRiskScore = supplier.geographicRisk === 'Low' ? 90 : supplier.geographicRisk === 'Medium' ? 60 : 30;
    const capacityScore = supplier.productionCapacity < 80 ? 100 : supplier.productionCapacity < 95 ? 70 : 40; // 产能利用率过高有风险
    const riskScore = (financialHealthScore * 0.4) + (geoRiskScore * 0.3) + (capacityScore * 0.3);
    
    // 🔥 战略价值得分
    const strategicScore = (
      (supplier.innovationCapability * 18) +
      (supplier.partnershipPotential * 18) +
      (supplier.exclusivity ? 30 : 0) +
      (supplier.pastPerformance * 0.34)
    );
    
    // 🔥 加权总分
    const totalWeight = weights.price + weights.quality + weights.delivery + weights.service + weights.risk + weights.strategic;
    const overallScore = (
      (priceScore * weights.price / totalWeight) +
      (qualityScore * weights.quality / totalWeight) +
      (deliveryScore * weights.delivery / totalWeight) +
      (serviceScore * weights.service / totalWeight) +
      (riskScore * weights.risk / totalWeight) +
      (strategicScore * weights.strategic / totalWeight)
    );
    
    // 🔥 推荐等级
    let recommendationLevel: 'Highly Recommended' | 'Recommended' | 'Acceptable' | 'Caution' | 'Not Recommended';
    if (overallScore >= 85) recommendationLevel = 'Highly Recommended';
    else if (overallScore >= 75) recommendationLevel = 'Recommended';
    else if (overallScore >= 65) recommendationLevel = 'Acceptable';
    else if (overallScore >= 50) recommendationLevel = 'Caution';
    else recommendationLevel = 'Not Recommended';

    return {
      fob,
      freight,
      dutyBase,
      dutyAmount,
      insurance,
      clearance,
      bankFees,
      subtotal,
      vat,
      totalLanded,
      savingsVsBase,
      savingsPercent,
      // 🔥 Hidden Costs - 客户输入值
      qualityInspectionCost: supplier.qualityInspectionCost,
      expectedDefectCost: supplier.expectedDefectCost,
      inventoryHoldingCost: supplier.inventoryHoldingCost,
      communicationCost: supplier.communicationCost,
      lateDeliveryCost: supplier.lateDeliveryCost,
      totalHiddenCost,
      trueTotal,
      // 💰 利润分析
      sellingPrice,
      profitAmount,
      roi,
      priceScore,
      qualityScore,
      deliveryScore,
      serviceScore,
      riskScore,
      strategicScore,
      overallScore,
      recommendationLevel
    };
  };

  const baseTotal = suppliers.length > 0 ? (() => {
    const baseSupplier = suppliers[0];
    const fob = baseSupplier.fobPrice;
    const freight = baseSupplier.containerQty * baseSupplier.costPerContainer;
    const dutyBase = fob + freight;
    const dutyAmount = dutyBase * (importDutyRate / 100);
    const insurance = fob * (insuranceRate / 100);
    const subtotal = fob + freight + dutyAmount + insurance + baseSupplier.clearance + baseSupplier.bankFees;
    const vat = subtotal * (vatRate / 100);
    return subtotal + vat;
  })() : 0;

  const calculations = suppliers.map(s => ({
    supplier: s,
    calc: calculateCost(s, baseTotal)
  }));

  // 找到最低真实成本
  const lowestCost = calculations.length > 0
    ? calculations.filter(c => c.supplier.fobPrice > 0).reduce((min, curr) => 
        curr.calc.trueTotal < min.calc.trueTotal ? curr : min
      , calculations[0])
    : null;

  // 找到综合评分最高
  const bestOverall = calculations.length > 0
    ? calculations.filter(c => c.supplier.fobPrice > 0).reduce((max, curr) => 
        curr.calc.overallScore > max.calc.overallScore ? curr : max
      , calculations[0])
    : null;

  // 💰 找到最高利润
  const bestProfit = calculations.length > 0
    ? calculations.filter(c => c.supplier.fobPrice > 0).reduce((max, curr) => 
        curr.calc.profitAmount > max.calc.profitAmount ? curr : max
      , calculations[0])
    : null;

  const maxSavings = lowestCost && calculations[0]
    ? calculations[0].calc.trueTotal - lowestCost.calc.trueTotal
    : 0;

  // 星级渲染
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.floor(rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : star - 0.5 <= rating 
                  ? 'fill-yellow-200 text-yellow-400' 
                  : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-bold ml-1`}>{rating.toFixed(1)}</span>
      </div>
    );
  };

  // 推荐等级颜色
  const getRecommendationColor = (level: string) => {
    switch (level) {
      case 'Highly Recommended': return 'bg-green-500 text-white';
      case 'Recommended': return 'bg-blue-500 text-white';
      case 'Acceptable': return 'bg-yellow-500 text-white';
      case 'Caution': return 'bg-orange-500 text-white';
      case 'Not Recommended': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-none shadow-lg border-l-8 border-[#F96302]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F96302] rounded flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold tracking-tight uppercase">Strategic Procurement Intelligence</h1>
              <p className="text-gray-300 text-xs mt-0.5">Total Cost of Ownership + Multi-Dimensional Risk Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 🔥 返回报价详情按钮 */}
            {selectedQuoteId && onNavigate && (
              <Button 
                onClick={() => {
                  console.log('🔥 [ProfitAnalyzerPro] Returning to quotation detail:', selectedQuoteId);
                  // 🔥 将报价ID存储到localStorage，供QuotationReceived自动打开
                  localStorage.setItem('quotationDetail_autoOpenId', selectedQuoteId);
                  localStorage.setItem('myOrders_activeTab', 'quotations'); // 🔥 设置My Orders的默认tab
                  // 🔥 导航回My Orders页面（其中包含Quotations tab）
                  onNavigate('my-orders');
                }}
                size="sm" 
                className="h-8 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500 font-semibold shadow-lg"
              >
                <ArrowLeft className="w-3 h-3 mr-1.5" />
                Back to Quotation
              </Button>
            )}
            <Button 
              onClick={() => setShowWeightsConfig(!showWeightsConfig)}
              variant="outline" 
              size="sm" 
              className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Target className="w-3 h-3 mr-1" />
              Weights
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/30">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* 🔥 操作按钮栏 */}
      {suppliers.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-900">Analysis Actions</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* 查看历史记录 */}
              <Button
                onClick={loadHistory}
                variant="outline"
                size="sm"
                className="h-9 text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300 font-semibold"
                disabled={isLoadingHistory}
              >
                <FolderOpen className="w-4 h-4 mr-1.5" />
                {isLoadingHistory ? 'Loading...' : 'My Saved Analyses'}
              </Button>

              {/* 查看图表对比 */}
              <Button
                onClick={() => setShowChartsModal(true)}
                variant="outline"
                size="sm"
                className="h-9 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-400 font-semibold shadow-md"
              >
                <PieChart className="w-4 h-4 mr-1.5" />
                📊 View Charts Comparison
              </Button>

              {/* 保存到后台 */}
              <Button
                onClick={saveAnalysis}
                variant="outline"
                size="sm"
                className="h-9 text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-orange-400 font-semibold shadow-md"
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1.5" />
                {isSaving ? 'Saving...' : '💾 Save Analysis'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 权重配置面板 */}
      {showWeightsConfig && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4 overflow-visible">
          <h3 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Custom Score Weights - What Matters Most to You?
          </h3>
          
          {/* 🎯 账户类型 & 权重策略 */}
          <div className="mb-4 bg-white/60 rounded-lg p-3 border border-purple-200 overflow-visible">
            {/* 显示账户类型 */}
            {userInfo?.businessType && (
              <div className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Your Account Type</span>
                    <div className="text-sm font-bold text-blue-900 mt-0.5">
                      {userInfo.businessType === 'Retailer' ? '🏪 Retailer' :
                       userInfo.businessType === 'Wholesaler' ? '📦 Wholesaler' :
                       userInfo.businessType === 'Importer' ? '🌐 Importer' :
                       userInfo.businessType === 'Distributor' ? '🚚 Distributor' :
                       userInfo.businessType === 'E-commerce' ? '💻 E-commerce' : userInfo.businessType}
                    </div>
                  </div>
                  <Button
                    onClick={resetToAccountDefault}
                    size="sm"
                    className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Reset to Account Default
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-bold text-gray-700">
                🎯 Procurement Strategy (Temporarily switch for special projects)
              </label>
              <div className="group relative inline-block">
                <HelpCircle className="w-4 h-4 text-purple-600 cursor-help hover:text-purple-800 transition-colors" />
                {/* Tooltip */}
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-full ml-2 top-1/2 -translate-y-1/2 z-[100] w-[700px] bg-white border-2 border-purple-400 rounded-lg shadow-2xl p-4">
                  {/* 小箭头 */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-purple-400"></div>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 ml-[2px] w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[7px] border-r-white"></div>
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg p-2.5 mb-3">
                    <h4 className="text-xs font-bold text-purple-900 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" />
                      Business Logic Mapping: Account Type → Auto Strategy → Default Weights
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md px-2 py-2">
                      <div>Account Type</div>
                      <div>Auto Strategy</div>
                      <div>Default Weights</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-gray-50/50 hover:bg-gray-100 border border-gray-200 rounded px-2">
                      <div className="font-semibold text-gray-800">🏪 Retailer</div>
                      <div className="font-semibold text-gray-600">⚖️ Balanced</div>
                      <div className="text-gray-600">Price 35%, Quality 25%, Delivery 20%, Service 10%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded px-2">
                      <div className="font-semibold text-gray-800">📦 Wholesaler</div>
                      <div className="font-semibold text-orange-600">💰 Price-Sensitive</div>
                      <div className="text-gray-600">Price <span className="font-bold text-orange-600">50%</span>, Quality 20%, Delivery 15%, Service 5%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-gray-50/50 hover:bg-gray-100 border border-gray-200 rounded px-2">
                      <div className="font-semibold text-gray-800">🌐 Importer</div>
                      <div className="font-semibold text-gray-600">⚖️ Balanced</div>
                      <div className="text-gray-600">Price 35%, Quality 25%, Delivery 20%, Service 10%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-orange-50/50 hover:bg-orange-50 border border-orange-100 rounded px-2">
                      <div className="font-semibold text-gray-800">🚚 Distributor</div>
                      <div className="font-semibold text-orange-600">💰 Price-Sensitive</div>
                      <div className="text-gray-600">Price <span className="font-bold text-orange-600">50%</span>, Quality 20%, Delivery 15%, Service 5%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded px-2">
                      <div className="font-semibold text-gray-800">💻 E-commerce</div>
                      <div className="font-semibold text-blue-600">⚡ Fast-Delivery</div>
                      <div className="text-gray-600">Price 20%, Quality 20%, Delivery <span className="font-bold text-blue-600">40%</span>, Service 10%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-yellow-50/50 hover:bg-yellow-50 border border-yellow-200 rounded px-2">
                      <div className="font-semibold text-gray-800">⭐ Brand Owner</div>
                      <div className="font-semibold text-yellow-600">⭐ Quality-First</div>
                      <div className="text-gray-600">Price 15%, Quality <span className="font-bold text-yellow-600">45%</span>, Delivery 15%, Service 15%, Risk 5%, Strategic 5%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-green-50/50 hover:bg-green-50 border border-green-100 rounded px-2">
                      <div className="font-semibold text-gray-800">🤝 OEM Manufacturer</div>
                      <div className="font-semibold text-green-600">🤝 Strategic-Partnership</div>
                      <div className="text-gray-600">Price 15%, Quality 25%, Delivery 15%, Service <span className="font-bold text-green-600">20%</span>, Risk 10%, Strategic <span className="font-bold text-green-600">15%</span></div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded px-2">
                      <div className="font-semibold text-gray-800">🛡️ Chain Store</div>
                      <div className="font-semibold text-red-600">🛡️ Risk-Averse</div>
                      <div className="text-gray-600">Price 20%, Quality 25%, Delivery 15%, Service 15%, Risk <span className="font-bold text-red-600">15%</span>, Strategic 10%</div>
                    </div>
                    
                    <div className="grid grid-cols-[140px_170px_1fr] gap-3 text-xs py-1.5 bg-gray-50/50 hover:bg-gray-100 border border-gray-200 rounded px-2">
                      <div className="font-semibold text-gray-800">❓ Other</div>
                      <div className="font-semibold text-gray-600">⚖️ Balanced</div>
                      <div className="text-gray-600">Price 35%, Quality 25%, Delivery 20%, Service 10%, Risk 5%, Strategic 5%</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-purple-200 text-[11px] text-purple-700 font-medium">
                    💡 Your strategy is auto-configured at login. Switch temporarily for special projects, then use "Reset to Account Default" button.
                  </div>
                </div>
              </div>
            </div>
            <select
              value={customerType}
              onChange={(e) => applyCustomerTypeWeights(e.target.value)}
              className="w-full h-9 px-3 border-2 border-purple-300 rounded-lg text-sm font-semibold text-purple-900 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302] outline-none bg-white"
            >
              <option value="Balanced">⚖️ Balanced</option>
              <option value="Price-Sensitive">💰 Price-Sensitive (50% Price)</option>
              <option value="Quality-First">⭐ Quality-First (45% Quality)</option>
              <option value="Fast-Delivery">⚡ Fast-Delivery (40% Delivery)</option>
              <option value="Strategic-Partnership">🤝 Strategic-Partnership (Long-term focus)</option>
              <option value="Risk-Averse">🛡️ Risk-Averse (15% Risk)</option>
            </select>
            <div className="mt-1.5 text-[10px] text-purple-700 font-medium">
              💡 Auto-configured based on your account type, or switch temporarily for special orders
            </div>
          </div>
          
          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Price ({weights.price}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.price}
                onChange={(e) => setWeights({...weights, price: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Quality ({weights.quality}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.quality}
                onChange={(e) => setWeights({...weights, quality: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Delivery ({weights.delivery}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.delivery}
                onChange={(e) => setWeights({...weights, delivery: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Service ({weights.service}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.service}
                onChange={(e) => setWeights({...weights, service: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Risk ({weights.risk}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.risk}
                onChange={(e) => setWeights({...weights, risk: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Strategic ({weights.strategic}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weights.strategic}
                onChange={(e) => setWeights({...weights, strategic: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-700">
            Total: {weights.price + weights.quality + weights.delivery + weights.service + weights.risk + weights.strategic}% 
            (Will auto-normalize)
          </div>
        </div>
      )}

      {/* 🎯 账户类型 & 采购策略指示器 */}
      {calculations.length > 0 && calculations.some(c => c.supplier.fobPrice > 0) && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 border border-purple-700 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {userInfo?.businessType && (
              <div className="flex items-center gap-1.5">
                <div className="bg-blue-400/30 rounded-full px-2 py-0.5">
                  <span className="text-[10px] font-bold text-white">Account</span>
                </div>
                <span className="text-xs font-bold text-blue-100">
                  {userInfo.businessType === 'Retailer' ? '🏪 Retailer' :
                   userInfo.businessType === 'Wholesaler' ? '📦 Wholesaler' :
                   userInfo.businessType === 'Importer' ? '🌐 Importer' :
                   userInfo.businessType === 'Distributor' ? '🚚 Distributor' :
                   userInfo.businessType === 'E-commerce' ? '💻 E-commerce' : userInfo.businessType}
                </span>
                <span className="text-white/60 mx-1">→</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className="bg-white/20 rounded-full px-2 py-0.5">
                <span className="text-[10px] font-bold text-white">Strategy</span>
              </div>
              <span className="text-sm font-bold text-white">
                {customerType === 'Price-Sensitive' ? '💰 Price-Sensitive' :
                 customerType === 'Quality-First' ? '⭐ Quality-First' :
                 customerType === 'Fast-Delivery' ? '⚡ Fast-Delivery' :
                 customerType === 'Strategic-Partnership' ? '🤝 Strategic-Partnership' :
                 customerType === 'Risk-Averse' ? '🛡️ Risk-Averse' : '⚖️ Balanced'}
              </span>
            </div>
          </div>
          <div className="text-[10px] text-white/90 font-medium">
            Weights: Price {weights.price}% • Quality {weights.quality}% • Delivery {weights.delivery}% • Service {weights.service}%
          </div>
        </div>
      )}

      {/* 快速指标 */}
      {calculations.length > 0 && calculations.some(c => c.supplier.fobPrice > 0) && (
        <div className="grid grid-cols-6 gap-3">
          <div className="bg-white border-l-4 border-green-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Lowest True Cost</div>
            <div className="text-2xl font-bold text-green-600">
              ${lowestCost?.calc.trueTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">{lowestCost?.supplier.name}</div>
          </div>

          <div className="bg-white border-l-4 border-blue-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Current Quote</div>
            <div className="text-2xl font-bold text-blue-600">
              ${calculations[0]?.calc.trueTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">True Total Cost</div>
          </div>

          <div className="bg-white border-l-4 border-purple-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Max Savings</div>
            <div className="text-2xl font-bold text-purple-600">
              ${maxSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calculations[0] && maxSavings > 0 ? `${((maxSavings / calculations[0].calc.trueTotal) * 100).toFixed(1)}% reduction` : 'Best price'}
            </div>
          </div>

          <div className="bg-white border-l-4 border-emerald-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Best Profit</div>
            <div className="text-2xl font-bold text-emerald-600">
              ${bestProfit?.calc.profitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bestProfit?.supplier.name}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              {bestProfit?.calc.roi.toFixed(1)}% margin
            </div>
          </div>

          <div className="bg-white border-l-4 border-orange-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Best Overall</div>
            <div className="text-2xl font-bold text-orange-600">
              {bestOverall?.calc.overallScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">{bestOverall?.supplier.name}</div>
          </div>

          <div className="bg-white border-l-4 border-gray-500 p-3 shadow-sm">
            <div className="text-xs text-gray-600 uppercase font-semibold mb-1">Recommendation</div>
            <div className="text-sm font-bold text-gray-600">
              {bestOverall?.calc.recommendationLevel.split(' ')[0]}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {bestOverall?.calc.recommendationLevel}
            </div>
          </div>
        </div>
      )}

      {/* 报价选择 */}
      <div className="bg-white border border-gray-200 shadow-sm w-full max-w-full overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-100" onClick={() => setIsStep1Collapsed(!isStep1Collapsed)}>
          <div className="flex items-center gap-2">
            {isStep1Collapsed ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex-shrink min-w-0">Step 1: Select Quote & Add Competitors</h3>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowHiddenCosts(!showHiddenCosts)}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 whitespace-nowrap"
            >
              {showHiddenCosts ? 'Hide' : 'Show'} Hidden Costs
            </button>
            <button
              onClick={() => setShowDecisionFactors(!showDecisionFactors)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              {showDecisionFactors ? 'Hide' : 'Show'} Decision Factors
            </button>
          </div>
        </div>
        {!isStep1Collapsed && (
        <div className="p-4 w-full">
          <div className="flex items-center gap-3 w-full max-w-full">
            <select
              value={selectedQuoteId}
              onChange={(e) => handleLoadQuote(e.target.value)}
              className="flex-1 min-w-0 h-9 px-3 border-2 border-gray-300 rounded text-sm font-medium focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 outline-none"
            >
              <option value="">-- Select a received quotation --</option>
              {quotations.map(q => (
                <option key={q.id} value={q.id}>
                  {q.qtNumber} - ${q.totalPrice?.toLocaleString()} - {new Date(q.createdAt || '').toLocaleDateString()}
                </option>
              ))}
            </select>
            <Button
              onClick={addCompetitor}
              disabled={suppliers.length === 0 || suppliers.length >= 8}
              className="h-9 px-4 bg-[#F96302] hover:bg-orange-600 text-white font-bold text-sm flex-shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Competitor
            </Button>
          </div>
        </div>
        )}
      </div>

      {/* 🔥 决策因素矩阵 - 紧凑版 */}
      {suppliers.length > 0 && showDecisionFactors && (
        <div className="bg-white border border-gray-200 shadow-sm">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100" onClick={() => setIsStep2Collapsed(!isStep2Collapsed)}>
            <div className="flex items-center gap-2">
              {isStep2Collapsed ? <ChevronDown className="w-4 h-4 flex-shrink-0 text-gray-600" /> : <ChevronUp className="w-4 h-4 flex-shrink-0 text-gray-600" />}
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide truncate">
                Step 2: Strategic Decision Factors - Comprehensive Supplier Evaluation
                {suppliers.length > 3 && <span className="text-xs font-normal ml-2 text-gray-600">(Scroll horizontally →)</span>}
              </h3>
            </div>
          </div>
          {!isStep2Collapsed && (
          <div className="overflow-x-auto overflow-y-visible">
            <div className="min-w-max">
              <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800 text-white">
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wide border-r border-gray-600 w-48 sticky left-0 z-20 bg-gray-800">Factor</th>
                  {calculations.map(({ supplier, calc }) => (
                    <th key={`dec-header-${supplier.id}`} className="px-3 py-2 text-left font-bold uppercase tracking-wide border-r border-gray-600 min-w-[180px]">
                      <div className="mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRecommendationColor(calc.recommendationLevel)}`}>
                          {calc.recommendationLevel === 'Highly Recommended' ? '🏆 TOP CHOICE' :
                           calc.recommendationLevel === 'Recommended' ? '✅ GOOD' :
                           calc.recommendationLevel === 'Acceptable' ? '⚠️ OK' :
                           calc.recommendationLevel === 'Caution' ? '⚠️ RISK' : '🚨 AVOID'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>{supplier.name}</span>
                        {!supplier.isBaseQuote && (
                          <button
                            onClick={() => removeSupplier(supplier.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 group"
                            title="Remove this supplier"
                          >
                            <Trash2 className="w-[18px] h-[18px] text-red-400 group-hover:text-red-600" />
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-300 mt-1">Overall: {calc.overallScore.toFixed(0)}/100</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 质量指标 */}
                <tr className="bg-blue-50 border-b border-blue-200">
                  <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-blue-900 text-xs sticky left-0 bg-blue-50 z-10">
                    📊 QUALITY METRICS (Score: {calculations[0]?.calc.qualityScore.toFixed(0)}/100)
                  </td>
                </tr>
                
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Quality Rating</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`qr-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center justify-between">
                        {renderStars(supplier.qualityRating)}
                        <input
                          type="number"
                          value={supplier.qualityRating}
                          onChange={(e) => updateSupplier(supplier.id, 'qualityRating', Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-12 h-6 px-1 border border-gray-300 rounded text-xs text-center focus:border-[#F96302] outline-none"
                          step="0.5"
                          min="0"
                          max="5"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Quality Pass Rate</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`qpr-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={supplier.qualityPassRate}
                          onChange={(e) => updateSupplier(supplier.id, 'qualityPassRate', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-16 h-6 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                          min="0"
                          max="100"
                        />
                        <span className={`text-xs font-bold ${supplier.qualityPassRate >= 95 ? 'text-green-600' : supplier.qualityPassRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.qualityPassRate >= 95 ? '✅' : supplier.qualityPassRate >= 90 ? '⚠️' : '🚨'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Defect Rate</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`dr-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={supplier.defectRate}
                          onChange={(e) => updateSupplier(supplier.id, 'defectRate', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-16 h-6 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-xs">%</span>
                        <span className={`text-xs font-bold ${supplier.defectRate <= 2 ? 'text-green-600' : supplier.defectRate <= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.defectRate <= 2 ? '✅' : supplier.defectRate <= 5 ? '⚠️' : '🚨'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 交付指标 */}
                <tr className="bg-green-50 border-b border-green-200">
                  <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-green-900 text-xs sticky left-0 bg-green-50 z-10">
                    🚚 DELIVERY METRICS (Score: {calculations[0]?.calc.deliveryScore.toFixed(0)}/100)
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">On-Time Delivery Rate</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`otd-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={supplier.onTimeDeliveryRate}
                          onChange={(e) => updateSupplier(supplier.id, 'onTimeDeliveryRate', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-16 h-6 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                          min="0"
                          max="100"
                        />
                        <span className={`text-xs font-bold ${supplier.onTimeDeliveryRate >= 95 ? 'text-green-600' : supplier.onTimeDeliveryRate >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.onTimeDeliveryRate >= 95 ? '✅' : supplier.onTimeDeliveryRate >= 85 ? '⚠️' : '🚨'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Lead Time (days)
                    </div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`lt-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={supplier.leadTime}
                          onChange={(e) => updateSupplier(supplier.id, 'leadTime', parseInt(e.target.value) || 0)}
                          className="w-16 h-6 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                        />
                        <span className={`text-xs font-bold ${supplier.leadTime <= 30 ? 'text-green-600' : supplier.leadTime <= 45 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.leadTime <= 30 ? '✅' : supplier.leadTime <= 45 ? '⚠️' : '🚨'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 服务指标 */}
                <tr className="bg-purple-50 border-b border-purple-200">
                  <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-purple-900 text-xs sticky left-0 bg-purple-50 z-10">
                    💬 SERVICE METRICS (Score: {calculations[0]?.calc.serviceScore.toFixed(0)}/100)
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Response Time (hours)
                    </div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`rt-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={supplier.responseTime}
                          onChange={(e) => updateSupplier(supplier.id, 'responseTime', parseFloat(e.target.value) || 0)}
                          className="w-16 h-6 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                          step="0.5"
                        />
                        <span className={`text-xs font-bold ${supplier.responseTime <= 6 ? 'text-green-600' : supplier.responseTime <= 24 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {supplier.responseTime <= 6 ? '⚡' : supplier.responseTime <= 24 ? '⏱️' : '🐌'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Communication Quality</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`cq-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <div className="flex items-center justify-between">
                        {renderStars(supplier.communicationScore)}
                        <input
                          type="number"
                          value={supplier.communicationScore}
                          onChange={(e) => updateSupplier(supplier.id, 'communicationScore', Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-12 h-6 px-1 border border-gray-300 rounded text-xs text-center focus:border-[#F96302] outline-none"
                          step="0.5"
                          min="0"
                          max="5"
                        />
                      </div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Payment Terms
                    </div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`pt-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <select
                        value={supplier.paymentTerms}
                        onChange={(e) => updateSupplier(supplier.id, 'paymentTerms', e.target.value)}
                        className="w-full h-6 px-1 border border-gray-300 rounded text-xs font-medium focus:border-[#F96302] outline-none"
                      >
                        <option value="Prepaid">Prepaid 🚨</option>
                        <option value="30 days">30 days</option>
                        <option value="60 days">60 days ✅</option>
                        <option value="90 days">90 days ⭐</option>
                        <option value="LC">L/C</option>
                      </select>
                    </td>
                  ))}
                </tr>

                {/* 风险指标 */}
                <tr className="bg-red-50 border-b border-red-200">
                  <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-red-900 text-xs sticky left-0 bg-red-50 z-10">
                    🛡️ RISK ASSESSMENT (Score: {calculations[0]?.calc.riskScore.toFixed(0)}/100 - Higher is Safer)
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Financial Health
                    </div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`fh-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <select
                        value={supplier.financialHealth}
                        onChange={(e) => updateSupplier(supplier.id, 'financialHealth', e.target.value as any)}
                        className="w-full h-6 px-1 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                      >
                        <option value="Excellent">✅ Excellent</option>
                        <option value="Good">👍 Good</option>
                        <option value="Fair">⚠️ Fair</option>
                        <option value="Poor">🚨 Poor</option>
                      </select>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1 text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Geographic Risk</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`gr-${supplier.id}`} className="px-3 py-1 border-r border-gray-200">
                      <select
                        value={supplier.geographicRisk}
                        onChange={(e) => updateSupplier(supplier.id, 'geographicRisk', e.target.value as any)}
                        className="w-full h-6 px-1 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] outline-none"
                      >
                        <option value="Low">✅ Low</option>
                        <option value="Medium">⚠️ Medium</option>
                        <option value="High">🚨 High</option>
                      </select>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          )}
        </div>
      )}

      {/* 成本对比表格 */}
      {suppliers.length > 0 && (
        <div className="bg-white border border-gray-200 shadow-sm relative">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 relative cursor-pointer hover:bg-gray-100" onClick={() => setIsStep3Collapsed(!isStep3Collapsed)}>
            <div className="pr-32 flex items-center gap-2">
              {isStep3Collapsed ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide truncate">
                Step 3: Total Cost of Ownership (TCO) Analysis
                {suppliers.length > 3 && <span className="text-xs font-normal ml-2 text-gray-600">(Scroll horizontally →)</span>}
              </h3>
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
              <Button
                onClick={addCompetitor}
                disabled={suppliers.length === 0 || suppliers.length >= 8}
                className="h-8 px-3 bg-[#F96302] hover:bg-orange-600 text-white font-bold text-xs whitespace-nowrap"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Supplier
              </Button>
            </div>
          </div>
          {!isStep3Collapsed && (
          <div className="overflow-x-auto overflow-y-visible" style={{ maxHeight: '800px' }}>
            <div className="min-w-max">
              <style>{`
                .sticky-col { position: sticky; left: 0; z-index: 10; }
                .sticky-header { position: sticky; left: 0; z-index: 20; }
              `}</style>
              <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-800 text-white">
                  <th className="px-3 py-2 text-left font-bold uppercase tracking-wide border-r border-gray-600 w-48 sticky-header bg-gray-800">Cost Item</th>
                  {calculations.map(({ supplier }) => (
                    <th key={`header-${supplier.id}`} className="px-3 py-2 text-left font-bold uppercase tracking-wide border-r border-gray-600 min-w-[180px]">
                      {supplier.isBaseQuote && (
                        <div className="mb-1">
                          <span className="px-2 py-0.5 bg-[#F96302] rounded text-[10px]">BASE</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span>{supplier.name}</span>
                        {!supplier.isBaseQuote && (
                          <button
                            onClick={() => removeSupplier(supplier.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 group"
                            title="Remove this supplier"
                          >
                            <Trash2 className="w-[18px] h-[18px] text-red-400 group-hover:text-red-600" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Supplier Name */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="px-3 py-2 font-bold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">Supplier Name</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`name-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={supplier.name}
                          onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)}
                          className="flex-1 h-7 px-2 border border-gray-300 rounded text-xs font-medium focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                        />
                        {!supplier.isBaseQuote && (
                          <button
                            onClick={() => removeSupplier(supplier.id)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-red-100 text-red-600 rounded flex-shrink-0"
                          >
                            <Trash2 className="w-[15px] h-[15px]" />
                          </button>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* FOB Price */}
                <tr className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="px-3 py-2 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">FOB Price</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`fob-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.fobPrice || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'fobPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full h-7 px-2 border border-gray-300 rounded text-xs font-bold focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                      />
                    </td>
                  ))}
                </tr>

                {/* Loading Port */}
                <tr className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="px-3 py-2 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">Loading Port</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`port-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <select
                        value={supplier.loadingPort || 'Yantian'}
                        onChange={(e) => updateSupplier(supplier.id, 'loadingPort', e.target.value)}
                        className="w-full h-7 px-2 border border-gray-300 rounded text-xs font-medium focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                      >
                        {CHINA_PORTS.map(port => (
                          <option key={port} value={port}>{port}</option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>

                {/* 海运费 */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-cyan-50">
                  <td className="px-3 py-2 text-gray-700 border-r border-gray-200 sticky left-0 bg-cyan-50 z-10">
                    <div className="font-semibold">+ Ocean Freight</div>
                    <div className="text-[10px] text-gray-500">Container Type</div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`container-type-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <select
                        value={supplier.containerType}
                        onChange={(e) => updateSupplier(supplier.id, 'containerType', e.target.value as any)}
                        className="w-full h-7 px-2 border border-cyan-400 rounded text-xs font-bold focus:border-[#F96302] outline-none bg-white"
                      >
                        <option value="20GP">20GP</option>
                        <option value="40GP">40GP</option>
                        <option value="40HQ">40HQ</option>
                      </select>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-cyan-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">
                    <div className="text-[10px] text-gray-500 ml-4">× Containers Qty</div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`container-qty-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.containerQty || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'containerQty', parseInt(e.target.value) || 0)}
                        className="w-full h-7 px-2 border border-cyan-400 rounded text-xs font-bold focus:border-[#F96302] outline-none bg-white"
                        min="1"
                      />
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-cyan-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">
                    <div className="text-[10px] text-gray-500 ml-4">× Cost per Container</div>
                  </td>
                  {calculations.map(({ supplier }) => (
                    <td key={`cost-per-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.costPerContainer || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'costPerContainer', parseFloat(e.target.value) || 0)}
                        className="w-full h-7 px-2 border border-cyan-400 rounded text-xs font-bold focus:border-[#F96302] outline-none bg-white"
                      />
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-200 hover:bg-gray-50 bg-cyan-100">
                  <td className="px-3 py-2 text-gray-700 border-r border-gray-200">
                    <div className="font-bold text-[10px] text-gray-500 ml-4">= Total Ocean Freight</div>
                  </td>
                  {calculations.map(({ calc, supplier }) => (
                    <td key={`total-freight-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="font-bold text-cyan-700">
                        ${calc.freight.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {supplier.containerQty} × ${supplier.costPerContainer}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Import Duty */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-yellow-50">
                  <td className="px-3 py-2 text-gray-700 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span>+ Import Duty</span>
                      <input
                        type="number"
                        value={importDutyRate}
                        onChange={(e) => setImportDutyRate(parseFloat(e.target.value) || 0)}
                        className="w-16 h-6 px-2 border border-yellow-400 rounded text-xs font-bold text-center focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none bg-white"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`duty-${index}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="font-medium text-gray-700">${calc.dutyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] text-gray-500">on ${calc.dutyBase.toLocaleString()}</div>
                    </td>
                  ))}
                </tr>

                {/* Insurance */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-yellow-50">
                  <td className="px-3 py-2 text-gray-700 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span>+ Insurance</span>
                      <input
                        type="number"
                        value={insuranceRate}
                        onChange={(e) => setInsuranceRate(parseFloat(e.target.value) || 0)}
                        className="w-16 h-6 px-2 border border-yellow-400 rounded text-xs font-bold text-center focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none bg-white"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`insurance-${index}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="font-medium text-gray-700">${calc.insurance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </td>
                  ))}
                </tr>

                {/* Clearance + Bank Fees */}
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Clearance & Broker</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`clearance-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.clearance || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'clearance', parseFloat(e.target.value) || 0)}
                        className="w-full h-7 px-2 border border-gray-300 rounded text-xs font-medium focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                      />
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Bank Fees</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`bank-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.bankFees || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'bankFees', parseFloat(e.target.value) || 0)}
                        className="w-full h-7 px-2 border border-gray-300 rounded text-xs font-medium focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                      />
                    </td>
                  ))}
                </tr>

                {/* Subtotal */}
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <td className="px-3 py-2 font-bold text-gray-900 border-r border-gray-300">Subtotal</td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`subtotal-${index}`} className="px-3 py-2 font-bold text-gray-900 border-r border-gray-300">
                      ${calc.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>

                {/* VAT */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-yellow-50">
                  <td className="px-3 py-2 text-gray-700 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span>+ VAT</span>
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                        className="w-16 h-6 px-2 border border-yellow-400 rounded text-xs font-bold text-center focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none bg-white"
                        step="0.1"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`vat-${index}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="font-medium text-gray-700">${calc.vat.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </td>
                  ))}
                </tr>

                {/* TOTAL LANDED COST */}
                <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-y-2 border-blue-700">
                  <td className="px-3 py-2 font-bold uppercase tracking-wide border-r border-blue-700">Total Landed Cost</td>
                  {calculations.map(({ supplier, calc }) => (
                    <td key={`total-${supplier.id}`} className="px-3 py-2 border-r border-blue-700">
                      <div className="text-xl font-bold">${calc.totalLanded.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </td>
                  ))}
                </tr>

                {/* 🔥 隐性成本 */}
                {showHiddenCosts && (
                  <>
                    <tr className="bg-rose-50 border-b border-rose-200">
                      <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-rose-900 text-xs">
                        💸 HIDDEN COSTS (Often Overlooked!)
                      </td>
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50 bg-rose-50">
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Quality Inspection Cost</td>
                      {calculations.map(({ supplier }) => (
                        <td key={`qic-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                          <input
                            type="number"
                            value={supplier.qualityInspectionCost || ''}
                            onChange={(e) => updateSupplier(supplier.id, 'qualityInspectionCost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full h-7 px-2 border border-rose-300 rounded text-xs font-medium text-rose-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50 bg-rose-50">
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Expected Defect Cost</td>
                      {calculations.map(({ supplier }) => (
                        <td key={`edc-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                          <input
                            type="number"
                            value={supplier.expectedDefectCost || ''}
                            onChange={(e) => updateSupplier(supplier.id, 'expectedDefectCost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full h-7 px-2 border border-rose-300 rounded text-xs font-medium text-rose-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50 bg-rose-50">
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Inventory Holding Cost</td>
                      {calculations.map(({ supplier }) => (
                        <td key={`ihc-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                          <input
                            type="number"
                            value={supplier.inventoryHoldingCost || ''}
                            onChange={(e) => updateSupplier(supplier.id, 'inventoryHoldingCost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full h-7 px-2 border border-rose-300 rounded text-xs font-medium text-rose-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50 bg-rose-50">
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Communication Cost</td>
                      {calculations.map(({ supplier }) => (
                        <td key={`cc-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                          <input
                            type="number"
                            value={supplier.communicationCost || ''}
                            onChange={(e) => updateSupplier(supplier.id, 'communicationCost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full h-7 px-2 border border-rose-300 rounded text-xs font-medium text-rose-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="border-b border-gray-100 hover:bg-gray-50 bg-rose-50">
                      <td className="px-3 py-2 text-gray-600 border-r border-gray-200">+ Late Delivery Cost</td>
                      {calculations.map(({ supplier }) => (
                        <td key={`ldc-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                          <input
                            type="number"
                            value={supplier.lateDeliveryCost || ''}
                            onChange={(e) => updateSupplier(supplier.id, 'lateDeliveryCost', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full h-7 px-2 border border-rose-300 rounded text-xs font-medium text-rose-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                          />
                        </td>
                      ))}
                    </tr>

                    <tr className="bg-rose-100 border-b-2 border-rose-300">
                      <td className="px-3 py-2 font-bold text-rose-900 border-r border-rose-300">Total Hidden Costs</td>
                      {calculations.map(({ calc }, index) => (
                        <td key={`thc-${index}`} className="px-3 py-2 font-bold text-rose-900 border-r border-rose-300">
                          ${calc.totalHiddenCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* TRUE TOTAL COST */}
                <tr className="bg-gradient-to-r from-[#F96302] to-orange-600 text-white border-y-4 border-orange-700">
                  <td className="px-3 py-3 font-bold uppercase tracking-wide border-r border-orange-700">
                    ⭐ TRUE TOTAL COST (TCO)
                  </td>
                  {calculations.map(({ supplier, calc }) => {
                    const isLowest = lowestCost?.supplier.id === supplier.id && supplier.fobPrice > 0;
                    return (
                      <td key={`true-total-${supplier.id}`} className="px-3 py-3 border-r border-orange-700">
                        <div className="flex items-center gap-2">
                          {isLowest && <Award className="w-4 h-4" />}
                          <div className="text-2xl font-bold">${calc.trueTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        </div>
                        {isLowest && <div className="text-[10px] mt-1 font-semibold">LOWEST TCO</div>}
                      </td>
                    );
                  })}
                </tr>

                {/* 💰 利润分析 */}
                <tr className="bg-emerald-50 border-b border-emerald-200">
                  <td colSpan={suppliers.length + 1} className="px-3 py-1.5 font-bold text-emerald-900 text-xs">
                    💰 YOUR PROFIT ANALYSIS
                  </td>
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-emerald-50">
                  <td className="px-3 py-2 text-gray-700 font-semibold border-r border-gray-200">Target Profit Margin %</td>
                  {calculations.map(({ supplier }) => (
                    <td key={`profit-margin-${supplier.id}`} className="px-3 py-2 border-r border-gray-200">
                      <input
                        type="number"
                        value={supplier.profitMarginPercent || ''}
                        onChange={(e) => updateSupplier(supplier.id, 'profitMarginPercent', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full h-7 px-2 border border-emerald-400 rounded text-xs font-bold text-emerald-700 focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                      />
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-emerald-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">→ Your Selling Price</td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`selling-price-${index}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="text-lg font-bold text-blue-700">${calc.sellingPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </td>
                  ))}
                </tr>

                <tr className="border-b border-gray-100 hover:bg-gray-50 bg-emerald-50">
                  <td className="px-3 py-2 text-gray-600 border-r border-gray-200">→ Your Profit Amount</td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`profit-amount-${index}`} className="px-3 py-2 border-r border-gray-200">
                      <div className="text-lg font-bold text-emerald-700">${calc.profitAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </td>
                  ))}
                </tr>

                <tr className="bg-emerald-100 border-b-2 border-emerald-300">
                  <td className="px-3 py-2 font-bold text-emerald-900 border-r border-emerald-300">→ ROI (Return on Investment)</td>
                  {calculations.map(({ calc }, index) => (
                    <td key={`roi-${index}`} className="px-3 py-2 font-bold text-emerald-900 border-r border-emerald-300">
                      {calc.roi.toFixed(1)}%
                    </td>
                  ))}
                </tr>

                {/* Savings */}
                <tr className="bg-purple-50 border-b-2 border-purple-200">
                  <td className="px-3 py-2 font-bold text-purple-900 border-r border-purple-200">Savings vs Base</td>
                  {calculations.map(({ supplier, calc }) => {
                    const trueSavings = calculations[0].calc.trueTotal - calc.trueTotal;
                    const isSavings = trueSavings > 0;
                    const isLoss = trueSavings < 0;
                    return (
                      <td key={`savings-${supplier.id}`} className="px-3 py-2 border-r border-purple-200">
                        {supplier.isBaseQuote ? (
                          <div className="text-gray-500 font-medium">--</div>
                        ) : (
                          <div>
                            <div className={`text-lg font-bold ${isSavings ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-600'}`}>
                              {isSavings ? '+' : ''}{isLoss ? '-' : ''}${Math.abs(trueSavings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className={`text-[10px] font-semibold ${isSavings ? 'text-green-600' : isLoss ? 'text-red-600' : 'text-gray-600'}`}>
                              {trueSavings !== 0 ? `${((trueSavings / calculations[0].calc.trueTotal) * 100).toFixed(1)}%` : '--'}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 🔥 综合评分 */}
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-y-4 border-indigo-700">
                  <td className="px-3 py-3 font-bold uppercase tracking-wide border-r border-indigo-700">
                    <div className="flex items-center gap-2">
                      <span>🏆 OVERALL SCORE</span>
                      <button
                        onClick={() => setShowScoringModal(true)}
                        className="p-0.5 hover:bg-white/20 rounded transition-colors"
                        title="Click to learn how scores are calculated"
                      >
                        <HelpCircle className="w-4 h-4 text-white/80 hover:text-white transition-colors cursor-pointer" />
                      </button>
                    </div>
                  </td>
                  {calculations.map(({ supplier, calc }) => {
                    const isBest = bestOverall?.supplier.id === supplier.id && supplier.fobPrice > 0;
                    return (
                      <td key={`overall-${supplier.id}`} className="px-3 py-3 border-r border-indigo-700">
                        <div className="flex items-center gap-2">
                          {isBest && <Award className="w-5 h-5" />}
                          <div>
                            <div className="text-3xl font-bold">{calc.overallScore.toFixed(0)}</div>
                            <div className="text-[10px] mt-0.5">
                              P:{calc.priceScore.toFixed(0)} Q:{calc.qualityScore.toFixed(0)} D:{calc.deliveryScore.toFixed(0)} S:{calc.serviceScore.toFixed(0)}
                            </div>
                          </div>
                        </div>
                        {isBest && <div className="text-[10px] mt-1 font-semibold">BEST OVERALL</div>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          {suppliers.length > 3 && (
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 text-center">
              <span className="text-xs font-semibold text-blue-700">← Scroll horizontally to view all {suppliers.length} suppliers →</span>
            </div>
          )}
        </div>
          )}
        </div>
      )}

      {/* 智能建议 */}
      {calculations.length > 1 && lowestCost && bestOverall && calculations.some(c => c.supplier.fobPrice > 0 && !c.supplier.isBaseQuote) && (
        <div className="grid grid-cols-2 gap-3">
          {/* 最低TCO */}
          <div className="border-l-4 p-4 bg-green-50 border-green-500">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-green-500">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1 text-green-900">
                  💰 Lowest True Total Cost: {lowestCost.supplier.name}
                </h3>
                <p className="text-xs text-green-800">
                  TCO: ${lowestCost.calc.trueTotal.toLocaleString()} 
                  {maxSavings > 0 && ` (Save $${maxSavings.toLocaleString()} vs current)`}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Hidden Costs: ${lowestCost.calc.totalHiddenCost.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 综合最优 */}
          <div className={`border-l-4 p-4 ${
            bestOverall.calc.recommendationLevel === 'Highly Recommended' ? 'bg-orange-50 border-orange-500' :
            bestOverall.calc.recommendationLevel === 'Recommended' ? 'bg-blue-50 border-blue-500' :
            bestOverall.calc.recommendationLevel === 'Acceptable' ? 'bg-yellow-50 border-yellow-500' :
            'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                bestOverall.calc.recommendationLevel === 'Highly Recommended' ? 'bg-orange-500' :
                bestOverall.calc.recommendationLevel === 'Recommended' ? 'bg-blue-500' :
                bestOverall.calc.recommendationLevel === 'Acceptable' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}>
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm mb-1 ${
                  bestOverall.calc.recommendationLevel === 'Highly Recommended' ? 'text-orange-900' :
                  bestOverall.calc.recommendationLevel === 'Recommended' ? 'text-blue-900' :
                  bestOverall.calc.recommendationLevel === 'Acceptable' ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  🏆 {bestOverall.calc.recommendationLevel}: {bestOverall.supplier.name}
                </h3>
                <p className={`text-xs ${
                  bestOverall.calc.recommendationLevel === 'Highly Recommended' ? 'text-orange-800' :
                  bestOverall.calc.recommendationLevel === 'Recommended' ? 'text-blue-800' :
                  bestOverall.calc.recommendationLevel === 'Acceptable' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  Overall Score: {bestOverall.calc.overallScore.toFixed(0)}/100 
                  (Price:{bestOverall.calc.priceScore.toFixed(0)} Quality:{bestOverall.calc.qualityScore.toFixed(0)} Delivery:{bestOverall.calc.deliveryScore.toFixed(0)} Service:{bestOverall.calc.serviceScore.toFixed(0)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      {suppliers.length === 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">Strategic Procurement Decision Framework:</p>
              <ol className="text-xs text-blue-800 space-y-0.5">
                <li><strong>1.</strong> Select a received quotation</li>
                <li><strong>2.</strong> Add competitors (up to 8 suppliers)</li>
                <li><strong>3.</strong> Configure Decision Factors: quality, delivery reliability, service responsiveness</li>
                <li><strong>4.</strong> Enter cost data: FOB, ocean freight (container type/qty/cost), fees</li>
                <li><strong>5.</strong> Input Hidden Costs: quality inspection, defects, inventory holding, communication, late delivery</li>
                <li><strong>6.</strong> Set your target profit margin % to calculate selling price and profit amount</li>
                <li><strong>7.</strong> Adjust scoring weights to match your priorities</li>
                <li><strong>8.</strong> Compare TCO + Profit + Overall Score to make the optimal decision</li>
              </ol>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔥 可拖动的评分说明模态窗口 */}
      {showScoringModal && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={() => setShowScoringModal(false)}
          />
          
          {/* 可拖动弹窗 */}
          <div
            className="fixed bg-white text-gray-800 rounded-lg shadow-2xl border-2 border-indigo-300 z-[9999] flex flex-col"
            style={{
              left: `${modalPosition.x}px`,
              top: `${modalPosition.y}px`,
              width: '900px',
              maxHeight: '80vh',
              cursor: isDragging ? 'grabbing' : 'default'
            }}
          >
            {/* 可拖动的标题栏 */}
            <div
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg cursor-grab active:cursor-grabbing flex items-center justify-between border-b-2 border-indigo-700"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold">📊 Comprehensive Scoring System - How Overall Score is Calculated</h3>
              </div>
              <button
                onClick={() => setShowScoringModal(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Close (ESC)"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* 可滚动内容区域 */}
            <div className="overflow-y-auto p-5" style={{ maxHeight: 'calc(80vh - 60px)' }}>
              {/* 核心公式 */}
              <div className="mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="text-xs font-bold text-indigo-900 mb-2">🎯 Core Formula: Weighted Average</div>
                <div className="text-xs text-gray-700 font-mono bg-white px-3 py-2 rounded border border-indigo-100">
                  Overall Score = (Price×W₁ + Quality×W₂ + Delivery×W₃ + Service×W₄ + Risk×W₅ + Strategic×W₆) ÷ Total Weight
                </div>
                <div className="text-xs text-gray-600 mt-2 italic">
                  All scores range 0-100. Weights automatically adjust based on your account type.
                </div>
              </div>

              {/* 六大维度 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* 价格得分 */}
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                  <div className="text-xs font-bold text-orange-700 mb-1.5">💰 1. Price Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    100 - ((Your TCO - Lowest TCO) / Lowest TCO × 100)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• Based on <span className="font-semibold">True Total Cost</span> (Landed + Hidden Costs)</div>
                    <div>• Lowest supplier gets 100, others scored relatively</div>
                    <div>• Example: Lowest $10k=100, Your $11k=90, High $12k=80</div>
                  </div>
                </div>

                {/* 质量得分 */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-xs font-bold text-blue-700 mb-1.5">⭐ 2. Quality Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    (Rating×15) + (Pass Rate×0.4) + ((100-Defect)×0.3) + ((10-Gap)×2) + (History×0.15)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• <span className="font-semibold">Rating 5★</span> → 75pts | <span className="font-semibold">Pass 100%</span> → 40pts</div>
                    <div>• <span className="font-semibold">Defect 0%</span> → 30pts | <span className="font-semibold">Sample Gap 0</span> → 20pts</div>
                    <div>• <span className="font-semibold">History 100</span> → 15pts | Total: up to 180pts (capped 100)</div>
                  </div>
                </div>

                {/* 交付得分 */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-xs font-bold text-green-700 mb-1.5">🚚 3. Delivery Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    (On-Time Rate × 0.6) + (Max(0, 100 - Lead Days) × 0.4)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• <span className="font-semibold">On-Time 60%</span>: Reliability &gt; Speed</div>
                    <div>• <span className="font-semibold">Lead Time 40%</span>: Shorter is better</div>
                    <div>• Example: 95% on-time, 15 days → 95×0.6+(100-15)×0.4=<span className="font-semibold">91pts</span></div>
                  </div>
                </div>

                {/* 服务得分 */}
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <div className="text-xs font-bold text-purple-700 mb-1.5">🤝 4. Service Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    (Service×15) + (Comm×10) + (Flex×10) + (Payment Bonus×0.3) + (Response Bonus×0.15)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• <span className="font-semibold">Payment Terms</span>: 90d→+25 | 60d→+15 | LC→+10</div>
                    <div>• <span className="font-semibold">Response Time</span>: 1hr→+98 | 24hr→+52</div>
                    <div>• Service/Comm/Flex: Each 5★ → 15/10/10pts</div>
                  </div>
                </div>

                {/* 风险得分 */}
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-xs font-bold text-red-700 mb-1.5">🛡️ 5. Risk Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    (Financial Health × 0.4) + (Geographic Risk × 0.3) + (Capacity Safety × 0.3)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• <span className="font-semibold">Financial</span>: Excellent→100 | Good→85 | Fair→60 | Poor→30</div>
                    <div>• <span className="font-semibold">Geographic</span>: Low→90 | Medium→60 | High→30</div>
                    <div>• <span className="font-semibold">Capacity</span>: &lt;80%→100 | 80-95%→70 | &gt;95%→40</div>
                  </div>
                </div>

                {/* 战略得分 */}
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="text-xs font-bold text-yellow-700 mb-1.5">🎯 6. Strategic Score (0-100)</div>
                  <div className="text-xs text-gray-700 mb-1.5 font-mono bg-white px-2 py-1 rounded">
                    (Innovation×18) + (Partnership×18) + (Exclusivity?30:0) + (History×0.34)
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <div>• <span className="font-semibold">Innovation 5</span> → 90pts | <span className="font-semibold">Partnership 5</span> → 90pts</div>
                    <div>• <span className="font-semibold">Exclusive Supply</span> → +30pts bonus</div>
                    <div>• <span className="font-semibold">Past Performance 100</span> → 34pts</div>
                  </div>
                </div>
              </div>

              {/* 推荐等级 */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-300">
                <div className="text-xs font-bold text-gray-800 mb-2">🏆 Recommendation Levels</div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div className="bg-green-100 border border-green-300 px-2 py-1 rounded text-center">
                    <div className="font-bold text-green-700">≥85</div>
                    <div className="text-green-600">Highly Rec.</div>
                  </div>
                  <div className="bg-blue-100 border border-blue-300 px-2 py-1 rounded text-center">
                    <div className="font-bold text-blue-700">75-84</div>
                    <div className="text-blue-600">Recommended</div>
                  </div>
                  <div className="bg-yellow-100 border border-yellow-300 px-2 py-1 rounded text-center">
                    <div className="font-bold text-yellow-700">65-74</div>
                    <div className="text-yellow-600">Acceptable</div>
                  </div>
                  <div className="bg-orange-100 border border-orange-300 px-2 py-1 rounded text-center">
                    <div className="font-bold text-orange-700">50-64</div>
                    <div className="text-orange-600">Caution</div>
                  </div>
                  <div className="bg-red-100 border border-red-300 px-2 py-1 rounded text-center">
                    <div className="font-bold text-red-700">&lt;50</div>
                    <div className="text-red-600">Not Rec.</div>
                  </div>
                </div>
              </div>

              {/* 权重策略说明 */}
              <div className="mt-3 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="text-xs font-bold text-indigo-900 mb-2">⚙️ Weight Strategy Auto-Applied</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-gray-700">
                    <span className="font-semibold text-orange-600">Price-Sensitive</span> (50%): Wholesaler, Distributor
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-gray-600">Balanced</span> (35%): Retailer, Importer
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-yellow-600">Quality-First</span> (45%): Brand Owner
                  </div>
                  <div className="text-gray-700">
                    <span className="font-semibold text-blue-600">Fast-Delivery</span> (40%): E-commerce
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-2 italic">
                  💡 Adjust weights manually in "Configure Scoring Weights" to customize your evaluation criteria.
                </div>
              </div>
            </div>

            {/* 底部提示 */}
            <div className="px-5 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200 text-center">
              <span className="text-xs text-gray-600">
                💡 <span className="font-semibold">Pro Tip:</span> Drag the title bar to move this window. Click outside or press ESC to close.
              </span>
            </div>
          </div>
        </>
      )}

      {/* 🔥 图表对比弹窗 */}
      {showChartsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setShowChartsModal(false)}
          />
          
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border-2 border-blue-300 z-[9999] w-[1200px] max-h-[90vh] overflow-y-auto">
            {/* 标题栏 */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex items-center justify-between border-b-2 border-blue-700">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                <h2 className="text-lg font-bold">📊 Multi-Dimensional Supplier Comparison</h2>
              </div>
              <button
                onClick={() => setShowChartsModal(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* 图表内容 */}
            <div className="p-6 space-y-6">
              {/* 雷达图 - 六大维度对比 */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Six-Dimensional Score Radar Chart
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={[
                    {
                      dimension: 'Price',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.priceScore
                        ])
                      )
                    },
                    {
                      dimension: 'Quality',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.qualityScore
                        ])
                      )
                    },
                    {
                      dimension: 'Delivery',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.deliveryScore
                        ])
                      )
                    },
                    {
                      dimension: 'Service',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.serviceScore
                        ])
                      )
                    },
                    {
                      dimension: 'Risk',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.riskScore
                        ])
                      )
                    },
                    {
                      dimension: 'Strategic',
                      ...Object.fromEntries(
                        calculations.slice(0, 5).map(({ supplier, calc }, idx) => [
                          `supplier${idx}`,
                          calc.strategicScore
                        ])
                      )
                    }
                  ]}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#374151', fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    {calculations.slice(0, 5).map(({ supplier }, idx) => (
                      <Radar
                        key={idx}
                        name={supplier.name}
                        dataKey={`supplier${idx}`}
                        stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx]}
                        fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 柱状图 - 综合评分对比 */}
              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  Overall Score Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={calculations.map(({ supplier, calc }) => ({
                    name: supplier.name,
                    'Overall Score': calc.overallScore,
                    'Price': calc.priceScore,
                    'Quality': calc.qualityScore,
                    'Delivery': calc.deliveryScore
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                    <Bar dataKey="Overall Score" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Price" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Quality" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Delivery" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 成本结构对比 */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  Cost Structure Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={calculations.map(({ supplier, calc }) => ({
                    name: supplier.name,
                    'FOB': calc.fob,
                    'Freight': calc.freight,
                    'Duty': calc.dutyAmount,
                    'Hidden Costs': calc.hiddenCosts
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                    <Bar dataKey="FOB" stackId="a" fill="#60a5fa" />
                    <Bar dataKey="Freight" stackId="a" fill="#34d399" />
                    <Bar dataKey="Duty" stackId="a" fill="#fbbf24" />
                    <Bar dataKey="Hidden Costs" stackId="a" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 text-center">
              <span className="text-xs text-gray-600">
                💡 <span className="font-semibold">Tip:</span> Use these charts to quickly identify the best supplier across multiple dimensions.
              </span>
            </div>
          </div>
        </>
      )}

      {/* 🔥 历史记录弹窗 */}
      {showHistoryModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[9998]"
            onClick={() => setShowHistoryModal(false)}
          />
          
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl border-2 border-green-300 z-[9999] w-[1000px] max-h-[80vh] overflow-y-auto">
            {/* 标题栏 */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg flex items-center justify-between border-b-2 border-green-700">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6" />
                <h2 className="text-lg font-bold">📂 My Saved Profit Analyses</h2>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* 历史记录列表 */}
            <div className="p-6">
              {isLoadingHistory ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading saved analyses...</p>
                </div>
              ) : savedAnalyses.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">No saved analyses found</p>
                  <p className="text-gray-500 text-sm mt-2">Save your first analysis to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAnalyses.map((analysis, index) => (
                    <div
                      key={analysis.id}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-lg p-4 transition-all cursor-pointer"
                      onClick={() => loadSavedAnalysis(analysis)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">
                                Quotation: {analysis.quotationNumber}
                              </h4>
                              <p className="text-xs text-gray-600">
                                Saved: {new Date(analysis.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                            <div className="bg-white rounded px-3 py-2 border border-gray-200">
                              <div className="text-gray-500">Suppliers</div>
                              <div className="font-bold text-gray-800">{analysis.suppliers?.length || 0}</div>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-gray-200">
                              <div className="text-gray-500">Quantity</div>
                              <div className="font-bold text-gray-800">{analysis.quantity?.toLocaleString() || 'N/A'}</div>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-gray-200">
                              <div className="text-gray-500">Strategy</div>
                              <div className="font-bold text-gray-800">{analysis.customerType || 'N/A'}</div>
                            </div>
                            <div className="bg-white rounded px-3 py-2 border border-gray-200">
                              <div className="text-gray-500">Best Score</div>
                              <div className="font-bold text-green-600">
                                {analysis.calculations?.[0]?.overallScore?.toFixed(0) || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadSavedAnalysis(analysis);
                          }}
                        >
                          Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200 text-center">
              <span className="text-xs text-gray-600">
                💡 <span className="font-semibold">Tip:</span> Click on any saved analysis to load it back into the analyzer.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
