import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuotationRequests } from '../../contexts/QuotationRequestContext';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext'; // 🔥 导入报价请求单 Context（QR 语义层）
import { getAuthenticatedUser, getCurrentUser } from '../../utils/dataIsolation'; // 🔥 导入统一身份工具
import { nextQRNumber, type RegionType } from '../../utils/xjNumberGenerator';
import { TRADE_TERMS_PRESETS, isPresetTradeTerm, resolveInitialTradeTerms } from '../../utils/tradeTerms';
import {
  buildCustomerRequirementsSnapshot,
  buildProcurementRequestNotes,
  DEFAULT_DOWNSTREAM_VISIBILITY,
} from '../../utils/procurementRequestContext';
import { getFactoryFacingModelNo, getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import type { PaymentMode } from '../../contexts/SalesQuotationContext';
import {
  BALANCE_TRIGGER_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  buildPaymentTermsText,
  deriveBalanceTrigger,
  type BalanceTrigger,
} from '../../lib/paymentFlow';
import { getCustomerDocumentReleasePreferenceLabel } from '../documents/templates/CustomerInquiryDocument';
import { Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  type QuoteRequirementDocumentData,
} from '../documents/templates/QuoteRequirementDocument';

const resolveInquiryStructuredRequirements = (inquiry: any) => {
  const requirements = inquiry?.requirements && typeof inquiry.requirements === 'object' ? inquiry.requirements : {};
  const rawPaymentMode = String(
    requirements.paymentMode ||
    inquiry?.paymentMode ||
    '',
  ).trim() as PaymentMode;
  const paymentMode = PAYMENT_MODE_OPTIONS.some((option) => option.value === rawPaymentMode)
    ? rawPaymentMode
    : 'tt_deposit_balance_before_shipment';
  const balanceTrigger = deriveBalanceTrigger(
    paymentMode,
    requirements.balanceTrigger || inquiry?.balanceTrigger || null,
  );
  const tradeTerms = resolveInitialTradeTerms(
    requirements.tradeTerms,
    inquiry?.shippingInfo?.tradeTerms,
    inquiry?.tradeTerms,
  );
  const sourceInquiryNumber = String(
    inquiry?.inquiryNumber ||
    inquiry?.sourceInquiryNumber ||
    inquiry?.id ||
    '',
  ).trim();

  return {
    requirements,
    paymentMode,
    balanceTrigger,
    paymentTerms:
      String(requirements.paymentTerms || inquiry?.paymentTerms || '').trim() ||
      buildPaymentTermsText(paymentMode, balanceTrigger),
    tradeTerms,
    sourceInquiryNumber,
    documentReleasePreference: getCustomerDocumentReleasePreferenceLabel(requirements.documentReleasePreference),
    incoterm: String(requirements.incoterm || '').trim(),
    locationValue: String(requirements.locationValue || requirements.portOfDestination || '').trim(),
    deliveryTime: String(requirements.deliveryTime || '').trim(),
    packingRequirements: String(requirements.packingRequirements || '').trim(),
    certifications: Array.isArray(requirements.certifications)
      ? requirements.certifications.filter(Boolean).join(', ')
      : String(requirements.certifications || '').trim(),
    otherRequirements: String(requirements.otherRequirements || '').trim(),
  };
};

/**
 * 📋 向采购员请求报价对话框
 * 
 * 设计原则：台湾大厂风格
 * - 纯黑白灰配色
 * - 无图标，无彩色
 * - 极简主义
 * - 高信息密度
 * - 表格化布局
 * 
 * ✅ 产品表格：移除图片列，仅显示核心信息
 */

const QUALITY_REQUIREMENTS_PRESETS = [
  '需要第三方验货，AQL 2.5标准',
  '供应商自检，提供检验报告',
  '全检（100%检验）',
  'AQL 1.5标准验货',
  'AQL 4.0标准验货',
  '自定义...'
];

const PACKAGING_REQUIREMENTS_PRESETS = [
  '需要客户logo印刷，彩盒包装',
  '中性包装，无logo',
  '出口标准牛皮纸箱',
  'Polybag + 彩盒 + 外箱',
  '吸塑包装 + 展示盒',
  '自定义...'
];

interface CreateQuotationRequestDialogProps {
  open: boolean;
  onClose: () => void;
  inquiry: any;
}

export function CreateQuotationRequestDialog({
  open,
  onClose,
  inquiry
}: CreateQuotationRequestDialogProps) {
  const { addQuotationRequest } = useQuotationRequests();
  const { addRequirement: addQuoteRequirement } = useQuoteRequirements(); // 🔥 通过 QR 语义层写入主承载表
  
  // 🔥 计算默认日期：期望报价日期 = 今天 + 3天，期望交期 = 今天 + 30天
  const getDefaultQuoteDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };
  
  const getDefaultDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  const [expectedQuoteDate, setExpectedQuoteDate] = useState(getDefaultQuoteDate()); // 🔥 默认：3天后
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [tradeTerms, setTradeTerms] = useState(resolveInitialTradeTerms());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('tt_deposit_balance_before_shipment');
  const [balanceTrigger, setBalanceTrigger] = useState<BalanceTrigger>(
    deriveBalanceTrigger('tt_deposit_balance_before_shipment', null),
  );
  const [paymentTerms, setPaymentTerms] = useState(
    buildPaymentTermsText('tt_deposit_balance_before_shipment', deriveBalanceTrigger('tt_deposit_balance_before_shipment', null)),
  );
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate()); // 🔥 默认：30天后
  const [targetCostRange, setTargetCostRange] = useState('');
  const [qualityRequirements, setQualityRequirements] = useState(QUALITY_REQUIREMENTS_PRESETS[0]); // 🔥 默认：第一条验货要求
  const [packagingRequirements, setPackagingRequirements] = useState(PACKAGING_REQUIREMENTS_PRESETS[0]); // 🔥 默认：第一条特殊包装

  const [isCustomTradeTerms, setIsCustomTradeTerms] = useState(false);
  const [isCustomQuality, setIsCustomQuality] = useState(false);
  const [isCustomPackaging, setIsCustomPackaging] = useState(false);

  const [editableProducts, setEditableProducts] = useState<any[]>([]);
  const structured = resolveInquiryStructuredRequirements(inquiry);

  useEffect(() => {
    if (inquiry?.products) {
      console.log('🔍 [CreateQuotationRequestDialog] 原始 inquiry.products:', inquiry.products);
      
      const processedProducts = inquiry.products.map((p: any) => ({
        ...p,
        modelNo: getFormalBusinessModelNo(p) || p.color || 'N/A',
        factoryModelNo:
          getFactoryFacingModelNo(p) ||
          p?.inquirySnapshot?.factoryModelNo ||
          p?.inquirySnapshotDraft?.factoryModelNo ||
          getFormalBusinessModelNo(p) ||
          p.color ||
          'N/A',
        internalModelNo:
          p?.internalModelNo ||
          p?.inquirySnapshot?.masterRef?.internalModelNo ||
          p?.inquirySnapshotDraft?.masterRef?.internalModelNo ||
          getFormalBusinessModelNo(p) ||
          '',
        editableQuantity: p.quantity || 0,
        editableRemarks: p.remarks || ''
      }));
      
      console.log('✅ [CreateQuotationRequestDialog] 处理后的 editableProducts:', processedProducts);
      setEditableProducts(processedProducts);
    }
  }, [inquiry]);

  // 🔥 每次打开对话框时重置为默认值
  useEffect(() => {
    if (open) {
      console.log('🔄 [CreateQuotationRequestDialog] 对话框打开，重置为默认值');
      setExpectedQuoteDate(getDefaultQuoteDate());
      setDeliveryDate(getDefaultDeliveryDate());
      setPaymentMode(structured.paymentMode);
      setBalanceTrigger(structured.balanceTrigger);
      setPaymentTerms(structured.paymentTerms);
      setQualityRequirements(structured.certifications || QUALITY_REQUIREMENTS_PRESETS[0]);
      setPackagingRequirements(structured.packingRequirements || PACKAGING_REQUIREMENTS_PRESETS[0]);
      setTradeTerms(structured.tradeTerms);
      setTargetCostRange('');
      setRemarks('');
      setIsCustomTradeTerms(!isPresetTradeTerm(structured.tradeTerms));
      setIsCustomQuality(false);
      setIsCustomPackaging(false);
    }
  }, [open, inquiry, structured.balanceTrigger, structured.certifications, structured.packingRequirements, structured.paymentMode, structured.paymentTerms, structured.tradeTerms]);

  const handleSubmit = async () => {
    if (!inquiry) return;

    // QR 的 documentDataSnapshot 由下游重新生成，不依赖 ING 的快照。

    if (!expectedQuoteDate) {
      toast.error('请设置期望报价日期');
      return;
    }

    if (!paymentTerms) {
      toast.error('请填写付款条款');
      return;
    }

    if (!tradeTerms.trim()) {
      toast.error('请填写明确的贸易条款');
      return;
    }

    if (!deliveryDate) {
      toast.error('请填写期望交期');
      return;
    }

    setLoading(true);

    try {
      // 🔥 获取完整用户信息（包含姓名）
      const salesRepEmail = getCurrentUser()?.email || 'sales@cosun.com';
      const operatorUser = getAuthenticatedUser() || getCurrentUser();
      const salesRepName = operatorUser?.name || operatorUser?.email?.split('@')[0] || '业务员';
      
      console.log('🔍 [CreateQuotationRequestDialog] 业务员信息:');
      console.log('  - Email:', salesRepEmail);
      console.log('  - Name:', salesRepName);
      
      const requestNumber = await nextQRNumber(
        inquiry.region === 'South America' ? 'SA' : inquiry.region === 'Europe & Africa' ? 'EA' : 'NA'
      );

      const commercialTerms = {
        expectedQuoteDate,
        deliveryDate,
        tradeTerms: tradeTerms.trim(),
        incoterm: structured.incoterm || undefined,
        paymentMode,
        balanceTrigger,
        paymentTerms: paymentTerms.trim(),
        targetCostRange: targetCostRange.trim() || undefined,
        qualityRequirements: qualityRequirements.trim() || undefined,
        packagingRequirements: packagingRequirements.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };
      const customerRequirements = buildCustomerRequirementsSnapshot(inquiry, editableProducts);
      const flowNotes = buildProcurementRequestNotes(commercialTerms);

      const items = editableProducts?.map((product: any) => ({
        id: product.id || `item_${Date.now()}_${Math.random()}`,
        productName: product.productName,
        modelNo: getFormalBusinessModelNo(product) || product.color || 'N/A',
        factoryModelNo:
          getFactoryFacingModelNo(product) ||
          product.factoryModelNo ||
          getFormalBusinessModelNo(product) ||
          product.color ||
          'N/A',
        internalModelNo: product.internalModelNo || getFormalBusinessModelNo(product) || '',
        specification: product.specification,
        quantity: product.editableQuantity,
        unit: 'pcs',
        // 客户公开价不能继续下游流转给采购/供应商
        currency: 'N/A',
        remarks: product.editableRemarks || (product.material ? `材质: ${product.material}` : '')
      })) || [];

      const quotationRequest = {
        id: `qr_${Date.now()}_${Math.floor(Math.random() * 9000) + 1000}`,
        requestNumber,
        
        sourceInquiryId: inquiry.id,
        sourceInquiryNumber: structured.sourceInquiryNumber,
        customerName: inquiry.buyerInfo?.companyName || inquiry.customerName || 'N/A',
        customerEmail: inquiry.userEmail || inquiry.buyerInfo?.email,
        region: inquiry.region,
        
        requestedBy: salesRepEmail,
        requestedByName: salesRepName,
        requestDate: new Date().toISOString().split('T')[0],
        expectedQuoteDate: expectedQuoteDate,
        
        items: items,

        tradeTerms: commercialTerms.tradeTerms,
        paymentMode: commercialTerms.paymentMode,
        balanceTrigger: commercialTerms.balanceTrigger,
        paymentTerms: commercialTerms.paymentTerms,
        deliveryDate: commercialTerms.deliveryDate,
        targetCostRange: commercialTerms.targetCostRange,
        qualityRequirements: commercialTerms.qualityRequirements,
        packagingRequirements: commercialTerms.packagingRequirements,
        
        status: 'pending' as const,
        remarks: remarks,
        notes: flowNotes,
        createdDate: new Date().toISOString().split('T')[0],
        xjCount: 0, // 🔥 初始化下推计数，创建时未下推
      };

      console.log('📤 [CreateQuotationRequestDialog] 提交报价请求:', quotationRequest);
      await addQuotationRequest(quotationRequest);
      console.log('✅ [CreateQuotationRequestDialog] 报价请求已添加到Context');

      const qrDocumentData: QuoteRequirementDocumentData = {
        requirementNo: requestNumber,
        requirementDate: new Date().toISOString().split('T')[0],
        sourceInquiryNo: inquiry.id,
        requiredResponseDate: expectedQuoteDate,
        requiredDeliveryDate: deliveryDate,
        customer: {
          companyName: inquiry.buyerInfo?.companyName || inquiry.customerName || 'N/A',
          contactPerson: inquiry.buyerInfo?.contactPerson || inquiry.buyerInfo?.name || salesRepName,
          email: inquiry.userEmail || inquiry.buyerInfo?.email || '',
          phone: inquiry.buyerInfo?.phone || '',
          address: inquiry.buyerInfo?.address || '',
          region: inquiry.region || '',
        },
        products: items.map((item: any, index: number) => ({
          no: index + 1,
          productName: item.productName,
          modelNo: item.factoryModelNo || getFactoryFacingModelNo(item) || getFormalBusinessModelNo(item),
          factoryModelNo: item.factoryModelNo || getFactoryFacingModelNo(item) || undefined,
          internalModelNo: item.internalModelNo || getFormalBusinessModelNo(item) || undefined,
          specification: item.specification || '',
          quantity: item.quantity,
          unit: item.unit,
          remarks: item.remarks,
        })),
        customerRequirements: {
          deliveryTerms: commercialTerms.tradeTerms,
          paymentTerms: commercialTerms.paymentTerms,
          qualityStandard: commercialTerms.qualityRequirements || structured.certifications || undefined,
          packaging: commercialTerms.packagingRequirements || structured.packingRequirements || undefined,
          specialRequirements: [
            structured.documentReleasePreference ? `Document Release Preference: ${structured.documentReleasePreference}` : '',
            structured.locationValue ? `Location Requirement: ${structured.locationValue}` : '',
            structured.deliveryTime ? `Customer Delivery Time: ${structured.deliveryTime}` : '',
            structured.otherRequirements,
            remarks.trim(),
          ].filter(Boolean).join(' | ') || undefined,
        },
        salesDeptNotes: flowNotes,
        urgency: 'medium',
        createdBy: salesRepName,
      };

      // 🔥 同时创建 QR 主承载记录，让采购侧 QR 池能够看到
      const quoteRequirement = {
        id: `pr_${Date.now()}_${random}`,
        requirementNo: requestNumber, // 使用相同的编号
        source: '报价请求', // 来源是报价请求
        sourceRef: structured.sourceInquiryNumber, // 🔥 关联原始 ING 编号，避免只落内部 UUID
        requiredDate: deliveryDate, // 期望交
        urgency: 'medium' as const,
        status: 'pending' as const,
        createdBy: salesRepName,
        createdDate: new Date().toISOString().split('T')[0],
        expectedQuoteDate: commercialTerms.expectedQuoteDate,
        deliveryDate: commercialTerms.deliveryDate,
        tradeTerms: commercialTerms.tradeTerms,
        paymentMode: commercialTerms.paymentMode,
        balanceTrigger: commercialTerms.balanceTrigger,
        paymentTerms: commercialTerms.paymentTerms,
        targetCostRange: commercialTerms.targetCostRange,
        qualityRequirements: commercialTerms.qualityRequirements,
        packagingRequirements: commercialTerms.packagingRequirements,
        remarks: commercialTerms.remarks,
        commercialTerms,
        customerRequirements,
        downstreamVisibility: DEFAULT_DOWNSTREAM_VISIBILITY,
        specialRequirements: flowNotes,
        salesOrderNo: inquiry.id,
        region: inquiry.region,
        items: items.map((item: any) => ({
          id: item.id,
          productName: item.productName,
          modelNo: item.modelNo || getFormalBusinessModelNo(item),
          factoryModelNo: item.factoryModelNo || getFactoryFacingModelNo(item) || undefined,
          internalModelNo: item.internalModelNo || getFormalBusinessModelNo(item) || undefined,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          remarks: item.remarks
        })),
        documentDataSnapshot: qrDocumentData,
      };

      console.log('📤 [CreateQuotationRequestDialog] 同时创建 QR 主承载记录:', quoteRequirement);
      console.log('🔍 数据流转说明:');
      console.log(`  ├─ 业务员询价单号: ${inquiry.id} (ING)`);
      console.log(`  ├─ QR 编号: ${requestNumber}`);
      console.log(`  ├─ 来源单号: ${inquiry.id} (追溯业务源头)`);
      console.log(`  └─ 区域: ${inquiry.region || '未设置'}`);
      await addQuoteRequirement(quoteRequirement);
      console.log('✅ [CreateQuotationRequestDialog] QR 主承载记录已添加到 Context');

      toast.success(`报价请求已发送 - ${requestNumber}`);

      // 🔥 重置为默认值，而不是清空
      setExpectedQuoteDate(getDefaultQuoteDate());
      setRemarks('');
      setTradeTerms(structured.tradeTerms);
      setPaymentMode(structured.paymentMode);
      setBalanceTrigger(structured.balanceTrigger);
      setPaymentTerms(structured.paymentTerms);
      setDeliveryDate(getDefaultDeliveryDate());
      setTargetCostRange('');
      setQualityRequirements(structured.certifications || QUALITY_REQUIREMENTS_PRESETS[0]);
      setPackagingRequirements(structured.packingRequirements || PACKAGING_REQUIREMENTS_PRESETS[0]);
      setIsCustomQuality(false);
      setIsCustomPackaging(false);
      
      onClose();
    } catch (error) {
      console.error('创建报价请求失败:', error);
      toast.error('创建报价请求失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!inquiry) return null;

  const productCount = editableProducts?.length || 0;
  const totalQuantity = editableProducts?.reduce((sum: number, p: any) => sum + (p.editableQuantity || 0), 0) || 0;
  const hasNoProducts = !editableProducts || editableProducts.length === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        
        {/* 标题区 - 极简黑白 */}
        <DialogHeader className="border-b border-gray-300 px-8 py-5 bg-white">
          <div className="flex items-end justify-between">
            <div>
              <DialogTitle className="text-xl tracking-tight text-black mb-1">
                向采购员请求报价
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-normal">
                QUOTATION REQUEST TO PROCUREMENT DEPT.
              </DialogDescription>
            </div>
            <div className="text-xs text-gray-900 font-mono border border-gray-300 px-3 py-1.5 bg-gray-50">
              {inquiry.id}
            </div>
          </div>
        </DialogHeader>

        {/* 内容区 - 滚动 */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
          
          {hasNoProducts && (
            <div className="bg-white border border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-600">没有产品数据</p>
            </div>
          )}

          {!hasNoProducts && (
            <div className="space-y-6">
              
              {/* 产品清单 */}
              <div className="bg-white border border-gray-300">
                {/* 表头 */}
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm tracking-wide uppercase text-black">
                      产品清单明细 / PRODUCT LIST
                    </h3>
                    <div className="text-xs text-gray-600">
                      {productCount} 项 | 共 {totalQuantity} 件
                    </div>
                  </div>
                </div>

                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-12">No.</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-32">Internal No.</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-32">Factory No.</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 min-w-[320px]">Item Name / Specification</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-28">Quantity</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-16">Unit</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-40">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableProducts?.map((product: any, index: number) => (
                        <tr key={product.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                          {/* No. */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900">{index + 1}</span>
                          </td>
                          
                          {/* Model No. */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-black">
                              {getFormalBusinessModelNo(product) || product.color || product.productName?.slice(0, 12) || '-'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-xs font-mono font-semibold text-black">
                              {product.factoryModelNo || getFactoryFacingModelNo(product) || '-'}
                            </span>
                          </td>
                          
                          {/* Item Name / Specification */}
                          <td className="px-4 py-3">
                            <div className="space-y-1.5">
                              <div className="text-sm text-black leading-tight">
                                {product.productName || '-'}
                              </div>
                              {product.specification && (
                                <div className="text-xs text-gray-600 leading-tight">
                                  {product.specification}
                                </div>
                              )}
                              {product.material && (
                                <div className="text-xs text-gray-500">
                                  Material: {product.material}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Quantity - 可编辑 */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={product.editableQuantity}
                              onChange={(e) => {
                                const newProducts = [...editableProducts];
                                newProducts[index].editableQuantity = parseInt(e.target.value) || 0;
                                setEditableProducts(newProducts);
                              }}
                              className="w-20 text-center text-sm border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:border-black"
                            />
                          </td>
                          
                          {/* Unit */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600">
                              {product.unit || 'pcs'}
                            </span>
                          </td>
                          
                          {/* 备注 - 可编辑 */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={product.editableRemarks}
                              onChange={(e) => {
                                const newProducts = [...editableProducts];
                                newProducts[index].editableRemarks = e.target.value;
                                setEditableProducts(newProducts);
                              }}
                              placeholder="备注"
                              className="w-full text-xs border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:border-black placeholder:text-gray-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 客户对产品的要求 */}
              <div className="bg-white border border-gray-300">
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <h3 className="text-sm tracking-wide uppercase text-black">
                    客户对产品的要求 / CUSTOMER REQUIREMENTS
                  </h3>
                </div>
                <div className="px-5 py-4">
                  <table className="w-full text-xs">
                    <tbody>
                      {inquiry.products?.some((p: any) => p.material) && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">材质要求</td>
                          <td className="py-2 text-black">
                            {[...new Set(inquiry.products.map((p: any) => p.material).filter(Boolean))].join(', ')}
                          </td>
                        </tr>
                      )}
                      {inquiry.products?.some((p: any) => p.specification?.includes('Certification') || p.specification?.includes('CE') || p.specification?.includes('ISO')) && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">认证要求</td>
                          <td className="py-2 text-black">按产品规格要求（见上表）</td>
                        </tr>
                      )}
                      {inquiry.products?.some((p: any) => p.specification?.includes('Warranty') || p.specification?.includes('保修')) && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">保修要求</td>
                          <td className="py-2 text-black">按产品规格要求（见上表）</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-200">
                        <td className="py-2 w-32 text-gray-600">包装要求</td>
                        <td className="py-2 text-black">{structured.packingRequirements || '出口标准包装'}</td>
                      </tr>
                      {structured.certifications && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">认证要求</td>
                          <td className="py-2 text-black">{structured.certifications}</td>
                        </tr>
                      )}
                      {structured.documentReleasePreference && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">提单放单要求</td>
                          <td className="py-2 text-black">{structured.documentReleasePreference}</td>
                        </tr>
                      )}
                      {structured.deliveryTime && (
                        <tr className="border-b border-gray-200">
                          <td className="py-2 w-32 text-gray-600">客户交期要求</td>
                          <td className="py-2 text-black">{structured.deliveryTime}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2 w-32 text-gray-600">其它要求</td>
                        <td className="py-2 text-black">
                          {structured.otherRequirements || '详见产品规格说明（Item Name / Specification 列）'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 其它商务要求 */}
              <div className="bg-white border border-gray-300">
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm tracking-wide uppercase text-black">
                      其它商务要求 / TRADING TERMS
                    </h3>
                    <span className="text-xs text-gray-600">* 必填项</span>
                  </div>
                </div>
                <div className="px-5 py-5">
                  <div className="space-y-4">
                    {/* 第一行：期望报价日期 + 期望交期 + 付款条款 + 贸易条款 + 验货要求 + 目标成本价区间 + 特殊包装要求（占满整个宽度） */}
                    <div className="grid grid-cols-7 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          期望报价日期 *
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={expectedQuoteDate}
                            onChange={(e) => setExpectedQuoteDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            onKeyDown={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            className="text-xs border-gray-300 focus:border-black cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          采购员需在此日期前完成采购询价
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          期望交期 *
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            onKeyDown={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            className="text-xs border-gray-300 focus:border-black cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          付款主规则 *
                        </Label>
                        <select
                          value={paymentMode}
                          onChange={(e) => {
                            const nextMode = e.target.value as PaymentMode;
                            const nextTrigger = deriveBalanceTrigger(nextMode, null);
                            setPaymentMode(nextMode);
                            setBalanceTrigger(nextTrigger);
                            setPaymentTerms(buildPaymentTermsText(nextMode, nextTrigger));
                          }}
                          className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                        >
                          {PAYMENT_MODE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          触发节点 *
                        </Label>
                        <select
                          value={balanceTrigger}
                          onChange={(e) => {
                            const nextTrigger = e.target.value as BalanceTrigger;
                            setBalanceTrigger(nextTrigger);
                            setPaymentTerms(buildPaymentTermsText(paymentMode, nextTrigger));
                          }}
                          className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                        >
                          {BALANCE_TRIGGER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          贸易条款 *
                        </Label>
                        {!isCustomTradeTerms ? (
                          <select
                            value={isPresetTradeTerm(tradeTerms) ? tradeTerms : '自定义...'}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomTradeTerms(true);
                                setTradeTerms('');
                              } else {
                                setTradeTerms(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {TRADE_TERMS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：EXW（不含13%增值税，工厂交货）/ FOB 厦门港（含13%增值税）"
                              value={tradeTerms}
                              onChange={(e) => setTradeTerms(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const fallbackTradeTerms = resolveInitialTradeTerms(
                                  inquiry?.shippingInfo?.tradeTerms,
                                  inquiry?.requirements?.tradeTerms,
                                  inquiry?.tradeTerms,
                                );
                                setIsCustomTradeTerms(false);
                                setTradeTerms(isPresetTradeTerm(fallbackTradeTerms) ? fallbackTradeTerms : TRADE_TERMS_PRESETS[0]);
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          请明确写清税态与地点，例如“EXW（不含13%增值税，工厂交货）”或“FOB 厦门港（含13%增值税）”。
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          验货要求
                        </Label>
                        {!isCustomQuality ? (
                          <select
                            value={qualityRequirements}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomQuality(true);
                                setQualityRequirements('');
                              } else {
                                setQualityRequirements(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {QUALITY_REQUIREMENTS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：需要第三方验货，AQL 2.5标准"
                              value={qualityRequirements}
                              onChange={(e) => setQualityRequirements(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomQuality(false);
                                setQualityRequirements('');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          目标成本
                        </Label>
                        <Input
                          placeholder="例如：USD 5.50 - 6.20 /pcs"
                          value={targetCostRange}
                          onChange={(e) => setTargetCostRange(e.target.value)}
                          className="text-xs border-gray-300 focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          特殊包装
                        </Label>
                        {!isCustomPackaging ? (
                          <select
                            value={packagingRequirements}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomPackaging(true);
                                setPackagingRequirements('');
                              } else {
                                setPackagingRequirements(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {PACKAGING_REQUIREMENTS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：需要客户logo印刷，彩盒包装"
                              value={packagingRequirements}
                              onChange={(e) => setPackagingRequirements(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomPackaging(false);
                                setPackagingRequirements('');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-gray-700">
                        付款条款展示文本 *
                      </Label>
                      <Textarea
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="text-xs border-gray-300 focus:border-black min-h-[76px]"
                        placeholder="结构化付款规则会自动生成展示文本，也可人工微调。"
                      />
                    </div>

                    {/* 第二行：给采购员的备注（单独一行，仅占左半边） */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          给采购员的备注 Remarks
                        </Label>
                        <Textarea
                          placeholder="例如：客户很急，请优先处理..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={3}
                          className="resize-none text-xs border-gray-300 focus:border-black"
                        />
                        <p className="text-xs text-gray-500">
                          请勿在备注中透露客户身份信息
                        </p>
                      </div>
                      
                      {/* 右侧留空 */}
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <DialogFooter className="border-t border-gray-300 px-8 py-4 bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-600">
              共 <span className="text-black font-mono">{productCount}</span> 个产品，
              总计 <span className="text-black font-mono">{totalQuantity}</span> 件
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="text-xs border-gray-300 hover:bg-gray-50"
              >
                取消
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!expectedQuoteDate || loading}
                className="bg-black hover:bg-gray-800 text-white text-xs"
              >
                {loading ? '提交中...' : '提交报价请求'}
              </Button>
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
