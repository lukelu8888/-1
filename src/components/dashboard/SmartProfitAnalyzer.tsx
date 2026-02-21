import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Calculator,
  Info,
  Ship,
  Percent,
  FileText,
  Banknote,
  Shield,
  Package
} from 'lucide-react';

interface SmartProfitAnalyzerProps {
  quotation: {
    id?: string;
    totalPrice: number;
    currency?: string;
    items?: any[];
    region?: 'NA' | 'SA' | 'EU';
  };
}

export function SmartProfitAnalyzer({ quotation }: SmartProfitAnalyzerProps) {
  // 🔥 核心状态
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 🔥 成本配置（可编辑）
  const [costs, setCosts] = useState({
    oceanFreight: 850,
    importDuty: 7.5, // 百分比
    vat: 20, // 百分比
    customsClearance: 200,
    cargoInsurance: 2, // 百分比
    bankCharges: 50
  });

  const currency = quotation.currency || 'USD';
  const fobPrice = quotation.totalPrice || 0;
  const totalQuantity = quotation.items 
    ? quotation.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0;

  // 🔥 根据地区自动调整税率
  useEffect(() => {
    const regionTaxRates: Record<string, { duty: number; vat: number }> = {
      'NA': { duty: 7.5, vat: 0 },     // 北美：关税7.5%，无VAT
      'SA': { duty: 12, vat: 18 },     // 南美：关税12%，VAT 18%
      'EU': { duty: 10, vat: 20 }      // 欧洲：关税10%，VAT 20%
    };
    
    const region = quotation.region || 'NA';
    const rates = regionTaxRates[region] || regionTaxRates['NA'];
    
    setCosts(prev => ({
      ...prev,
      importDuty: rates.duty,
      vat: rates.vat
    }));
  }, [quotation.region]);

  // 🔥 自动保存/恢复目标价格
  useEffect(() => {
    const saved = localStorage.getItem(`targetPrice_${(quotation as any).id}`);
    if (saved) {
      setTargetPrice(saved);
    }
  }, [(quotation as any).id]);

  const saveTargetPrice = (value: string) => {
    setTargetPrice(value);
    if (value) {
      localStorage.setItem(`targetPrice_${(quotation as any).id}`, value);
    }
  };

  // 🔥 计算到岸成本
  const calculateLandedCost = () => {
    const dutyAmount = (fobPrice + costs.oceanFreight) * (costs.importDuty / 100);
    const insuranceAmount = fobPrice * (costs.cargoInsurance / 100);
    const subtotal = fobPrice + costs.oceanFreight + dutyAmount + insuranceAmount + costs.customsClearance + costs.bankCharges;
    const vatAmount = subtotal * (costs.vat / 100);
    
    return {
      oceanFreight: costs.oceanFreight,
      dutyAmount,
      vatAmount,
      insuranceAmount,
      customsClearance: costs.customsClearance,
      bankCharges: costs.bankCharges,
      totalLandedCost: subtotal + vatAmount,
      realCostPerUnit: totalQuantity > 0 ? (subtotal + vatAmount) / totalQuantity : 0
    };
  };

  const landedCost = calculateLandedCost();
  
  // 🔥 计算利润指标
  const targetPriceNum = parseFloat(targetPrice) || 0;
  const totalRevenue = targetPriceNum * totalQuantity;
  
  // FOB基础毛利
  const fobGrossProfit = totalRevenue - fobPrice;
  const fobGrossMargin = totalRevenue > 0 ? (fobGrossProfit / totalRevenue) * 100 : 0;
  const fobProfitPerUnit = totalQuantity > 0 ? fobGrossProfit / totalQuantity : 0;
  
  // 到岸真实毛利
  const realGrossProfit = totalRevenue - landedCost.totalLandedCost;
  const realGrossMargin = totalRevenue > 0 ? (realGrossProfit / totalRevenue) * 100 : 0;
  const realProfitPerUnit = totalQuantity > 0 ? realGrossProfit / totalQuantity : 0;

  // 🔥 智能决策建议
  const getRecommendation = () => {
    if (!targetPriceNum) {
      return {
        status: 'neutral',
        title: '💡 Enter your target selling price',
        message: 'Add your expected selling price to see profit analysis and recommendations.',
        confidence: 0
      };
    }

    if (realGrossMargin >= 40) {
      return {
        status: 'excellent',
        title: '✅ EXCELLENT DEAL - Highly Recommended',
        message: `${realGrossMargin.toFixed(1)}% margin exceeds your 40% target. This is a strong deal with healthy profit potential.`,
        confidence: 95
      };
    } else if (realGrossMargin >= 25) {
      return {
        status: 'good',
        title: '✅ GOOD OPPORTUNITY - Recommended',
        message: `${realGrossMargin.toFixed(1)}% margin is acceptable. Consider negotiating for better terms or higher MOQ discounts.`,
        confidence: 75
      };
    } else if (realGrossMargin >= 15) {
      return {
        status: 'caution',
        title: '⚠️ LOW MARGIN - Negotiate Recommended',
        message: `${realGrossMargin.toFixed(1)}% margin is below target. Suggest negotiating ${((fobPrice * 0.85) / totalQuantity).toFixed(2)}/${currency} per unit (-15% from FOB).`,
        confidence: 50
      };
    } else {
      return {
        status: 'reject',
        title: '❌ UNPROFITABLE - Not Recommended',
        message: `${realGrossMargin.toFixed(1)}% margin is too low. Unless strategic reasons exist, consider declining or requesting significant price reduction.`,
        confidence: 85
      };
    }
  };

  const recommendation = getRecommendation();

  // 🔥 毛利率颜色
  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-green-600';
    if (margin >= 25) return 'text-blue-600';
    if (margin >= 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 40) return 'bg-green-50 border-green-200';
    if (margin >= 25) return 'bg-blue-50 border-blue-200';
    if (margin >= 15) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-4 print:hidden">
      {/* 🔥 模块标题 */}
      <div className="flex items-center gap-2 border-b pb-3">
        <Calculator className="w-5 h-5 text-[#F96302]" />
        <h3 className="text-sm font-semibold text-gray-900">
          💰 Smart Profit Analyzer
        </h3>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Info className="w-4 h-4 text-gray-400 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-xs">
              Calculate your real profit after all landed costs including freight, duties, VAT, and clearance fees.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* 🔥 模块1: 快速毛利计算面板 */}
      <Card className={`border-2 ${targetPriceNum > 0 ? getMarginBgColor(realGrossMargin) : 'bg-gray-50 border-gray-200'}`}>
        <CardContent className="p-4 space-y-3">
          {/* FOB报价显示 */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div className="text-xs text-gray-600">
              Supplier Quote (FOB):
            </div>
            <div className="text-sm font-bold text-gray-900">
              {currency} {fobPrice.toLocaleString()} 
              <span className="text-xs text-gray-500 ml-1">
                ({totalQuantity.toLocaleString()} pcs @ {currency}{(fobPrice / totalQuantity).toFixed(2)})
              </span>
            </div>
          </div>

          {/* 目标售价输入 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
              Your Target Selling Price (per unit):
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 22.00"
                  value={targetPrice}
                  onChange={(e) => saveTargetPrice(e.target.value)}
                  className="pl-9 h-10 text-sm font-medium"
                />
              </div>
              <div className="text-xs text-gray-500 w-12">{currency}</div>
            </div>
            {targetPriceNum > 0 && (
              <div className="text-xs text-gray-500">
                Total Revenue: {currency} {totalRevenue.toLocaleString()} ({totalQuantity.toLocaleString()} pcs)
              </div>
            )}
          </div>

          {/* 利润计算结果 */}
          {targetPriceNum > 0 && (
            <>
              <div className="bg-white/50 rounded-lg p-3 space-y-2 border border-gray-200">
                {/* FOB基础毛利 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">Gross Margin (FOB basis):</span>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          Simple calculation: (Selling Price - FOB Price) / Selling Price
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className={`text-sm font-bold ${getMarginColor(fobGrossMargin)}`}>
                    {fobGrossMargin.toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Profit per Unit:</span>
                  <span className="font-medium">{currency} {fobProfitPerUnit.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Total Gross Profit:</span>
                  <span className="font-medium">{currency} {fobGrossProfit.toLocaleString()}</span>
                </div>
              </div>

              {/* 真实毛利（考虑到岸成本） */}
              <div className="bg-gradient-to-br from-[#F96302]/5 to-orange-50 rounded-lg p-3 border-2 border-[#F96302]/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-[#F96302]" />
                    <span className="text-xs font-semibold text-gray-900">
                      Real Gross Margin (Landed Cost):
                    </span>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="w-3 h-3 text-[#F96302] cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">
                          ⚠️ This includes ALL costs: freight, duties, VAT, insurance, clearance. 
                          This is your TRUE profit margin!
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className={`text-lg font-bold ${getMarginColor(realGrossMargin)}`}>
                    {realGrossMargin.toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Real Profit per Unit:</span>
                    <span className={`font-bold ${getMarginColor(realGrossMargin)}`}>
                      {currency} {realProfitPerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">Total Real Profit:</span>
                    <span className={`font-bold ${getMarginColor(realGrossMargin)}`}>
                      {currency} {realGrossProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 展开/折叠详细成本 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full h-8 text-xs text-gray-600 hover:text-[#F96302]"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Hide Detailed Cost Breakdown
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    View Detailed Cost Breakdown
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* 🔥 模块2: 总到岸成本分析（可展开） */}
      {isExpanded && targetPriceNum > 0 && (
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#F96302]" />
              <h4 className="text-sm font-semibold text-gray-900">
                📦 Total Landed Cost Breakdown
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              {/* FOB价格 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">FOB Price:</span>
                </div>
                <span className="font-medium text-gray-900">{currency} {fobPrice.toLocaleString()}</span>
              </div>

              {/* 海运费 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Ship className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">+ Ocean Freight:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={costs.oceanFreight}
                    onChange={(e) => setCosts({...costs, oceanFreight: parseFloat(e.target.value) || 0})}
                    className="w-24 h-7 text-xs text-right"
                  />
                  <button className="text-[#F96302] hover:underline text-xs">✏️</button>
                </div>
              </div>

              {/* 进口关税 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Percent className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">+ Import Duty ({costs.importDuty}%):</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{currency} {landedCost.dutyAmount.toLocaleString()}</span>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p className="text-xs">Auto-calculated: (FOB + Freight) × {costs.importDuty}%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* VAT */}
              {costs.vat > 0 && (
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-700">+ VAT ({costs.vat}%):</span>
                  </div>
                  <span className="font-medium text-gray-900">{currency} {landedCost.vatAmount.toLocaleString()}</span>
                </div>
              )}

              {/* 货物保险 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">+ Cargo Insurance ({costs.cargoInsurance}%):</span>
                </div>
                <span className="font-medium text-gray-900">{currency} {landedCost.insuranceAmount.toLocaleString()}</span>
              </div>

              {/* 清关费 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">+ Customs Clearance:</span>
                </div>
                <Input
                  type="number"
                  value={costs.customsClearance}
                  onChange={(e) => setCosts({...costs, customsClearance: parseFloat(e.target.value) || 0})}
                  className="w-24 h-7 text-xs text-right"
                />
              </div>

              {/* 银行费用 */}
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-700">+ Bank Charges:</span>
                </div>
                <Input
                  type="number"
                  value={costs.bankCharges}
                  onChange={(e) => setCosts({...costs, bankCharges: parseFloat(e.target.value) || 0})}
                  className="w-24 h-7 text-xs text-right"
                />
              </div>

              {/* 总到岸成本 */}
              <div className="flex items-center justify-between py-3 bg-gray-50 rounded-lg px-3 mt-3">
                <span className="font-semibold text-gray-900">Total Landed Cost:</span>
                <span className="text-base font-bold text-[#F96302]">
                  {currency} {landedCost.totalLandedCost.toLocaleString()}
                </span>
              </div>

              {/* 真实单位成本 */}
              <div className="flex items-center justify-between py-2 bg-orange-50 rounded-lg px-3">
                <span className="font-medium text-gray-800">Real Cost per Unit:</span>
                <span className="text-sm font-bold text-[#F96302]">
                  {currency} {landedCost.realCostPerUnit.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 调整后的毛利率提示 */}
            <div className={`mt-4 p-3 rounded-lg border-2 ${getMarginBgColor(realGrossMargin)}`}>
              <div className="flex items-center gap-2 mb-1">
                {realGrossMargin >= 25 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                )}
                <span className="text-xs font-semibold text-gray-900">
                  Adjusted Gross Margin:
                </span>
                <span className={`text-sm font-bold ${getMarginColor(realGrossMargin)}`}>
                  {realGrossMargin.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-gray-600">
                Your selling price {currency}{targetPriceNum.toFixed(2)} - Real cost {currency}{landedCost.realCostPerUnit.toFixed(2)} = 
                <span className={`font-medium ml-1 ${getMarginColor(realGrossMargin)}`}>
                  {currency}{realProfitPerUnit.toFixed(2)} profit per unit
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🔥 模块5: 智能决策建议 */}
      {targetPriceNum > 0 && (
        <Card className={`border-2 ${
          recommendation.status === 'excellent' ? 'bg-green-50 border-green-300' :
          recommendation.status === 'good' ? 'bg-blue-50 border-blue-300' :
          recommendation.status === 'caution' ? 'bg-orange-50 border-orange-300' :
          recommendation.status === 'reject' ? 'bg-red-50 border-red-300' :
          'bg-gray-50 border-gray-300'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {recommendation.status === 'excellent' || recommendation.status === 'good' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : recommendation.status === 'caution' ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  {recommendation.title}
                </h4>
                <p className="text-xs text-gray-700 mb-2">
                  {recommendation.message}
                </p>
                {recommendation.confidence > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>Confidence:</span>
                    <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          recommendation.confidence >= 80 ? 'bg-green-500' :
                          recommendation.confidence >= 60 ? 'bg-blue-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${recommendation.confidence}%` }}
                      />
                    </div>
                    <span className="font-medium">{recommendation.confidence}%</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}