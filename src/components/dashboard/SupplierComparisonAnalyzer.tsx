import React, { useState, useEffect } from 'react';
import { X, Plus, Award, CheckCircle2, Info, Calculator, Download, BarChart3, DollarSign, TrendingDown, Zap, ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface SupplierQuote {
  id: string;
  supplierName: string;
  isCurrentSupplier: boolean; // 是否是当前报价的供应商（福建高盛达富）
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
  services?: string[]; // 增值服务
  paymentTerms?: string;
  deliveryTime?: string;
}

interface CostMetrics {
  fobTotal: number;
  freightCost: number;
  dutyAmount: number;
  insuranceAmount: number;
  customsClearance: number;
  bankCharges: number;
  vatAmount: number;
  totalLandedCost: number;
  unitLandedCost: number;
}

interface SupplierComparisonAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  ourQuote: {
    id: string;
    quotationNumber: string;
    totalPrice: number;
    currency: string;
    items: any[];
    region: 'NA' | 'SA' | 'EU';
    paymentTerms?: string;
    deliveryTime?: string;
  };
}

export function SupplierComparisonAnalyzer({ isOpen, onClose, ourQuote }: SupplierComparisonAnalyzerProps) {
  const [suppliers, setSuppliers] = useState<SupplierQuote[]>([]);
  const [expandedCosts, setExpandedCosts] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // 🔥 初始化当前供应商（福建高盛达富）的报价
  useEffect(() => {
    if (!isOpen) {
      // 当关闭时重置状态
      setInitialized(false);
      setSuppliers([]);
      return;
    }
    
    if (initialized) return; // 已经初始化过了
    
    if (!ourQuote) {
      console.warn('⚠️ [SupplierComparisonAnalyzer] ourQuote is null/undefined');
      return;
    }
    
    console.log('🔍 [SupplierComparisonAnalyzer] Initializing supplier with quote:', ourQuote);
    
    // 🔥 计算总数量，如果items为空则使用默认值100
    const totalQuantity = Array.isArray(ourQuote.items) && ourQuote.items.length > 0
      ? ourQuote.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 100; // 默认数量
    
    console.log('🔍 [SupplierComparisonAnalyzer] Items:', ourQuote.items);
    console.log('🔍 [SupplierComparisonAnalyzer] Total quantity:', totalQuantity);
    
    const regionTaxRates: Record<string, { duty: number; vat: number }> = {
      'NA': { duty: 7.5, vat: 0 },
      'SA': { duty: 12, vat: 18 },
      'EU': { duty: 10, vat: 20 }
    };
    const rates = regionTaxRates[ourQuote.region] || regionTaxRates['NA'];

    const ourSupplier: SupplierQuote = {
      id: ourQuote.id,
      supplierName: 'Fujian Gaoshengdafu (Current Quote)',
      isCurrentSupplier: true,
      fobPrice: ourQuote.totalPrice || 0,
      quantity: totalQuantity || 100,
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
      services: [
        'Free pre-shipment inspection',
        'L/C payment accepted',
        '12-month warranty',
        '24/7 English support',
        'Fast claims resolution (<48h)',
        'Multi-supplier consolidation'
      ],
      paymentTerms: ourQuote.paymentTerms || 'T/T 30% deposit, 70% before shipment',
      deliveryTime: ourQuote.deliveryTime || '25-30 days'
    };

    console.log('✅ [SupplierComparisonAnalyzer] Supplier initialized:', ourSupplier);
    setSuppliers([ourSupplier]);
    setInitialized(true);
  }, [isOpen, ourQuote, initialized]);

  // 恢复保存的竞争供应商报价
  useEffect(() => {
    if (!isOpen || !ourQuote?.id) return;
    
    const saved = localStorage.getItem(`competitorQuotes_${ourQuote.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSuppliers(prev => {
            const currentSupplier = prev.find(s => s.isCurrentSupplier);
            return currentSupplier ? [currentSupplier, ...parsed] : parsed;
          });
        }
      } catch (e) {
        console.error('Failed to parse saved quotes:', e);
      }
    }
  }, [isOpen, ourQuote.id]);

  // 保存竞争供应商报价到localStorage
  const saveCompetitorQuotes = (allSuppliers: SupplierQuote[]) => {
    const competitors = allSuppliers.filter(s => !s.isCurrentSupplier);
    localStorage.setItem(`competitorQuotes_${ourQuote.id}`, JSON.stringify(competitors));
  };

  // 添加竞争供应商报价
  const addCompetitorSupplier = () => {
    const competitorCount = suppliers.filter(s => !s.isCurrentSupplier).length;
    const newSupplier: SupplierQuote = {
      id: `competitor-${Date.now()}`,
      supplierName: `Supplier ${String.fromCharCode(65 + competitorCount)}`,
      isCurrentSupplier: false,
      fobPrice: 0,
      quantity: suppliers[0].quantity,
      currency: suppliers[0].currency,
      region: suppliers[0].region,
      costs: { ...suppliers[0].costs },
      paymentTerms: 'T/T 30% deposit',
      deliveryTime: '30-35 days'
    };
    const newSuppliers = [...suppliers, newSupplier];
    setSuppliers(newSuppliers);
    saveCompetitorQuotes(newSuppliers);
  };

  const removeSupplier = (id: string) => {
    const newSuppliers = suppliers.filter(s => s.id !== id);
    setSuppliers(newSuppliers);
    saveCompetitorQuotes(newSuppliers);
  };

  const updateSupplier = (id: string, updates: Partial<SupplierQuote>) => {
    const newSuppliers = suppliers.map(s => s.id === id ? { ...s, ...updates } : s);
    setSuppliers(newSuppliers);
    saveCompetitorQuotes(newSuppliers);
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

  // 计算Landed Cost指标
  const calculateCostMetrics = (supplier: SupplierQuote): CostMetrics | null => {
    if (supplier.quantity === 0 || supplier.fobPrice === 0) {
      return null;
    }

    const dutyAmount = (supplier.fobPrice + supplier.costs.oceanFreight) * (supplier.costs.importDuty / 100);
    const insuranceAmount = supplier.fobPrice * (supplier.costs.cargoInsurance / 100);
    const subtotal = supplier.fobPrice + supplier.costs.oceanFreight + dutyAmount + insuranceAmount + 
                     supplier.costs.customsClearance + supplier.costs.bankCharges;
    const vatAmount = subtotal * (supplier.costs.vat / 100);
    const totalLandedCost = subtotal + vatAmount;
    const unitLandedCost = totalLandedCost / supplier.quantity;

    return {
      fobTotal: supplier.fobPrice,
      freightCost: supplier.costs.oceanFreight,
      dutyAmount,
      insuranceAmount,
      customsClearance: supplier.costs.customsClearance,
      bankCharges: supplier.costs.bankCharges,
      vatAmount,
      totalLandedCost,
      unitLandedCost
    };
  };

  const allMetrics = suppliers.map(s => ({
    supplier: s,
    metrics: calculateCostMetrics(s)
  })).filter(item => item.metrics !== null);

  const lowestCostSupplier = allMetrics.length > 0
    ? allMetrics.reduce((lowest, current) =>
        current.metrics!.totalLandedCost < lowest.metrics!.totalLandedCost ? current : lowest
      )
    : null;

  const currentSupplierMetrics = allMetrics.find(item => item.supplier.isCurrentSupplier);

  // 生成采购建议
  const generateRecommendation = () => {
    if (!currentSupplierMetrics || allMetrics.length < 2) return null;

    const currentCost = currentSupplierMetrics.metrics!.totalLandedCost;
    const lowestCost = lowestCostSupplier!.metrics!.totalLandedCost;
    const costDiff = currentCost - lowestCost;
    const costDiffPercent = (costDiff / currentCost) * 100;

    if (currentSupplierMetrics.supplier.id === lowestCostSupplier!.supplier.id) {
      return {
        type: 'success',
        title: '🎯 Best Value - This is Your Best Option!',
        message: `${currentSupplierMetrics.supplier.supplierName} offers the lowest total landed cost among all suppliers.`,
        actions: [
          'This supplier has the most competitive pricing',
          'Consider their value-added services (inspection, warranty, support)',
          'Proceed with this order with confidence'
        ]
      };
    } else if (costDiffPercent <= 5) {
      return {
        type: 'warning',
        title: '⚖️ Close Competition - Consider All Factors',
        message: `${currentSupplierMetrics.supplier.supplierName} is ${costDiffPercent.toFixed(1)}% (${currentSupplierMetrics.supplier.currency} ${costDiff.toLocaleString('en-US', { maximumFractionDigits: 2 })}) more expensive than the lowest option.`,
        actions: [
          'Price difference is small - consider quality and service',
          'Review payment terms and delivery time carefully',
          'Value-added services may justify the small premium',
          'Check supplier reliability and track record'
        ]
      };
    } else {
      return {
        type: 'info',
        title: '💡 Significant Price Difference - Negotiate or Switch',
        message: `${currentSupplierMetrics.supplier.supplierName} is ${costDiffPercent.toFixed(1)}% (${currentSupplierMetrics.supplier.currency} ${costDiff.toLocaleString('en-US', { maximumFractionDigits: 2 })}) more expensive than ${lowestCostSupplier!.supplier.supplierName}.`,
        actions: [
          'Consider negotiating with current supplier for better pricing',
          'Evaluate if switching suppliers is worth the cost savings',
          'Compare quality, service level, and reliability',
          'Request detailed breakdown and justification for price difference'
        ]
      };
    }
  };

  const recommendation = generateRecommendation();

  // 🔥 调试日志
  console.log('🔍 [SupplierComparisonAnalyzer] Render check:', {
    isOpen,
    ourQuote,
    suppliers: suppliers.length,
    showingAnalyzer: isOpen
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1600px] h-[90vh] flex flex-col border-4 border-[#F96302]/30">
        {/* Header - 台湾大厂风格 */}
        <div className="bg-gradient-to-r from-[#F96302] via-orange-500 to-orange-600 px-8 py-6 rounded-t-2xl border-b-4 border-orange-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/40 shadow-xl">
              <Calculator className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-md flex items-center gap-3">
                Supplier Comparison Analyzer
                <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-lg text-sm font-semibold border border-white/30">
                  Buyer's Tool
                </span>
              </h1>
              <p className="text-white/90 text-sm mt-1">
                Quotation: <span className="font-semibold">{ourQuote.quotationNumber}</span> | Compare total landed costs | Analyze payment terms | Make smarter purchasing decisions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-semibold"
            >
              <X className="w-4 h-4 mr-2" />
              Back to Quotation
            </Button>
            <Button
              variant="ghost"
              onClick={() => alert('Export feature: Coming soon - PDF comparison report')}
              className="h-11 px-5 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
          <div className="p-8 space-y-6">
            {/* Overview Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-white shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Lowest Total Cost</span>
                  </div>
                  {lowestCostSupplier ? (
                    <>
                      <div className="text-3xl font-bold text-green-700">
                        {lowestCostSupplier.supplier.currency} {lowestCostSupplier.metrics!.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {lowestCostSupplier.supplier.supplierName}
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
                    <span className="text-sm font-medium text-gray-700">Current Quote</span>
                  </div>
                  {currentSupplierMetrics ? (
                    <>
                      <div className="text-3xl font-bold text-blue-700">
                        {currentSupplierMetrics.supplier.currency} {currentSupplierMetrics.metrics!.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Total Landed Cost
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-400">Loading...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Potential Savings</span>
                  </div>
                  {currentSupplierMetrics && lowestCostSupplier && currentSupplierMetrics.supplier.id !== lowestCostSupplier.supplier.id ? (
                    <>
                      <div className="text-3xl font-bold text-purple-700">
                        {currentSupplierMetrics.supplier.currency} {(currentSupplierMetrics.metrics!.totalLandedCost - lowestCostSupplier.metrics!.totalLandedCost).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {(((currentSupplierMetrics.metrics!.totalLandedCost - lowestCostSupplier.metrics!.totalLandedCost) / currentSupplierMetrics.metrics!.totalLandedCost) * 100).toFixed(1)}% savings possible
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-green-700">$0</div>
                      <div className="text-xs text-green-600 mt-1">Already best price!</div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-white shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Total Quantity</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-700">
                    {suppliers[0]?.quantity.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Units
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supplier Comparison Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[#F96302]" />
                  Supplier Quotes ({suppliers.length})
                </h2>
                {suppliers.length < 5 && (
                  <Button
                    onClick={addCompetitorSupplier}
                    className="h-10 px-6 bg-[#F96302] hover:bg-orange-600 text-white font-bold shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier Quote
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {suppliers.map((supplier, index) => {
                  const metrics = calculateCostMetrics(supplier);
                  const isExpanded = expandedCosts.has(supplier.id);
                  const isLowestCost = lowestCostSupplier?.supplier.id === supplier.id;

                  return (
                    <Card 
                      key={supplier.id} 
                      className={`border-2 shadow-lg transition-all hover:shadow-xl ${
                        supplier.isCurrentSupplier 
                          ? 'border-[#F96302] bg-gradient-to-br from-orange-50 via-white to-orange-50/50' 
                          : 'border-gray-300 bg-white hover:border-[#F96302]/50'
                      }`}
                    >
                      <CardContent className="p-5 space-y-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {supplier.isCurrentSupplier ? (
                                <div className="px-2 py-1 bg-[#F96302] text-white text-xs font-bold rounded">
                                  CURRENT QUOTE
                                </div>
                              ) : (
                                <div className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
                                  ALTERNATIVE
                                </div>
                              )}
                              {isLowestCost && (
                                <div className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  BEST PRICE
                                </div>
                              )}
                            </div>
                            {supplier.isCurrentSupplier ? (
                              <h3 className="font-bold text-gray-900 text-sm">
                                {supplier.supplierName}
                              </h3>
                            ) : (
                              <input
                                type="text"
                                value={supplier.supplierName}
                                onChange={(e) => updateSupplier(supplier.id, { supplierName: e.target.value })}
                                placeholder="Enter supplier name"
                                className="font-bold text-gray-900 text-sm w-full px-2 py-1 border border-gray-300 rounded focus:border-[#F96302] focus:ring-1 focus:ring-[#F96302] outline-none"
                              />
                            )}
                          </div>
                          {!supplier.isCurrentSupplier && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSupplier(supplier.id)}
                              className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        {/* FOB Price Input */}
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">
                            FOB Price (Total) {!supplier.isCurrentSupplier && <span className="text-red-500">*</span>}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Enter FOB price"
                              value={supplier.fobPrice || ''}
                              onChange={(e) => updateSupplier(supplier.id, { fobPrice: parseFloat(e.target.value) || 0 })}
                              disabled={supplier.isCurrentSupplier}
                              className={`flex-1 h-10 px-3 font-bold border-2 rounded-lg outline-none ${
                                supplier.isCurrentSupplier 
                                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                                  : 'border-gray-300 focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20'
                              }`}
                            />
                            <div className="px-2 text-sm font-bold text-gray-700">
                              {supplier.currency}
                            </div>
                          </div>
                        </div>

                        {/* Metrics Display */}
                        {metrics && (
                          <>
                            {/* Key Metrics */}
                            <div className="space-y-2 pt-2 border-t-2 border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Total Landed Cost:</span>
                                <span className="text-lg font-bold text-[#F96302]">
                                  {supplier.currency} {metrics.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Unit Landed Cost:</span>
                                <span className="text-sm font-bold text-gray-900">
                                  {supplier.currency} {metrics.unitLandedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">FOB Total:</span>
                                <span className="text-sm font-bold text-blue-700">
                                  {supplier.currency} {metrics.fobTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Expandable Cost Breakdown */}
                            <div>
                              <button
                                onClick={() => toggleCostExpansion(supplier.id)}
                                className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                              >
                                <span className="flex items-center gap-2">
                                  <Calculator className="w-4 h-4" />
                                  Cost Breakdown
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              
                              {isExpanded && (
                                <div className="mt-2 space-y-1.5 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">FOB Cost:</span>
                                    <span className="font-bold">{supplier.currency} {metrics.fobTotal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Ocean Freight:</span>
                                    <span className="font-bold">{supplier.currency} {metrics.freightCost.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Import Duty ({supplier.costs.importDuty}%):</span>
                                    <span className="font-bold">{supplier.currency} {metrics.dutyAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Insurance ({supplier.costs.cargoInsurance}%):</span>
                                    <span className="font-bold">{supplier.currency} {metrics.insuranceAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Customs Clearance:</span>
                                    <span className="font-bold">{supplier.currency} {metrics.customsClearance.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Bank Charges:</span>
                                    <span className="font-bold">{supplier.currency} {metrics.bankCharges.toLocaleString()}</span>
                                  </div>
                                  {supplier.costs.vat > 0 && (
                                    <div className="flex justify-between pt-1.5 border-t border-gray-300">
                                      <span className="text-gray-600">VAT ({supplier.costs.vat}%):</span>
                                      <span className="font-bold">{supplier.currency} {metrics.vatAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between pt-1.5 border-t-2 border-gray-400 font-bold">
                                    <span className="text-gray-900">Total Landed:</span>
                                    <span className="text-[#F96302]">{supplier.currency} {metrics.totalLandedCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Payment Terms & Delivery */}
                            <div className="pt-2 border-t border-gray-200 space-y-2 text-xs">
                              <div>
                                <span className="text-gray-600 font-medium">Payment: </span>
                                <span className="text-gray-900">{supplier.paymentTerms}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 font-medium">Delivery: </span>
                                <span className="text-gray-900">{supplier.deliveryTime}</span>
                              </div>
                            </div>

                            {/* Value-Added Services (Current Supplier Only) */}
                            {supplier.isCurrentSupplier && supplier.services && (
                              <div className="pt-2 border-t-2 border-orange-200">
                                <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-[#F96302]" />
                                  Value-Added Services:
                                </div>
                                <div className="space-y-1">
                                  {supplier.services.slice(0, 3).map((service, idx) => (
                                    <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                      <span>{service}</span>
                                    </div>
                                  ))}
                                  {supplier.services.length > 3 && (
                                    <div className="text-xs text-[#F96302] font-medium">
                                      +{supplier.services.length - 3} more benefits
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

            {/* Purchasing Recommendation */}
            {recommendation && (
              <Card className={`border-2 shadow-xl ${
                recommendation.type === 'success' ? 'border-green-400 bg-gradient-to-br from-green-50 to-white' :
                recommendation.type === 'warning' ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-white' :
                'border-blue-400 bg-gradient-to-br from-blue-50 to-white'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      recommendation.type === 'success' ? 'bg-green-500' :
                      recommendation.type === 'warning' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`}>
                      {recommendation.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                       recommendation.type === 'warning' ? <Info className="w-6 h-6 text-white" /> :
                       <Info className="w-6 h-6 text-white" />}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${
                        recommendation.type === 'success' ? 'text-green-900' :
                        recommendation.type === 'warning' ? 'text-amber-900' :
                        'text-blue-900'
                      }`}>
                        {recommendation.title}
                      </h3>
                      <p className={`text-sm mb-4 ${
                        recommendation.type === 'success' ? 'text-green-800' :
                        recommendation.type === 'warning' ? 'text-amber-800' :
                        'text-blue-800'
                      }`}>
                        {recommendation.message}
                      </p>
                      <div className="space-y-2">
                        <div className="font-bold text-sm text-gray-900">💡 Considerations:</div>
                        {recommendation.actions.map((action, idx) => (
                          <div key={idx} className={`flex items-start gap-2 text-sm ${
                            recommendation.type === 'success' ? 'text-green-800' :
                            recommendation.type === 'warning' ? 'text-amber-800' :
                            'text-blue-800'
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
                    <h3 className="font-bold text-blue-900 mb-3">💡 How to Use This Tool:</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                      <div>
                        <p className="font-bold mb-2">Quick Start:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Current quote is <strong>already loaded</strong></li>
                          <li>Click <strong>"Add Supplier Quote"</strong> to compare alternatives</li>
                          <li>Enter competitor's <strong>supplier name & FOB price</strong></li>
                          <li>Compare <strong>Total Landed Cost</strong> across all suppliers</li>
                        </ol>
                      </div>
                      <div>
                        <p className="font-bold mb-2">Key Information:</p>
                        <ul className="space-y-1">
                          <li>• <strong>Total Landed Cost</strong> = Final price at your warehouse</li>
                          <li>• Includes: FOB + Freight + Duty + VAT + All Fees</li>
                          <li>• <strong>Green badge</strong> = Lowest total cost</li>
                          <li>• Click <strong>"Cost Breakdown"</strong> for detailed analysis</li>
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