/**
 * 🔥 供应商报价单编辑器 - 台湾大厂风格
 * 集成成本分析器和利润计算系统
 */

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calculator, Save, Send, X, TrendingUp, DollarSign, Package, Truck, Users, Settings, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { apiFetchJson } from '../../api/backend-auth';

interface SupplierQuotationEditorProps {
  quotation: any;
  onSave: (updatedQuotation: any) => void;
  onCancel: () => void;
}

// 🔥 成本结构接口
interface CostBreakdown {
  materialCost: number;      // 原材料成本
  laborCost: number;         // 人工成本
  manufacturingCost: number; // 制造费用
  packagingCost: number;     // 包装费用
  shippingCost: number;      // 运输费用
  overheadCost: number;      // 管理费用
  otherCost: number;         // 其他费用
}

export default function SupplierQuotationEditor({ quotation, onSave, onCancel }: SupplierQuotationEditorProps) {
  // 🔥 产品价格和成本状态
  const [itemPrices, setItemPrices] = useState<Record<string, string>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.unitPrice?.toString() || '';
      return acc;
    }, {}) || {}
  );
  
  // 🔥 成本结构状态（每个产品都有独立的成本结构）
  const [itemCosts, setItemCosts] = useState<Record<string, CostBreakdown>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.costBreakdown || {
        materialCost: 0,
        laborCost: 0,
        manufacturingCost: 0,
        packagingCost: 0,
        shippingCost: 0,
        overheadCost: 0,
        otherCost: 0
      };
      return acc;
    }, {}) || {}
  );

  // 🔥 目标利润率（每个产品独立设置）
  const [targetMargins, setTargetMargins] = useState<Record<string, string>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.targetMargin?.toString() || '15';
      return acc;
    }, {}) || {}
  );

  // 🔥 展开的成本分析器（哪些产品的成本分析器是展开的）
  const [expandedCostAnalyzers, setExpandedCostAnalyzers] = useState<Record<string, boolean>>({});
  
  const [leadTime, setLeadTime] = useState(quotation.items?.[0]?.leadTime?.toString() || '30');
  const [moq, setMoq] = useState(quotation.items?.[0]?.moq?.toString() || '1000');
  const [paymentTerms, setPaymentTerms] = useState(quotation.paymentTerms || 'T/T 30天');
  const [deliveryTerms, setDeliveryTerms] = useState(quotation.deliveryTerms || 'FOB 厦门');
  const [remarks, setRemarks] = useState(quotation.generalRemarks || '');
  const [supplierRemarks, setSupplierRemarks] = useState(quotation.supplierRemarks || '');
  const [status, setStatus] = useState<'draft' | 'submitted'>(quotation.status);
  
  // 🔥 全局货币设置 - 默认为人民币
  const [globalCurrency, setGlobalCurrency] = useState(quotation.currency || 'CNY');
  
  // 🔥 货币符号映射
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'CNY': '¥',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥'
    };
    return symbols[currency] || currency;
  };

  // 🔥 计算单个产品的总成本
  const calculateTotalCost = (itemId: string): number => {
    const costs = itemCosts[itemId];
    if (!costs) return 0;
    return (
      costs.materialCost +
      costs.laborCost +
      costs.manufacturingCost +
      costs.packagingCost +
      costs.shippingCost +
      costs.overheadCost +
      costs.otherCost
    );
  };

  // 🔥 根据成本和目标利润率计算建议报价
  const calculateSuggestedPrice = (itemId: string): number => {
    const totalCost = calculateTotalCost(itemId);
    const margin = parseFloat(targetMargins[itemId] || '15');
    return totalCost / (1 - margin / 100);
  };

  // 🔥 计算实际利润率
  const calculateActualMargin = (itemId: string): number => {
    const price = parseFloat(itemPrices[itemId] || '0');
    const cost = calculateTotalCost(itemId);
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // 🔥 计算实际利润金额
  const calculateActualProfit = (itemId: string): number => {
    const price = parseFloat(itemPrices[itemId] || '0');
    const cost = calculateTotalCost(itemId);
    return price - cost;
  };

  // 🔥 应用建议报价
  const applySuggestedPrice = (itemId: string) => {
    const suggested = calculateSuggestedPrice(itemId);
    setItemPrices({ ...itemPrices, [itemId]: suggested.toFixed(2) });
    toast.success('已应用建议报价');
  };

  // 🔥 快速填充成本（基于百分比）
  const quickFillCost = (itemId: string, basePrice: number) => {
    const newCosts: CostBreakdown = {
      materialCost: basePrice * 0.50,  // 原材料50%（建材行业原材料占比高）
      laborCost: basePrice * 0.15,     // 人工15%（中国制造人工成本相对较低）
      manufacturingCost: basePrice * 0.10, // 制造费用10%（水电、设备折旧）
      packagingCost: basePrice * 0.05, // 包装5%（出口包装要求较高）
      shippingCost: basePrice * 0.06,  // 运输6%（国内运输+港口费用）
      overheadCost: basePrice * 0.08,  // 管理费用8%（销售、行政、质检）
      otherCost: basePrice * 0.03      // 其他3%（认证、保险等）
    };
    setItemCosts({ ...itemCosts, [itemId]: newCosts });
    toast.info('已应用中国工厂标准成本模板（总成本97%，利润率3%）');
  };

  // 计算总金额和总利润
  const totalAmount = quotation.items?.reduce((sum: number, item: any) => {
    const unitPrice = parseFloat(itemPrices[item.id] || '0');
    return sum + (unitPrice * item.quantity);
  }, 0) || 0;

  const totalCost = quotation.items?.reduce((sum: number, item: any) => {
    const cost = calculateTotalCost(item.id);
    return sum + (cost * item.quantity);
  }, 0) || 0;

  const totalProfit = totalAmount - totalCost;
  const overallMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

  // 🔥 检查是否所有必填项都已填写
  const isFormValid = (): boolean => {
    // 1. 检查所有产品是否都有有效的单价
    const allPricesValid = quotation.items?.every((item: any) => {
      const price = parseFloat(itemPrices[item.id] || '0');
      return price > 0;
    });
    
    // 2. 检查交货期、MOQ是否有效
    const leadTimeValid = parseInt(leadTime) > 0;
    const moqValid = parseInt(moq) > 0;
    
    // 3. 检查付款条款和交货条款是否填写
    const paymentTermsValid = paymentTerms.trim().length > 0;
    const deliveryTermsValid = deliveryTerms.trim().length > 0;
    
    return allPricesValid && leadTimeValid && moqValid && paymentTermsValid && deliveryTermsValid;
  };

  const handleSave = async (submitNow: boolean = false) => {
    // 🔥 仅在提交时验证必填字段（保存草稿不验证）
    if (submitNow && !isFormValid()) {
      toast.error('请填写所有必填项（单价、交货期、MOQ、付款方式、交货条款）');
      return;
    }

    // 更新报价单数据
    const updatedQuotation = {
      ...quotation,
      currency: globalCurrency, // 🔥 保存全局货币设置
      items: quotation.items.map((item: any) => ({
        ...item,
        unitPrice: parseFloat(itemPrices[item.id] || '0'),
        amount: parseFloat(itemPrices[item.id] || '0') * item.quantity,
        currency: globalCurrency, // 🔥 更新产品货币
        leadTime: parseInt(leadTime),
        moq: parseInt(moq),
        costBreakdown: itemCosts[item.id], // 🔥 保存成本结构
        targetMargin: parseFloat(targetMargins[item.id] || '15'), // 🔥 保存目标利润率
        actualMargin: calculateActualMargin(item.id), // 🔥 保存实际利润率
        actualProfit: calculateActualProfit(item.id) // 🔥 保存实际利润
      })),
      totalAmount,
      totalCost, // 🔥 保存总成本
      totalProfit, // 🔥 保存总利润
      overallMargin, // 🔥 保存整体利润率
      paymentTerms,
      deliveryTerms,
      generalRemarks: remarks,
      supplierRemarks,
      status: submitNow ? 'submitted' : 'draft',
      version: quotation.version + 1
    };
    
    // 🔥 调试：打印更新后的报价单
    console.log('💾 updatedQuotation.currency (保存后):', updatedQuotation.currency);
    console.log('💾 updatedQuotation.items[0].currency:', updatedQuotation.items[0]?.currency);
    console.log('💾 完整的 updatedQuotation:', updatedQuotation);

    // 更新documentData
    if (updatedQuotation.documentData) {
      updatedQuotation.documentData.products = updatedQuotation.items.map((item: any, index: number) => ({
        no: index + 1,
        modelNo: item.modelNo,
        description: item.productName,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        currency: item.currency,
        remarks: item.remarks
      }));

      updatedQuotation.documentData.terms = {
        paymentTerms: updatedQuotation.paymentTerms,
        deliveryTerms: updatedQuotation.deliveryTerms,
        deliveryTime: `收到订单后${leadTime}天内`,
        deliveryAddress: '福建省福州市仓山区金山工业区',
        moq: `${moq} ${quotation.items[0].unit}`,
        qualityStandard: '符合国家标准',
        warranty: '12个月',
        packaging: updatedQuotation.packingTerms || '标准出口包装',
        shippingMarks: '中性唛头',
        remarks: updatedQuotation.generalRemarks
      };
      
      updatedQuotation.documentData.supplierRemarks = supplierRemarks ? {
        content: supplierRemarks,
        remarkDate: quotation.quotationDate,
        remarkBy: quotation.supplierName || '供应商'
      } : undefined;
    } else {
      // 🔥 如果没有documentData，创建一个完整的文档数据结构
      updatedQuotation.documentData = {
        quotationNo: updatedQuotation.quotationNo,
        quotationDate: updatedQuotation.quotationDate,
        validUntil: updatedQuotation.validUntil,
        rfqReference: updatedQuotation.sourceXJ || updatedQuotation.sourceQR,
        supplier: {
          companyName: updatedQuotation.supplierCompany || '',
          address: '供应商地址',
          tel: updatedQuotation.supplierPhone || '',
          email: updatedQuotation.supplierEmail || '',
          contactPerson: updatedQuotation.supplierContact || updatedQuotation.supplierName || '',
          supplierCode: updatedQuotation.supplierCode || ''
        },
        buyer: {
          name: '福建高盛达富建材有限公司',
          nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
          address: '福建省厦门市思明区',
          addressEn: 'Siming District, Xiamen, Fujian, China',
          tel: '+86-592-1234567',
          email: 'purchase@cosun.com',
          contactPerson: updatedQuotation.customerName || 'COSUN采购'
        },
        products: updatedQuotation.items.map((item: any, index: number) => ({
          no: index + 1,
          modelNo: item.modelNo,
          description: item.productName,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          currency: item.currency, // 🔥 使用更新后的货币
          remarks: item.remarks
        })),
        terms: {
          paymentTerms: updatedQuotation.paymentTerms,
          deliveryTerms: updatedQuotation.deliveryTerms,
          deliveryTime: `收到订单后${leadTime}天内`,
          deliveryAddress: '福建省福州市仓山区金山工业区',
          moq: `${moq} ${quotation.items[0].unit}`,
          qualityStandard: '符合国家标准',
          warranty: '12个月',
          packaging: updatedQuotation.packingTerms || '标准出口包装',
          shippingMarks: '中性唛头',
          remarks: updatedQuotation.generalRemarks
        },
        supplierRemarks: supplierRemarks ? {
          content: supplierRemarks,
          remarkDate: quotation.quotationDate,
          remarkBy: quotation.supplierName || '供应商'
        } : undefined
      };
    }

    if (submitNow) {
      try {
        const payload = {
          id: updatedQuotation.id,
          quotationNo: updatedQuotation.quotationNo,
          sourceRFQId: updatedQuotation.sourceRFQId,
          sourceXJ: updatedQuotation.sourceXJ,
          sourceQR: updatedQuotation.sourceQR,
          supplierCode: updatedQuotation.supplierCode,
          supplierName: updatedQuotation.supplierName,
          supplierEmail: updatedQuotation.supplierEmail,
          currency: updatedQuotation.currency,
          totalAmount: updatedQuotation.totalAmount,
          paymentTerms: updatedQuotation.paymentTerms,
          deliveryTerms: updatedQuotation.deliveryTerms,
          generalRemarks: updatedQuotation.generalRemarks ?? '',
          supplierRemarks: updatedQuotation.supplierRemarks ?? '',
          items: (updatedQuotation.items || []).map((item: any) => ({
            id: item.id,
            productName: item.productName,
            modelNo: item.modelNo ?? '',
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            leadTime: item.leadTime ?? parseInt(leadTime, 10),
            moq: item.moq ?? parseInt(moq, 10),
          })),
          documentData: updatedQuotation.documentData ?? null,
        };
        await apiFetchJson<{ quotation: any }>('/api/supplier-quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        toast.error(err?.message ?? '提交报价失败，请重试');
        return;
      }
    }

    onSave(updatedQuotation);

    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ {submitNow ? '报价单已提交给采购员' : '报价单已保存'}</p>
        <p className="text-sm">报价单号: {quotation.quotationNo}</p>
        <p className="text-sm">总金额: {getCurrencySymbol(globalCurrency)}{totalAmount.toLocaleString()}</p>
        {submitNow && <p className="text-xs text-slate-600">采购员将在【供应商报价】中收到并对比报价</p>}
      </div>,
      { duration: 4000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* 🔥 顶部信息卡 - 紧凑型 */}
      <div className="grid grid-cols-4 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        <div>
          <div className="text-xs text-blue-600 mb-0.5">报价单号</div>
          <div className="font-semibold text-sm">{quotation.quotationNo}</div>
        </div>
        <div>
          <div className="text-xs text-blue-600 mb-0.5">询价单号</div>
          <div className="font-semibold text-sm">{quotation.sourceXJ}</div>
        </div>
        <div>
          <div className="text-xs text-blue-600 mb-0.5">客户</div>
          <div className="font-semibold text-sm truncate">{quotation.customerName}</div>
        </div>
        <div>
          <div className="text-xs text-blue-600 mb-0.5">报价日期</div>
          <div className="font-semibold text-sm">{quotation.quotationDate}</div>
        </div>
      </div>

      {/* 🔥 货币设置条 - 一键切换 */}
      <div className="bg-white border-2 border-purple-200 rounded-lg p-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-purple-600" />
          <Label className="text-sm font-semibold text-purple-900">报价货币</Label>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={globalCurrency} 
            onValueChange={(value) => {
              setGlobalCurrency(value);
              toast.success(`已切换到 ${value === 'CNY' ? '人民币' : value === 'USD' ? '美元' : value === 'EUR' ? '欧元' : value === 'GBP' ? '英镑' : '日元'}`);
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-sm border-2 border-purple-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CNY">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">¥</span>
                  <span>人民币 (CNY)</span>
                </div>
              </SelectItem>
              <SelectItem value="USD">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">$</span>
                  <span>美元 (USD)</span>
                </div>
              </SelectItem>
              <SelectItem value="EUR">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">€</span>
                  <span>欧元 (EUR)</span>
                </div>
              </SelectItem>
              <SelectItem value="GBP">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">£</span>
                  <span>英镑 (GBP)</span>
                </div>
              </SelectItem>
              <SelectItem value="JPY">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">¥</span>
                  <span>日元 (JPY)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded border border-purple-200">
            <span className="font-semibold">{getCurrencySymbol(globalCurrency)}</span> 
            <span className="ml-1">此设置将应用到所有产品</span>
          </div>
        </div>
      </div>

      {/* 🔥 总览指标卡 - 台湾大厂风格 */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white border-2 border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <div className="text-xs text-slate-600">报价总额</div>
          </div>
          <div className="text-xl font-bold text-orange-600">
            {getCurrencySymbol(globalCurrency)}{totalAmount.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border-2 border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-red-600" />
            <div className="text-xs text-slate-600">总成本</div>
          </div>
          <div className="text-xl font-bold text-red-600">
            {getCurrencySymbol(globalCurrency)}{totalCost.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div className="text-xs text-slate-600">预估利润</div>
          </div>
          <div className="text-xl font-bold text-green-600">
            {getCurrencySymbol(globalCurrency)}{totalProfit.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-4 h-4 text-blue-600" />
            <div className="text-xs text-slate-600">利润率</div>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {overallMargin.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 🔥 产品清单 - 紧凑型台湾大厂风格 */}
      <div className="space-y-2">
        {quotation.items?.map((item: any, index: number) => {
          const totalCost = calculateTotalCost(item.id);
          const suggestedPrice = calculateSuggestedPrice(item.id);
          const actualMargin = calculateActualMargin(item.id);
          const actualProfit = calculateActualProfit(item.id);
          const isExpanded = expandedCostAnalyzers[item.id];

          return (
            <div key={item.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">
              {/* 产品头部 */}
              <div className="bg-slate-50 px-3 py-2 border-b-2 border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="outline" className="text-xs font-bold">#{index + 1}</Badge>
                    <div className="font-semibold text-sm">{item.productName}</div>
                    <div className="text-xs text-slate-500">型号: {item.modelNo}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div><span className="text-slate-500">数量:</span> <span className="font-semibold">{item.quantity} {item.unit}</span></div>
                    <div><span className="text-slate-500">货币:</span> <span className="font-semibold">{globalCurrency}</span></div>
                  </div>
                </div>
                {item.specification && (
                  <div className="text-xs text-slate-600 mt-1">规格: {item.specification}</div>
                )}
              </div>

              {/* 报价区域 */}
              <div className="p-3 bg-white">
                <div className="grid grid-cols-12 gap-2 items-end">
                  {/* 单价输入 */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">单价 *</Label>
                    <Input
                      type="number"
                      value={itemPrices[item.id] || ''}
                      onChange={(e) => setItemPrices({ ...itemPrices, [item.id]: e.target.value })}
                      placeholder="0.00"
                      className="mt-1 h-8 text-sm font-semibold"
                      step="0.01"
                    />
                  </div>

                  {/* 小计金额 */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">小计金额</Label>
                    <div className="h-8 flex items-center mt-1 px-2 bg-orange-50 border-2 border-orange-200 rounded-md">
                      <span className="text-sm font-bold text-orange-700">
                        {getCurrencySymbol(globalCurrency)}{((parseFloat(itemPrices[item.id] || '0')) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 单位成本 */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">单位成本</Label>
                    <div className="h-8 flex items-center mt-1 px-2 bg-red-50 border-2 border-red-200 rounded-md">
                      <span className="text-sm font-bold text-red-700">
                        {getCurrencySymbol(globalCurrency)}{totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 单位利润 */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">单位利润</Label>
                    <div className={`h-8 flex items-center mt-1 px-2 border-2 rounded-md ${
                      actualProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <span className={`text-sm font-bold ${
                        actualProfit >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {getCurrencySymbol(globalCurrency)}{actualProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 利润率 */}
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-600">利润率</Label>
                    <div className={`h-8 flex items-center mt-1 px-2 border-2 rounded-md ${
                      actualMargin >= 15 ? 'bg-green-50 border-green-200' : 
                      actualMargin >= 10 ? 'bg-yellow-50 border-yellow-200' : 
                      'bg-red-50 border-red-200'
                    }`}>
                      <span className={`text-sm font-bold ${
                        actualMargin >= 15 ? 'text-green-700' : 
                        actualMargin >= 10 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {actualMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 状态 */}
                  <div className="col-span-2 flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => setExpandedCostAnalyzers({ 
                        ...expandedCostAnalyzers, 
                        [item.id]: !isExpanded 
                      })}
                    >
                      <Calculator className="w-3 h-3 mr-1" />
                      {isExpanded ? '收起' : '成本分析'}
                    </Button>
                  </div>
                </div>

                {/* 🔥 成本分析器 - 可展开 */}
                {isExpanded && (
                  <div className="mt-3 border-t-2 border-slate-200 pt-3">
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-3">
                      {/* 标题和操作 */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-indigo-600" />
                          <h4 className="font-semibold text-sm text-indigo-900">成本核算与利润分析</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              const basePrice = parseFloat(itemPrices[item.id] || '100');
                              quickFillCost(item.id, basePrice);
                            }}
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            快速填充
                          </Button>
                        </div>
                      </div>

                      {/* 成本输入网格 */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {/* 原材料成本 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            原材料
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.materialCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], materialCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.materialCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 人工成本 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            人工
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.laborCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], laborCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.laborCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 制造费用 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            制造
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.manufacturingCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], manufacturingCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.manufacturingCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 包装费用 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            包装
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.packagingCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], packagingCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.packagingCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 运输费用 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            运输
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.shippingCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], shippingCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.shippingCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 管理费用 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            管理
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.overheadCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], overheadCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.overheadCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 其他费用 */}
                        <div>
                          <Label className="text-xs text-slate-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            其他
                          </Label>
                          <Input
                            type="number"
                            value={itemCosts[item.id]?.otherCost || ''}
                            onChange={(e) => setItemCosts({
                              ...itemCosts,
                              [item.id]: { ...itemCosts[item.id], otherCost: parseFloat(e.target.value) || 0 }
                            })}
                            placeholder="0.00"
                            className="mt-1 h-7 text-xs"
                            step="0.01"
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            {totalCost > 0 ? `${((itemCosts[item.id]?.otherCost || 0) / totalCost * 100).toFixed(1)}%` : '0%'}
                          </div>
                        </div>

                        {/* 总成本显示 */}
                        <div>
                          <Label className="text-xs text-slate-700 font-semibold">总成本</Label>
                          <div className="mt-1 h-7 flex items-center px-2 bg-red-100 border-2 border-red-300 rounded-md">
                            <span className="text-sm font-bold text-red-700">
                              {getCurrencySymbol(globalCurrency)}{totalCost.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">100%</div>
                        </div>
                      </div>

                      {/* 利润计算器 */}
                      <div className="border-t-2 border-indigo-200 pt-3 mt-2">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          {/* 目标利润率 */}
                          <div className="col-span-2">
                            <Label className="text-xs text-slate-700 font-semibold">目标利润率 (%)</Label>
                            <Input
                              type="number"
                              value={targetMargins[item.id] || ''}
                              onChange={(e) => setTargetMargins({ ...targetMargins, [item.id]: e.target.value })}
                              placeholder="15"
                              className="mt-1 h-8 text-sm font-semibold"
                              step="0.1"
                            />
                          </div>

                          {/* 建议报价 */}
                          <div className="col-span-3">
                            <Label className="text-xs text-slate-700 font-semibold">建议报价</Label>
                            <div className="h-8 flex items-center mt-1 px-2 bg-blue-100 border-2 border-blue-300 rounded-md">
                              <span className="text-sm font-bold text-blue-700">
                                {getCurrencySymbol(globalCurrency)}{suggestedPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* 应用按钮 */}
                          <div className="col-span-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                              onClick={() => applySuggestedPrice(item.id)}
                            >
                              <TrendingUp className="w-3 h-3 mr-1" />
                              应用报价
                            </Button>
                          </div>

                          {/* 利润分析 */}
                          <div className="col-span-5">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-slate-600">当前利润</Label>
                                <div className={`h-8 flex items-center mt-1 px-2 border-2 rounded-md text-xs font-bold ${
                                  actualProfit >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                  {getCurrencySymbol(globalCurrency)}{actualProfit.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">利润率</Label>
                                <div className={`h-8 flex items-center mt-1 px-2 border-2 rounded-md text-xs font-bold ${
                                  actualMargin >= 15 ? 'bg-green-50 border-green-200 text-green-700' : 
                                  actualMargin >= 10 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                                  'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                  {actualMargin.toFixed(2)}%
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-slate-600">总利润</Label>
                                <div className={`h-8 flex items-center mt-1 px-2 border-2 rounded-md text-xs font-bold ${
                                  actualProfit * item.quantity >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                  {getCurrencySymbol(globalCurrency)}{(actualProfit * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 提示信息 */}
                      <div className="mt-3 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold mb-1">💡 成本核算建议</div>
                          <div className="space-y-0.5 text-blue-600">
                            <div>• 原材料成本通常占45-55%，人工成本占12-18%</div>
                            <div>• 制造费用（水电、设备折旧）占8-15%，包装运输占7-14%</div>
                            <div>• 管理费用（销售、行政、质检）占6-10%，建议目标利润率≥15%</div>
                            <div>• 使用"快速填充"可基于报价自动分配成本结构（总成本97%，利润率3%）</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔥 交易条款 - 紧凑型 */}
      <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-orange-50 px-3 py-2 border-b-2 border-orange-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-orange-600" />
            <h3 className="font-semibold text-sm">交易条款</h3>
          </div>
        </div>
        <div className="p-3 bg-white">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <Label className="text-xs text-slate-600">交货周期（天）</Label>
              <Input
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="30"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">最小起订量 (MOQ)</Label>
              <Input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="1000"
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">付款方式</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T/T 30天">T/T 30天</SelectItem>
                  <SelectItem value="T/T 60天">T/T 60天</SelectItem>
                  <SelectItem value="L/C at sight">L/C at sight</SelectItem>
                  <SelectItem value="30% 预付 + 70% 发货前">30% 预付 + 70% 发货前</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-600">交货条款</Label>
              <Select value={deliveryTerms} onValueChange={setDeliveryTerms}>
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB 厦门">FOB 厦门</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="DDP">DDP</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-600">备注说明</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="其他说明..."
                className="mt-1 min-h-16 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">供应商备注</Label>
              <Textarea
                value={supplierRemarks}
                onChange={(e) => setSupplierRemarks(e.target.value)}
                placeholder="供应商备注..."
                className="mt-1 min-h-16 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 操作按钮 */}
      <div className="flex items-center justify-between border-t-2 pt-3">
        <div className="text-sm text-slate-600">
          共 <span className="font-semibold text-slate-900">{quotation.items?.length}</span> 个产品
          {!isFormValid() && (
            <span className="ml-3 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              请填写所有必填项后才能提交
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-9"
            disabled={quotation.status === 'submitted'}
          >
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            className="h-9"
            disabled={quotation.status === 'submitted'}
          >
            <Save className="w-4 h-4 mr-2" />
            保存草稿
          </Button>
          {quotation.status === 'submitted' ? (
            <Button
              className="bg-green-600 hover:bg-green-600 h-9 cursor-not-allowed"
              disabled
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              已报价
            </Button>
          ) : (
            <Button
              onClick={() => handleSave(true)}
              className="bg-orange-600 hover:bg-orange-700 h-9"
              disabled={!isFormValid()}
            >
              <Send className="w-4 h-4 mr-2" />
              提交报价
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}