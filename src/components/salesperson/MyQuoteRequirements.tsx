/**
 * 🔥 我的 QR - 业务员端
 * 
 * 功能：
 * 1. 查看自己创建的报价请求单（QR）
 * 2. 查看采购员反馈的成本信息
 * 3. 基于采购反馈创建客户报价（QT）
 * 4. 跟踪采购进度
 */

import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Search, 
  FileText, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Filter,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useInquiries } from '../../contexts/InquiryContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { PurchaserFeedbackView } from './PurchaserFeedbackView';
import { CreateQuotationFromFeedback } from './CreateQuotationFromFeedback';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  QuoteRequirementDocument,
  type QuoteRequirementDocumentData,
  buildDefaultQuoteRequirementTextOverrides,
} from '../documents/templates/QuoteRequirementDocument';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { desensitizePurchaserFeedbackText, sanitizeQuoteRequirementDocumentForSales } from '../../utils/purchaserFeedbackSanitizer';
import { matchesBusinessOwnerEmail, resolveQuoteRequirementOwner } from '../../utils/quotationOwnership';
import { buildQuoteRequirementDocumentSnapshot } from '../admin/purchase-order/purchaseOrderUtils';
import { supplierQuotationService } from '../../lib/supabaseService';
import {
  ERP_LIST_UI_SPEC_V1,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../shared/erpListUiSpec';
import { normalizeLegacyQrNumber } from '../../utils/quoteRequirementNumber';

const normalizeComparable = (value: unknown) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const toPositiveNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const enrichSalesQrPreviewDocument = (
  qr: any,
  documentData: QuoteRequirementDocumentData | null,
): QuoteRequirementDocumentData | null => {
  if (!qr || !documentData) return documentData;

  const feedbackProducts = Array.isArray(qr?.purchaserFeedback?.products)
    ? qr.purchaserFeedback.products
    : [];
  const snapshotProducts = Array.isArray(qr?.documentDataSnapshot?.products)
    ? qr.documentDataSnapshot.products
    : Array.isArray(qr?.document_data_snapshot?.products)
      ? qr.document_data_snapshot.products
      : [];
  const sourceItems = Array.isArray(qr?.items) ? qr.items : [];

  const nextProducts = documentData.products.map((product, index) => {
    const sourceItem = sourceItems[index] || null;
    const feedbackProduct = feedbackProducts.find((item: any, feedbackIndex: number) => {
      if (feedbackIndex === index) return true;
      const sameId =
        normalizeComparable(item?.productId) &&
        normalizeComparable(item?.productId) === normalizeComparable(sourceItem?.id);
      const sameModel =
        normalizeComparable(item?.modelNo || item?.productModelNo) &&
        normalizeComparable(item?.modelNo || item?.productModelNo) === normalizeComparable(product?.modelNo || sourceItem?.modelNo);
      const sameName =
        normalizeComparable(item?.productName) &&
        normalizeComparable(item?.productName) === normalizeComparable(product?.productName || sourceItem?.productName);
      return Boolean(sameId || sameModel || sameName);
    }) || null;

    const snapshotProduct = snapshotProducts.find((item: any, snapshotIndex: number) => {
      if (snapshotIndex === index) return true;
      const sameModel =
        normalizeComparable(item?.modelNo || item?.model || item?.sku) &&
        normalizeComparable(item?.modelNo || item?.model || item?.sku) === normalizeComparable(product?.modelNo || sourceItem?.modelNo);
      const sameName =
        normalizeComparable(item?.productName || item?.name || item?.description) &&
        normalizeComparable(item?.productName || item?.name || item?.description) === normalizeComparable(product?.productName || sourceItem?.productName);
      return Boolean(sameModel || sameName);
    }) || null;

    const quantity = Number(product?.quantity || feedbackProduct?.quantity || sourceItem?.quantity || 0);
    const feedbackUnitPrice =
      toPositiveNumberOrNull(feedbackProduct?.sourcePricing?.unitPrice) ??
      toPositiveNumberOrNull(feedbackProduct?.costPrice) ??
      (
        toPositiveNumberOrNull(feedbackProduct?.amount) != null && quantity > 0
          ? Number(feedbackProduct.amount) / quantity
          : null
      );
    const snapshotUnitPrice =
      toPositiveNumberOrNull(snapshotProduct?.unitPrice) ??
      toPositiveNumberOrNull(snapshotProduct?.price) ??
      toPositiveNumberOrNull(snapshotProduct?.quotedPrice);
    const resolvedUnitPrice = feedbackUnitPrice ?? snapshotUnitPrice ?? product.unitPrice;

    const feedbackTotal =
      toPositiveNumberOrNull(feedbackProduct?.amount) ??
      (feedbackUnitPrice != null && quantity > 0 ? feedbackUnitPrice * quantity : null);
    const snapshotTotal =
      toPositiveNumberOrNull(snapshotProduct?.totalPrice) ??
      toPositiveNumberOrNull(snapshotProduct?.amount) ??
      (snapshotUnitPrice != null && quantity > 0 ? snapshotUnitPrice * quantity : null);

    return {
      ...product,
      unitPrice: resolvedUnitPrice ?? product.unitPrice,
      totalPrice: feedbackTotal ?? snapshotTotal ?? product.totalPrice,
      currency: String(
        feedbackProduct?.sourcePricing?.currency ||
        feedbackProduct?.currency ||
        snapshotProduct?.currency ||
        product.currency ||
        'CNY',
      ).toUpperCase(),
    };
  });

  return {
    ...documentData,
    products: nextProducts,
  };
};

export function MyQuoteRequirements() {
  const { requirements: quoteRequirements } = useQuoteRequirements();
  const { inquiries } = useInquiries();
  const currentUser = getCurrentUser();
  
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'feedbacked'>('all');
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [showFeedbackView, setShowFeedbackView] = useState(false);
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [resolvedPreviewDocumentData, setResolvedPreviewDocumentData] = useState<QuoteRequirementDocumentData | null>(null);
  
  // 🔥 筛选我的 QR
  const myRequirements = useMemo(() => {
    return quoteRequirements.filter(qr => {
      const owner = resolveQuoteRequirementOwner(qr, inquiries, currentUser);
      if (!matchesBusinessOwnerEmail(owner.email, currentUser?.email, qr?.region, qr?.ownerUserId, currentUser?.id)) {
        return false;
      }
      
      // 状态筛选
      if (filterStatus === 'pending' && qr.purchaserFeedback) {
        return false;
      }
      if (filterStatus === 'feedbacked' && !qr.purchaserFeedback) {
        return false;
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          normalizeLegacyQrNumber(qr.requirementNo).toLowerCase().includes(term) ||
          qr.sourceInquiryNumber?.toLowerCase().includes(term) ||
          qr.items.some(item => 
            item.productName.toLowerCase().includes(term) ||
            getFormalBusinessModelNo(item).toLowerCase().includes(term)
          )
        );
      }
      
      return true;
    });
  }, [quoteRequirements, inquiries, currentUser, filterStatus, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myRequirements.length;
    const pending = myRequirements.filter(qr => !qr.purchaserFeedback).length;
    const feedbacked = myRequirements.filter(qr => qr.purchaserFeedback).length;
    
    return { total, pending, feedbacked };
  }, [myRequirements]);
  
  // 🔥 查看采购反馈
  const handleViewFeedback = (qr: any) => {
    if (!qr.purchaserFeedback) {
      toast.error('该 QR 尚未收到采购员反馈');
      return;
    }
    
    setSelectedQR(qr);
    setShowFeedbackView(true);
  };
  
  // 🔥 创建客户报价
  const handleCreateQuotation = (qr: any, feedback: any) => {
    setSelectedQR(qr);
    setShowCreateQuotation(true);
  };

  const buildFallbackQrDocumentData = (qr: any): QuoteRequirementDocumentData => ({
    requirementNo: qr.requirementNo,
    requirementDate: qr.createdDate || qr.createdAt || new Date().toISOString().split('T')[0],
    sourceInquiryNo: qr.sourceInquiryNumber || qr.sourceRef || '',
    requiredResponseDate: qr.expectedQuoteDate || new Date().toISOString().split('T')[0],
    requiredDeliveryDate: qr.deliveryDate || qr.requiredDate || new Date().toISOString().split('T')[0],
    customer: {
      companyName: qr.customerName || 'N/A',
      contactPerson: qr.requestedByName || qr.createdBy || '',
      email: qr.customerEmail || '',
      phone: '',
      address: '',
      region: qr.region || '',
    },
    products: (qr.items || []).map((item: any, index: number) => ({
      no: index + 1,
      modelNo: getFormalBusinessModelNo(item),
      productName: item.productName || '',
      specification: item.specification || '',
      quantity: Number(item.quantity || 0),
      unit: item.unit || 'pcs',
      remarks: item.remarks,
    })),
    customerRequirements: {
      deliveryTerms: qr.tradeTerms,
      paymentTerms: qr.paymentTerms,
      qualityStandard: qr.qualityRequirements,
      packaging: qr.packagingRequirements,
      specialRequirements: qr.remarks || qr.specialRequirements,
    },
    salesDeptNotes: qr.notes || qr.specialRequirements,
    purchaseDeptFeedback: desensitizePurchaserFeedbackText(
      qr.purchaserFeedback?.purchaserRemarks || '',
      qr.purchaserFeedback,
      'Sales_Rep',
    ) || undefined,
    urgency: 'medium',
    createdBy: qr.requestedByName || qr.createdBy || '',
  });

  const handlePreviewDocument = (qr: any) => {
    setSelectedQR(qr);
    setShowDocumentPreview(true);
  };

  React.useEffect(() => {
    let alive = true;

    const buildPreviewDocument = async () => {
      if (!selectedQR || !showDocumentPreview) {
        if (alive) setResolvedPreviewDocumentData(null);
        return;
      }

      const baseDocument = enrichSalesQrPreviewDocument(
        selectedQR,
        sanitizeQuoteRequirementDocumentForSales(
          buildQuoteRequirementDocumentSnapshot(
            selectedQR,
            currentUser?.type || currentUser?.role || 'Sales_Rep',
            { forceRebuild: true },
          ),
          selectedQR?.purchaserFeedback,
          'Sales_Rep',
        ) as QuoteRequirementDocumentData | null,
      );

      if (!baseDocument) {
        if (alive) setResolvedPreviewDocumentData(null);
        return;
      }

      if (alive) setResolvedPreviewDocumentData(baseDocument);

      try {
        const quotations = await supplierQuotationService.getAll();
        const allRows = Array.isArray(quotations) ? quotations : [];
        const linkedBJList = String(selectedQR?.purchaserFeedback?.linkedBJ || '')
          .split(/[\n,，、;；]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        const requirementNo = String(selectedQR?.requirementNo || '').trim();
        const sourceInquiryNo = String(
          selectedQR?.sourceInquiryNumber ||
          selectedQR?.sourceRef ||
          baseDocument?.sourceInquiryNo ||
          '',
        ).trim();
        const linkedRows = allRows.filter((quotation: any) =>
          linkedBJList.includes(String(quotation?.quotationNo || quotation?.bjNumber || '').trim()),
        );
        const relatedRows = linkedRows.length > 0
          ? linkedRows
          : allRows.filter((quotation: any) => {
              const quotationNo = String(quotation?.quotationNo || quotation?.bjNumber || '').trim();
              const qrNo = String(quotation?.sourceQR || quotation?.requirementNo || '').trim();
              const xjNo = String(quotation?.sourceXJ || quotation?.xjNumber || '').trim();
              return Boolean(
                (requirementNo && qrNo === requirementNo) ||
                (linkedBJList.length > 0 && linkedBJList.includes(quotationNo)) ||
                (sourceInquiryNo && xjNo === sourceInquiryNo)
              );
            });
        if (relatedRows.length === 0 || !alive) return;

        const bjItems = relatedRows.flatMap((quotation: any) => {
          const snapshotProducts = Array.isArray(quotation?.documentDataSnapshot?.products)
            ? quotation.documentDataSnapshot.products
            : Array.isArray(quotation?.document_data_snapshot?.products)
              ? quotation.document_data_snapshot.products
              : [];
          const rowItems = Array.isArray(quotation?.items) ? quotation.items : [];
          const sourceItems = snapshotProducts.length > 0 ? snapshotProducts : rowItems;
          return sourceItems.map((item: any, index: number) => {
            const fallbackRowItem = rowItems[index] || null;
            return {
              ...fallbackRowItem,
              ...item,
              productId: item?.productId || item?.id || fallbackRowItem?.productId || fallbackRowItem?.id,
              productName:
                item?.productName ||
                item?.name ||
                item?.description ||
                item?.product ||
                fallbackRowItem?.productName ||
                fallbackRowItem?.name ||
                fallbackRowItem?.description,
              modelNo:
                item?.modelNo ||
                item?.model ||
                item?.sku ||
                fallbackRowItem?.modelNo ||
                fallbackRowItem?.model ||
                fallbackRowItem?.sku,
              unitPrice:
                item?.unitPrice ??
                item?.price ??
                item?.quotedPrice ??
                item?.supplierPrice ??
                fallbackRowItem?.unitPrice ??
                fallbackRowItem?.price,
              amount:
                item?.amount ??
                item?.totalPrice ??
                item?.lineAmount ??
                item?.totalAmount ??
                fallbackRowItem?.amount ??
                fallbackRowItem?.totalPrice ??
                fallbackRowItem?.lineAmount,
              currency:
                item?.currency ||
                item?.quoteCurrency ||
                fallbackRowItem?.currency ||
                fallbackRowItem?.quoteCurrency ||
                quotation?.currency ||
                'CNY',
            };
          });
        });

        const nextProducts = baseDocument.products.map((product, index) => {
          const matched = bjItems.find((item: any, bjIndex: number) => {
            if (bjIndex === index) return true;
            const sameModel =
              normalizeComparable(item?.modelNo) &&
              normalizeComparable(item?.modelNo) === normalizeComparable(product?.modelNo);
            const sameName =
              normalizeComparable(item?.productName) &&
              normalizeComparable(item?.productName) === normalizeComparable(product?.productName);
            return Boolean(sameModel || sameName);
          }) || null;

          if (!matched) return product;

          const quantity = Number(product?.quantity || 0);
          const unitPrice = toPositiveNumberOrNull(matched?.unitPrice);
          const totalPrice =
            toPositiveNumberOrNull(matched?.amount) ??
            (unitPrice != null && quantity > 0 ? unitPrice * quantity : null);

          return {
            ...product,
            unitPrice: unitPrice ?? product.unitPrice,
            totalPrice: totalPrice ?? product.totalPrice,
            currency: String(matched?.currency || product.currency || 'CNY').toUpperCase(),
          };
        });

        if (!alive) return;
        setResolvedPreviewDocumentData({
          ...baseDocument,
          products: nextProducts,
        });
      } catch (error) {
        console.warn('⚠️ [MyQuoteRequirements] failed to enrich sales QR preview from linked BJ:', error);
      }
    };

    void buildPreviewDocument();
    return () => {
      alive = false;
    };
  }, [currentUser, selectedQR, showDocumentPreview]);
  
  // 🔥 状态标识
  const getStatusBadge = (qr: any) => {
    if (qr.purchaserFeedback) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          已反馈
        </Badge>
      );
    }
    
    if (qr.status === 'allSubmitted' || qr.status === 'partialSubmitted') {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300">
          <Clock className="h-3 w-3 mr-1" />
          等待反馈
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gray-100 text-gray-700 border-gray-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        {qr.status === 'pending' ? '未询价' : '询价中'}
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      
      {/* 🔥 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">我的 QR</h2>
          <p className="text-sm text-gray-600 mt-1">
            查看采购进度，接收采购员反馈，创建客户报价
          </p>
        </div>
      </div>
      
      {/* 🔥 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总 QR 数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">等待反馈</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-orange-600 opacity-20" />
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">已收到反馈</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.feedbacked}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-600 opacity-20" />
          </div>
        </div>
      </div>
      
      {/* 🔥 筛选和搜索 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="sr-only">搜索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索 QR 编号、ING 编号、产品名称..."
                className={`pl-10 h-9 ${ERP_LIST_UI_SPEC_V1.searchTextClass}`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                style={getErpListFilterPillStyle(filterStatus === 'all')}
                className={getErpListFilterPillClass(filterStatus === 'all')}
                onClick={() => setFilterStatus('all')}
              >
                全部 ({stats.total})
              </Button>
              <Button 
                variant="outline"
                size="sm"
                style={getErpListFilterPillStyle(filterStatus === 'pending')}
                className={getErpListFilterPillClass(filterStatus === 'pending')}
                onClick={() => setFilterStatus('pending')}
              >
                等待反馈 ({stats.pending})
              </Button>
              <Button 
                variant="outline"
                size="sm"
                style={getErpListFilterPillStyle(filterStatus === 'feedbacked')}
                className={getErpListFilterPillClass(filterStatus === 'feedbacked')}
                onClick={() => setFilterStatus('feedbacked')}
              >
                已反馈 ({stats.feedbacked})
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 🔥 QR 列表 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-40">QR编号</TableHead>
              <TableHead className="w-32">关联询价</TableHead>
              <TableHead className="w-24">区域</TableHead>
              <TableHead>产品信息</TableHead>
              <TableHead className="w-32 text-center">状态</TableHead>
              <TableHead className="w-32 text-center">反馈状态</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myRequirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>暂无 QR</p>
                  <p className="text-sm mt-1">在客户询价管理中下推 QR 即可在此查看</p>
                </TableCell>
              </TableRow>
            ) : (
              myRequirements.map((qr) => (
                <TableRow key={qr.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-semibold text-blue-600">
                    {normalizeLegacyQrNumber(qr.requirementNo)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {qr.sourceInquiryNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {qr.region || 'NA'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const items = Array.isArray(qr.items) ? qr.items : [];
                      const first = items[0];
                      const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                      const unit = first?.unit || '';
                      return (
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{first?.productName || 'N/A'}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            共 {Math.max(items.length, 1)} 个产品 · {totalQty.toLocaleString()} {unit}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(qr)}
                  </TableCell>
                  <TableCell className="text-center">
                    {qr.purchaserFeedback ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1 text-sm text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          已反馈
                        </div>
                        <div className="text-xs text-gray-500">
                          {qr.purchaserFeedback.feedbackDate}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          by {qr.purchaserFeedback.feedbackBy}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        等待中
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {qr.purchaserFeedback && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewDocument(qr)}
                            className="gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            预览QR
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFeedback(qr)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            查看反馈
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleCreateQuotation(qr, qr.purchaserFeedback)}
                            className="gap-1 bg-orange-600 hover:bg-orange-700"
                          >
                            <FileText className="h-3 w-3" />
                            创建报价
                          </Button>
                        </>
                      )}
                      {!qr.purchaserFeedback && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewDocument(qr)}
                            className="gap-1"
                          >
                            <FileText className="h-3 w-3" />
                            预览QR
                          </Button>
                          <div className="text-xs text-gray-500">
                            等待采购员反馈...
                          </div>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 🔥 采购反馈查看对话框 */}
      {selectedQR && selectedQR.purchaserFeedback && (
        <PurchaserFeedbackView
          open={showFeedbackView}
          onOpenChange={setShowFeedbackView}
          qr={selectedQR}
          onCreateQuotation={(qr, feedback) => {
            setShowFeedbackView(false);
            handleCreateQuotation(qr, feedback);
          }}
        />
      )}
      
      {/* 🔥 创建客户报价对话框 */}
      {selectedQR && selectedQR.purchaserFeedback && (
        <CreateQuotationFromFeedback
          open={showCreateQuotation}
          onOpenChange={setShowCreateQuotation}
          qr={selectedQR}
          feedback={selectedQR.purchaserFeedback}
        />
      )}

      {selectedQR && (
        <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
          <DialogContent className="max-w-[95vw] h-[95vh] overflow-hidden p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>QR 文档预览 - {normalizeLegacyQrNumber(selectedQR.requirementNo)}</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(95vh-72px)] overflow-auto bg-[#525659] p-6">
              {(() => {
                const templateSnapshot = selectedQR.templateSnapshot || selectedQR.template_snapshot || null;
                const templateVersion = templateSnapshot?.version || null;
                const documentData = resolvedPreviewDocumentData;
                if (!templateVersion || !documentData) {
                  return (
                    <div className="mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      该 QR 未绑定模板中心版本快照，无法预览。
                    </div>
                  );
                }
                const textOverrides = templateVersion.style_tokens?.textOverrides || buildDefaultQuoteRequirementTextOverrides(documentData);
                return (
                  <div className="mx-auto" style={{ width: `${(templateVersion?.layout_json?.canvasWidthMm || 210)}mm` }}>
                    <QuoteRequirementDocument
                      data={documentData}
                      layoutConfig={templateVersion?.layout_json || undefined}
                      textOverrides={textOverrides}
                      showRelationBanner={false}
                    />
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
    </div>
  );
}
