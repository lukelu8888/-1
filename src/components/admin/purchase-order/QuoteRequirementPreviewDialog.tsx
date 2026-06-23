import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { exportToPDF, generatePDFFilename, exportToPDFPrint } from '../../../utils/pdfExport';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { QuoteRequirementDocumentA4Pages } from '../../documents/templates/paginated/QuoteRequirementDocumentA4';
import { Button } from '../../ui/button';
import { sanitizeQuoteRequirementDocumentForSales } from '../../../utils/purchaserFeedbackSanitizer';
import { buildQuoteRequirementDocumentSnapshot } from './purchaseOrderUtils';
import { supplierQuotationService } from '../../../lib/supabaseService';
import type { QuoteRequirementDocumentData } from '../../documents/templates/QuoteRequirementDocument';
import { ProcurementDocumentViewerShell } from './ProcurementDocumentViewerShell';
import { matchesNormalizedQrNumber, normalizeLegacyQrNumber } from '../../../utils/quoteRequirementNumber';

type QuoteRequirementPreviewDialogProps = {
  showRequirementDialog: boolean;
  setShowRequirementDialog: React.Dispatch<React.SetStateAction<boolean>>;
  viewRequirement: QuoteRequirement | null;
  userRole?: string;
  supplierQuotations?: any[];
};

export const QuoteRequirementPreviewDialog: React.FC<QuoteRequirementPreviewDialogProps> = ({
  showRequirementDialog,
  setShowRequirementDialog,
  viewRequirement,
  userRole,
  supplierQuotations = [],
}) => {
  const [resolvedDocumentData, setResolvedDocumentData] = React.useState<QuoteRequirementDocumentData | null>(null);
  const documentRef = React.useRef<HTMLDivElement>(null);
  const templateSnapshot = viewRequirement?.templateSnapshot || viewRequirement?.template_snapshot || null;
  const templateVersion = templateSnapshot?.version || null;
  const rawDocumentData = React.useMemo(
    () => (viewRequirement
      ? buildQuoteRequirementDocumentSnapshot(viewRequirement, userRole, { forceRebuild: true })
      : null),
    [viewRequirement, userRole],
  );

  React.useEffect(() => {
    let alive = true;

      const normalizeComparable = (value: unknown) =>
        String(value || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
      const toPositiveNumberOrNull = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };
      const pickPositiveNumberOrNull = (...values: unknown[]) => {
        for (const value of values) {
          const parsed = toPositiveNumberOrNull(value);
          if (parsed != null) return parsed;
        }
        return null;
      };
      const resolvePricingUnitPrice = (item: any) => pickPositiveNumberOrNull(
        item?.sourcePricing?.unitPrice,
        item?.sourcePricing?.unit_price,
        item?.sourcePricing?.price,
        item?.sourcePricing?.quotedPrice,
        item?.sourcePricing?.quoted_price,
        item?.sourcePricing?.supplierPrice,
        item?.sourcePricing?.supplier_price,
        item?.costPrice,
        item?.cost_price,
        item?.supplierPrice,
        item?.supplier_price,
        item?.unitPrice,
        item?.unit_price,
        item?.quotedPrice,
        item?.quoted_price,
        item?.price,
        item?.pricing?.unitPrice,
        item?.pricing?.unit_price,
      );
      const resolvePricingAmount = (item: any) => pickPositiveNumberOrNull(
        item?.amount,
        item?.totalAmount,
        item?.total_amount,
        item?.totalPrice,
        item?.total_price,
        item?.lineAmount,
        item?.line_amount,
        item?.subtotal,
        item?.sourcePricing?.amount,
        item?.sourcePricing?.totalAmount,
        item?.sourcePricing?.total_amount,
      );
      const resolvePricingCurrency = (item: any, fallback = 'CNY') => String(
        item?.sourcePricing?.currency ||
        item?.sourcePricing?.currencyCode ||
        item?.sourcePricing?.currency_code ||
        item?.currency ||
        item?.currencyCode ||
        item?.currency_code ||
        item?.quoteCurrency ||
        item?.quote_currency ||
        item?.quotationCurrency ||
        fallback,
      ).toUpperCase();

    const enrichFromLinkedBJ = async () => {
      if (!viewRequirement || !rawDocumentData) {
        if (alive) setResolvedDocumentData(null);
        return;
      }

      const baseData = sanitizeQuoteRequirementDocumentForSales(
        rawDocumentData,
        viewRequirement?.purchaserFeedback,
        userRole,
      );
      if (!baseData) {
        if (alive) setResolvedDocumentData(null);
        return;
      }

      const feedbackProducts = Array.isArray(viewRequirement?.purchaserFeedback?.products)
        ? viewRequirement.purchaserFeedback.products
        : [];

      const feedbackOverriddenProducts = baseData.products.map((product, index) => {
        const feedbackProduct = feedbackProducts[index] || null;
        if (!feedbackProduct) return product;

        const unitPrice = resolvePricingUnitPrice(feedbackProduct);
        const quantity = Number(product?.quantity || feedbackProduct?.quantity || 0);
        const amount = resolvePricingAmount(feedbackProduct);
        const totalPriceRaw = amount ?? (
          unitPrice != null && quantity > 0 ? unitPrice * quantity : Number(product.totalPrice || 0)
        );

        return {
          ...product,
          unitPrice: unitPrice ?? product.unitPrice,
          totalPrice:
            Number.isFinite(totalPriceRaw) && totalPriceRaw > 0
              ? totalPriceRaw
              : product.totalPrice,
          currency: resolvePricingCurrency(feedbackProduct, product.currency || 'CNY'),
        };
      });

      const feedbackFirstData = {
        ...baseData,
        products: feedbackOverriddenProducts,
      };

      if (alive) setResolvedDocumentData(feedbackFirstData);

      const linkedBJList = String(viewRequirement?.purchaserFeedback?.linkedBJ || '')
        .split(/[\n,，、;；]+/)
        .map((item) => item.trim())
        .filter(Boolean);

      try {
        const quotations =
          Array.isArray(supplierQuotations) && supplierQuotations.length > 0
            ? supplierQuotations
            : await supplierQuotationService.getAll();
        const allRows = Array.isArray(quotations) ? quotations : [];
        const requirementNo = String(viewRequirement?.requirementNo || '').trim();
        const sourceInquiryNo = String(
          viewRequirement?.sourceInquiryNumber ||
          (viewRequirement as any)?.sourceRef ||
          rawDocumentData?.sourceInquiryNo ||
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
                matchesNormalizedQrNumber(qrNo, requirementNo, quotation?.region, viewRequirement?.region) ||
                (linkedBJList.length > 0 && linkedBJList.includes(quotationNo)) ||
                (sourceInquiryNo && xjNo === sourceInquiryNo)
              );
            });
        if (relatedRows.length === 0) return;

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
              quantity: item?.quantity ?? fallbackRowItem?.quantity,
              unitPrice:
                item?.unitPrice ??
                item?.unit_price ??
                item?.price ??
                item?.quotedPrice ??
                item?.quoted_price ??
                item?.supplierPrice ??
                item?.supplier_price ??
                fallbackRowItem?.unitPrice ??
                fallbackRowItem?.unit_price ??
                fallbackRowItem?.price,
              amount:
                item?.amount ??
                item?.totalPrice ??
                item?.total_price ??
                item?.lineAmount ??
                item?.line_amount ??
                item?.totalAmount ??
                item?.total_amount ??
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
              quotationCurrency: quotation?.currency || item?.currency || fallbackRowItem?.currency || 'CNY',
            };
          });
        });

        const nextProducts = feedbackFirstData.products.map((product, index) => {
          const byFeedback = Array.isArray(viewRequirement?.purchaserFeedback?.products)
            ? viewRequirement!.purchaserFeedback!.products[index]
            : null;
          const matched = bjItems.find((item: any) => {
            const sameId =
              normalizeComparable(item?.productId) &&
              (
                normalizeComparable(item?.productId) === normalizeComparable(byFeedback?.productId) ||
                normalizeComparable(item?.productId) === normalizeComparable((viewRequirement?.items || [])[index]?.id)
              );
            const sameModel =
              normalizeComparable(item?.modelNo) &&
              (
                normalizeComparable(item?.modelNo) === normalizeComparable(product?.modelNo) ||
                normalizeComparable(item?.modelNo) === normalizeComparable((viewRequirement?.items || [])[index]?.modelNo)
              );
            const sameName =
              normalizeComparable(item?.productName) &&
              (
                normalizeComparable(item?.productName) === normalizeComparable(product?.productName) ||
                normalizeComparable(item?.productName) === normalizeComparable((viewRequirement?.items || [])[index]?.productName)
              );
            return sameId || sameModel || sameName;
          });
          const fallbackMatched = matched || bjItems[index] || null;
          if (!fallbackMatched) return product;

          const unitPrice = resolvePricingUnitPrice(fallbackMatched);
          const quantity = Number(product?.quantity || matched?.quantity || 0);
          const totalPriceRaw = resolvePricingAmount(fallbackMatched);
          const totalPrice =
            totalPriceRaw != null && totalPriceRaw > 0
              ? totalPriceRaw
              : (unitPrice != null && unitPrice > 0 && quantity > 0 ? unitPrice * quantity : product.totalPrice);

          return {
            ...product,
            unitPrice: unitPrice ?? product.unitPrice,
            totalPrice,
            currency: resolvePricingCurrency(fallbackMatched, product.currency || 'CNY'),
          };
        });

        if (!alive) return;
        setResolvedDocumentData({
          ...feedbackFirstData,
          products: nextProducts,
        });
      } catch (error) {
        console.warn('⚠️ [QuoteRequirementPreviewDialog] failed to enrich QR preview from linked BJ:', error);
      }
    };

    void enrichFromLinkedBJ();
    return () => {
      alive = false;
    };
  }, [rawDocumentData, supplierQuotations, userRole, viewRequirement]);

  const documentData = resolvedDocumentData;

  return (
    <ProcurementDocumentViewerShell
      open={showRequirementDialog}
      onClose={() => setShowRequirementDialog(false)}
      title="报价请求单"
      subtitle={normalizeLegacyQrNumber(documentData?.requirementNo || viewRequirement?.requirementNo || '')}
      templateLabel={templateVersion?.version || '未绑定'}
      icon={<FileText className="h-6 w-6" />}
      actions={(
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (!documentData || !documentRef.current) {
                toast.error('该 QR 未绑定模板中心版本快照，无法导出');
                return;
              }
              try {
                const filename = generatePDFFilename('QR', normalizeLegacyQrNumber(documentData.requirementNo) || 'QR');
                await exportToPDF(documentRef.current, filename);
                toast.success('PDF已生成！');
              } catch (error) {
                console.error('PDF导出失败:', error);
                toast.error('PDF导出失败');
              }
            }}
          >
            <Download className="h-4 w-4" />
            下载PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={async () => {
              if (!documentData || !documentRef.current) {
                toast.error('该 QR 未绑定模板中心版本快照，无法导出');
                return;
              }
              try {
                const filename = generatePDFFilename('QR', normalizeLegacyQrNumber(documentData.requirementNo) || 'QR');
                await exportToPDFPrint(documentRef.current, filename);
                toast.success('PDF已生成！');
              } catch (error) {
                console.error('PDF导出失败:', error);
                toast.error('PDF导出失败');
              }
            }}
          >
            <Printer className="h-4 w-4" />
            打印
          </Button>
        </>
      )}
      bodyClassName="flex-1 overflow-auto bg-gray-100 p-6"
      innerClassName="mx-auto flex min-w-[210mm] flex-col items-center gap-4"
    >
        <div ref={documentRef} className="w-full">
          {templateVersion && documentData ? (
            <QuoteRequirementDocumentA4Pages data={documentData} showRelationBanner={false} />
          ) : (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
              该 QR 未绑定模板中心版本快照，无法预览
            </div>
          )}
        </div>
    </ProcurementDocumentViewerShell>
  );
};
