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
import { PurchaseRequirement, PurchaserFeedback, PurchaserFeedbackProduct } from '../../contexts/PurchaseRequirementContext';
import { useXJs } from '../../contexts/XJContext';
import { validateFeedback, calculateSuggestedPrice } from '../../utils/autoPopulateFeedback';
import { performSmartComparison, SmartComparisonResult } from '../../utils/supplierScoring';
import { SmartSupplierComparisonForm } from './SmartSupplierComparisonForm';

interface PurchaserFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qr: PurchaseRequirement;
  onSubmit: (feedback: PurchaserFeedback) => void;
  currentUserName: string;
}

export function PurchaserFeedbackForm({
  open,
  onOpenChange,
  qr,
  onSubmit,
  currentUserName
}: PurchaserFeedbackFormProps) {
  
  const { rfqs } = useXJs();
  
  // 🔥 状态管理
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<SmartComparisonResult | null>(null);
  const [showComparisonForm, setShowComparisonForm] = useState(false);
  
  // 🔥 可编辑字段
  const [suggestedMargin, setSuggestedMargin] = useState(30);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [purchaserRemarks, setPurchaserRemarks] = useState('');
  
  // 🔥 自动加载：当对话框打开时，尝试智能比价
  useEffect(() => {
    if (open && !comparisonResult) {
      handleSmartComparison();
    }
  }, [open]);
  
  // 🔥 智能比价 - 核心函数
  const handleSmartComparison = () => {
    setLoading(true);
    
    try {
      // 1. 从localStorage读取所有供应商报价单
      const supplierQuotations = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
      
      console.log('🔍 开始智能比价...');
      console.log('  QR编号:', qr.requirementNo);
      console.log('  QR产品数:', qr.items.length);
      console.log('  XJ数量:', rfqs.length);
      console.log('  BJ总数:', supplierQuotations.length);
      
      // 2. 找到关联的XJ（询价单）
      const relatedXJs = rfqs.filter(xj => 
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
          const matchBySupplierRfqNo = bj.sourceXJ === xj.supplierXjNo;
          const matchByRfqNumber = bj.sourceXJ === xj.xjNumber;
          
          if (matchBySupplierRfqNo || matchByRfqNumber) {
            console.log(`  ✅ BJ ${bj.quotationNo} 匹配成功！`);
            console.log(`    - BJ.sourceXJ: ${bj.sourceXJ}`);
            console.log(`    - XJ.supplierXjNo: ${xj.supplierXjNo}`);
            console.log(`    - XJ.xjNumber: ${xj.xjNumber}`);
          }
          
          return matchBySupplierRfqNo || matchByRfqNumber;
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
      
      setComparisonResult(result);
      setRiskLevel(result.overallRisk);
      
      // 5. 生成默认采购建议
      const defaultRemarks = generateDefaultPurchaserRemarks(result);
      setPurchaserRemarks(defaultRemarks);
      
      toast.success(`✅ 智能比价完成！收到 ${relatedBJs.length} 个供应商报价`, {
        description: `涉及 ${result.products.length} 个产品，AI已完成评分和推荐`
      });
      
      // 6. 如果有多供应商报价，显示比价表
      const hasMultipleQuotations = result.products.some(p => p.quotationCount > 1);
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
    
    const selectedSuppliers = result.products.map(p => {
      const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
      return selected?.supplierName;
    }).filter((v, i, arr) => arr.indexOf(v) === i); // 去重
    
    return `已从 ${quotationCount} 个供应商报价中智能择优，涉及 ${productCount} 个产品。

【供应商组合】
${result.products.map((p, idx) => {
  const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
  return `${idx + 1}. ${p.productName}：${selected?.supplierName}（${selected?.recommendReason}）`;
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
    
    // 重新生成采购建议
    const newRemarks = generateDefaultPurchaserRemarks(updatedResult);
    setPurchaserRemarks(newRemarks);
    
    toast.success('✅ 比价结果已确认');
  };
  
  // 🔥 提交反馈
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
      
      // 🔥 读取供应商报价时携带的价格属性，优先级：item.priceType > item.quoteMode 推断 > currency 推断
      const itemPriceType: string =
        selectedQuotation.priceType ||
        (selectedQuotation.quoteMode === 'FOB_USD' || selectedQuotation.quoteMode === 'CIF_USD'
          ? 'usd'
          : selectedQuotation.quoteMode === 'FOB_CNY' || selectedQuotation.quoteMode === 'EXW_CNY'
            ? 'cny_with_tax'
            : (selectedQuotation.currency || '').toUpperCase() === 'USD'
              ? 'usd'
              : 'cny_with_tax');

      return {
        productId: product.productId,
        productName: selectedQuotation.productName,
        specification: selectedQuotation.specification,
        quantity: selectedQuotation.quantity,
        unit: selectedQuotation.unit,
        costPrice: selectedQuotation.unitPrice,
        currency: selectedQuotation.currency,
        // 🔥 价格属性字段，传递到业务员成本核算
        priceType: itemPriceType,
        quoteMode: selectedQuotation.quoteMode,
        taxSettings: selectedQuotation.taxSettings,
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
      paymentTerms: firstSelected?.paymentTerms || 'T/T 30% 定金，70% 发货前',
      deliveryTerms: firstSelected?.deliveryTerms || 'FOB 厦门',
      packaging: '标准出口包装',
      warranty: firstSelected?.warranty || '12个月',
      
      // 🔥 采购员专业建议
      purchaserRemarks,
      
      // 成本分析
      suggestedMargin,
      riskLevel
    };
    
    // 验证数据
    const validation = validateFeedback(feedback);
    if (!validation.valid) {
      toast.error('反馈数据不完整', {
        description: validation.errors.join('; ')
      });
      return;
    }
    
    // 🔥 提交反馈并同步采购员建议到QR单据
    onSubmit(feedback);
    
    toast.success('✅ 采购反馈已提交', {
      description: `业务员 ${qr.createdBy} 将收到成本信息和您的专业建议`,
      duration: 4000
    });
    onOpenChange(false);
  };
  
  // 🔥 计算汇总信息
  const hasComparison = !!comparisonResult;
  const hasMultipleQuotations = comparisonResult?.products.some(p => p.quotationCount > 1) || false;
  
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
              为业务员 <span className="font-semibold text-blue-600">{qr.createdBy}</span> 提供成本信息，帮助其完成客户报价
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
            <div className="space-y-6">
              
              {/* 🔥 智能比价成功提示 */}
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">智能比价完成！</AlertTitle>
                <AlertDescription className="text-green-700 text-sm">
                  收到 <strong>{comparisonResult!.totalQuotations}</strong> 个供应商报价，
                  涉及 <strong>{comparisonResult!.products.length}</strong> 个产品。
                  AI已完成评分和推荐。
                  {hasMultipleQuotations && (
                    <span className="ml-2 text-orange-600 font-medium">
                      检测到多供应商报价，已为您智能择优。
                    </span>
                  )}
                </AlertDescription>
              </Alert>
              
              {/* 🔥 比价结果汇总 */}
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-orange-600" />
                  择优结果汇总
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">总成本</div>
                    <div className="text-xl font-bold text-orange-600">
                      {comparisonResult!.currency} {comparisonResult!.totalCost.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">平均交期</div>
                    <div className="text-xl font-bold text-blue-600">
                      {comparisonResult!.avgLeadTime} 天
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">建议利润率</div>
                    <div className="flex items-center justify-center gap-2">
                      <Input 
                        type="number"
                        value={suggestedMargin}
                        onChange={(e) => setSuggestedMargin(Number(e.target.value))}
                        min={0}
                        max={100}
                        className="w-20 text-center font-bold text-green-600"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">建议总售价</div>
                    <div className="text-xl font-bold text-green-600">
                      {comparisonResult!.currency} {calculateSuggestedPrice(comparisonResult!.totalCost, suggestedMargin).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 🔥 查看详细比价按钮 */}
              {hasMultipleQuotations && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => setShowComparisonForm(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    查看详细比价分析
                  </Button>
                </div>
              )}
              
              {/* 🔥 采购员专业建议 */}
              <div>
                <Label className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  采购员专业建议（给业务员的指导）
                </Label>
                <Textarea 
                  value={purchaserRemarks}
                  onChange={(e) => setPurchaserRemarks(e.target.value)}
                  placeholder="请填写专业建议，如：供应商产能、质量评估、议价空间、风险提示等..."
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 提示：业务员会看到这些建议，请提供有价值的成本分析和市场指导
                </p>
              </div>
              
              {/* 🔥 风险评估 */}
              <div>
                <Label>风险评估</Label>
                <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                  <SelectTrigger>
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
              
              {/* 🔥 权限隔离提示 */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">权限隔离说明</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                  ✅ 业务员可见：成本单价、交期、MOQ、付款方式、交货条款、您的专业建议<br />
                  ❌ 业务员不可见：<strong>供应商名称、BJ单号、供应商联系方式</strong>（完全隔离，防止跳单）
                </AlertDescription>
              </Alert>
              
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
                  提交反馈给业务员
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