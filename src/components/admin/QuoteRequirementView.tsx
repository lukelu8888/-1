import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import {
  QuoteRequirementDocument,
  type QuoteRequirementDocumentData,
  type QuoteRequirementPreviewLayout,
  type QuoteRequirementTextOverrides,
} from '../documents/templates/QuoteRequirementDocument';
import { useAuth } from '../../hooks/useAuth'; // 🔥 使用useAuth而不是useUser
import { buildQuoteRequirementDocumentSnapshot } from './purchase-order/purchaseOrderUtils';
import { supplierQuotationService } from '../../lib/supabaseService';
import { matchesNormalizedQrNumber } from '../../utils/quoteRequirementNumber';

/**
 * 📋 报价请求单视图 - 基于报价请求单模板
 * 
 * 功能：
 * 1. 展示报价请求单的完整内容
 * 2. 使用专业的报价请求单格式
 * 3. 显示客户信息、产品清单、业务部说明、采购部反馈
 */

interface QuoteRequirementViewProps {
  requirement: any; // 报价请求单数据
  zoom?: number;
  onClose?: () => void; // 🔥 关闭弹窗的回调
  layoutConfig?: Partial<QuoteRequirementPreviewLayout>;
  textOverrides?: Partial<QuoteRequirementTextOverrides>;
}

const normalizeComparable = (value: unknown) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const toPositiveNumberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const QuoteRequirementView = forwardRef<HTMLDivElement, QuoteRequirementViewProps>(
  ({ requirement, zoom = 100, onClose, layoutConfig, textOverrides }, ref) => {
    const { currentUser } = useAuth(); // 🔥 使用useAuth获取有role字段的用户对象
    const [resolvedDocumentData, setResolvedDocumentData] = useState<QuoteRequirementDocumentData | null>(null);

    // 🔥 调试日志
    console.log('🔍 [QuoteRequirementView] requirement:', requirement?.requirementNo);
    if (requirement?.items && requirement.items.length > 0) {
      console.log('   - 第一个产品 modelNo:', requirement.items[0].modelNo);
      console.log('   - 第一个产品 specification:', requirement.items[0].specification);
    }

    if (!requirement) {
      return (
        <div className="bg-white p-8 text-center">
          <p className="text-gray-500">未找到报价请求单数据</p>
        </div>
      );
    }

    const templateSnapshot = requirement.templateSnapshot || requirement.template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const baseDocument = useMemo(() => buildQuoteRequirementDocumentSnapshot(
      requirement,
      currentUser?.type || currentUser?.role,
      { forceRebuild: true },
    ), [currentUser?.role, currentUser?.type, requirement]);

    useEffect(() => {
      let alive = true;

      const hydratePreview = async () => {
        if (!requirement || !baseDocument) {
          if (alive) setResolvedDocumentData(null);
          return;
        }

        if (alive) setResolvedDocumentData(baseDocument);

        try {
          const quotations = await supplierQuotationService.getAll();
          const allRows = Array.isArray(quotations) ? quotations : [];
          const linkedBJList = String(requirement?.purchaserFeedback?.linkedBJ || '')
            .split(/[\n,，、;；]+/)
            .map((item) => item.trim())
            .filter(Boolean);
          const requirementNo = String(requirement?.requirementNo || '').trim();
          const sourceInquiryNo = String(
            requirement?.sourceInquiryNumber ||
            requirement?.sourceRef ||
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
                  matchesNormalizedQrNumber(qrNo, requirementNo, quotation?.region, requirement?.region) ||
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
                imageUrl:
                  item?.imageUrl ||
                  item?.image ||
                  item?.image_url ||
                  item?.photoUrl ||
                  item?.productImage ||
                  item?.product_image ||
                  fallbackRowItem?.imageUrl ||
                  fallbackRowItem?.image ||
                  fallbackRowItem?.image_url,
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
              imageUrl: matched?.imageUrl || product.imageUrl,
              unitPrice: unitPrice ?? product.unitPrice,
              totalPrice: totalPrice ?? product.totalPrice,
              currency: String(matched?.currency || product.currency || 'CNY').toUpperCase(),
            };
          });

          if (!alive) return;
          setResolvedDocumentData({
            ...baseDocument,
            products: nextProducts,
          });
        } catch (error) {
          console.warn('⚠️ [QuoteRequirementView] failed to enrich QR preview from linked BJ:', error);
        }
      };

      void hydratePreview();
      return () => {
        alive = false;
      };
    }, [baseDocument, requirement]);

    if (!templateVersion || !resolvedDocumentData) {
      return (
        <div className="bg-white p-8 text-center">
          <p className="text-gray-500">该 QR 未绑定模板中心版本快照，无法预览</p>
        </div>
      );
    }

    return (
      <div ref={ref}>
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm">
          <span className="font-medium text-slate-700">报价请求单预览</span>
          <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-semibold text-blue-700">
            模板版本：{templateVersion?.version || '未绑定'}
          </span>
        </div>
        <QuoteRequirementDocument
          data={resolvedDocumentData}
          layoutConfig={layoutConfig}
          textOverrides={textOverrides}
        />
      </div>
    );
  }
);

QuoteRequirementView.displayName = 'QuoteRequirementView';
