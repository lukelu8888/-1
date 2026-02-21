/**
 * 🔥 智能供应商比价表 - 台湾大厂风格
 * 
 * 设计理念：紧凑、专业、数据密集、易于对比决策
 * 参考：富士康、鸿海、广达等台湾制造业ERP系统
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle, 
  CheckCircle2,
  Circle,
  Sparkles,
  Calculator,
  ThumbsUp,
  Clock,
  DollarSign,
  Package,
  Star,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  ProductComparison, 
  SupplierQuotationForComparison,
  SmartComparisonResult 
} from '../../utils/supplierScoring';
import { toast } from 'sonner@2.0.3';

interface SmartSupplierComparisonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparisonResult: SmartComparisonResult;
  onConfirm: (updatedResult: SmartComparisonResult) => void;
}

export function SmartSupplierComparisonForm({
  open,
  onOpenChange,
  comparisonResult,
  onConfirm
}: SmartSupplierComparisonFormProps) {
  
  // 🔥 本地状态：采购员的选择
  const [localResult, setLocalResult] = useState<SmartComparisonResult>(comparisonResult);
  
  // 🔥 更新产品选择
  const handleSelectQuotation = (productId: string, bjNumber: string) => {
    setLocalResult(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.productId === productId 
          ? { ...p, selectedBJNumber: bjNumber }
          : p
      )
    }));
  };
  
  // 🔥 快捷操作：全选AI推荐
  const handleSelectAllRecommended = () => {
    setLocalResult(prev => ({
      ...prev,
      products: prev.products.map(p => ({
        ...p,
        selectedBJNumber: p.recommendedBJNumber
      }))
    }));
    toast.success('✅ 已全选AI推荐供应商');
  };
  
  // 🔥 快捷操作：全选最低价
  const handleSelectAllLowestPrice = () => {
    setLocalResult(prev => ({
      ...prev,
      products: prev.products.map(p => {
        const lowestPrice = p.quotations.reduce((min, q) => 
          q.unitPrice < min.unitPrice ? q : min
        );
        return { ...p, selectedBJNumber: lowestPrice.bjNumber };
      })
    }));
    toast.success('✅ 已全选最低价供应商');
  };
  
  // 🔥 快捷操作：全选最短交期
  const handleSelectAllShortestLeadTime = () => {
    setLocalResult(prev => ({
      ...prev,
      products: prev.products.map(p => {
        const shortest = p.quotations.reduce((min, q) => 
          q.leadTime < min.leadTime ? q : min
        );
        return { ...p, selectedBJNumber: shortest.bjNumber };
      })
    }));
    toast.success('✅ 已全选最短交期供应商');
  };
  
  // 🔥 重新计算汇总信息
  const recalculateSummary = () => {
    const totalCost = localResult.products.reduce((sum, p) => {
      const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
      return sum + (selected?.totalAmount || 0);
    }, 0);
    
    const avgLeadTime = Math.round(
      localResult.products.reduce((sum, p) => {
        const selected = p.quotations.find(q => q.bjNumber === p.selectedBJNumber);
        return sum + (selected?.leadTime || 0);
      }, 0) / localResult.products.length
    );
    
    // 评估整体风险
    const selectedQuotations = localResult.products.map(p => 
      p.quotations.find(q => q.bjNumber === p.selectedBJNumber)
    ).filter(Boolean);
    
    const highRiskCount = selectedQuotations.filter(q => q!.riskLevel === 'high').length;
    const mediumRiskCount = selectedQuotations.filter(q => q!.riskLevel === 'medium').length;
    
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (highRiskCount > 0) {
      overallRisk = 'high';
    } else if (mediumRiskCount >= localResult.products.length / 2) {
      overallRisk = 'medium';
    }
    
    return { totalCost, avgLeadTime, overallRisk };
  };
  
  const summary = recalculateSummary();
  
  // 🔥 确认提交
  const handleConfirm = () => {
    // 检查是否所有产品都已选择
    const unselected = localResult.products.filter(p => !p.selectedBJNumber);
    if (unselected.length > 0) {
      toast.error('请为所有产品选择供应商', {
        description: `还有 ${unselected.length} 个产品未选择`
      });
      return;
    }
    
    // 更新汇总信息
    const updatedResult = {
      ...localResult,
      totalCost: summary.totalCost,
      avgLeadTime: summary.avgLeadTime,
      overallRisk: summary.overallRisk
    };
    
    onConfirm(updatedResult);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] flex flex-col p-0 overflow-hidden">
        
        {/* 🔥 标题栏 - 紧凑设计 */}
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-[#F96302] rounded-full"></div>
              <Sparkles className="h-4 w-4 text-[#F96302]" />
              <h2 className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>
                智能供应商比价决策 - {comparisonResult.qrNumber}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-gray-600" style={{ fontSize: '13px' }}>
              <span>收到 <strong className="text-[#F96302]">{comparisonResult.totalQuotations}</strong> 个报价</span>
              <span>涉及 <strong className="text-blue-600">{comparisonResult.products.length}</strong> 个产品</span>
            </div>
          </div>
        </div>
        
        {/* 🔥 快捷操作栏 - 醒目设计 */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-300 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-[#F96302]" />
            <span className="text-sm font-semibold text-gray-700">一键智能择优：</span>
            <span className="text-xs text-gray-500">快速应用最优策略</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAllRecommended}
              className="h-8 text-xs px-4 gap-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <Award className="h-3.5 w-3.5" />
              全选AI推荐
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAllLowestPrice}
              className="h-8 text-xs px-4 gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <DollarSign className="h-3.5 w-3.5" />
              全选最低价
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAllShortestLeadTime}
              className="h-8 text-xs px-4 gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all font-semibold"
            >
              <Clock className="h-3.5 w-3.5" />
              全选最短交期
            </Button>
          </div>
        </div>
        
        {/* 🔥 主内容区 - 紧凑表格 */}
        <div className="flex-1 overflow-auto px-4 py-3">
          <div className="space-y-3">
            {localResult.products.map((product, productIdx) => {
              const selected = product.quotations.find(q => q.bjNumber === product.selectedBJNumber);
              
              return (
                <div key={product.productId} className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                  
                  {/* 🔥 产品头部 - 超紧凑 */}
                  <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 border-b border-gray-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-300">
                        #{productIdx + 1}
                      </span>
                      <span className="font-semibold text-gray-900" style={{ fontSize: '13px' }}>
                        {product.productName}
                      </span>
                      {product.specification && (
                        <span className="text-xs text-gray-500">
                          规格: {product.specification}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-600">
                        需求: <strong className="text-gray-900">{product.quantity.toLocaleString()}</strong> {product.unit}
                      </span>
                      <Badge variant="outline" className="text-xs py-0 h-5">
                        {product.quotationCount}个报价
                      </Badge>
                      <span className="text-gray-600">
                        价格区间: <strong className="text-[#F96302]">
                          {product.priceRange.currency} {product.priceRange.min.toFixed(2)} ~ {product.priceRange.max.toFixed(2)}
                        </strong>
                      </span>
                    </div>
                  </div>
                  
                  {/* 🔥 比价表格 - 台湾大厂紧凑风格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-300">
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '40px' }}>选择</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '40px' }}>推荐</th>
                          <th className="text-left py-1.5 px-3 font-semibold text-gray-700 border-r border-gray-200" style={{ minWidth: '160px' }}>供应商 / BJ单号</th>
                          <th className="text-right py-1.5 px-3 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '90px' }}>单价</th>
                          <th className="text-right py-1.5 px-3 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '100px' }}>总价</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '60px' }}>交期</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '70px' }}>MOQ</th>
                          <th className="text-left py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '140px' }}>账期</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '60px' }}>得分</th>
                          <th className="text-center py-1.5 px-2 font-semibold text-gray-700 border-r border-gray-200" style={{ width: '50px' }}>风险</th>
                          <th className="text-left py-1.5 px-3 font-semibold text-gray-700" style={{ minWidth: '220px' }}>AI推荐理由</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.quotations.map((quotation, qIdx) => {
                          const isSelected = product.selectedBJNumber === quotation.bjNumber;
                          const isRecommended = quotation.isRecommended;
                          const isLowestPrice = quotation.unitPrice === product.priceRange.min;
                          const isShortestLeadTime = quotation.leadTime === Math.min(...product.quotations.map(q => q.leadTime));
                          
                          return (
                            <tr 
                              key={quotation.bjNumber}
                              className={`
                                border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors
                                ${isSelected ? 'bg-green-50 border-l-4 border-l-green-600' : ''}
                                ${isRecommended && !isSelected ? 'bg-orange-50' : ''}
                              `}
                              onClick={() => handleSelectQuotation(product.productId, quotation.bjNumber)}
                            >
                              {/* 选择 */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                {isSelected ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-300 mx-auto" />
                                )}
                              </td>
                              
                              {/* 推荐标识 */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                {isRecommended && (
                                  <Award className="h-4 w-4 text-[#F96302] mx-auto" title="AI推荐" />
                                )}
                              </td>
                              
                              {/* 供应商 */}
                              <td className="py-2 px-3 border-r border-gray-100">
                                <div className="font-medium text-gray-900">{quotation.supplierName}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5 font-mono">{quotation.bjNumber}</div>
                              </td>
                              
                              {/* 单价 */}
                              <td className="text-right py-2 px-3 border-r border-gray-100">
                                <div className="font-semibold text-blue-600">
                                  {quotation.currency} {quotation.unitPrice.toFixed(2)}
                                </div>
                                {isLowestPrice && (
                                  <div className="text-[11px] text-green-600 flex items-center justify-end gap-0.5 mt-0.5">
                                    <TrendingDown className="h-2.5 w-2.5" />
                                    最低价
                                  </div>
                                )}
                              </td>
                              
                              {/* 总价 */}
                              <td className="text-right py-2 px-3 border-r border-gray-100">
                                <div className="font-bold text-[#F96302]">
                                  {quotation.currency} {quotation.totalAmount.toLocaleString()}
                                </div>
                              </td>
                              
                              {/* 交期 */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                <div className={`font-medium ${isShortestLeadTime ? 'text-green-600' : 'text-gray-900'}`}>
                                  {quotation.leadTime}天
                                </div>
                                {isShortestLeadTime && (
                                  <div className="text-[11px] text-green-600">最快</div>
                                )}
                              </td>
                              
                              {/* MOQ */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                <div className="font-medium text-gray-900">
                                  {quotation.moq.toLocaleString()}
                                </div>
                              </td>
                              
                              {/* 账期 */}
                              <td className="py-2 px-2 border-r border-gray-100">
                                <div className="text-[12px] text-gray-700 leading-tight">
                                  {quotation.paymentTerms.substring(0, 30)}
                                  {quotation.paymentTerms.length > 30 && '...'}
                                </div>
                              </td>
                              
                              {/* 综合得分 */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                <div className="flex flex-col items-center">
                                  <div className={`text-base font-bold tabular-nums ${
                                    quotation.totalScore >= 85 ? 'text-green-600' :
                                    quotation.totalScore >= 70 ? 'text-blue-600' :
                                    quotation.totalScore >= 60 ? 'text-orange-600' :
                                    'text-red-600'
                                  }`}>
                                    {quotation.totalScore}
                                  </div>
                                  <div className="text-[10px] text-gray-500">分</div>
                                </div>
                              </td>
                              
                              {/* 风险 */}
                              <td className="text-center py-2 px-2 border-r border-gray-100">
                                <div className={`
                                  text-[11px] font-semibold px-1.5 py-0.5 rounded inline-block
                                  ${quotation.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                                    quotation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'}
                                `}>
                                  {quotation.riskLevel === 'low' ? '🟢低' :
                                   quotation.riskLevel === 'medium' ? '🟡中' :
                                   '🔴高'}
                                </div>
                              </td>
                              
                              {/* AI推荐理由 */}
                              <td className="py-2 px-3">
                                <div className="text-[12px] text-gray-700 leading-snug">
                                  {quotation.recommendReason}
                                </div>
                                {quotation.warnings && quotation.warnings.length > 0 && (
                                  <div className="mt-1 space-y-0.5">
                                    {quotation.warnings.map((warning, idx) => (
                                      <div key={idx} className="text-[11px] text-orange-600 flex items-start gap-1">
                                        <AlertTriangle className="h-2.5 w-2.5 mt-0.5 flex-shrink-0" />
                                        <span>{warning}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 🔥 底部汇总栏 - 紧凑设计 */}
        <div className="px-4 py-2.5 border-t border-gray-300 bg-gradient-to-r from-orange-50 to-yellow-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            
            {/* 左侧：汇总数据 */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-[#F96302]" />
                <span className="font-semibold text-gray-700" style={{ fontSize: '13px' }}>择优结果汇总:</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600" style={{ fontSize: '11px' }}>总成本</span>
                <span className="text-lg font-bold text-[#F96302] tabular-nums">
                  {localResult.currency} {summary.totalCost.toLocaleString()}
                </span>
              </div>
              
              <div className="h-4 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-gray-600" style={{ fontSize: '11px' }}>平均交期</span>
                <span className="text-base font-bold text-blue-600 tabular-nums">
                  {summary.avgLeadTime} 天
                </span>
              </div>
              
              <div className="h-4 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600" style={{ fontSize: '11px' }}>整体风险</span>
                <div className={`
                  font-semibold px-2 py-0.5 rounded
                  ${summary.overallRisk === 'low' ? 'bg-green-100 text-green-700' :
                    summary.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}
                `} style={{ fontSize: '13px' }}>
                  {summary.overallRisk === 'low' ? '🟢 低风险' :
                   summary.overallRisk === 'medium' ? '🟡 中风险' :
                   '🔴 高风险'}
                </div>
              </div>
              
              <div className="h-4 w-px bg-gray-300"></div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600" style={{ fontSize: '11px' }}>已选择</span>
                <span className="text-base font-bold text-green-600 tabular-nums">
                  {localResult.products.filter(p => p.selectedBJNumber).length} / {localResult.products.length}
                </span>
              </div>
            </div>
            
            {/* 右侧：操作按钮 */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="h-8 px-3" style={{ fontSize: '13px' }}
              >
                取消
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="h-8 px-4 bg-[#F96302] hover:bg-[#E55502] gap-1.5" style={{ fontSize: '13px' }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                确认择优结果
              </Button>
            </div>
            
          </div>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}