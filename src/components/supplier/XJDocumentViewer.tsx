import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { XJData } from '../documents/templates/XJDocument';
import { XJDocumentA4Pages } from '../documents/templates/paginated/XJDocumentA4';
import { buildXJDocumentSnapshot } from '../admin/purchase-order/purchaseOrderUtils';
import { templateCenterService } from '../../lib/supabaseService';
import { ProcurementDocumentViewerShell } from '../admin/purchase-order/ProcurementDocumentViewerShell';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../contexts/UserContext';
import {
  SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS,
  SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS,
} from './documentPreviewStandards';

interface XJDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  xj: any; // 采购询价对象，包含documentData字段
}

export default function XJDocumentViewer({ open, onClose, xj }: XJDocumentViewerProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [latestPublishedVersion, setLatestPublishedVersion] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { user: authUser } = useUser();

  // 🔥 打印/导出PDF功能
  const handlePrint = async () => {
    if (!documentRef.current) {
      toast.error('文档未加载完成，请稍后重试');
      return;
    }

    const filename = generatePDFFilename('Procurement_Inquiry', xj?.xjNumber ?? xj?.xjNo ?? 'XJ');
    await exportToPDFPrint(documentRef.current, filename);
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
  const viewerContact = useMemo(() => {
    const parseStoredUser = (key: string) => {
      if (typeof window === 'undefined') return null;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    };

    const roleSwitchedUser = parseStoredUser('cosun_current_user');
    const authCachedUser = parseStoredUser('cosun_auth_user');
    const backendUser = parseStoredUser('cosun_backend_user');

    const name = String(
      currentUser?.name ||
      authUser?.name ||
      roleSwitchedUser?.name ||
      backendUser?.displayName ||
      backendUser?.name ||
      authCachedUser?.name ||
      '',
    ).trim();
    const email = String(
      currentUser?.email ||
      authUser?.email ||
      roleSwitchedUser?.email ||
      backendUser?.loginEmail ||
      backendUser?.email ||
      authCachedUser?.email ||
      '',
    ).trim();

    return {
      name: name || documentData?.buyer.contactPerson || '',
      email: email || documentData?.buyer.email || '',
    };
  }, [
    authUser?.email,
    authUser?.name,
    currentUser?.email,
    currentUser?.name,
    documentData?.buyer.contactPerson,
    documentData?.buyer.email,
  ]);
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

  const missingDocumentPage = (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <FileText className="mx-auto mb-3 h-12 w-12 text-red-600" />
      <h3 className="mb-2 font-semibold text-red-900">XJ 文档数据缺失</h3>
      <p className="text-sm text-red-700">
        此采购询价单缺少可渲染的产品文档数据，无法预览。
        <br />
        请重新生成该 XJ 后再试。
      </p>
    </div>
  );

  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={async () => {
          if (!documentRef.current) {
            toast.error('文档未加载完成，请稍后重试');
            return;
          }

          try {
            const filename = generatePDFFilename('Procurement_Inquiry', documentData?.xjNo ?? xj?.xjNumber ?? 'XJ');
            await exportToPDF(documentRef.current, filename);
            toast.success('询价单PDF导出成功！');
          } catch (error) {
            toast.error('导出PDF失败');
            console.error(error);
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
        onClick={() => {
          void handlePrint();
        }}
      >
        <Printer className="h-4 w-4" />
        打印
      </Button>
    </>
  );

  return (
    <ProcurementDocumentViewerShell
      open={open}
      onClose={onClose}
      title="询价单文档"
      subtitle={documentData?.xjNo || xj?.xjNumber || '-'}
      templateLabel={boundVersion || '未绑定'}
      icon={<FileText className="h-6 w-6" />}
      headerBadges={
        latestPublishedVersion ? (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              isBoundToLatestPublished
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}
          >
            {isBoundToLatestPublished ? '已映射最新发布版' : `当前最新发布：${latestPublishedVersion}`}
          </span>
        ) : null
      }
      actions={actions}
      bodyClassName={SUPPLIER_DOCUMENT_PREVIEW_BODY_CLASS}
      innerClassName={SUPPLIER_DOCUMENT_PREVIEW_INNER_CLASS}
    >
      <div ref={documentRef}>
        {documentData && Array.isArray(documentData.products) && documentData.products.length > 0 ? (
          <XJDocumentA4Pages data={documentData} footerContact={viewerContact} />
        ) : (
          missingDocumentPage
        )}
      </div>
    </ProcurementDocumentViewerShell>
  );
}
