/**
 * 🔥 采购员反馈表单 - 智能一键流转 + 多供应商比价
 * 
 * 功能：
 * 1. 自动从多个BJ提取数据，智能比价
 * 2. AI评分推荐最优供应商
 * 3. 采购员可手动择优调整
 * 4. 提交后，业务员可在QR中查看反馈
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Award,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  QuoteRequirement,
  QuoteRequirementDecisionSnapshot,
  QuoteRequirementDecisionSnapshotHistoricalBenchmark,
  QuoteRequirementDecisionSnapshotMetric,
  QuoteRequirementDecisionSnapshotProduct,
  QuoteRequirementDecisionSnapshotSupplierPerformance,
  QuoteRequirementFeedback,
  QuoteRequirementFeedbackProduct,
} from '../../contexts/QuoteRequirementContext';
import { useXJs } from '../../contexts/XJContext';
import { validateFeedback, calculateSuggestedPrice } from '../../utils/autoPopulateFeedback';
import {
  assessHistoricalPriceDeviationLevel,
  calculateHistoricalPriceDeltaPct,
  calculatePerformanceScoreAdjustment,
  calculateSupplierPerformanceScore,
  generateRecommendReason,
  generateWarnings,
  performSmartComparison,
  SMART_COMPARISON_SCORE_WEIGHTS,
  SmartComparisonResult,
  type ProductComparison,
  type ScoreEvidenceSource,
  type SupplierQuotationForComparison,
} from '../../utils/supplierScoring';
import { SmartSupplierComparisonForm } from './SmartSupplierComparisonForm';
import {
  postOrderFeedbackService,
  purchaseOrderService,
  qcInspectionOrderService,
  supplierInspectionReportService,
  supplierQuotationService,
} from '../../lib/supabaseService';
import { buildSourcePricingBasis } from '../../types/pricingBasis';
import { buildPaymentTermsText } from '../../lib/paymentFlow';

interface PurchaserFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qr: QuoteRequirement;
  onSubmit: (feedback: QuoteRequirementFeedback) => void;
  currentUserName: string;
  preferredBJNumber?: string;
}

type ComparisonFactEntry = {
  product: ProductComparison;
  selected: SupplierQuotationForComparison;
  lowestPrice: number;
  fastestLeadTime: number;
  isLowestPrice: boolean;
  isFastestLeadTime: boolean;
  priceDeltaPct: number;
  historicalBenchmark: QuoteRequirementDecisionSnapshotHistoricalBenchmark | null;
  supplierPerformance: QuoteRequirementDecisionSnapshotSupplierPerformance | null;
};

export function PurchaserFeedbackForm({
  open,
  onOpenChange,
  qr,
  onSubmit,
  currentUserName,
  preferredBJNumber,
}: PurchaserFeedbackFormProps) {
  
  const { xjs } = useXJs();
  const hasPersistedFeedback = Boolean(qr.purchaserFeedback);
  
  // 🔥 状态管理
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<SmartComparisonResult | null>(null);
  const [showComparisonForm, setShowComparisonForm] = useState(false);
  const [allSupplierQuotations, setAllSupplierQuotations] = useState<any[]>([]);
  const [allPurchaseOrders, setAllPurchaseOrders] = useState<any[]>([]);
  const [allSupplierInspectionReports, setAllSupplierInspectionReports] = useState<any[]>([]);
  const [allQcInspectionOrders, setAllQcInspectionOrders] = useState<any[]>([]);
  const [allPostOrderFeedbackRows, setAllPostOrderFeedbackRows] = useState<any[]>([]);
  
  // 🔥 可编辑字段
  const [suggestedMargin, setSuggestedMargin] = useState(30);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [purchaserRemarks, setPurchaserRemarks] = useState('');

  useEffect(() => {
    if (!open) {
      setComparisonResult(null);
      setShowComparisonForm(false);
    }
  }, [open, qr.id, preferredBJNumber]);

  useEffect(() => {
    if (!open) return;

    setSuggestedMargin(qr.purchaserFeedback?.suggestedMargin ?? 30);
    setRiskLevel(qr.purchaserFeedback?.riskLevel || 'medium');
    setPurchaserRemarks(qr.purchaserFeedback?.purchaserRemarks || '');
  }, [
    open,
    qr.id,
    qr.purchaserFeedback?.purchaserRemarks,
    qr.purchaserFeedback?.riskLevel,
    qr.purchaserFeedback?.suggestedMargin,
  ]);
  
  // 🔥 自动加载：当对话框打开时，尝试智能比价
  useEffect(() => {
    if (open && !comparisonResult) {
      handleSmartComparison();
    }
  }, [open]);

  const extractComparableItems = (quotationRow: any, product: ProductComparison) => {
    const snapshotItems = Array.isArray(quotationRow?.documentDataSnapshot?.products)
      ? quotationRow.documentDataSnapshot.products
      : Array.isArray(quotationRow?.document_data_snapshot?.products)
        ? quotationRow.document_data_snapshot.products
        : [];
    const rowItems = Array.isArray(quotationRow?.items) ? quotationRow.items : [];
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
        unitPrice: item?.unitPrice ?? item?.price ?? fallbackRow?.unitPrice ?? fallbackRow?.price,
        currency:
          item?.currency ||
          item?.quoteCurrency ||
          fallbackRow?.currency ||
          fallbackRow?.quoteCurrency ||
          quotationRow?.currency ||
          'CNY',
      };
    });

    return candidateItems.filter((item: any) =>
      item.productId === product.productId || item.productName === product.productName
    );
  };

  const buildHistoricalBenchmark = (
    product: ProductComparison,
    selected: SupplierQuotationForComparison,
  ): QuoteRequirementDecisionSnapshotHistoricalBenchmark | null => {
    const comparableSamples = allSupplierQuotations
      .filter((row: any) => row?.quotationNo !== selected.bjNumber && (row?.status === 'submitted' || row?.status === 'accepted'))
      .flatMap((row: any) =>
        extractComparableItems(row, product).map((item: any) => ({
          bjNumber: row?.quotationNo || row?.bjNumber || '',
          supplierCode: row?.supplierCode || row?.supplierId || '',
          supplierName: row?.supplierName || row?.supplierCompany || '',
          unitPrice: Number(item?.unitPrice),
          currency: item?.currency || row?.currency || 'CNY',
          quoteDate: row?.quotationDate || row?.submittedDate || row?.updatedAt || row?.createdAt || null,
        })),
      )
      .filter((sample) => Number.isFinite(sample.unitPrice) && sample.currency === selected.currency);

    if (comparableSamples.length === 0) {
      return null;
    }

    const sameSupplierSamples = comparableSamples.filter((sample) => {
      const supplierCodeMatch = sample.supplierCode && selected.supplierCode && sample.supplierCode === selected.supplierCode;
      const supplierNameMatch = sample.supplierName && sample.supplierName === selected.supplierName;
      return supplierCodeMatch || supplierNameMatch;
    });

    const sortedByDate = [...comparableSamples].sort((a, b) => {
      const aTs = a.quoteDate ? new Date(a.quoteDate).getTime() : 0;
      const bTs = b.quoteDate ? new Date(b.quoteDate).getTime() : 0;
      return bTs - aTs;
    });
    const average = (list: typeof comparableSamples) =>
      list.length > 0 ? list.reduce((sum, sample) => sum + sample.unitPrice, 0) / list.length : null;

    return {
      sampleCount: comparableSamples.length,
      sameSupplierSampleCount: sameSupplierSamples.length,
      marketMinUnitPrice: Math.min(...comparableSamples.map((sample) => sample.unitPrice)),
      marketAvgUnitPrice: average(comparableSamples),
      sameSupplierAvgUnitPrice: average(sameSupplierSamples),
      latestKnownUnitPrice: sortedByDate[0]?.unitPrice ?? null,
      latestKnownQuoteDate: sortedByDate[0]?.quoteDate ?? null,
    };
  };

  const buildSupplierPerformanceSummary = (
    selected: SupplierQuotationForComparison,
  ): QuoteRequirementDecisionSnapshotSupplierPerformance | null => {
    const relatedPurchaseOrders = allPurchaseOrders.filter((po: any) => {
      const supplierCodeMatch = po?.supplierCode && selected.supplierCode && po.supplierCode === selected.supplierCode;
      const supplierNameMatch = po?.supplierName && po.supplierName === selected.supplierName;
      return supplierCodeMatch || supplierNameMatch;
    });

    if (relatedPurchaseOrders.length === 0) {
      return null;
    }

    const purchaseOrderIds = new Set(relatedPurchaseOrders.map((po: any) => String(po.id)));
    const relatedQcOrders = allQcInspectionOrders.filter((row: any) => purchaseOrderIds.has(String(row?.purchaseOrderId || '')));
    const relatedSupplierInspectionReports = allSupplierInspectionReports.filter((row: any) => purchaseOrderIds.has(String(row?.purchaseOrderId || '')));
    const relatedFeedbackRows = allPostOrderFeedbackRows.filter((row: any) => purchaseOrderIds.has(String(row?.purchaseOrderId || '')));

    const average = (values: number[]) => values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

    return {
      historicalPurchaseOrderCount: relatedPurchaseOrders.length,
      qcPassCount: relatedQcOrders.filter((row: any) => row?.result === 'pass' || row?.result === 'pass_with_remark').length,
      qcFailCount: relatedQcOrders.filter((row: any) => row?.result === 'fail').length,
      supplierSelfInspectionPassCount: relatedSupplierInspectionReports.filter((row: any) => row?.result === 'pass').length,
      supplierSelfInspectionFailCount: relatedSupplierInspectionReports.filter((row: any) => row?.result === 'fail').length,
      averageOverallRating: average(
        relatedFeedbackRows
          .map((row: any) => Number(row?.overallRating))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
      averageDeliveryRating: average(
        relatedFeedbackRows
          .map((row: any) => Number(row?.deliveryRating))
          .filter((value: number) => Number.isFinite(value) && value > 0),
      ),
      qualityIssueCount: relatedFeedbackRows.filter((row: any) => Boolean(row?.qualityIssueFlag)).length,
      deliveryIssueCount: relatedFeedbackRows.filter((row: any) => Boolean(row?.deliveryIssueFlag)).length,
    };
  };

  const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

  const enrichQuotationWithDecisionEvidence = (
    product: ProductComparison,
    quotation: SupplierQuotationForComparison,
  ): SupplierQuotationForComparison => {
    const historicalBenchmark = buildHistoricalBenchmark(product, quotation);
    const supplierPerformance = buildSupplierPerformanceSummary(quotation);
    const supplierPerformanceScore = calculateSupplierPerformanceScore(supplierPerformance);
    const supplierPerformanceAdjustment = calculatePerformanceScoreAdjustment(supplierPerformanceScore);
    const historicalPriceDeltaPct = calculateHistoricalPriceDeltaPct(quotation.unitPrice, historicalBenchmark);
    const historicalPriceDeviationLevel = assessHistoricalPriceDeviationLevel(historicalPriceDeltaPct);
    const warnings = [...(quotation.warnings || [])];

    if (historicalPriceDeltaPct != null) {
      if (historicalPriceDeltaPct <= -15) {
        warnings.push(`💡 较历史均价低 ${Math.abs(historicalPriceDeltaPct).toFixed(1)}%，建议核实是否存在异常低价或规格差异`);
      } else if (historicalPriceDeltaPct >= 15) {
        warnings.push(`⚠️ 较历史均价高 ${historicalPriceDeltaPct.toFixed(1)}%，需确认成本上涨依据`);
      }
    }

    if (supplierPerformanceScore != null && supplierPerformanceScore < 45) {
      warnings.push('⚠️ 供应商后段履约表现偏弱，建议结合试单或加严验货条件');
    }

    const baseTotalScore = quotation.baseTotalScore ?? quotation.totalScore;
    let riskLevel = quotation.riskLevel;
    if (historicalPriceDeviationLevel === 'alert' && historicalPriceDeltaPct != null && historicalPriceDeltaPct < 0) {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }
    if (supplierPerformanceScore != null && supplierPerformanceScore < 40) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }

    const enrichedQuotation: SupplierQuotationForComparison = {
      ...quotation,
      historicalBenchmark,
      historicalPriceDeltaPct,
      historicalPriceDeviationLevel,
      supplierPerformance,
      supplierPerformanceScore,
      supplierPerformanceAdjustment,
      baseTotalScore,
      totalScore: clampScore(baseTotalScore + supplierPerformanceAdjustment),
      riskLevel,
    };

    enrichedQuotation.warnings = Array.from(new Set([
      ...warnings,
      ...generateWarnings(enrichedQuotation),
    ]));

    return enrichedQuotation;
  };

  const enrichComparisonResult = (
    result: SmartComparisonResult,
    preferredBJ?: string,
  ): SmartComparisonResult => {
    const products = result.products.map((product) => {
      const enrichedQuotations = product.quotations.map((quotation) =>
        enrichQuotationWithDecisionEvidence(product, quotation),
      );
      const sortedQuotations = [...enrichedQuotations].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (a.unitPrice !== b.unitPrice) return a.unitPrice - b.unitPrice;
        return a.leadTime - b.leadTime;
      });
      const recommendedBJNumber = sortedQuotations[0]?.bjNumber;
      const selectedBJNumber =
        (preferredBJ && sortedQuotations.some((quotation) => quotation.bjNumber === preferredBJ)
          ? preferredBJ
          : product.selectedBJNumber && sortedQuotations.some((quotation) => quotation.bjNumber === product.selectedBJNumber)
            ? product.selectedBJNumber
            : recommendedBJNumber) || undefined;

      const quotations = sortedQuotations.map((quotation) => ({
        ...quotation,
        isRecommended: quotation.bjNumber === recommendedBJNumber,
      }));

      quotations.forEach((quotation) => {
        quotation.recommendReason = generateRecommendReason(quotation, quotations);
      });

      return {
        ...product,
        quotations,
        recommendedBJNumber,
        selectedBJNumber,
      };
    });

    const totalCost = products.reduce((sum, product) => {
      const selected = product.quotations.find((quotation) => quotation.bjNumber === product.selectedBJNumber);
      return sum + (selected?.totalAmount || 0);
    }, 0);
    const avgLeadTime = products.length > 0
      ? Math.round(
          products.reduce((sum, product) => {
            const selected = product.quotations.find((quotation) => quotation.bjNumber === product.selectedBJNumber);
            return sum + (selected?.leadTime || 0);
          }, 0) / products.length,
        )
      : 0;
    const selectedQuotations = products
      .map((product) => product.quotations.find((quotation) => quotation.bjNumber === product.selectedBJNumber))
      .filter(Boolean);
    const highRiskCount = selectedQuotations.filter((quotation) => quotation!.riskLevel === 'high').length;
    const mediumRiskCount = selectedQuotations.filter((quotation) => quotation!.riskLevel === 'medium').length;

    const overallRisk: SmartComparisonResult['overallRisk'] = highRiskCount > 0
      ? 'high'
      : mediumRiskCount >= Math.max(1, products.length / 2)
        ? 'medium'
        : 'low';

    return {
      ...result,
      products,
      totalCost,
      avgLeadTime,
      overallRisk,
      selectedQuotations: products.filter((product) => Boolean(product.selectedBJNumber)).length,
    };
  };
  
  // 🔥 智能比价 - 核心函数
  const handleSmartComparison = async () => {
    setLoading(true);
    
    try {
      // 1. Supabase-first: 读取所有供应商报价单（不再依赖 localStorage）
      const [rows, purchaseOrders, supplierInspectionReports, qcInspectionOrders, postOrderFeedbackRows] = await Promise.all([
        supplierQuotationService.getAll(),
        purchaseOrderService.getAll(),
        supplierInspectionReportService.listAll(),
        qcInspectionOrderService.listAll(),
        postOrderFeedbackService.listAll(),
      ]);
      const supplierQuotations = Array.isArray(rows) ? rows : [];
      setAllPurchaseOrders(Array.isArray(purchaseOrders) ? purchaseOrders : []);
      setAllSupplierInspectionReports(Array.isArray(supplierInspectionReports) ? supplierInspectionReports : []);
      setAllQcInspectionOrders(Array.isArray(qcInspectionOrders) ? qcInspectionOrders : []);
      setAllPostOrderFeedbackRows(Array.isArray(postOrderFeedbackRows) ? postOrderFeedbackRows : []);
      setAllSupplierQuotations(supplierQuotations);
      
      console.log('🔍 开始智能比价...');
      console.log('  QR编号:', qr.requirementNo);
      console.log('  QR产品数:', qr.items.length);
      console.log('  XJ数量:', xjs.length);
      console.log('  BJ总数:', supplierQuotations.length);
      
      // 2. 找到关联的XJ（询价单）
      const relatedXJs = xjs.filter(xj => 
        xj.sourceQRNumber === qr.requirementNo || 
        xj.requirementNo === qr.requirementNo
      );
      
      console.log('  关联XJ数:', relatedXJs.length);
      if (relatedXJs.length > 0) {
        console.log('  关联XJ详情:');
        relatedXJs.forEach(xj => {
          console.log(`    - XJ编号: ${xj.supplierXjNo}, XJ内部编号: ${xj.xjNumber}, 关联QR: ${xj.requirementNo}`);
        });
      }
      
      if (relatedXJs.length === 0) {
        toast.error('未找到关联的询价单（XJ）', {
          description: '请先创建询价单并发送给供应商'
        });
        setLoading(false);
        return;
      }
      
      // 3. 找到关联的BJ（供应商报价单）
      console.log('  🔍 开始匹配BJ报价单...');
      console.log('  BJ总数:', supplierQuotations.length);
      
      // 🔥 调试：显示所有BJ的关键信息
      if (supplierQuotations.length > 0) {
        console.log('  所有BJ报价单:');
        supplierQuotations.forEach((bj: any, idx: number) => {
          console.log(`    [${idx + 1}] BJ编号: ${bj.quotationNo}, sourceXJ: ${bj.sourceXJ}, sourceQR: ${bj.sourceQR}, status: ${bj.status}`);
        });
      }
      
      const relatedBJs = supplierQuotations.filter((bj: any) => {
        // 🔥 BJ状态必须是已提交或已接受（accepted状态说明采购已经接受过，更有价值）
        if (bj.status !== 'submitted' && bj.status !== 'accepted') {
          console.log(`  ⚠️ BJ ${bj.quotationNo} 状态不符合: ${bj.status} (需要submitted或accepted)`);
          return false;
        }
        
        // 匹配XJ编号
        const matched = relatedXJs.some(xj => {
          const matchBySupplierXJNo = bj.sourceXJ === xj.supplierXjNo;
          const matchByXJNumber = bj.sourceXJ === xj.xjNumber;
          
          if (matchBySupplierXJNo || matchByXJNumber) {
            console.log(`  ✅ BJ ${bj.quotationNo} 匹配成功！`);
            console.log(`    - BJ.sourceXJ: ${bj.sourceXJ}`);
            console.log(`    - XJ.supplierXjNo: ${xj.supplierXjNo}`);
            console.log(`    - XJ.xjNumber: ${xj.xjNumber}`);
          }
          
          return matchBySupplierXJNo || matchByXJNumber;
        });
        
        return matched;
      });
      
      console.log('  关联BJ数:', relatedBJs.length);
      
      if (relatedBJs.length === 0) {
        toast.error('未找到已提交的供应商报价单（BJ）', {
          description: '请等待供应商提交报价'
        });
        setLoading(false);
        return;
      }
      
      // 4. 执行智能比价
      const result = performSmartComparison(
        qr.requirementNo,
        qr.items,
        relatedBJs
      );
      const preferredResult = enrichComparisonResult(result, preferredBJNumber);
      
      setComparisonResult(preferredResult);
      if (!hasPersistedFeedback) {
        setRiskLevel(preferredResult.overallRisk);
        setSuggestedMargin(30);
        
        // 5. 仅在尚未保存反馈时生成默认采购建议
        const defaultRemarks = generateDefaultPurchaserRemarks(preferredResult);
        setPurchaserRemarks(defaultRemarks);
      }
      
      toast.success(`✅ 智能比价完成！收到 ${relatedBJs.length} 个供应商报价`, {
        description: `涉及 ${result.products.length} 个产品，AI已完成评分和推荐`
      });
      
      // 6. 如果有多供应商报价，显示比价表
      const hasMultipleQuotations = preferredResult.products.some(p => p.quotationCount > 1);
      if (hasMultipleQuotations) {
        setShowComparisonForm(true);
      }
      
    } catch (error) {
      console.error('❌ 智能比价失败:', error);
      toast.error('智能比价失败', {
        description: '请检查数据完整性或联系技术支持'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 🔥 生成默认采购建议
  const generateDefaultPurchaserRemarks = (result: SmartComparisonResult): string => {
    const productCount = result.products.length;
    const quotationCount = result.totalQuotations;
    const formatSelectedSupplierLabel = (selected?: { supplierCode?: string; supplierId?: string }) => {
      const supplierCode = String(selected?.supplierCode || selected?.supplierId || '').trim();
      return supplierCode || '未识别供应商编号';
    };
    
    const selectedSuppliers = result.products.map(p => {
      const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
      return formatSelectedSupplierLabel(selected);
    }).filter((v, i, arr) => arr.indexOf(v) === i); // 去重
    
    return `已从 ${quotationCount} 个供应商报价中智能择优，涉及 ${productCount} 个产品。

【供应商组合】
${result.products.map((p, idx) => {
  const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
  return `${idx + 1}. ${formatSelectedSupplierLabel(selected)}（${selected?.recommendReason}）`;
}).join('\n')}

【成本分析】
- 总成本：${result.currency} ${result.totalCost.toLocaleString()}
- 平均交期：${result.avgLeadTime}天
- 整体风险：${result.overallRisk === 'low' ? '低风险' : result.overallRisk === 'high' ? '高风险' : '中风险'}

【建议】
1. 建议销售加价 30%-40%，确保合理利润空间
2. ${selectedSuppliers.length > 1 ? `本次涉及 ${selectedSuppliers.length} 个供应商，建议分批下单` : '单一供应商，可适当增加订单量争取更优价格'}
3. 大单（数量超过MOQ的3倍）可再议价 5%-8%
4. 建议提前收取30%定金以锁定生产排期

如有特殊要求，请及时与采购部沟通。`;
  };
  
  // 🔥 确认比价结果
  const handleConfirmComparison = (updatedResult: SmartComparisonResult) => {
    setComparisonResult(updatedResult);
    setShowComparisonForm(false);
    
    // 已保存反馈时保持原文案，未保存时才重新生成默认采购建议
    if (!hasPersistedFeedback) {
      const newRemarks = generateDefaultPurchaserRemarks(updatedResult);
      setPurchaserRemarks(newRemarks);
    }
    
    toast.success('✅ 比价结果已确认');
  };
  
  // 🔥 保存反馈（下推动作在操作区单独执行）
  const handleSubmit = () => {
    if (!comparisonResult) {
      toast.error('请先完成智能比价');
      return;
    }
    
    // 🔥 构建PurchaserFeedback对象
    const feedbackProducts: PurchaserFeedbackProduct[] = comparisonResult.products.map(product => {
      const selectedQuotation = product.quotations.find(q => q.bjNumber === product.selectedBJNumber);
      
      if (!selectedQuotation) {
        throw new Error(`产品 ${product.productName} 未选择供应商`);
      }
      
      const sourcePricing = selectedQuotation.pricingBasis || buildSourcePricingBasis({
        unitPrice: selectedQuotation.unitPrice,
        currency: selectedQuotation.currency,
        priceType: selectedQuotation.priceType,
        quoteMode: selectedQuotation.quoteMode,
        deliveryTerms: selectedQuotation.deliveryTerms,
        sourceDocumentNo: selectedQuotation.bjNumber,
        supplierQuotationNo: selectedQuotation.bjNumber,
        taxSettings: selectedQuotation.taxSettings,
      });

      return {
        productId: product.productId,
        productName: selectedQuotation.productName,
        specification: selectedQuotation.specification,
        quantity: selectedQuotation.quantity,
        unit: selectedQuotation.unit,
        costPrice: selectedQuotation.unitPrice,
        currency: sourcePricing.currency,
        // 🔥 价格属性字段，传递到业务员成本核算
        priceType: sourcePricing.priceType,
        quoteMode: sourcePricing.quoteMode || selectedQuotation.quoteMode,
        taxSettings: selectedQuotation.taxSettings,
        sourcePricing,
        amount: selectedQuotation.totalAmount,
        moq: selectedQuotation.moq,
        leadTime: `${selectedQuotation.leadTime}天`,
        remarks: product.purchaserRemarks
      };
    });
    
    // 获取第一个选中的供应商报价信息（用于商务条款）
    const firstSelected = comparisonResult.products[0].quotations.find(
      q => q.bjNumber === comparisonResult.products[0].selectedBJNumber
    );
    
    const feedback: PurchaserFeedback = {
      status: 'quoted',
      feedbackDate: new Date().toISOString().split('T')[0],
      feedbackBy: currentUserName,
      
      // 🔥 关联信息（仅采购员可见，业务员看不到）
      linkedBJ: comparisonResult.products.map(p => p.selectedBJNumber).join(', '),
      linkedSupplier: comparisonResult.products.map(p => {
        const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
        return selected?.supplierName;
      }).filter((v, i, arr) => arr.indexOf(v) === i).join(', '),
      
      // 🔥 给业务员的成本信息（脱敏）
      products: feedbackProducts,
      
      // 商务条款
      paymentTerms: firstSelected?.paymentTerms || buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment'),
      deliveryTerms: firstSelected?.deliveryTerms || 'FOB 厦门',
      packaging: '标准出口包装',
      warranty: firstSelected?.warranty || '12个月',
      
      // 🔥 采购员专业建议
      purchaserRemarks,
      
      // 成本分析
      suggestedMargin,
      riskLevel,
      decisionSnapshot: buildDecisionSnapshot(),
    };
    
    // 验证数据
    const validation = validateFeedback(feedback);
    if (!validation.valid) {
      toast.error('反馈数据不完整', {
        description: validation.errors.join('; ')
      });
      return;
    }

    const missingSourcePricing = feedback.products.find((product) => !product.sourcePricing);
    if (missingSourcePricing) {
      toast.error('反馈数据缺少源价格基准', {
        description: `${missingSourcePricing.productName} 未携带 BJ 价格语义，已阻止下推`,
      });
      return;
    }
    
    // 🔥 提交反馈并同步采购员建议到QR单据
    onSubmit(feedback);
    
    toast.success('✅ 采购反馈已保存', {
      description: '请在操作区点击“反馈业务员询报”完成流转',
      duration: 4000
    });
    onOpenChange(false);
  };
  
  // 🔥 计算汇总信息
  const hasComparison = !!comparisonResult;
  const hasMultipleQuotations = comparisonResult?.products.some(p => p.quotationCount > 1) || false;
  const selectedComparisonFacts = comparisonResult
    ? comparisonResult.products
        .map((product) => {
          const selected = product.quotations.find(q => q.bjNumber === product.selectedBJNumber);
          if (!selected) return null;
          const lowestPrice = Math.min(...product.quotations.map(q => q.unitPrice));
          const fastestLeadTime = Math.min(...product.quotations.map(q => q.leadTime));
          const historicalBenchmark = selected.historicalBenchmark || buildHistoricalBenchmark(product, selected);
          const supplierPerformance = selected.supplierPerformance || buildSupplierPerformanceSummary(selected);
          return {
            product,
            selected,
            lowestPrice,
            fastestLeadTime,
            isLowestPrice: selected.unitPrice === lowestPrice,
            isFastestLeadTime: selected.leadTime === fastestLeadTime,
            priceDeltaPct: lowestPrice > 0
              ? ((selected.unitPrice - lowestPrice) / lowestPrice) * 100
              : 0,
            historicalBenchmark,
            supplierPerformance,
          };
        })
        .filter(Boolean) as ComparisonFactEntry[]
    : [];
  const supplierCount = new Set(selectedComparisonFacts.map((entry) => entry.selected.supplierName)).size;
  const evidenceTotalChecks = selectedComparisonFacts.length * 5;
  const evidenceStrongChecks = selectedComparisonFacts.reduce((sum, entry) => {
    const sources = [
      entry.selected.leadTimeSource,
      entry.selected.paymentTermsSource,
      entry.selected.moqSource,
      entry.selected.supplierCreditSource,
      entry.selected.qualitySource,
    ];
    return sum + sources.filter((source) => source === 'quoted' || source === 'history').length;
  }, 0);
  const evidenceCoverage = evidenceTotalChecks > 0 ? Math.round((evidenceStrongChecks / evidenceTotalChecks) * 100) : 0;
  const selectedWarnings = Array.from(
    new Set(selectedComparisonFacts.flatMap((entry) => entry.selected.warnings || []))
  );
  const decisionLimitations = Array.from(new Set([
    !hasMultipleQuotations ? '当前仅单报价，不能证明该供应商优于市场其他报价。' : '',
    evidenceCoverage < 100 ? '部分判断字段仍依赖默认值或缺失数据，建议补齐报价条款/历史履约资料。' : '',
    ...selectedComparisonFacts
      .filter((entry) => !entry.historicalBenchmark || entry.historicalBenchmark.sampleCount < 2)
      .map((entry) => `${entry.product.productName} 的历史价格样本不足，暂不适合做强历史趋势结论。`),
    ...selectedComparisonFacts
      .filter((entry) => entry.selected.supplierCreditSource === 'default' || entry.selected.qualitySource === 'default')
      .map((entry) => `${entry.product.productName} 的信用/品质判断仍存在默认值，请结合真实履约或质检记录复核。`),
    ...selectedComparisonFacts
      .filter((entry) => !entry.supplierPerformance || entry.supplierPerformance.historicalPurchaseOrderCount === 0)
      .map((entry) => `${entry.product.productName} 暂无可关联的供应商历史履约记录。`),
  ].filter(Boolean)));
  const decisionModeLabel = hasMultipleQuotations ? '多供应商择优' : '单报价成本确认';
  const decisionTitle = hasMultipleQuotations ? '智能比价已完成' : '单报价采购建议已生成';
  const confidenceSummary = (() => {
    if (!hasComparison) return { label: '待生成', tone: 'slate', description: '尚未产出结论' };
    if (hasMultipleQuotations && evidenceCoverage >= 85) {
      return { label: '较高', tone: 'emerald', description: '存在横向报价对比，且大部分关键字段来自真实报价或历史数据。' };
    }
    if (evidenceCoverage >= 65) {
      return { label: '中等', tone: 'amber', description: '已有部分可靠事实，但仍有默认值或缺失字段参与判断。' };
    }
    return { label: '有限', tone: 'rose', description: '当前结论更多依赖单报价或默认值，只适合作为初步判断。' };
  })();
  const evidenceSourceLabel = (source?: ScoreEvidenceSource) => {
    if (source === 'quoted') return '报价单原始字段';
    if (source === 'history') return '历史数据';
    return '默认值/待补充';
  };
  const evidenceSourceTone = (source?: ScoreEvidenceSource) => {
    if (source === 'quoted' || source === 'history') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    return 'border-amber-200 bg-amber-50 text-amber-700';
  };
  const buildDecisionSnapshot = (): QuoteRequirementDecisionSnapshot => {
    const confidence: QuoteRequirementDecisionSnapshot['confidence'] =
      confidenceSummary.label === '较高'
        ? 'high'
        : confidenceSummary.label === '中等'
          ? 'medium'
          : 'limited';

    const products: QuoteRequirementDecisionSnapshotProduct[] = selectedComparisonFacts.map((entry) => {
      const metrics: QuoteRequirementDecisionSnapshotMetric[] = [
        {
          key: 'unit_price',
          label: '单价',
          value: `${entry.selected.currency} ${entry.selected.unitPrice.toLocaleString()}`,
          source: 'quoted',
          note: hasMultipleQuotations
            ? (entry.isLowestPrice ? '当前最低价' : `较本轮最低价高 ${entry.priceDeltaPct.toFixed(1)}%`)
            : '当前仅单报价',
        },
        {
          key: 'lead_time',
          label: '交期',
          value: `${entry.selected.leadTime} 天`,
          source: entry.selected.leadTimeSource || 'default',
          note: hasMultipleQuotations
            ? (entry.isFastestLeadTime ? '当前最短交期' : `最快交期 ${entry.fastestLeadTime} 天`)
            : '当前仅单报价',
        },
        {
          key: 'payment_terms',
          label: '账期',
          value: entry.selected.paymentTerms,
          source: entry.selected.paymentTermsSource || 'default',
        },
        {
          key: 'moq',
          label: 'MOQ',
          value: String(entry.selected.moq),
          source: entry.selected.moqSource || 'default',
        },
        {
          key: 'supplier_credit',
          label: '供应商信用',
          value: String(entry.selected.supplierCreditScore),
          source: entry.selected.supplierCreditSource || 'default',
        },
        {
          key: 'quality',
          label: '品质',
          value: String(entry.selected.qualityScore),
          source: entry.selected.qualitySource || 'default',
        },
      ];

      if (entry.selected.historicalPriceDeltaPct != null) {
        metrics.push({
          key: 'historical_price_position',
          label: '历史价格偏离',
          value: `${entry.selected.historicalPriceDeltaPct >= 0 ? '+' : ''}${entry.selected.historicalPriceDeltaPct.toFixed(1)}%`,
          source: 'history',
          note: entry.selected.historicalPriceDeviationLevel === 'alert'
            ? '偏离显著，需复核原因'
            : entry.selected.historicalPriceDeviationLevel === 'watch'
              ? '存在一定偏离，建议补充说明'
              : '与历史均价接近',
        });
      }

      if (entry.selected.supplierPerformanceScore != null) {
        metrics.push({
          key: 'supplier_performance',
          label: '历史履约',
          value: String(entry.selected.supplierPerformanceScore),
          source: 'history',
          note: `履约校正 ${entry.selected.supplierPerformanceAdjustment && entry.selected.supplierPerformanceAdjustment > 0 ? '+' : ''}${entry.selected.supplierPerformanceAdjustment || 0} 分`,
        });
      }

      return {
        productId: entry.product.productId,
        productName: entry.product.productName,
        selectedSupplierName: entry.selected.supplierName,
        selectedBJNumber: entry.selected.bjNumber,
        totalScore: entry.selected.totalScore,
        riskLevel: entry.selected.riskLevel,
        recommendReason: entry.selected.recommendReason,
        metrics,
        warnings: entry.selected.warnings || [],
        historicalBenchmark: entry.historicalBenchmark,
        supplierPerformance: entry.supplierPerformance,
      };
    });

    return {
      decisionMode: hasMultipleQuotations ? 'multi_supplier_comparison' : 'single_quote_confirmation',
      comparisonDate: comparisonResult?.comparisonDate || new Date().toISOString().split('T')[0],
      supplierCount,
      quotationCount: comparisonResult?.totalQuotations || 0,
      evidenceCoverage,
      confidence,
      scoreWeights: [
        ...SMART_COMPARISON_SCORE_WEIGHTS.map((item) => ({ ...item })),
        {
          key: 'supplierPerformanceAdjustment',
          label: '履约校正',
          weight: 0,
          description: '不改变基础权重，按历史履约表现对总分做 -6 到 +8 分有限校正。',
        },
      ],
      products,
      limitations: decisionLimitations,
    };
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-600" />
              智能采购反馈 - {qr.requirementNo}
            </DialogTitle>
            <DialogDescription>
              为业务员 <span className="font-semibold text-blue-600">{qr.requestedByName || qr.createdBy}</span> 提供成本信息，帮助其完成客户报价
            </DialogDescription>
          </DialogHeader>
          
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-3 text-sm text-gray-600">正在智能比价分析...</span>
            </div>
          )}
          
          {!loading && !hasComparison && (
            <div className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">未找到关联的供应商报价单</p>
              <Button onClick={handleSmartComparison} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                重新尝试智能比价
              </Button>
            </div>
          )}
          
          {!loading && hasComparison && (
            <div className="space-y-4">
              <section className="rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(240,253,250,0.94))] p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-semibold tracking-tight text-slate-900">{decisionTitle}</span>
                        {hasMultipleQuotations && (
                          <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                            已完成多供应商择优
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        已收集 <span className="font-semibold text-slate-900">{comparisonResult!.totalQuotations}</span> 份供应商报价，
                        覆盖 <span className="font-semibold text-slate-900">{comparisonResult!.products.length}</span> 个产品，
                        当前按 <span className="font-semibold text-slate-900">{decisionModeLabel}</span> 输出建议。
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 lg:items-end">
                    {hasMultipleQuotations ? (
                      <Button
                        onClick={() => setShowComparisonForm(true)}
                        variant="outline"
                        className="h-9 shrink-0 gap-2 border-slate-300 bg-white/90 px-4 text-sm font-medium text-slate-700 hover:bg-white"
                      >
                        <BarChart3 className="h-4 w-4" />
                        打开逐项比价表
                      </Button>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-500">
                        当前仅 1 份报价，无横向比价表
                      </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      confidenceSummary.tone === 'emerald'
                        ? 'bg-emerald-100 text-emerald-700'
                        : confidenceSummary.tone === 'amber'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                    }`}>
                      结论可信度：{confidenceSummary.label}
                    </span>
                  </div>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">决策模式</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{decisionModeLabel}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {hasMultipleQuotations
                      ? `本次涉及 ${supplierCount} 家供应商，可做真实横向择优。`
                      : '当前只收到 1 份 BJ，系统只能做单报价事实归纳，不能证明其优于其他供应商。'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">证据覆盖率</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{evidenceCoverage}%</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    已确认 {evidenceStrongChecks}/{evidenceTotalChecks || 0} 个关键判断字段来自报价单原文或历史记录。
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">结论可信度</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{confidenceSummary.label}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{confidenceSummary.description}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">风险提示数</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{selectedWarnings.length}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    采购建议不只看得分，还要结合风控提示和缺失事实一起判断。
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">择优结果汇总</h3>
                    <p className="text-xs text-slate-500">面向业务报价的核心建议数据</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">总成本</div>
                    <div className="mt-2 text-[28px] font-semibold tracking-tight text-orange-600">
                      {comparisonResult!.currency} {comparisonResult!.totalCost.toLocaleString()}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">平均交期</div>
                    <div className="mt-2 text-[28px] font-semibold tracking-tight text-blue-600">
                      {comparisonResult!.avgLeadTime} 天
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">建议利润率</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        value={suggestedMargin}
                        onChange={(e) => setSuggestedMargin(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="h-11 w-24 border-slate-300 bg-white text-center text-2xl font-semibold text-emerald-600"
                      />
                      <span className="text-lg font-medium text-slate-500">%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-700/70">建议总售价</div>
                    <div className="mt-2 text-[28px] font-semibold tracking-tight text-emerald-600">
                      {comparisonResult!.currency} {calculateSuggestedPrice(comparisonResult!.totalCost, suggestedMargin).toLocaleString()}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <BarChart3 className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">评分规则与证据边界</h3>
                    <p className="text-xs text-slate-500">把系统如何得出结论说清楚，而不是只给结果。</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {SMART_COMPARISON_SCORE_WEIGHTS.map((rule) => (
                    <div key={rule.key} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">{rule.label}</span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">{rule.weight}%</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{rule.description}</p>
                    </div>
                  ))}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">履约校正</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">-6 ~ +8</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      在不改动基础价格/交期权重的前提下，按历史 QC、供应商自检、交付评价与问题记录，对最终决策分做有限校正。
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-6 text-amber-900">
                  当前“供应商信用”和“品质”会优先读取历史资料；若历史资料缺失，系统会回退默认值。履约校正只做有限加减分，不会覆盖价格与交期事实。默认值可以辅助判断，但不能替代真实履约、质检和财务证据。
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Calculator className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">本次结论依据</h3>
                    <p className="text-xs text-slate-500">逐个产品列出当前选中 BJ 的事实依据和证据来源。</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedComparisonFacts.map((entry, index) => (
                    <div key={`${entry.product.productId}-${entry.selected.bjNumber}`} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">#{index + 1}</span>
                            <h4 className="text-sm font-semibold text-slate-900">{entry.product.productName}</h4>
                            <span className="text-xs text-slate-500">{entry.product.specification || '未填写规格'}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            选中供应商 <span className="font-medium text-slate-700">{entry.selected.supplierName}</span>，
                            BJ 单号 <span className="font-mono text-slate-700">{entry.selected.bjNumber}</span>。
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-white text-slate-700">综合得分 {entry.selected.totalScore}</Badge>
                          <Badge variant="outline" className="bg-white text-slate-700">风险 {entry.selected.riskLevel === 'high' ? '高' : entry.selected.riskLevel === 'medium' ? '中' : '低'}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">采购成本</div>
                          <div className="mt-1 text-lg font-semibold text-orange-600">
                            {entry.selected.currency} {entry.selected.totalAmount.toLocaleString()}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            单价 {entry.selected.currency} {entry.selected.unitPrice.toLocaleString()}
                            {hasMultipleQuotations && (
                              <>
                                {' '}| {entry.isLowestPrice ? '当前最低价' : `较最低价高 ${entry.priceDeltaPct.toFixed(1)}%`}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">交期与 MOQ</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {entry.selected.leadTime} 天 / MOQ {entry.selected.moq}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {hasMultipleQuotations
                              ? entry.isFastestLeadTime
                                ? '当前交期最短'
                                : `最快交期为 ${entry.fastestLeadTime} 天`
                              : '当前仅单报价，无交期横向比较'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">账期与推荐理由</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{entry.selected.paymentTerms}</div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{entry.selected.recommendReason || '系统未生成额外推荐理由'}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="text-xs text-slate-500">历史价格基准</div>
                          {entry.historicalBenchmark ? (
                            <>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                历史样本 {entry.historicalBenchmark.sampleCount} 条
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                市场均价 {entry.selected.currency} {(entry.historicalBenchmark.marketAvgUnitPrice || 0).toLocaleString()}
                                {' '}| 最低 {entry.selected.currency} {(entry.historicalBenchmark.marketMinUnitPrice || 0).toLocaleString()}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                同供应商均价 {entry.historicalBenchmark.sameSupplierAvgUnitPrice != null
                                  ? `${entry.selected.currency} ${entry.historicalBenchmark.sameSupplierAvgUnitPrice.toLocaleString()}`
                                  : '暂无'}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              暂无可比历史样本，当前无法给出稳定的历史价格趋势结论。
                            </p>
                          )}
                        </div>
                      </div>

                      {entry.historicalBenchmark && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
                          最近一次可识别历史报价：
                          <span className="font-medium text-slate-700">
                            {' '}{entry.selected.currency} {(entry.historicalBenchmark.latestKnownUnitPrice || 0).toLocaleString()}
                          </span>
                          {entry.historicalBenchmark.latestKnownQuoteDate ? (
                            <span>，日期 {entry.historicalBenchmark.latestKnownQuoteDate}</span>
                          ) : (
                            <span>，日期未记录</span>
                          )}
                          <span>；同供应商历史样本 {entry.historicalBenchmark.sameSupplierSampleCount} 条。</span>
                        </div>
                      )}

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-700">供应商历史履约摘要</div>
                        {entry.supplierPerformance ? (
                          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <div className="text-[11px] text-slate-500">历史采购单</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">{entry.supplierPerformance.historicalPurchaseOrderCount} 单</div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">QC 记录</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                通过 {entry.supplierPerformance.qcPassCount} / 失败 {entry.supplierPerformance.qcFailCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">供应商自检</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                通过 {entry.supplierPerformance.supplierSelfInspectionPassCount} / 失败 {entry.supplierPerformance.supplierSelfInspectionFailCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">交付反馈</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                总评分 {entry.supplierPerformance.averageOverallRating != null ? entry.supplierPerformance.averageOverallRating.toFixed(1) : '暂无'}
                                {' '}| 交付 {entry.supplierPerformance.averageDeliveryRating != null ? entry.supplierPerformance.averageDeliveryRating.toFixed(1) : '暂无'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-xs leading-5 text-slate-500">
                            暂无可关联的历史履约、QC 或交付反馈记录。
                          </div>
                        )}
                        {entry.supplierPerformance && (
                          <div className="mt-2 text-xs leading-5 text-slate-500">
                            质量问题记录 {entry.supplierPerformance.qualityIssueCount} 次，交付问题记录 {entry.supplierPerformance.deliveryIssueCount} 次。
                            当前这些后段事实只作为审阅依据，尚未直接参与综合分计算。
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          ['交期来源', entry.selected.leadTimeSource],
                          ['账期来源', entry.selected.paymentTermsSource],
                          ['MOQ来源', entry.selected.moqSource],
                          ['信用来源', entry.selected.supplierCreditSource],
                          ['品质来源', entry.selected.qualitySource],
                        ].map(([label, source]) => (
                          <span
                            key={`${entry.selected.bjNumber}-${label}`}
                            className={`rounded-full border px-3 py-1 text-xs ${evidenceSourceTone(source as ScoreEvidenceSource)}`}
                          >
                            {label}：{evidenceSourceLabel(source as ScoreEvidenceSource)}
                          </span>
                        ))}
                      </div>

                      {entry.selected.warnings && entry.selected.warnings.length > 0 && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                          <div className="text-xs font-semibold text-amber-900">风险/提醒</div>
                          <div className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
                            {entry.selected.warnings.map((warning) => (
                              <div key={`${entry.selected.bjNumber}-${warning}`}>{warning}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {decisionLimitations.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-amber-900">当前结论的边界与待补证据</div>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-amber-900">
                    {decisionLimitations.map((item) => (
                      <div key={item}>- {item}</div>
                    ))}
                  </div>
                </section>
              )}

              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr),260px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    采购员专业建议
                    <span className="text-xs font-normal text-slate-500">给业务员的指导</span>
                  </Label>
                  <Textarea
                    value={purchaserRemarks}
                    onChange={(e) => setPurchaserRemarks(e.target.value)}
                    placeholder="请填写专业建议，如：议价空间、交付风险、质量判断、客户报价策略等..."
                    rows={9}
                    className="min-h-[240px] resize-y border-slate-200 bg-slate-50/50 text-sm leading-6"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    业务员会直接看到这段内容，建议聚焦成本判断、报价策略和交付风险。
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Label className="mb-2 block text-sm font-semibold text-slate-900">风险评估</Label>
                  <p className="mb-3 text-xs leading-5 text-slate-500">
                    该标签会影响业务员对订单安全边际和报价策略的判断。
                  </p>
                  <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                    <SelectTrigger className="h-11 border-slate-300 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        🟢 低风险 - 老供应商，质量稳定
                      </SelectItem>
                      <SelectItem value="medium">
                        🟡 中风险 - 新供应商，需观察
                      </SelectItem>
                      <SelectItem value="high">
                        🔴 高风险 - 需谨慎，建议先小单测试
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            {hasComparison && (
              <>
                <Button 
                  variant="outline"
                  onClick={handleSmartComparison}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  重新智能比价
                </Button>
                <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  保存反馈
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 智能比价详细表单 */}
      {comparisonResult && (
        <SmartSupplierComparisonForm
          open={showComparisonForm}
          onOpenChange={setShowComparisonForm}
          comparisonResult={comparisonResult}
          onConfirm={handleConfirmComparison}
        />
      )}
    </>
  );
}
