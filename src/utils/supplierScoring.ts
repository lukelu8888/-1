/**
 * 🔥 供应商智能评分系统
 * 
 * 功能：
 * 1. 多维度评分（价格、交期、账期、MOQ、信用、品质）
 * 2. 综合得分计算
 * 3. AI智能推荐
 * 4. 风险评估
 */

import { buildSourcePricingBasis, normalizePriceType, normalizeCurrencyByPriceType, type PricingTaxSettings, type SourcePricingBasis } from '../types/pricingBasis';

export const SMART_COMPARISON_SCORING_POLICY = {
  baseWeights: {
    priceScore: 40,
    leadTimeScore: 20,
    paymentScore: 15,
    moqScore: 10,
    supplierCreditScore: 10,
    qualityScore: 5,
  },
  weightDescriptions: {
    priceScore: '价格越低得分越高',
    leadTimeScore: '交期越短得分越高',
    paymentScore: '账期越长得分越高',
    moqScore: 'MOQ越低得分越高',
    supplierCreditScore: '优先使用历史评级，否则退回默认值',
    qualityScore: '优先使用历史质量表现，否则退回默认值',
  },
  performanceAdjustmentBands: [
    { minScore: 90, adjustment: 8 },
    { minScore: 80, adjustment: 6 },
    { minScore: 70, adjustment: 4 },
    { minScore: 60, adjustment: 2 },
    { minScore: 50, adjustment: 0 },
    { minScore: 40, adjustment: -2 },
    { minScore: 30, adjustment: -4 },
    { minScore: 0, adjustment: -6 },
  ],
  historicalPriceDeviationThresholds: {
    watchPct: 8,
    alertPct: 15,
  },
} as const;

function assertSmartComparisonPolicy() {
  const totalWeight = Object.values(SMART_COMPARISON_SCORING_POLICY.baseWeights)
    .reduce((sum, weight) => sum + weight, 0);

  if (totalWeight !== 100) {
    throw new Error(`SMART_COMPARISON_SCORING_POLICY.baseWeights 必须合计 100，当前为 ${totalWeight}`);
  }

  const { watchPct, alertPct } = SMART_COMPARISON_SCORING_POLICY.historicalPriceDeviationThresholds;
  if (watchPct <= 0 || alertPct <= watchPct) {
    throw new Error('SMART_COMPARISON_SCORING_POLICY.historicalPriceDeviationThresholds 配置无效');
  }

  const bands = SMART_COMPARISON_SCORING_POLICY.performanceAdjustmentBands;
  for (let index = 1; index < bands.length; index += 1) {
    if (bands[index - 1].minScore <= bands[index].minScore) {
      throw new Error('SMART_COMPARISON_SCORING_POLICY.performanceAdjustmentBands 必须按 minScore 降序排列');
    }
  }
}

assertSmartComparisonPolicy();

export const SMART_COMPARISON_SCORE_WEIGHTS = [
  {
    key: 'priceScore',
    label: '价格',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.priceScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.priceScore,
  },
  {
    key: 'leadTimeScore',
    label: '交期',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.leadTimeScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.leadTimeScore,
  },
  {
    key: 'paymentScore',
    label: '账期',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.paymentScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.paymentScore,
  },
  {
    key: 'moqScore',
    label: 'MOQ',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.moqScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.moqScore,
  },
  {
    key: 'supplierCreditScore',
    label: '供应商信用',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.supplierCreditScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.supplierCreditScore,
  },
  {
    key: 'qualityScore',
    label: '品质',
    weight: SMART_COMPARISON_SCORING_POLICY.baseWeights.qualityScore,
    description: SMART_COMPARISON_SCORING_POLICY.weightDescriptions.qualityScore,
  },
] as const;

export type ScoreEvidenceSource = 'quoted' | 'history' | 'default';
export type HistoricalPriceDeviationLevel = 'normal' | 'watch' | 'alert';

interface SupplierScoreAssessment {
  score: number;
  source: Exclude<ScoreEvidenceSource, 'quoted'>;
}

export interface HistoricalBenchmarkReference {
  sampleCount: number;
  sameSupplierSampleCount: number;
  marketMinUnitPrice?: number | null;
  marketAvgUnitPrice?: number | null;
  sameSupplierAvgUnitPrice?: number | null;
  latestKnownUnitPrice?: number | null;
  latestKnownQuoteDate?: string | null;
}

export interface SupplierPerformanceReference {
  historicalPurchaseOrderCount: number;
  qcPassCount: number;
  qcFailCount: number;
  supplierSelfInspectionPassCount: number;
  supplierSelfInspectionFailCount: number;
  averageOverallRating?: number | null;
  averageDeliveryRating?: number | null;
  qualityIssueCount: number;
  deliveryIssueCount: number;
}

// 🔥 供应商报价对比项
export interface SupplierQuotationForComparison {
  bjNumber: string;
  xjNumber?: string;
  supplierId: string;
  supplierCode?: string;
  supplierName: string;
  supplierCompany?: string;
  
  // 产品信息
  productId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  
  // 报价信息
  unitPrice: number;
  totalAmount: number;
  currency: string;
  leadTime: number; // 天数
  moq: number;
  paymentTerms: string;
  deliveryTerms?: string;
  warranty?: string;
  priceType?: 'usd' | 'cny_no_tax' | 'cny_with_tax';
  quoteMode?: string;
  taxSettings?: PricingTaxSettings;
  pricingBasis?: SourcePricingBasis;
  leadTimeSource?: ScoreEvidenceSource;
  moqSource?: ScoreEvidenceSource;
  paymentTermsSource?: ScoreEvidenceSource;
  supplierCreditSource?: ScoreEvidenceSource;
  qualitySource?: ScoreEvidenceSource;
  historicalBenchmark?: HistoricalBenchmarkReference | null;
  historicalPriceDeltaPct?: number | null;
  historicalPriceDeviationLevel?: HistoricalPriceDeviationLevel | null;
  supplierPerformance?: SupplierPerformanceReference | null;
  supplierPerformanceScore?: number | null;
  supplierPerformanceAdjustment?: number;
  baseTotalScore?: number;
  
  // 🔥 评分维度
  priceScore: number;        // 价格得分 (0-100)
  leadTimeScore: number;     // 交期得分 (0-100)
  paymentScore: number;      // 账期得分 (0-100)
  moqScore: number;          // MOQ得分 (0-100)
  supplierCreditScore: number; // 供应商信用得分 (0-100)
  qualityScore: number;      // 品质得分 (0-100)
  
  // 🔥 综合评估
  totalScore: number;        // 综合得分 (0-100)
  isRecommended: boolean;    // 是否AI推荐
  riskLevel: 'low' | 'medium' | 'high';
  recommendReason?: string;  // AI推荐理由
  warnings?: string[];       // 风险提示
}

// 🔥 产品级比价结果
export interface ProductComparison {
  productId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  
  // 该产品的所有供应商报价
  quotations: SupplierQuotationForComparison[];
  
  // 🔥 采购员选择
  selectedBJNumber?: string;  // 采购员选中的BJ编号
  purchaserRemarks?: string;  // 采购员备注（为什么选这个）
  
  // 🔥 智能推荐
  recommendedBJNumber?: string; // AI推荐的BJ编号
  
  // 统计信息
  quotationCount: number;     // 收到报价数量
  priceRange: { min: number; max: number; currency: string };
  avgLeadTime: number;
}

// 🔥 整体比价结果
export interface SmartComparisonResult {
  qrNumber: string;
  products: ProductComparison[];
  
  // 🔥 汇总信息（基于采购员选择）
  totalCost: number;
  currency: string;
  avgLeadTime: number;
  overallRisk: 'low' | 'medium' | 'high';
  suggestedMargin: number;
  
  // 统计
  totalQuotations: number;    // 总报价数
  selectedQuotations: number; // 已选择数
  
  // 时间戳
  comparisonDate: string;
}

/**
 * 🔥 计算账期评分
 * 账期越长，得分越高（对采购方越有利）
 */
export function calculatePaymentTermsScore(paymentTerms: string): number {
  const terms = paymentTerms.toLowerCase();
  
  // 90天账期
  if (terms.includes('90') && (terms.includes('天') || terms.includes('day'))) {
    return 100;
  }
  
  // 60天账期
  if (terms.includes('60') && (terms.includes('天') || terms.includes('day'))) {
    return 95;
  }
  
  // 45天账期
  if (terms.includes('45') && (terms.includes('天') || terms.includes('day'))) {
    return 90;
  }
  
  // 30天账期
  if (terms.includes('30') && (terms.includes('天') || terms.includes('day'))) {
    return 85;
  }
  
  // 50% + 50%
  if (terms.includes('50%') || terms.includes('50')) {
    return 70;
  }
  
  // 30% + 70%
  if (terms.includes('30%') || (terms.includes('30') && terms.includes('70'))) {
    return 60;
  }
  
  // 100% 预付
  if (terms.includes('100%') || terms.includes('全额')) {
    return 40;
  }
  
  // L/C 信用证
  if (terms.includes('l/c') || terms.includes('信用证')) {
    return 75;
  }
  
  // 月结
  if (terms.includes('月结')) {
    return 85;
  }
  
  // 默认
  return 50;
}

function getStoredSupplierProfile(supplierId: string, supplierName: string) {
  const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
  return suppliers.find((s: any) =>
    s.id === supplierId || s.code === supplierId || s.name === supplierName
  );
}

/**
 * 🔥 获取供应商信用评分
 * TODO: 从历史合作数据中获取真实评分
 */
export function getSupplierCreditScore(supplierId: string, supplierName: string): number {
  return getSupplierCreditAssessment(supplierId, supplierName).score;
}

export function getSupplierCreditAssessment(supplierId: string, supplierName: string): SupplierScoreAssessment {
  const supplier = getStoredSupplierProfile(supplierId, supplierName);
  if (supplier && supplier.creditRating) {
    // A级 = 95, B级 = 85, C级 = 70, D级 = 50
    const ratingMap: { [key: string]: number } = {
      'A': 95,
      'B': 85,
      'C': 70,
      'D': 50,
      'A+': 100,
      'B+': 90,
      'C+': 75
    };
    return {
      score: ratingMap[supplier.creditRating] || 75,
      source: 'history',
    };
  }
  
  // 默认中等信用
  return {
    score: 75,
    source: 'default',
  };
}

/**
 * 🔥 获取供应商品质评分
 * TODO: 从历史质检数据中获取真实评分
 */
export function getSupplierQualityScore(supplierId: string, supplierName: string): number {
  return getSupplierQualityAssessment(supplierId, supplierName).score;
}

export function getSupplierQualityAssessment(supplierId: string, supplierName: string): SupplierScoreAssessment {
  const supplier = getStoredSupplierProfile(supplierId, supplierName);
  if (supplier && supplier.qualityRating) {
    // 5星 = 100, 4星 = 85, 3星 = 70, 2星 = 50, 1星 = 30
    const stars = parseInt(supplier.qualityRating) || 3;
    return {
      score: 30 + (stars - 1) * 17.5,
      source: 'history',
    };
  }
  
  // 默认中等品质
  return {
    score: 70,
    source: 'default',
  };
}

/**
 * 🔥 计算单个供应商报价的综合得分
 */
export function calculateSupplierScore(
  quotation: any,
  allQuotationsForSameProduct: any[]
): {
  priceScore: number;
  leadTimeScore: number;
  paymentScore: number;
  moqScore: number;
  supplierCreditScore: number;
  qualityScore: number;
  totalScore: number;
} {
  const {
    priceScore: priceWeight,
    leadTimeScore: leadTimeWeight,
    paymentScore: paymentWeight,
    moqScore: moqWeight,
    supplierCreditScore: supplierCreditWeight,
    qualityScore: qualityWeight,
  } = SMART_COMPARISON_SCORING_POLICY.baseWeights;
  
  // 1️⃣ 价格得分 (40%) - 价格越低得分越高
  const prices = allQuotationsForSameProduct.map(q => q.unitPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceScore = maxPrice === minPrice ? 100 : 
    100 - ((quotation.unitPrice - minPrice) / (maxPrice - minPrice)) * 100;
  
  // 2️⃣ 交期得分 (20%) - 交期越短得分越高
  const leadTimes = allQuotationsForSameProduct.map(q => q.leadTime || 30);
  const minLeadTime = Math.min(...leadTimes);
  const maxLeadTime = Math.max(...leadTimes);
  const leadTimeScore = maxLeadTime === minLeadTime ? 100 :
    100 - ((quotation.leadTime - minLeadTime) / (maxLeadTime - minLeadTime)) * 100;
  
  // 3️⃣ 账期得分 (15%) - 账期越长得分越高
  const paymentScore = calculatePaymentTermsScore(quotation.paymentTerms || '');
  
  // 4️⃣ MOQ得分 (10%) - MOQ越低得分越高
  const moqs = allQuotationsForSameProduct.map(q => q.moq || quotation.quantity);
  const minMOQ = Math.min(...moqs);
  const maxMOQ = Math.max(...moqs);
  const moqScore = maxMOQ === minMOQ ? 100 :
    100 - ((quotation.moq - minMOQ) / (maxMOQ - minMOQ)) * 100;
  
  // 5️⃣ 供应商信用得分 (10%) - 从历史数据获取
  const supplierCreditAssessment = getSupplierCreditAssessment(
    quotation.supplierId || quotation.supplierCode,
    quotation.supplierName || quotation.supplierCompany
  );
  
  // 6️⃣ 品质得分 (5%)
  const qualityAssessment = getSupplierQualityAssessment(
    quotation.supplierId || quotation.supplierCode,
    quotation.supplierName || quotation.supplierCompany
  );
  
  // 🔥 综合得分（加权平均）
  const totalScore = Math.round(
    priceScore * (priceWeight / 100) +
    leadTimeScore * (leadTimeWeight / 100) +
    paymentScore * (paymentWeight / 100) +
    moqScore * (moqWeight / 100) +
    supplierCreditAssessment.score * (supplierCreditWeight / 100) +
    qualityAssessment.score * (qualityWeight / 100)
  );
  
  return {
    priceScore: Math.round(priceScore),
    leadTimeScore: Math.round(leadTimeScore),
    paymentScore: Math.round(paymentScore),
    moqScore: Math.round(moqScore),
    supplierCreditScore: Math.round(supplierCreditAssessment.score),
    qualityScore: Math.round(qualityAssessment.score),
    totalScore
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateSupplierPerformanceScore(
  performance?: SupplierPerformanceReference | null,
): number | null {
  if (!performance || performance.historicalPurchaseOrderCount <= 0) {
    return null;
  }

  const qcTotal = performance.qcPassCount + performance.qcFailCount;
  const qcPassRateScore = qcTotal > 0
    ? (performance.qcPassCount / qcTotal) * 100
    : null;

  const supplierInspectionTotal =
    performance.supplierSelfInspectionPassCount + performance.supplierSelfInspectionFailCount;
  const supplierInspectionScore = supplierInspectionTotal > 0
    ? (performance.supplierSelfInspectionPassCount / supplierInspectionTotal) * 100
    : null;

  const overallRatingScore = performance.averageOverallRating != null
    ? Math.max(0, Math.min(100, (performance.averageOverallRating / 5) * 100))
    : null;
  const deliveryRatingScore = performance.averageDeliveryRating != null
    ? Math.max(0, Math.min(100, (performance.averageDeliveryRating / 5) * 100))
    : null;

  const issuePenalty = Math.min(
    30,
    ((performance.qualityIssueCount * 1.5) + (performance.deliveryIssueCount * 1.5))
      / Math.max(1, performance.historicalPurchaseOrderCount) * 20,
  );
  const orderExperienceBonus = Math.min(10, performance.historicalPurchaseOrderCount * 1.5);

  const componentValues = [
    qcPassRateScore,
    supplierInspectionScore,
    overallRatingScore,
    deliveryRatingScore,
  ].filter((value): value is number => value != null);

  const componentAverage = componentValues.length > 0
    ? componentValues.reduce((sum, value) => sum + value, 0) / componentValues.length
    : 60;

  return clampScore(componentAverage + orderExperienceBonus - issuePenalty);
}

export function calculatePerformanceScoreAdjustment(performanceScore?: number | null): number {
  if (performanceScore == null) return 0;
  const matchedBand = SMART_COMPARISON_SCORING_POLICY.performanceAdjustmentBands
    .find((band) => performanceScore >= band.minScore);
  return matchedBand?.adjustment ?? 0;
}

export function calculateHistoricalPriceDeltaPct(
  unitPrice: number,
  benchmark?: HistoricalBenchmarkReference | null,
): number | null {
  const referencePrice = benchmark?.marketAvgUnitPrice;
  if (referencePrice == null || referencePrice <= 0) {
    return null;
  }
  return ((unitPrice - referencePrice) / referencePrice) * 100;
}

export function assessHistoricalPriceDeviationLevel(
  deltaPct?: number | null,
): HistoricalPriceDeviationLevel | null {
  if (deltaPct == null || !Number.isFinite(deltaPct)) {
    return null;
  }
  const thresholds = SMART_COMPARISON_SCORING_POLICY.historicalPriceDeviationThresholds;
  const absoluteDelta = Math.abs(deltaPct);
  if (absoluteDelta >= thresholds.alertPct) return 'alert';
  if (absoluteDelta >= thresholds.watchPct) return 'watch';
  return 'normal';
}

/**
 * 🔥 生成AI推荐理由
 */
export function generateRecommendReason(
  quotation: SupplierQuotationForComparison,
  allQuotations: SupplierQuotationForComparison[]
): string {
  const reasons: string[] = [];
  
  // 找出最低价、最短交期
  const prices = allQuotations.map(q => q.unitPrice);
  const leadTimes = allQuotations.map(q => q.leadTime);
  const minPrice = Math.min(...prices);
  const minLeadTime = Math.min(...leadTimes);
  
  // 综合得分排名
  const sortedByScore = [...allQuotations].sort((a, b) => b.totalScore - a.totalScore);
  const rank = sortedByScore.findIndex(q => q.bjNumber === quotation.bjNumber) + 1;
  
  if (rank === 1) {
    reasons.push('综合得分第一');
  }
  
  if (quotation.unitPrice === minPrice) {
    reasons.push('价格最低');
  } else if (quotation.unitPrice <= minPrice * 1.05) {
    reasons.push('价格接近最低价');
  }
  
  if (quotation.leadTime === minLeadTime) {
    reasons.push('交期最短');
  } else if (quotation.leadTime <= minLeadTime * 1.1) {
    reasons.push('交期较短');
  }
  
  if (quotation.paymentScore >= 85) {
    reasons.push('账期优秀');
  }
  
  if (quotation.supplierCreditScore >= 90) {
    reasons.push('供应商信用好');
  }
  
  if (quotation.qualityScore >= 85) {
    reasons.push('品质可靠');
  }

  if (quotation.supplierPerformanceScore != null) {
    if (quotation.supplierPerformanceScore >= 80) {
      reasons.push('历史履约稳定');
    } else if (quotation.supplierPerformanceScore < 45) {
      reasons.push('需关注后段履约');
    }
  }
  
  if (quotation.riskLevel === 'low') {
    reasons.push('风险低');
  }
  
  return reasons.length > 0 ? reasons.join('，') : '综合性价比较优';
}

/**
 * 🔥 评估风险等级
 */
export function assessRiskLevel(
  quotation: SupplierQuotationForComparison
): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // 价格过低风险
  if (quotation.priceScore > 95) {
    riskScore += 1; // 价格太低可能质量有问题
  }
  
  // 交期过长风险
  if (quotation.leadTime > 60) {
    riskScore += 2;
  } else if (quotation.leadTime > 45) {
    riskScore += 1;
  }
  
  // 供应商信用低风险
  if (quotation.supplierCreditScore < 60) {
    riskScore += 2;
  } else if (quotation.supplierCreditScore < 75) {
    riskScore += 1;
  }
  
  // 品质低风险
  if (quotation.qualityScore < 60) {
    riskScore += 2;
  } else if (quotation.qualityScore < 75) {
    riskScore += 1;
  }
  
  // MOQ过高风险
  if (quotation.moq > quotation.quantity * 2) {
    riskScore += 1;
  }
  
  // 综合评估
  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

/**
 * 🔥 生成风险警告
 */
export function generateWarnings(
  quotation: SupplierQuotationForComparison
): string[] {
  const warnings: string[] = [];
  
  if (quotation.leadTime > 60) {
    warnings.push(`⚠️ 交期过长（${quotation.leadTime}天），可能影响客户交付`);
  }
  
  if (quotation.moq > quotation.quantity * 1.5) {
    warnings.push(`⚠️ MOQ (${quotation.moq}) 超过需求量50%，可能产生库存压力`);
  }
  
  if (quotation.supplierCreditScore < 70) {
    warnings.push('⚠️ 供应商信用评级较低，建议谨慎合作');
  }
  
  if (quotation.qualityScore < 70) {
    warnings.push('⚠️ 供应商历史质量表现一般，建议加强质检');
  }
  
  if (quotation.paymentScore < 60) {
    warnings.push('⚠️ 付款条件不利，需提前准备资金');
  }
  
  if (quotation.priceScore > 98) {
    warnings.push('💡 价格明显低于市场，建议核实供应商资质和产品质量');
  }

  if (quotation.historicalPriceDeviationLevel === 'alert' && quotation.historicalPriceDeltaPct != null) {
    if (quotation.historicalPriceDeltaPct < 0) {
      warnings.push(`💡 较历史均价低 ${Math.abs(quotation.historicalPriceDeltaPct).toFixed(1)}%，建议确认是否存在异常低价`);
    } else {
      warnings.push(`⚠️ 较历史均价高 ${quotation.historicalPriceDeltaPct.toFixed(1)}%，建议补充涨价依据`);
    }
  }

  if (quotation.supplierPerformanceScore != null && quotation.supplierPerformanceScore < 45) {
    warnings.push('⚠️ 历史履约表现偏弱，建议结合试单、分批交付或加强验货');
  }
  
  if (quotation.riskLevel === 'high') {
    warnings.push('🔴 综合风险评级：高风险，建议先小单测试');
  }
  
  return warnings;
}

/**
 * 🔥 智能比价 - 核心函数
 * 
 * @param qrNumber QR采购需求单号
 * @param qrProducts QR中的产品列表
 * @param allBJs 所有供应商报价单列表
 * @returns 智能比价结果
 */
export function performSmartComparison(
  qrNumber: string,
  qrProducts: any[],
  allBJs: any[]
): SmartComparisonResult {
  
  console.log('🔍 开始智能比价...');
  console.log('  QR编号:', qrNumber);
  console.log('  产品数:', qrProducts.length);
  console.log('  BJ总数:', allBJs.length);
  
  const productComparisons: ProductComparison[] = [];
  
  // 🔥 遍历每个产品，找到该产品的所有供应商报价
  for (const product of qrProducts) {
    console.log(`\n  📦 处理产品: ${product.productName} (ID: ${product.id})`);
    
    // 找到所有BJ中包含该产品的报价项
    const quotations: SupplierQuotationForComparison[] = [];
    
    for (const bj of allBJs) {
      const snapshotItems = Array.isArray(bj?.documentDataSnapshot?.products)
        ? bj.documentDataSnapshot.products
        : Array.isArray(bj?.document_data_snapshot?.products)
          ? bj.document_data_snapshot.products
          : [];
      const rowItems = Array.isArray(bj?.items) ? bj.items : [];
      const candidateItems = (snapshotItems.length > 0 ? snapshotItems : rowItems).map((item: any, index: number) => {
        const fallbackRow = rowItems[index] || null;
        return {
          ...fallbackRow,
          ...item,
          productId: item?.productId || item?.id || fallbackRow?.productId || fallbackRow?.id,
          productName:
            item?.productName ||
            item?.name ||
            item?.description ||
            fallbackRow?.productName ||
            fallbackRow?.name ||
            fallbackRow?.description,
          specification: item?.specification || fallbackRow?.specification || product.specification,
          quantity: item?.quantity ?? fallbackRow?.quantity ?? product.quantity,
          unit: item?.unit || fallbackRow?.unit || product.unit,
          unitPrice: item?.unitPrice ?? item?.price ?? fallbackRow?.unitPrice ?? fallbackRow?.price,
          amount:
            item?.amount ??
            item?.totalPrice ??
            item?.lineAmount ??
            fallbackRow?.amount ??
            fallbackRow?.totalPrice ??
            fallbackRow?.lineAmount,
          currency:
            item?.currency ||
            item?.quoteCurrency ||
            fallbackRow?.currency ||
            fallbackRow?.quoteCurrency ||
            bj?.currency ||
            'CNY',
          leadTime: item?.leadTime ?? fallbackRow?.leadTime,
          moq: item?.moq ?? fallbackRow?.moq,
          taxSettings: item?.taxSettings || fallbackRow?.taxSettings,
          priceType: item?.priceType || fallbackRow?.priceType,
          quoteMode: item?.quoteMode || fallbackRow?.quoteMode || bj?.quoteMode,
          pricingBasis: item?.pricingBasis || fallbackRow?.pricingBasis,
          costBreakdown: item?.costBreakdown || fallbackRow?.costBreakdown,
        };
      });

      // 在该BJ的items中查找匹配该产品的报价项
      const bjItem = candidateItems.find((item: any) => {
        // 🔥 关键修复：匹配逻辑优先用productId，其次用productName
        return item.productId === product.id || 
               item.productName === product.productName;
      }) || candidateItems[0];
      
      if (!bjItem) {
        // 该供应商没有报这个产品的价
        continue;
      }
      
      console.log(`    找到供应商报价: ${bj.supplierName || bj.supplierCompany}`);
      
      // 构建报价对象
      const taxSettings = bjItem.taxSettings || bj.taxSettings || undefined;
      const normalizedPriceType = bjItem.priceType || normalizePriceType(undefined, bjItem.currency || bj.currency);
      const pricingBasis = bjItem.pricingBasis || buildSourcePricingBasis({
        unitPrice: bjItem.unitPrice,
        currency: normalizeCurrencyByPriceType(normalizedPriceType, bjItem.currency || bj.currency || 'CNY'),
        priceType: normalizedPriceType,
        quoteMode: bjItem.quoteMode || bj.quoteMode,
        deliveryTerms: bj.deliveryTerms,
        sourceDocumentNo: bj.quotationNo,
        supplierQuotationNo: bj.quotationNo,
        taxSettings,
        sourceFreightUSD: bjItem.costBreakdown?.seaFreight,
        sourceInsuranceUSD: bjItem.costBreakdown?.insurance,
      });

      const quotation = {
        bjNumber: bj.quotationNo,
        xjNumber: bj.sourceXJ,
        supplierId: bj.supplierCode || bj.supplierId,
        supplierCode: bj.supplierCode || bj.supplierId || '',
        supplierName: bj.supplierName || bj.supplierCompany,
        supplierCompany: bj.supplierCompany,
        
        productId: product.id,
        productName: bjItem.productName,
        specification: bjItem.specification || product.specification,
        quantity: bjItem.quantity,
        unit: bjItem.unit,
        
        unitPrice: bjItem.unitPrice,
        totalAmount: bjItem.amount || (bjItem.unitPrice * bjItem.quantity),
        currency: bjItem.currency || bj.currency || 'CNY',
        leadTime: bjItem.leadTime || 30,
        moq: bjItem.moq || bjItem.quantity,
        paymentTerms: bj.paymentTerms || 'T/T 30% 定金，70% 发货前',
        deliveryTerms: bj.deliveryTerms,
        warranty: bj.warrantyTerms,
        priceType: pricingBasis.priceType,
        quoteMode: pricingBasis.quoteMode || bjItem.quoteMode || bj.quoteMode,
        taxSettings,
        pricingBasis,
        leadTimeSource: bjItem.leadTime != null ? 'quoted' : 'default',
        moqSource: bjItem.moq != null ? 'quoted' : 'default',
        paymentTermsSource: bj.paymentTerms ? 'quoted' : 'default',
        supplierCreditSource: 'default' as ScoreEvidenceSource,
        qualitySource: 'default' as ScoreEvidenceSource,
        
        // 初始化评分字段
        priceScore: 0,
        leadTimeScore: 0,
        paymentScore: 0,
        moqScore: 0,
        supplierCreditScore: 0,
        qualityScore: 0,
        totalScore: 0,
        isRecommended: false,
        riskLevel: 'medium' as 'medium',
        recommendReason: '',
        warnings: []
      };
      
      quotations.push(quotation);
    }
    
    console.log(`    ✅ 该产品共收到 ${quotations.length} 个供应商报价`);
    
    if (quotations.length === 0) {
      // 没有报价，跳过
      continue;
    }
    
    // 🔥 计算每个报价的得分
    for (const quotation of quotations) {
      const scores = calculateSupplierScore(quotation, quotations);
      const supplierCreditAssessment = getSupplierCreditAssessment(
        quotation.supplierId || quotation.supplierCode,
        quotation.supplierName || quotation.supplierCompany
      );
      const qualityAssessment = getSupplierQualityAssessment(
        quotation.supplierId || quotation.supplierCode,
        quotation.supplierName || quotation.supplierCompany
      );
      
      quotation.priceScore = scores.priceScore;
      quotation.leadTimeScore = scores.leadTimeScore;
      quotation.paymentScore = scores.paymentScore;
      quotation.moqScore = scores.moqScore;
      quotation.supplierCreditScore = scores.supplierCreditScore;
      quotation.qualityScore = scores.qualityScore;
      quotation.totalScore = scores.totalScore;
      quotation.supplierCreditSource = supplierCreditAssessment.source;
      quotation.qualitySource = qualityAssessment.source;
      
      // 评估风险
      quotation.riskLevel = assessRiskLevel(quotation);
      
      // 生成警告
      quotation.warnings = generateWarnings(quotation);
    }
    
    // 🔥 生成推荐理由
    for (const quotation of quotations) {
      quotation.recommendReason = generateRecommendReason(quotation, quotations);
    }
    
    // 🔥 找出得分最高的作为推荐
    const sortedQuotations = [...quotations].sort((a, b) => b.totalScore - a.totalScore);
    if (sortedQuotations.length > 0) {
      sortedQuotations[0].isRecommended = true;
    }
    
    // 🔥 计算价格范围
    const prices = quotations.map(q => q.unitPrice);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: quotations[0].currency
    };
    
    // 🔥 计算平均交期
    const avgLeadTime = quotations.reduce((sum, q) => sum + q.leadTime, 0) / quotations.length;
    
    // 构建产品比价结果
    const productComparison: ProductComparison = {
      productId: product.id,
      productName: product.productName,
      specification: product.specification || '',
      quantity: product.quantity,
      unit: product.unit,
      
      quotations: sortedQuotations, // 按得分降序排列
      
      selectedBJNumber: sortedQuotations[0]?.bjNumber, // 默认选中推荐的
      recommendedBJNumber: sortedQuotations[0]?.bjNumber,
      
      quotationCount: quotations.length,
      priceRange,
      avgLeadTime: Math.round(avgLeadTime)
    };
    
    productComparisons.push(productComparison);
    
    console.log(`    ✅ 完成比价，推荐: ${sortedQuotations[0]?.supplierName} (得分: ${sortedQuotations[0]?.totalScore})`);
  }
  
  // 🔥 计算整体汇总信息
  const totalCost = productComparisons.reduce((sum, p) => {
    const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
    return sum + (selected?.totalAmount || 0);
  }, 0);
  
  const avgLeadTime = Math.round(
    productComparisons.reduce((sum, p) => sum + p.avgLeadTime, 0) / productComparisons.length
  );
  
  // 评估整体风险
  const selectedQuotations = productComparisons.map(p => 
    p.quotations.find(q => q.bjNumber === p.selectedBJNumber)
  ).filter(Boolean);
  
  const highRiskCount = selectedQuotations.filter(q => q!.riskLevel === 'high').length;
  const mediumRiskCount = selectedQuotations.filter(q => q!.riskLevel === 'medium').length;
  
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (highRiskCount > 0) {
    overallRisk = 'high';
  } else if (mediumRiskCount >= productComparisons.length / 2) {
    overallRisk = 'medium';
  }
  
  const result: SmartComparisonResult = {
    qrNumber,
    products: productComparisons,
    
    totalCost,
    currency: productComparisons[0]?.quotations[0]?.currency || 'CNY',
    avgLeadTime,
    overallRisk,
    suggestedMargin: 30, // 默认30%
    
    totalQuotations: allBJs.length,
    selectedQuotations: productComparisons.length,
    
    comparisonDate: new Date().toISOString().split('T')[0]
  };
  
  console.log('\n✅ 智能比价完成！');
  console.log(`  总成本: ${totalCost.toFixed(2)} ${result.currency}`);
  console.log(`  平均交期: ${avgLeadTime}天`);
  console.log(`  整体风险: ${overallRisk}`);
  
  return result;
}
