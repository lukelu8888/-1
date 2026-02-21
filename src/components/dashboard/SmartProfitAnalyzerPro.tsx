import React, { useState, useEffect } from 'react';
import { X, Plus, TrendingUp, Award, AlertTriangle, CheckCircle2, Info, Calculator, Download, BarChart3, PieChart, DollarSign, Target, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

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

interface Metrics {
  totalRevenue: number;
  totalLandedCost: number;
  fobGrossMargin: number;
  realGrossMargin: number;
  realGrossProfit: number;
  costBreakdown: {
    fobCost: number;
    oceanFreight: number;
    dutyAmount: number;
    insuranceAmount: number;
    customsClearance: number;
    bankCharges: number;
    vatAmount: number;
  };
}

interface SmartProfitAnalyzerProProps {
  isOpen: boolean;
  onClose: () => void;
  ourQuote: {
    id: string;
    quotationNumber: string;
    totalPrice: number;
    currency: string;
    items: any[];
    region: 'NA' | 'SA' | 'EU';
  };
}

export function SmartProfitAnalyzerPro({ isOpen, onClose, ourQuote }: SmartProfitAnalyzerProProps) {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [expandedCosts, setExpandedCosts] = useState<Set<string>>(new Set());

  // 初始化我们的报价
  useEffect(() => {
    if (ourQuote && quotes.length === 0) {
      const totalQuantity = ourQuote.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      
      const regionTaxRates: Record<string, { duty: number; vat: number }> = {
        'NA': { duty: 7.5, vat: 0 },
        'SA': { duty: 12, vat: 18 },
        'EU': { duty: 10, vat: 20 }
      };
      const rates = regionTaxRates[ourQuote.region] || regionTaxRates['NA'];

      const ourQuoteData: Quote = {
        id: ourQuote.id,
        label: `Our Quote (${ourQuote.quotationNumber})`,
        isOurQuote: true,
        fobPrice: ourQuote.totalPrice,
        quantity: totalQuantity,
        currency: ourQuote.currency || 'USD',
        region: ourQuote.region,
        costs: {
          oceanFreight: 850,
          importDuty: rates.duty,
          vat: rates.vat,
          customsClearance: 200,
          cargoInsurance: 2,
          bankCharges: 50
        },
        serviceIncludes: [
          'Free pre-shipment inspection',
          'L/C payment accepted',
          '12-month warranty',
          '24/7 English support',
          'Fast claims resolution (<48h)',
          'Multi-supplier consolidation'
        ]
      };

      setQuotes([ourQuoteData]);
    }
  }, [ourQuote]);

  // 恢复保存的目标价格
  useEffect(() => {
    const saved = localStorage.getItem(`targetPrice_${ourQuote.id}`);
    if (saved) {
      setTargetPrice(saved);
    }
  }, [ourQuote.id]);

  const saveTargetPrice = (value: string) => {
    setTargetPrice(value);
    if (value) {
      localStorage.setItem(`targetPrice_${ourQuote.id}`, value);
    }
  };

  // 添加竞争对手报价
  const addCompetitorQuote = () => {
    const competitorCount = quotes.filter(q => !q.isOurQuote).length;
    const newQuote: Quote = {
      id: `competitor-${Date.now()}`,
      label: `Competitor ${String.fromCharCode(65 + competitorCount)}`,
      isOurQuote: false,
      fobPrice: 0,
      quantity: quotes[0].quantity,
      currency: quotes[0].currency,
      region: quotes[0].region,
      costs: { ...quotes[0].costs }
    };
    setQuotes([...quotes, newQuote]);
  };

  const removeQuote = (id: string) => {
    setQuotes(quotes.filter(q => q.id !== id));
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    setQuotes(quotes.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const toggleCostExpansion = (id: string) => {
    const newSet = new Set(expandedCosts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedCosts(newSet);
  };

  // 计算指标
  const calculateMetrics = (quote: Quote): Metrics | null => {
    const targetPriceNum = parseFloat(targetPrice) || 0;
    if (targetPriceNum === 0 || quote.quantity === 0 || quote.fobPrice === 0) {
      return null;
    }

    const totalRevenue = targetPriceNum * quote.quantity;
    const dutyAmount = (quote.fobPrice + quote.costs.oceanFreight) * (quote.costs.importDuty / 100);
    const insuranceAmount = quote.fobPrice * (quote.costs.cargoInsurance / 100);
    const subtotal = quote.fobPrice + quote.costs.oceanFreight + dutyAmount + insuranceAmount + 
                     quote.costs.customsClearance + quote.costs.bankCharges;
    const vatAmount = subtotal * (quote.costs.vat / 100);
    const totalLandedCost = subtotal + vatAmount;

    const fobGrossProfit = totalRevenue - quote.fobPrice;
    const fobGrossMargin = (fobGrossProfit / totalRevenue) * 100;
    const realGrossProfit = totalRevenue - totalLandedCost;
    const realGrossMargin = (realGrossProfit / totalRevenue) * 100;

    return {
      totalRevenue,
      totalLandedCost,
      fobGrossMargin,
      realGrossMargin,
      realGrossProfit,
      costBreakdown: {
        fobCost: quote.fobPrice,
        oceanFreight: quote.costs.oceanFreight,
        dutyAmount,
        insuranceAmount,
        customsClearance: quote.costs.customsClearance,
        bankCharges: quote.costs.bankCharges,
        vatAmount
      }
    };
  };

  const allMetrics = quotes.map(q => ({
    quote: q,
    metrics: calculateMetrics(q)
  })).filter(item => item.metrics !== null);

  const bestMarginQuote = allMetrics.length > 0 
    ? allMetrics.reduce((best, current) => 
        current.metrics!.realGrossMargin > best.metrics!.realGrossMargin ? current : best
      )
    : null;

  const lowestPriceQuote = allMetrics.length > 0
    ? allMetrics.reduce((lowest, current) =>
        current.quote.fobPrice < lowest.quote.fobPrice ? current : lowest
      )
    : null;

  const ourQuoteMetrics = allMetrics.find(item => item.quote.isOurQuote);

  // 生成决策建议
  const generateRecommendation = () => {
    if (!ourQuoteMetrics || allMetrics.length < 2) return null;

    const ourMargin = ourQuoteMetrics.metrics!.realGrossMargin;
    const bestMargin = bestMarginQuote!.metrics!.realGrossMargin;
    const marginGap = bestMargin - ourMargin;

    if (ourQuoteMetrics.quote.id === bestMarginQuote!.quote.id) {
      return {
        type: 'success',
        title: '🎯 Perfect Position - Win This Deal!',
        message: 'You have the best profit margin. Your quote is competitive and profitable.',
        actions: [
          'Proceed with confidence',
          'Emphasize your value-added services',
          'Lock in this customer before competitors adjust'
        ]
      };
    } else if (marginGap <= 3) {
      return {
        type: 'warning',
        title: '⚠️ Close Competition - Strategic Negotiation Needed',
        message: `You're ${marginGap.toFixed(1)}% behind the best margin. Consider leveraging your services.`,
        actions: [
          'Highlight your 8% service fee vs industry 12-15%',
          'Emphasize free inspection and fast claims',
          'Offer multi-supplier consolidation value'
        ]
      };
    } else {
      return {
        type: 'danger',
        title: '🚨 Margin Gap Alert - Action Required',
        message: `You're ${marginGap.toFixed(1)}% behind. Need supplier negotiation or quote adjustment.`,
        actions: [
          'Negotiate with suppliers for better FOB pricing',
          'Review freight costs - can you consolidate shipments?',
          'Consider adjusting target price if service value justifies it'
        ]
      };
    }
  };

  const recommendation = generateRecommendation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1600px] h-[90vh] flex flex-col border-4 border-[#F96302]/30">
        {/* Header - 台湾大厂风格 */}
        <div className="bg-gradient-to-r from-[#F96302] via-orange-500 to-orange-600 px-8 py-6 rounded-t-2xl border-b-4 border-orange-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-xl">
              <Calculator className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-md flex items-center gap-3">
                Smart Profit Analyzer
                <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/30">
                  PRO Edition
                </span>
              </h1>
              <p className="text-white/90 text-sm mt-1">
                Real-time multi-quote comparison | Landed cost analysis | Strategic insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => alert('Export feature: Coming soon - PDF/Excel report')}
              className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 w-11 p-0 hover:bg-red-500/30 text-white border-2 border-transparent hover:border-red-300"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
          <div className="p-8 space-y-6">
            {/* Top Section: Target Price + Overview Metrics */}
            <div className="grid grid-cols-3 gap-6">
              {/* 目标售价 */}
              <Card className="col-span-1 border-2 border-[#F96302]/40 bg-gradient-to-br from-orange-50 to-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#F96302] flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <label className="font-bold text-gray-900">Target Selling Price</label>
                      <p className="text-xs text-gray-600">Per unit (CIF + VAT)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 22.00"
                      value={targetPrice}
                      onChange={(e) => saveTargetPrice(e.target.value)}
                      className="flex-1 h-12 px-4 text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 outline-none"
                    />
                    <div className="px-4 h-12 flex items-center bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700">
                      {quotes[0]?.currency || 'USD'}
                    </div>
                  </div>
                  {parseFloat(targetPrice) > 0 && quotes[0] && (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="text-sm text-gray-700 mb-1">Total Revenue:</div>
                      <div className="text-2xl font-bold text-green-700">
                        {quotes[0].currency} {(parseFloat(targetPrice) * quotes[0].quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {quotes[0].quantity.toLocaleString()} units × {quotes[0].currency} {parseFloat(targetPrice).toFixed(2)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Overview Metrics */}
              <div className="col-span-2 grid grid-cols-3 gap-4">
                <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Best Margin</span>
                    </div>
                    {bestMarginQuote ? (
                      <>
                        <div className="text-3xl font-bold text-purple-700">
                          {bestMarginQuote.metrics!.realGrossMargin.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {bestMarginQuote.quote.label}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">Add quotes to compare</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-white shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Lowest FOB</span>
                    </div>
                    {lowestPriceQuote ? (
                      <>
                        <div className="text-3xl font-bold text-blue-700">
                          {lowestPriceQuote.quote.currency} {lowestPriceQuote.quote.fobPrice.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 truncate">
                          {lowestPriceQuote.quote.label}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">Add quotes to compare</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-2 border-[#F96302]/40 bg-gradient-to-br from-orange-50 to-white shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-[#F96302]" />
                      <span className="text-sm font-medium text-gray-700">Our Margin</span>
                    </div>
                    {ourQuoteMetrics ? (
                      <>
                        <div className="text-3xl font-bold text-[#F96302]">
                          {ourQuoteMetrics.metrics!.realGrossMargin.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Profit: {ourQuoteMetrics.quote.currency} {ourQuoteMetrics.metrics!.realGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400">Enter target price</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quote Comparison Cards - Horizontal Scroll */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#F96302]" />
                  Quote Comparison ({quotes.length})
                </h2>
                {quotes.length < 5 && (
                  <Button
                    onClick={addCompetitorQuote}
                    className="h-10 px-6 bg-[#F96302] hover:bg-orange-600 text-white font-bold shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Competitor Quote
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {quotes.map((quote, index) => {
                  const metrics = calculateMetrics(quote);
                  const isExpanded = expandedCosts.has(quote.id);
                  const isBestMargin = bestMarginQuote?.quote.id === quote.id;
                  const isLowestPrice = lowestPriceQuote?.quote.id === quote.id;

                  return (
                    <Card 
                      key={quote.id} 
                      className={`border-2 shadow-lg transition-all hover:shadow-xl ${
                        quote.isOurQuote 
                          ? 'border-[#F96302] bg-gradient-to-br from-orange-50 via-white to-orange-50/50' 
                          : 'border-gray-300 bg-white hover:border-[#F96302]/50'
                      }`}
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {quote.isOurQuote ? (
                                <div className="px-2 py-1 bg-[#F96302] text-white text-xs font-bold rounded">
                                  OUR QUOTE
                                </div>
                              ) : (
                                <div className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
                                  COMPETITOR {String.fromCharCode(65 + index - 1)}
                                </div>
                              )}
                              {isBestMargin && (
                                <div className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  BEST
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm">
                              {quote.label}
                            </h3>
                          </div>
                          {!quote.isOurQuote && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuote(quote.id)}
                              className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* FOB Price Input */}
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">
                            FOB Price (Total) {!quote.isOurQuote && <span className="text-red-500">*</span>}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter FOB price"
                              value={quote.fobPrice || ''}
                              onChange={(e) => updateQuote(quote.id, { fobPrice: parseFloat(e.target.value) || 0 })}
                              disabled={quote.isOurQuote}
                              className={`flex-1 h-10 px-3 font-bold border-2 rounded-lg outline-none ${
                                quote.isOurQuote 
                                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                                  : 'border-gray-300 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20'
                              }`}
                            />
                            <div className="px-2 text-sm font-bold text-gray-700">
                              {quote.currency}
                            </div>
                          </div>
                        </div>

                        {/* Metrics Display */}
                        {metrics && (
                          <>
                            {/* Key Metrics */}
                            <div className="space-y-2 pt-2 border-t-2 border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Real Gross Margin:</span>
                                <span className={`text-lg font-bold ${
                                  metrics.realGrossMargin >= 20 ? 'text-green-600' :
                                  metrics.realGrossMargin >= 15 ? 'text-orange-600' :
                                  'text-red-600'
                                }`}>
                                  {metrics.realGrossMargin.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Real Profit:</span>
                                <span className="text-sm font-bold text-green-700">
                                  {quote.currency} {metrics.realGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Landed Cost:</span>
                                <span className="text-sm font-bold text-gray-900">
                                  {quote.currency} {metrics.totalLandedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Expandable Cost Breakdown */}
                            <div>
                              <button
                                onClick={() => toggleCostExpansion(quote.id)}
                                className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                              >
                                <span className="flex items-center gap-2">
                                  <PieChart className="w-4 h-4" />
                                  Cost Breakdown
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              
                              {isExpanded && (
                                <div className="mt-2 space-y-1.5 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">FOB Cost:</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.fobCost.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Ocean Freight:</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.oceanFreight.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Import Duty ({quote.costs.importDuty}%):</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.dutyAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Insurance ({quote.costs.cargoInsurance}%):</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.insuranceAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Customs Clearance:</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.customsClearance.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Bank Charges:</span>
                                    <span className="font-bold">{quote.currency} {metrics.costBreakdown.bankCharges.toLocaleString()}</span>
                                  </div>
                                  {quote.costs.vat > 0 && (
                                    <div className="flex justify-between pt-1.5 border-t border-gray-300">
                                      <span className="text-gray-600">VAT ({quote.costs.vat}%):</span>
                                      <span className="font-bold">{quote.currency} {metrics.costBreakdown.vatAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Value-Added Services (Our Quote Only) */}
                            {quote.isOurQuote && quote.serviceIncludes && (
                              <div className="pt-2 border-t-2 border-orange-200">
                                <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-[#F96302]" />
                                  Value-Added Services:
                                </div>
                                <div className="space-y-1">
                                  {quote.serviceIncludes.slice(0, 3).map((service, idx) => (
                                    <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span>{service}</span>
                                    </div>
                                  ))}
                                  {quote.serviceIncludes.length > 3 && (
                                    <div className="text-xs text-[#F96302] font-medium">
                                      +{quote.serviceIncludes.length - 3} more benefits
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Strategic Recommendation */}
            {recommendation && (
              <Card className={`border-2 shadow-xl ${
                recommendation.type === 'success' ? 'border-green-400 bg-gradient-to-br from-green-50 to-white' :
                recommendation.type === 'warning' ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-white' :
                'border-red-400 bg-gradient-to-br from-red-50 to-white'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      recommendation.type === 'success' ? 'bg-green-500' :
                      recommendation.type === 'warning' ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}>
                      {recommendation.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                       recommendation.type === 'warning' ? <AlertTriangle className="w-6 h-6 text-white" /> :
                       <AlertTriangle className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${
                        recommendation.type === 'success' ? 'text-green-900' :
                        recommendation.type === 'warning' ? 'text-amber-900' :
                        'text-red-900'
                      }`}>
                        {recommendation.title}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        recommendation.type === 'success' ? 'text-green-800' :
                        recommendation.type === 'warning' ? 'text-amber-800' :
                        'text-red-800'
                      }`}>
                        {recommendation.message}
                      </p>
                      <div className="space-y-2">
                        <div className="font-bold text-sm text-gray-900">Recommended Actions:</div>
                        {recommendation.actions.map((action, idx) => (
                          <div key={idx} className={`flex items-start gap-2 text-sm ${
                            recommendation.type === 'success' ? 'text-green-800' :
                            recommendation.type === 'warning' ? 'text-amber-800' :
                            'text-red-800'
                          }`}>
                            <span className="font-bold">{idx + 1}.</span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Usage Guide */}
            <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-3">💡 Professional Usage Guide:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                      <div>
                        <p className="font-bold mb-2">Quick Start:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Enter your <strong>target selling price</strong> (top left)</li>
                          <li>Our quote is <strong>auto-loaded</strong> and locked</li>
                          <li>Click <strong>"Add Competitor Quote"</strong> to compare</li>
                          <li>Enter competitor's <strong>FOB total price</strong></li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-bold mb-2">Key Metrics:</p>
                        <ul className="space-y-1">
                          <li>• <strong>Real Gross Margin</strong> = After all landed costs</li>
                          <li>• <strong>Landed Cost</strong> = FOB + Freight + Duty + VAT</li>
                          <li>• <strong>Best margin ≥ 20%</strong> (green), 15-20% (orange), &lt;15% (red)</li>
                          <li>• Click <strong>"Cost Breakdown"</strong> to see details</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
