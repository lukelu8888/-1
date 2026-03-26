import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { XJData } from '../documents/templates/XJDocument';
import { XJDocumentA4Pages } from '../documents/templates/paginated/XJDocumentA4';
import { buildXJDocumentSnapshot } from '../admin/purchase-order/purchaseOrderUtils';
import { templateCenterService } from '../../lib/supabaseService';

interface XJDocumentViewerProps {
  xj: any; // 采购询价对象，包含documentData字段
}

export default function XJDocumentViewer({ xj }: XJDocumentViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [latestPublishedVersion, setLatestPublishedVersion] = useState<string | null>(null);

  // 🔥 打印/导出PDF功能
  const handlePrint = () => {
    if (!documentRef.current) {
      toast.error('文档未加载完成，请稍后重试');
      return;
    }

    // 使用浏览器原生打印API
    window.print();
    
    toast.success('文档已准备就绪', {
      description: '请在打印对话框中选择"另存为PDF"进行保存',
      duration: 3000
    });
  };

  // 检查是否有文档数据
  const templateSnapshot = xj.templateSnapshot || xj.template_snapshot || null;
  const templateVersion =
    templateSnapshot?.version ||
    xj.templateVersion ||
    xj.template_version ||
    null;
  const rawSnapshotData = (xj.documentDataSnapshot || xj.document_data_snapshot || null) as XJData | null;
  const fallbackDocumentData = useMemo(() => buildXJDocumentSnapshot(xj) as XJData | null, [xj]);
  const documentData = useMemo(() => {
    if (!rawSnapshotData) {
      return fallbackDocumentData;
    }

    const fallbackProducts = Array.isArray(fallbackDocumentData?.products) ? fallbackDocumentData.products : [];
    const snapshotProducts = Array.isArray(rawSnapshotData.products) ? rawSnapshotData.products : [];
    const mergedProducts = (snapshotProducts.length > 0 ? snapshotProducts : fallbackProducts).map((product, index) => {
      const fallbackProduct = fallbackProducts[index] || ({} as XJData['products'][number]);
      const resolvedDescription = String(product?.description || fallbackProduct.description || '').trim();
      const resolvedSpecification = String(product?.specification || fallbackProduct.specification || '').trim();
      const resolvedModelNo = String(product?.modelNo || fallbackProduct.modelNo || '').trim();
      const resolvedItemCode = String(product?.itemCode || fallbackProduct.itemCode || '').trim();

      return {
        ...fallbackProduct,
        ...product,
        no: Number(product?.no || fallbackProduct.no || index + 1),
        modelNo: resolvedModelNo || fallbackProduct.modelNo || undefined,
        itemCode: resolvedItemCode || fallbackProduct.itemCode || undefined,
        imageUrl: product?.imageUrl || fallbackProduct.imageUrl || undefined,
        description: resolvedDescription || fallbackProduct.description || '-',
        specification: resolvedSpecification || fallbackProduct.specification || '-',
        quantity: Number(product?.quantity ?? fallbackProduct.quantity ?? 0),
        unit: String(product?.unit || fallbackProduct.unit || 'PCS'),
      };
    });

    return {
      ...fallbackDocumentData,
      ...rawSnapshotData,
      buyer: {
        ...(fallbackDocumentData?.buyer || {}),
        ...(rawSnapshotData.buyer || {}),
      },
      supplier: {
        ...(fallbackDocumentData?.supplier || {}),
        ...(rawSnapshotData.supplier || {}),
      },
      terms: {
        ...(fallbackDocumentData?.terms || {}),
        ...(rawSnapshotData.terms || {}),
      },
      products: mergedProducts,
      inquiryDescription:
        rawSnapshotData.inquiryDescription ||
        fallbackDocumentData?.inquiryDescription ||
        '',
      conditionGroups:
        Array.isArray(rawSnapshotData.conditionGroups) && rawSnapshotData.conditionGroups.length > 0
          ? rawSnapshotData.conditionGroups
          : (fallbackDocumentData?.conditionGroups || []),
    } as XJData;
  }, [fallbackDocumentData, rawSnapshotData]);
  const boundVersion =
    String(
      templateVersion?.version ||
      templateVersion?.version_label ||
      templateVersion?.versionLabel ||
      xj.templateVersion ||
      xj.template_version ||
      '',
    ).trim() || null;
  const isBoundToLatestPublished = Boolean(boundVersion && latestPublishedVersion && boundVersion === latestPublishedVersion);

  useEffect(() => {
    let active = true;
    templateCenterService
      .getVersionHistory('xj')
      .then((history: any[]) => {
        if (!active) return;
        const latest = history.find((record) => record.status === 'published') || history[0] || null;
        setLatestPublishedVersion(latest?.version || null);
      })
      .catch(() => {
        if (active) setLatestPublishedVersion(null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!documentData || !Array.isArray(documentData.products) || documentData.products.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FileText className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h3 className="font-semibold text-red-900 mb-2">XJ 文档数据缺失</h3>
        <p className="text-sm text-red-700">
          此采购询价单缺少可渲染的产品文档数据，无法预览。
          <br />
          请重新生成该 XJ 后再试。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-900">模板版本</span>
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
              {boundVersion || '未绑定'}
            </span>
            {latestPublishedVersion ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                  isBoundToLatestPublished
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {isBoundToLatestPublished ? '已映射最新发布版' : `当前最新发布：${latestPublishedVersion}`}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-gray-500">
            编号: {documentData.xjNo} | 日期: {documentData.xjDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              handlePrint();
            }}
          >
            <Printer className="w-4 h-4" />
            打印
          </Button>
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-orange-600 hover:bg-orange-700"
            onClick={() => {
              handlePrint();
            }}
          >
            <Download className="w-4 h-4" />
            导出PDF
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <div ref={documentRef} className="max-h-[70vh] overflow-y-auto bg-[#525659] p-6">
          <div className="flex flex-col items-center gap-6">
            <XJDocumentA4Pages data={documentData} />
          </div>
        </div>
      </div>
    </div>
  );
}
