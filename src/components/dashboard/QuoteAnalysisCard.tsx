import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Ship, Percent, FileText, Banknote, Shield, Package, TrendingUp, DollarSign, Edit2, Lock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Quote {
  id: string;
  label: string;
  isOurQuote: boolean;
  fobPrice: number;
  quantity: number;
  currency: string;
  region: 'NA' | 'SA' | 'EU';
  costs: {
    oceanFreight: number;
    importDuty: number;
    vat: number;
    customsClearance: number;
    cargoInsurance: number;
    bankCharges: number;
  };
  serviceIncludes?: string[];
}

interface QuoteAnalysisCardProps {
  quote: Quote;
  targetPrice: number;
  onUpdate: (updates: Partial<Quote>) => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function QuoteAnalysisCard({ quote, targetPrice, onUpdate, onRemove, showRemove }: QuoteAnalysisCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingFOB, setIsEditingFOB] = useState(!quote.isOurQuote && quote.fobPrice === 0);

  // 计算到岸成本
  const calculateLandedCost = () => {
    const dutyAmount = (quote.fobPrice + quote.costs.oceanFreight) * (quote.costs.importDuty / 100);
    const insuranceAmount = quote.fobPrice * (quote.costs.cargoInsurance / 100);
    const subtotal = quote.fobPrice + quote.costs.oceanFreight + dutyAmount + insuranceAmount + 
                     quote.costs.customsClearance + quote.costs.bankCharges;
    const vatAmount = subtotal * (quote.costs.vat / 100);
    
    return {
      oceanFreight: quote.costs.oceanFreight,
      dutyAmount,
      vatAmount,
      insuranceAmount,
      customsClearance: quote.costs.customsClearance,
      bankCharges: quote.costs.bankCharges,
      totalLandedCost: subtotal + vatAmount,
      realCostPerUnit: quote.quantity > 0 ? (subtotal + vatAmount) / quote.quantity : 0
    };
  };

  const landedCost = calculateLandedCost();
  
  // 计算利润指标
  const totalRevenue = targetPrice * quote.quantity;
  const fobGrossProfit = totalRevenue - quote.fobPrice;
  const fobGrossMargin = totalRevenue > 0 ? (fobGrossProfit / totalRevenue) * 100 : 0;
  
  const realGrossProfit = totalRevenue - landedCost.totalLandedCost;
  const realGrossMargin = totalRevenue > 0 ? (realGrossProfit / totalRevenue) * 100 : 0;
  const realProfitPerUnit = quote.quantity > 0 ? realGrossProfit / quote.quantity : 0;

  // 毛利率颜色
  const getMarginColor = (margin: number) => {
    if (margin >= 40) return 'text-green-600';
    if (margin >= 25) return 'text-blue-600';
    if (margin >= 15) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 40) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300';
    if (margin >= 25) return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300';
    if (margin >= 15) return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300';
    return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300';
  };

  const hasValidData = quote.fobPrice > 0 && targetPrice > 0;

  return (
    <Card className={`border-2 shadow-md ${ 
      quote.isOurQuote 
        ? 'border-[#F96302] bg-gradient-to-br from-orange-50 via-white to-orange-50/30' 
        : hasValidData
          ? getMarginBgColor(realGrossMargin)
          : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white'
    }`}>
      <CardContent className="p-4 space-y-4">
        {/* Header - 台湾大厂风格 */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
              quote.isOurQuote 
                ? 'bg-[#F96302] text-white' 
                : 'bg-gray-600 text-white'
            }`}>
              {quote.label.charAt(6)}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{quote.label.split(':')[1]?.trim() || quote.label}</h4>
              {quote.isOurQuote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F96302] text-white text-xs rounded-full mt-1">
                  <Lock className="w-3 h-3" />
                  Our Quote (Locked)
                </span>
              )}
            </div>
          </div>
          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-9 w-9 p-0 text-red-600 hover:bg-red-100 border-2 border-red-200 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* FOB价格输入区域 - 竞争对手报价 */}
        {!quote.isOurQuote && (
          <div className="space-y-2">
            <label className="font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#F96302]" />
              Competitor FOB Price (Total):
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 18500.00"
                  value={quote.fobPrice || ''}
                  onChange={(e) => onUpdate({ fobPrice: parseFloat(e.target.value) || 0 })}
                  onFocus={() => setIsEditingFOB(true)}
                  onBlur={() => setIsEditingFOB(false)}
                  className="h-12 text-base font-medium border-2 border-gray-300 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-100 border-l-2 border-gray-300 font-bold text-gray-700 rounded">
                  {quote.currency}
                </div>
              </div>
            </div>
            {quote.fobPrice > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Unit Price:</span>
                  <span className="font-bold text-blue-900">
                    {quote.currency} {(quote.fobPrice / quote.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  ({quote.quantity.toLocaleString()} units)
                </div>
              </div>
            )}
          </div>
        )}

        {/* 我们的FOB显示 - 锁定 */}
        {quote.isOurQuote && (
          <div className="bg-gradient-to-r from-white to-orange-50 rounded-lg p-4 border-2 border-[#F96302]/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 font-medium">FOB Price (Total):</span>
              <Lock className="w-4 h-4 text-[#F96302]" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {quote.currency} {quote.fobPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Unit: {quote.currency} {(quote.fobPrice / quote.quantity).toFixed(2)} × {quote.quantity.toLocaleString()} pcs
            </div>
          </div>
        )}

        {/* 利润计算结果 */}
        {hasValidData && (
          <div className="space-y-3">
            {/* FOB基础毛利 */}
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 font-medium">FOB Gross Margin:</span>
                <span className={`text-xl font-bold ${getMarginColor(fobGrossMargin)}`}>
                  {fobGrossMargin.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Profit: <span className="font-bold">{quote.currency} {fobGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* 真实到岸毛利 - 高亮显示 */}
            <div className={`rounded-lg p-4 border-2 shadow-md ${
              quote.isOurQuote 
                ? 'bg-gradient-to-r from-[#F96302]/20 to-orange-100 border-[#F96302]' 
                : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F96302] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Real Gross Margin:</span>
                </div>
                <span className={`text-2xl font-bold ${getMarginColor(realGrossMargin)}`}>
                  {realGrossMargin.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2 bg-white/60 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Real Profit (Total):</span>
                  <span className={`font-bold ${getMarginColor(realGrossMargin)}`}>
                    {quote.currency} {realGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Real Profit (Per Unit):</span>
                  <span className={`font-bold ${getMarginColor(realGrossMargin)}`}>
                    {quote.currency} {realProfitPerUnit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* 我们报价的服务亮点 */}
            {quote.isOurQuote && quote.serviceIncludes && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                    ✓
                  </div>
                  <div className="font-bold text-green-900">Value-Added Services Included:</div>
                </div>
                <div className="space-y-2">
                  {quote.serviceIncludes.slice(0, 4).map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-green-800 bg-white/60 rounded px-3 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 展开/折叠详细成本按钮 */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-10 border-2 border-gray-300 hover:border-[#F96302] hover:bg-orange-50 text-gray-700 hover:text-[#F96302] font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Hide Cost Breakdown
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  View Landed Cost Details
                </>
              )}
            </Button>
          </div>
        )}

        {/* 详细成本分析（展开后）- 台湾大厂风格 */}
        {isExpanded && hasValidData && (
          <div className="bg-white rounded-lg border-2 border-gray-300 p-4 space-y-4 shadow-md">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-[#F96302] flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h5 className="font-bold text-gray-900">Landed Cost Breakdown</h5>
            </div>

            <div className="space-y-3">
              {/* FOB价格 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-700">FOB Price:</span>
                </div>
                <span className="font-bold text-gray-900">{quote.currency} {quote.fobPrice.toLocaleString()}</span>
              </div>

              {/* 海运费 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-700">+ Ocean Freight:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={quote.costs.oceanFreight}
                    onChange={(e) => onUpdate({ 
                      costs: { ...quote.costs, oceanFreight: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-28 h-9 text-sm text-right font-medium"
                  />
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {/* 进口关税 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-gray-700">+ Import Duty:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={quote.costs.importDuty}
                    onChange={(e) => onUpdate({ 
                      costs: { ...quote.costs, importDuty: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-20 h-9 text-sm text-right font-medium"
                  />
                  <span className="text-sm text-gray-600 font-medium">%</span>
                  <span className="text-sm text-gray-500 w-24 text-right font-bold">
                    = {quote.currency} {landedCost.dutyAmount.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* VAT */}
              {quote.costs.vat > 0 && (
                <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-gray-700">+ VAT:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={quote.costs.vat}
                      onChange={(e) => onUpdate({ 
                        costs: { ...quote.costs, vat: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-20 h-9 text-sm text-right font-medium"
                    />
                    <span className="text-sm text-gray-600 font-medium">%</span>
                    <span className="text-sm text-gray-500 w-24 text-right font-bold">
                      = {quote.currency} {landedCost.vatAmount.toFixed(0)}
                    </span>
                  </div>
                </div>
              )}

              {/* 货物保险 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-gray-700">+ Cargo Insurance:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={quote.costs.cargoInsurance}
                    onChange={(e) => onUpdate({ 
                      costs: { ...quote.costs, cargoInsurance: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-20 h-9 text-sm text-right font-medium"
                  />
                  <span className="text-sm text-gray-600 font-medium">%</span>
                  <span className="text-sm text-gray-500 w-24 text-right font-bold">
                    = {quote.currency} {landedCost.insuranceAmount.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* 清关费 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-gray-700">+ Customs Clearance:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={quote.costs.customsClearance}
                    onChange={(e) => onUpdate({ 
                      costs: { ...quote.costs, customsClearance: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-28 h-9 text-sm text-right font-medium"
                  />
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {/* 银行费用 */}
              <div className="flex items-center justify-between py-3 border-b-2 border-gray-100">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-gray-700">+ Bank Charges:</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={quote.costs.bankCharges}
                    onChange={(e) => onUpdate({ 
                      costs: { ...quote.costs, bankCharges: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-28 h-9 text-sm text-right font-medium"
                  />
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>

              {/* 总到岸成本 */}
              <div className="flex items-center justify-between py-4 bg-gradient-to-r from-[#F96302]/10 to-orange-50 rounded-lg px-4 mt-4 border-2 border-[#F96302]/30">
                <span className="font-bold text-gray-900">Total Landed Cost:</span>
                <span className="text-xl font-bold text-[#F96302]">
                  {quote.currency} {landedCost.totalLandedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 真实单位成本 */}
              <div className="flex items-center justify-between py-3 bg-orange-100 rounded-lg px-4 border-2 border-orange-300">
                <span className="font-bold text-gray-800">Real Cost per Unit:</span>
                <span className="font-bold text-[#F96302]">
                  {quote.currency} {landedCost.realCostPerUnit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 提示输入FOB价格 */}
        {!hasValidData && !quote.isOurQuote && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">💡</div>
            <p className="font-medium text-gray-800">
              Enter competitor's FOB price above to calculate profit
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Real-time comparison will be shown automatically
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
