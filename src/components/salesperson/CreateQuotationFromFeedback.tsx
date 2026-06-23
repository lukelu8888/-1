/**
 * 🔥 从采购反馈创建客户报价 - 业务员端
 * 
 * 功能：
 * 1. 自动从采购反馈提取成本信息
 * 2. 根据建议利润率计算售价
 * 3. 业务员可调整售价、利润率
 * 4. 生成 QT-区域-YYMMDD-编号 格式的客户报价单
 * 5. 自动关联 QR、ING
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  DollarSign, 
  TrendingUp,
  Calculator,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { QuoteRequirement, QuoteRequirementFeedback } from '../../contexts/QuoteRequirementContext';
import { SalesQuotation, SalesQuotationItem, useSalesQuotations, type PaymentMode } from '../../contexts/SalesQuotationContext';
import { useInquiries } from '../../contexts/InquiryContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { supabase } from '../../lib/supabase';
import { adaptSalesQuotationToDocumentData } from '../../utils/documentDataAdapters';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { desensitizePurchaserFeedbackText, sanitizePurchaserFeedbackForSales } from '../../utils/purchaserFeedbackSanitizer';
import { resolveQuoteRequirementOwner } from '../../utils/quotationOwnership';
import {
  BALANCE_TRIGGER_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  buildPaymentTermsText,
  deriveBalanceTrigger,
  type BalanceTrigger,
} from '../../lib/paymentFlow';

interface CreateQuotationFromFeedbackProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qr: QuoteRequirement;
  feedback: QuoteRequirementFeedback;
}

const SALES_QUOTATION_TARGET_CURRENCY = 'USD';
const DEFAULT_CNY_PER_USD = 7.2;

const normalizeCurrencyCode = (value: unknown) =>
  String(value || '').trim().toUpperCase();

const getSourceCostCurrency = (product: QuoteRequirementFeedback['products'][number]) =>
  normalizeCurrencyCode(product.sourcePricing?.currency || product.currency || product.sourcePricing?.priceType) || 'CNY';

const getCnyPerUsdRate = (product: QuoteRequirementFeedback['products'][number]) => {
  const candidates = [
    product.sourcePricing?.exchangeRate,
    product.taxSettings?.usdRate,
  ];
  const matched = candidates
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  return matched || DEFAULT_CNY_PER_USD;
};

const convertSupplierCostToSalesCurrency = (product: QuoteRequirementFeedback['products'][number]) => {
  const rawCostPrice = Number(product.costPrice || 0);
  const sourceCurrency = getSourceCostCurrency(product);
  if (sourceCurrency === SALES_QUOTATION_TARGET_CURRENCY) return rawCostPrice;
  if (sourceCurrency === 'CNY' || sourceCurrency === 'RMB' || sourceCurrency === 'CNY_WITH_TAX' || sourceCurrency === 'CNY_NO_TAX') {
    return rawCostPrice / getCnyPerUsdRate(product);
  }
  return rawCostPrice;
};

export function CreateQuotationFromFeedback({
  open,
  onOpenChange,
  qr,
  feedback
}: CreateQuotationFromFeedbackProps) {
  const salesSafeFeedback = sanitizePurchaserFeedbackForSales(feedback, 'Sales_Rep') || feedback;
  const { addQuotation } = useSalesQuotations();
  const { inquiries } = useInquiries();
  const currentUser = getCurrentUser();
  
  // 🔥 状态管理
  const [margin, setMargin] = useState(feedback.suggestedMargin || 30);
  const [items, setItems] = useState<SalesQuotationItem[]>([]);
  const [validityDays, setValidityDays] = useState(30);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('tt_deposit_balance_before_shipment');
  const [balanceTrigger, setBalanceTrigger] = useState<BalanceTrigger>('before_shipment');
  const [paymentTerms, setPaymentTerms] = useState(buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment'));
  const [deliveryTerms, setDeliveryTerms] = useState(feedback.deliveryTerms || 'FOB 厦门');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawMode = String((feedback as any).paymentMode || (feedback as any).payment_mode || '').trim() as PaymentMode;
    const nextMode = PAYMENT_MODE_OPTIONS.some((option) => option.value === rawMode)
      ? rawMode
      : 'tt_deposit_balance_before_shipment';
    const nextTrigger = deriveBalanceTrigger(nextMode, (feedback as any).balanceTrigger || (feedback as any).balance_trigger || null);
    setPaymentMode(nextMode);
    setBalanceTrigger(nextTrigger);
    setPaymentTerms(
      String(feedback.paymentTerms || buildPaymentTermsText(nextMode, nextTrigger)).trim(),
    );
  }, [feedback]);
  
  // 🔥 初始化产品列表
  useEffect(() => {
    if (feedback.products) {
      const initialItems = feedback.products.map((p, index) => {
        const marginDecimal = margin / 100;
        const costPrice = convertSupplierCostToSalesCurrency(p);
        const salesPrice = costPrice * (1 + marginDecimal);
        const profit = salesPrice - costPrice;
        
        return {
          id: `${Date.now()}-${index}`,
          productName: p.productName,
          specification: p.specification || '',
          modelNo: getFormalBusinessModelNo(p) || p.productName,
          quantity: p.quantity,
          unit: p.unit,
          
          // 成本信息（脱敏，不显示具体供应商）；客户 QT 统一按 USD 销售币种核算
          costPrice: parseFloat(costPrice.toFixed(4)),
          selectedSupplier: '已隐藏',
          selectedSupplierName: '已隐藏',
          selectedBJ: salesSafeFeedback.linkedBJ || '已隐藏',
          currency: SALES_QUOTATION_TARGET_CURRENCY,
          sourcePricing: p.sourcePricing || null,
          
          // 销售报价
          salesPrice: parseFloat(salesPrice.toFixed(2)),
          profitMargin: parseFloat(marginDecimal.toFixed(4)),
          profit: parseFloat(profit.toFixed(2)),
          
          remarks: p.remarks || ''
        };
      });
      
      setItems(initialItems);
      
      // 设置默认交货日期（当前日期 + 最长交期）
      const maxLeadTime = Math.max(...feedback.products.map(p => {
        const match = p.leadTime?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 30;
      }));
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime);
      setDeliveryDate(deliveryDate.toISOString().split('T')[0]);
    }
  }, [feedback, margin]);
  
  // 🔥 调整单个产品的售价
  const handleUpdateProductPrice = (itemId: string, newSalesPrice: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const profit = newSalesPrice - item.costPrice;
        const marginDecimal = item.costPrice > 0 ? profit / item.costPrice : 0;
        
        return {
          ...item,
          salesPrice: newSalesPrice,
          profit: parseFloat(profit.toFixed(2)),
          profitMargin: parseFloat(marginDecimal.toFixed(4))
        };
      }
      return item;
    }));
  };
  
  // 🔥 批量调整利润率
  const handleMarginChange = (newMargin: number) => {
    setMargin(newMargin);
    const marginDecimal = newMargin / 100;
    
    setItems(prev => prev.map(item => {
      const salesPrice = item.costPrice * (1 + marginDecimal);
      const profit = salesPrice - item.costPrice;
      
      return {
        ...item,
        salesPrice: parseFloat(salesPrice.toFixed(2)),
        profitMargin: parseFloat(marginDecimal.toFixed(4)),
        profit: parseFloat(profit.toFixed(2))
      };
    }));
  };
  
  // 🔥 计算汇总信息
  const totalCost = items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.salesPrice * item.quantity), 0);
  const totalProfit = totalPrice - totalCost;
  const profitRate = totalCost > 0 ? totalProfit / totalCost : 0;
  
  // 🔥 生成 QT 编号（调用 next_number_ex RPC）
  const generateQTNumber = async (): Promise<string> => {
    const region = qr.region || 'NA';
    try {
      const { data, error } = await supabase.rpc('next_number_ex', {
        p_doc_type: 'QT',
        p_region_code: region,
        p_customer_id: null,
      });
      if (error) throw error;
      return data as string;
    } catch (err) {
      console.error('[CreateQuotationFromFeedback] next_number_ex failed, using fallback:', err);
      const date = new Date();
      const dateStr = date.getFullYear().toString().slice(-2)
        + String(date.getMonth() + 1).padStart(2, '0')
        + String(date.getDate()).padStart(2, '0');
      return `QT-${region}-${dateStr}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    }
  };
  
  // 🔥 查找关联的客户询价单
  const findRelatedInquiry = () => {
    if (qr.sourceInquiryNo) {
      return inquiries.find(inq => 
        inq.id === qr.sourceInquiryNo || 
        inq.inquiryNumber === qr.sourceInquiryNo
      );
    }
    
    return inquiries.find(inq => 
      inq.products?.some(ip => 
        qr.items.some(qi => 
          qi.productName === ip.productName || 
          getFormalBusinessModelNo(qi) === getFormalBusinessModelNo(ip)
        )
      )
    );
  };
  
  const relatedInquiry = findRelatedInquiry();

  const ensureBoundQuoteRequirementSnapshot = () => {
    const templateSnapshot = (qr as any).templateSnapshot || (qr as any).template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = (qr as any).documentDataSnapshot || (qr as any).document_data_snapshot || null;
    if (!templateVersion || !documentData) {
      toast.error('该 QR 未绑定模板中心版本快照，无法创建 QT');
      return false;
    }
    return true;
  };

  const ensureBoundBJFeedback = () => {
    if (!feedback.linkedBJ?.trim()) {
      toast.error('当前采购反馈未绑定 BJ 结果，无法创建 QT');
      return false;
    }
    const missingSourcePricing = feedback.products.find((product) => !product.sourcePricing);
    if (missingSourcePricing) {
      toast.error('当前采购反馈缺少 BJ 价格语义，无法创建 QT', {
        description: `${missingSourcePricing.productName} 未携带 sourcePricing`,
      });
      return false;
    }
    return true;
  };
  
  // 🔥 提交报价单
  const handleSubmit = async () => {
    if (!ensureBoundQuoteRequirementSnapshot()) {
      return;
    }
    if (!ensureBoundBJFeedback()) {
      return;
    }
    if (items.length === 0) {
      toast.error('请至少添加一个产品');
      return;
    }
    
    if (!relatedInquiry) {
      toast.error('未找到关联的客户询价单', {
        description: '无法确定客户信息，请手动创建报价单'
      });
      return;
    }

    try {
      setSubmitting(true);
      const qtNumber = await generateQTNumber();
      const today = new Date().toISOString().split('T')[0];
      const validUntilDate = new Date();
      validUntilDate.setDate(validUntilDate.getDate() + validityDays);
      const validUntil = validUntilDate.toISOString().split('T')[0];
      const quotationOwner = resolveQuoteRequirementOwner(qr, inquiries, currentUser);
      const inquiryBuyerInfo = (relatedInquiry as any)?.buyerInfo || {};
      const customerEmail = String(
        inquiryBuyerInfo?.email ||
        (relatedInquiry as any)?.email ||
        (relatedInquiry as any)?.userEmail ||
        '',
      ).trim();
      const customerName = String(
        inquiryBuyerInfo?.contactPerson ||
        (relatedInquiry as any)?.contactPerson ||
        (relatedInquiry as any)?.customerName ||
        inquiryBuyerInfo?.companyName ||
        (relatedInquiry as any)?.companyName ||
        '',
      ).trim();
      const customerCompany = String(
        inquiryBuyerInfo?.companyName ||
        (relatedInquiry as any)?.companyName ||
        (relatedInquiry as any)?.buyerCompany ||
        customerName ||
        '',
      ).trim();

      const quotation: SalesQuotation = {
        id: `qt-${Date.now()}`,
        qtNumber,
        qrNumber: qr.requirementNo,
        inqNumber: relatedInquiry.inquiryNumber || relatedInquiry.id,
        region: qr.region as 'NA' | 'SA' | 'EU',
        customerEmail,
        customerName,
        customerCompany,
        salesPerson: quotationOwner.email || currentUser?.email || '',
        salesPersonName: quotationOwner.name || currentUser?.name || '',
        items,
        totalCost,
        totalPrice,
        totalProfit,
        profitRate,
        currency: SALES_QUOTATION_TARGET_CURRENCY,
        paymentTerms,
        paymentMode,
        balanceTrigger,
        deliveryTerms,
        deliveryDate: deliveryDate || today,
        approvalStatus: 'draft',
        approvalChain: [],
        customerStatus: 'not_sent',
        validUntil,
        version: 1,
        createdAt: today,
        updatedAt: today,
        customerNotes: notes || '',
        remarks: notes || '',
        internalNotes: `基于采购反馈 ${qr.requirementNo} 创建\n采购员建议利润率：${feedback.suggestedMargin}%\n实际利润率：${(profitRate * 100).toFixed(2)}%\n\n采购员建议：\n${desensitizePurchaserFeedbackText(feedback.purchaserRemarks || '', feedback, 'Sales_Rep')}`,
        templateId: (qr as any).templateId || (qr as any).template_id || null,
        templateVersionId: (qr as any).templateVersionId || (qr as any).template_version_id || null,
        templateSnapshot: (qr as any).templateSnapshot || (qr as any).template_snapshot || { pendingResolution: true },
        tradeTerms: {
          incoterms: deliveryTerms,
          paymentTerms: paymentTerms,
          deliveryTime: deliveryDate ? `${Math.ceil((new Date(deliveryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days after deposit` : '25-30 days after deposit',
          packing: 'Export carton with pallets',
          portOfLoading: 'Xiamen, China',
          portOfDestination: (relatedInquiry as any)?.country || '',
          warranty: '12 months from delivery date against manufacturing defects',
          inspection: "Seller's factory inspection, buyer has the right to re-inspect upon arrival"
        }
      };

      (quotation as any).documentDataSnapshot = adaptSalesQuotationToDocumentData({
        ...quotation,
        customerAddress: inquiryBuyerInfo?.address || (relatedInquiry as any)?.address || '',
        customerPhone: inquiryBuyerInfo?.phone || (relatedInquiry as any)?.phone || '',
        customerCountry: (relatedInquiry as any)?.country || '',
      });

      console.log('🔍 [CreateQuotationFromFeedback] 创建报价单数据:', {
        qtNumber,
        totalPrice,
        totalCost,
        profitRate: (profitRate * 100).toFixed(2) + '%',
        itemsCount: items.length,
        customerEmail,
        customerCompany,
        items: items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          salesPrice: item.salesPrice,
          profit: item.profit,
          profitMargin: (item.profitMargin * 100).toFixed(2) + '%'
        }))
      });

      await addQuotation(quotation);

      toast.success(`✅ 客户报价单已创建 - ${qtNumber}`, {
        description: `利润率 ${(profitRate * 100).toFixed(2)}%，利润 ${totalProfit.toLocaleString()} ${SALES_QUOTATION_TARGET_CURRENCY}`,
        duration: 5000
      });

      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建报价单失败'
      console.error('[CreateQuotationFromFeedback] create quotation failed:', error)
      toast.error('创建报价单失败', {
        description: message,
      })
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            创建客户报价单（基于采购反馈 {qr.requirementNo}）
          </DialogTitle>
          <DialogDescription>
            采购成本已自动填充，请调整利润率和售价，确认后生成客户报价单
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          
          {/* 🔥 关联信息提示 */}
          {relatedInquiry && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">关联客户信息</AlertTitle>
              <AlertDescription className="text-blue-700 text-sm">
                客户：<strong>{relatedInquiry.companyName || relatedInquiry.contactPerson}</strong> |{' '}
                询价单：<strong>{relatedInquiry.inquiryNumber || relatedInquiry.id}</strong> |{' '}
                邮箱：<strong>{relatedInquiry.email}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          {!relatedInquiry && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">警告：未找到关联客户</AlertTitle>
              <AlertDescription className="text-red-700 text-sm">
                无法自动关联客户询价单，请手动确认客户信息后再创建报价
              </AlertDescription>
            </Alert>
          )}
          
          {/* 🔥 成本与利润分析 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              成本与利润分析
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">采购成本</div>
                <div className="text-xl font-bold text-orange-600">
                  {SALES_QUOTATION_TARGET_CURRENCY} {totalCost.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">利润率</div>
                <div className="flex items-center justify-center gap-2">
                  <Input 
                    type="number"
                    value={margin}
                    onChange={(e) => handleMarginChange(Number(e.target.value))}
                    min={0}
                    max={200}
                    className="w-20 text-center font-bold text-blue-600"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  建议：{feedback.suggestedMargin}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">预估利润</div>
                <div className="text-xl font-bold text-green-600">
                  {SALES_QUOTATION_TARGET_CURRENCY} {totalProfit.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">客户报价</div>
                <div className="text-xl font-bold text-blue-600">
                  {SALES_QUOTATION_TARGET_CURRENCY} {totalPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">实际利润率</div>
                <div className={`text-xl font-bold ${
                  profitRate * 100 >= feedback.suggestedMargin ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {(profitRate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
          
          {/* 🔥 产品报价明细表 */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              产品报价明细（可调整售价）
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>产品名称</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right bg-orange-50">成本单价</TableHead>
                    <TableHead className="text-right bg-blue-50">销售单价</TableHead>
                    <TableHead className="text-right">总金额</TableHead>
                    <TableHead className="text-center">单品利润率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const totalAmount = item.salesPrice * item.quantity;
                    const productMargin = item.profitMargin * 100;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.specification || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity.toLocaleString()} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 bg-orange-50">
                          {SALES_QUOTATION_TARGET_CURRENCY} {item.costPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right bg-blue-50">
                          <Input 
                            type="number"
                            value={item.salesPrice}
                            onChange={(e) => handleUpdateProductPrice(item.id, Number(e.target.value))}
                            min={item.costPrice}
                            step={0.01}
                            className="w-28 text-right font-semibold text-blue-600"
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {SALES_QUOTATION_TARGET_CURRENCY} {totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={
                            productMargin >= feedback.suggestedMargin 
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          }>
                            {productMargin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* 汇总行 */}
                  <TableRow className="bg-gray-50 font-semibold text-base">
                    <TableCell colSpan={3} className="text-right">总计：</TableCell>
                    <TableCell className="text-right text-orange-600 bg-orange-50">
                      {SALES_QUOTATION_TARGET_CURRENCY} {totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50"></TableCell>
                    <TableCell className="text-right text-green-600 text-lg">
                      {SALES_QUOTATION_TARGET_CURRENCY} {totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={
                        profitRate * 100 >= feedback.suggestedMargin 
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }>
                        {(profitRate * 100).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* 🔥 商务条款 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>有效期（天）</Label>
              <Input 
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                min={1}
                max={365}
              />
            </div>
            <div>
              <Label>付款模式</Label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  const nextMode = e.target.value as PaymentMode;
                  const nextTrigger = deriveBalanceTrigger(nextMode, null);
                  setPaymentMode(nextMode);
                  setBalanceTrigger(nextTrigger);
                  setPaymentTerms(buildPaymentTermsText(nextMode, nextTrigger));
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PAYMENT_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>交货条款</Label>
              <Input 
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
              />
            </div>
            <div>
              <Label>余款触发节点</Label>
              <select
                value={balanceTrigger}
                onChange={(e) => {
                  const nextTrigger = e.target.value as BalanceTrigger;
                  setBalanceTrigger(nextTrigger);
                  setPaymentTerms(buildPaymentTermsText(paymentMode, nextTrigger));
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {BALANCE_TRIGGER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <Label>付款条款展示文本</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Label>预计交货日期</Label>
              <Input 
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* 🔥 备注 */}
          <div>
            <Label>备注（可选）</Label>
            <Textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="给客户的特殊说明..."
              rows={3}
            />
          </div>
          
          {/* 🔥 采购员建议预览 */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">采购员建议（内部参考）</AlertTitle>
            <AlertDescription className="text-yellow-700 text-sm">
              <div className="whitespace-pre-wrap max-h-32 overflow-y-auto">
                {salesSafeFeedback.purchaserRemarks}
              </div>
            </AlertDescription>
          </Alert>
          
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!relatedInquiry || submitting}
            className="bg-orange-600 hover:bg-orange-700 gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {submitting ? '创建中...' : '创建客户报价单'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
