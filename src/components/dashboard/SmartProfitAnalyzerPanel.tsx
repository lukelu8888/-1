import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, TrendingUp, Award, AlertTriangle, CheckCircle2, Info, Calculator, ChevronLeft, ChevronRight, Move, Maximize2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { QuoteAnalysisCard } from './QuoteAnalysisCard';

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

interface SmartProfitAnalyzerPanelProps {
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

export function SmartProfitAnalyzerPanel({ isOpen, onClose, ourQuote }: SmartProfitAnalyzerPanelProps) {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 50 });
  const [size, setSize] = useState({ width: 600, height: 700 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 初始化：添加我们的报价作为Quote A
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
        label: `Quote A: Our Quote (${ourQuote.quotationNumber})`,
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
          '✅ Free pre-shipment inspection',
          '✅ L/C payment accepted',
          '✅ 12-month warranty',
          '✅ 24/7 English support',
          '✅ Fast claims resolution (<48h)',
          '✅ Multi-supplier consolidation'
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

  // 拖拽处理 - 只在Header上触发
  const handleDragStart = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 🔥 排除按钮点击
    if (target.closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  // Resize处理
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // 限制在屏幕范围内
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;
        
        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(500, Math.min(window.innerWidth - position.x - 20, size.width + deltaX));
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(400, Math.min(window.innerHeight - position.y - 20, size.height + deltaY));
        }
        if (resizeDirection.includes('w')) {
          const newW = Math.max(500, size.width - deltaX);
          if (newW !== size.width) {
            newWidth = newW;
            newX = position.x + deltaX;
          }
        }
        if (resizeDirection.includes('n')) {
          const newH = Math.max(400, size.height - deltaY);
          if (newH !== size.height) {
            newHeight = newH;
            newY = position.y + deltaY;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, position, size, resizeDirection]);

  // 添加竞争对手报价
  const addCompetitorQuote = () => {
    const nextLetter = String.fromCharCode(65 + quotes.length);
    const newQuote: Quote = {
      id: `competitor-${Date.now()}`,
      label: `Quote ${nextLetter}: Competitor`,
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

  const calculateMetrics = (quote: Quote) => {
    const targetPriceNum = parseFloat(targetPrice) || 0;
    if (targetPriceNum === 0 || quote.quantity === 0) {
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
      realGrossProfit
    };
  };

  const generateSummary = () => {
    const validQuotes = quotes.filter(q => q.fobPrice > 0);
    if (validQuotes.length === 0 || !targetPrice) return null;

    const metricsArray = validQuotes.map(q => ({
      quote: q,
      metrics: calculateMetrics(q)
    })).filter(item => item.metrics !== null);

    if (metricsArray.length === 0) return null;

    const bestPriceQuote = metricsArray.reduce((best, current) => 
      current.quote.fobPrice < best.quote.fobPrice ? current : best
    );

    const bestMarginQuote = metricsArray.reduce((best, current) => 
      current.metrics!.realGrossMargin > best.metrics!.realGrossMargin ? current : best
    );

    const ourQuoteMetrics = metricsArray.find(item => item.quote.isOurQuote);

    return {
      bestPrice: bestPriceQuote,
      bestMargin: bestMarginQuote,
      ourQuote: ourQuoteMetrics,
      allQuotes: metricsArray
    };
  };

  const summary = generateSummary();

  if (!isOpen) return null;

  // 使用Portal渲染到body，独立于Dialog
  const panelContent = (
    <div data-profit-analyzer="true">
      {/* 折叠标签 - 右侧边缘 */}
      {!isExpanded && (
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[9999] print:hidden cursor-pointer group pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsExpanded(true);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="bg-gradient-to-l from-[#F96302] to-orange-600 text-white px-3 py-8 rounded-l-xl shadow-2xl hover:px-4 transition-all duration-300 flex items-center gap-2 border-l-4 border-orange-700">
            <div className="flex flex-col items-center gap-3">
              <Calculator className="w-6 h-6 drop-shadow-lg" />
              <div className="writing-mode-vertical font-bold tracking-widest text-sm">
                PROFIT ANALYZER
              </div>
              <div className="animate-bounce">
                <ChevronLeft className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          {/* 呼吸光环效果 */}
          <div className="absolute inset-0 bg-[#F96302] opacity-0 group-hover:opacity-30 animate-pulse rounded-l-xl -z-10"></div>
        </div>
      )}

      {/* 展开的面板 - 可拖拽、可调整大小 */}
      {isExpanded && (
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-white shadow-2xl border-2 border-[#F96302]/40 rounded-xl print:hidden pointer-events-auto overflow-hidden"
          style={{
            width: `${size.width}px`,
            height: `${size.height}px`,
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* 台湾大厂风格Header - 可拖拽 */}
          <div 
            className="drag-handle flex items-center justify-between px-5 py-4 border-b-2 bg-gradient-to-r from-[#F96302] via-orange-500 to-[#F96302] cursor-grab active:cursor-grabbing rounded-t-xl"
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Calculator className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
              <div>
                <h2 className="font-bold text-white drop-shadow-md flex items-center gap-2">
                  Smart Profit Analyzer
                  <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-normal backdrop-blur-sm">PRO</span>
                </h2>
                <p className="text-xs text-white/90">Real-time comparison & profit calculation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-white/70" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0 hover:bg-white/20 text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-red-500/20 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content - 可滚动 */}
          <div 
            className="overflow-y-auto px-5 py-4 space-y-4 bg-gradient-to-br from-gray-50 to-white"
            style={{ height: `calc(${size.height}px - 73px)` }}
          >
            {/* 目标售价输入 - 台湾大厂风格 */}
            <Card className="border-2 border-[#F96302]/30 bg-gradient-to-br from-orange-50 via-white to-orange-50/50 shadow-md">
              <CardContent className="p-4">
                <label className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F96302] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span>Target Selling Price (per unit)</span>
                  <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 22.00"
                    value={targetPrice}
                    onChange={(e) => saveTargetPrice(e.target.value)}
                    className="flex-1 h-11 px-4 font-medium border-2 border-gray-300 rounded-lg focus:border-[#F96302] focus:ring-2 focus:ring-[#F96302]/20 outline-none transition-all"
                  />
                  <div className="px-4 h-11 flex items-center bg-gray-100 border-2 border-gray-300 rounded-lg font-bold text-gray-700 min-w-[80px] justify-center">
                    {quotes[0]?.currency || 'USD'}
                  </div>
                </div>
                {parseFloat(targetPrice) > 0 && quotes[0] && (
                  <div className="mt-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Total Revenue:</span>
                      <span className="font-bold text-green-700">
                        {quotes[0].currency} {(parseFloat(targetPrice) * quotes[0].quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ({quotes[0].quantity.toLocaleString()} units × {quotes[0].currency} {parseFloat(targetPrice).toFixed(2)})
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 使用指南 - 台湾大厂风格 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900 mb-2">💡 How to Use This Tool:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-blue-800">
                    <li>Enter your <strong>target selling price</strong> above</li>
                    <li>Our quote is <strong>pre-filled</strong> as Quote A (locked)</li>
                    <li>Click <strong>"Add Competitor Quote"</strong> to compare (B, C, D, E)</li>
                    <li>Enter competitor's <strong>FOB price</strong> in each card</li>
                    <li>View <strong>real-time profit analysis</strong> and comparison</li>
                    <li><strong>Drag header</strong> to move | <strong>Drag corners/edges</strong> to resize</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* 报价列表 */}
            <div className="space-y-3">
              {quotes.map((quote, index) => (
                <QuoteAnalysisCard
                  key={quote.id}
                  quote={quote}
                  targetPrice={parseFloat(targetPrice) || 0}
                  onUpdate={(updates) => updateQuote(quote.id, updates)}
                  onRemove={quote.isOurQuote ? undefined : () => removeQuote(quote.id)}
                  showRemove={!quote.isOurQuote}
                />
              ))}
            </div>

            {/* 添加竞争对手报价按钮 */}
            {quotes.length < 5 && (
              <Button
                variant="outline"
                onClick={addCompetitorQuote}
                className="w-full h-12 border-2 border-dashed border-[#F96302]/40 hover:border-[#F96302] hover:bg-orange-50 text-[#F96302] hover:text-[#F96302] font-bold transition-all shadow-sm"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Competitor Quote {String.fromCharCode(65 + quotes.length)}
              </Button>
            )}

            {/* 对比总结 - 台湾大厂风格 */}
            {summary && summary.allQuotes.length > 1 && (
              <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 shadow-lg">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-200">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900">Comparison Summary</h3>
                  </div>

                  {/* 最佳价格 */}
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <strong>Lowest FOB Price:</strong>
                    </div>
                    <div className="font-bold text-purple-900">
                      {summary.bestPrice.quote.label.split(':')[1].trim()}
                    </div>
                    <div className="text-lg font-bold text-purple-700 mt-1">
                      {summary.bestPrice.quote.currency} {summary.bestPrice.quote.fobPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* 最佳利润率 */}
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <span className="text-2xl">💰</span>
                      <strong>Highest Profit Margin:</strong>
                    </div>
                    <div className="font-bold text-green-900">
                      {summary.bestMargin.quote.label.split(':')[1].trim()}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.bestMargin.metrics!.realGrossMargin.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Profit: <span className="font-bold text-green-700">{summary.bestMargin.quote.currency} {summary.bestMargin.metrics!.realGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* 我们报价的位置 */}
                  {summary.ourQuote && (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border-2 border-[#F96302]/40 shadow-sm">
                      <div className="flex items-start gap-3">
                        {summary.ourQuote.quote.id === summary.bestMargin.quote.id ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-[#F96302] flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-2">Our Quote Position:</h4>
                          
                          {summary.ourQuote.quote.id === summary.bestPrice.quote.id && 
                           summary.ourQuote.quote.id === summary.bestMargin.quote.id ? (
                            <p className="text-sm text-green-800 font-medium">
                              🎉 <strong>Best price AND highest margin!</strong> Perfect position.
                            </p>
                          ) : summary.ourQuote.quote.id === summary.bestMargin.quote.id ? (
                            <p className="text-sm text-green-800 font-medium">
                              ✅ <strong>Highest profit margin</strong> with comprehensive services included.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700">
                                While not the lowest FOB, consider our <strong>value-added services:</strong>
                              </p>
                              <div className="bg-white/80 rounded-lg p-3 space-y-1.5 border border-orange-200">
                                {summary.ourQuote.quote.serviceIncludes?.slice(0, 3).map((service, idx) => (
                                  <div key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F96302]"></span>
                                    {service}
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-[#F96302] font-bold">
                                💡 Our service fee: 8% vs Industry average: 12-15%
                              </p>
                            </div>
                          )}

                          {/* 数据对比 */}
                          <div className="mt-3 pt-3 border-t-2 border-orange-200 grid grid-cols-2 gap-3">
                            <div className="bg-orange-100 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Our Margin:</div>
                              <div className="text-xl font-bold text-[#F96302]">
                                {summary.ourQuote.metrics!.realGrossMargin.toFixed(1)}%
                              </div>
                            </div>
                            <div className="bg-green-100 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Best Margin:</div>
                              <div className="text-xl font-bold text-green-600">
                                {summary.bestMargin.metrics!.realGrossMargin.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 重要提示 */}
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-bold mb-2">⚠️ Decision Factors Beyond Price:</p>
                        <ul className="space-y-1 text-xs text-amber-800">
                          <li>• Supplier reliability & track record</li>
                          <li>• Product quality & consistency</li>
                          <li>• Payment terms & security (L/C acceptance)</li>
                          <li>• After-sales service & warranty</li>
                          <li>• Claims resolution speed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resize Handles - 8个方向 */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-10"
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-10"
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-10"
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize z-10 bg-[#F96302]/20 hover:bg-[#F96302]/40 rounded-tl-lg transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          >
            <Maximize2 className="w-3 h-3 text-[#F96302]" />
          </div>
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 cursor-n-resize"
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-2 cursor-s-resize"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-w-resize"
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            style={{ background: 'transparent' }}
          />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-e-resize"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            style={{ background: 'transparent' }}
          />
        </div>
      )}

      {/* CSS for vertical text */}
      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );

  return createPortal(panelContent, document.body);
}