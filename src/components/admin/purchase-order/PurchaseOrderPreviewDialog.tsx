import React from 'react';
import { Download, Printer, RefreshCw, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../../utils/pdfExport';
import type { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { PurchaseOrderDocumentA4Pages } from '../../documents/templates/paginated/PurchaseOrderDocumentA4';
import { Button } from '../../ui/button';
import { ProcurementDocumentViewerShell } from './ProcurementDocumentViewerShell';
import { getStoredAdminOrgProfile, getStoredAdminUserProfile } from '../../../contexts/AdminOrganizationContext';
import { inferSupplierDocumentLanguage } from '../../../utils/documentDataAdapters';

type PurchaseOrderPreviewDialogProps = {
  showPOPreview: boolean;
  setShowPOPreview: React.Dispatch<React.SetStateAction<boolean>>;
  currentPOData: PurchaseOrderData | null;
  poPDFRef: React.RefObject<HTMLDivElement>;
  exportingPDF: boolean;
  setExportingPDF: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PurchaseOrderPreviewDialog: React.FC<PurchaseOrderPreviewDialogProps> = ({
  showPOPreview,
  setShowPOPreview,
  currentPOData,
  poPDFRef,
  exportingPDF,
  setExportingPDF,
}) => {
  if (!showPOPreview || !currentPOData) return null;

  const adminOrg = getStoredAdminOrgProfile();
  const adminUser = getStoredAdminUserProfile();
  const procurementLanguage = inferSupplierDocumentLanguage({
    supplierName: currentPOData.supplier.companyName,
    supplierAddress: currentPOData.supplier.address,
  });
  const useChineseBuyerProfile = procurementLanguage === 'zh';
  const currentContactPerson = String(currentPOData.buyer.contactPerson || '').trim();
  const shouldOverrideContactPerson = !currentContactPerson || ['管理员', '系统管理员', 'admin', 'administrator'].includes(currentContactPerson.toLowerCase());
  const normalizedPOData: PurchaseOrderData = {
    ...currentPOData,
    buyer: {
      ...currentPOData.buyer,
      name: useChineseBuyerProfile
        ? (adminOrg.nameCN || adminOrg.nameEN || currentPOData.buyer.name)
        : (adminOrg.nameEN || adminOrg.nameCN || currentPOData.buyer.name),
      nameEn: adminOrg.nameEN || adminOrg.nameCN || currentPOData.buyer.nameEn,
      address: useChineseBuyerProfile
        ? (adminOrg.addressCN || adminOrg.addressEN || currentPOData.buyer.address)
        : (adminOrg.addressEN || adminOrg.addressCN || currentPOData.buyer.address),
      addressEn: adminOrg.addressEN || adminOrg.addressCN || currentPOData.buyer.addressEn,
      tel: currentPOData.buyer.tel || adminOrg.phone,
      email: currentPOData.buyer.email || adminOrg.email || adminUser.email,
      contactPerson: shouldOverrideContactPerson
        ? (adminOrg.contactPerson || adminOrg.documentDefaults.defaultSignatory || adminUser.name || currentPOData.buyer.contactPerson)
        : currentPOData.buyer.contactPerson,
    },
  };

  const templateVersionLabel = normalizedPOData.templateSettings?.productTableColumns?.length
    ? '统一采购合同模板'
    : '默认采购合同模板';

  return (
    <ProcurementDocumentViewerShell
      open={showPOPreview}
      onClose={() => setShowPOPreview(false)}
      title="采购订单"
      subtitle={normalizedPOData.poNo}
      templateLabel={templateVersionLabel}
      icon={<ShoppingCart className="h-6 w-6" />}
      actions={(
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!poPDFRef.current) return;
              setExportingPDF(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const filename = generatePDFFilename('Purchase_Order', normalizedPOData.poNo);
                await exportToPDF(poPDFRef.current, filename);
                toast.success('采购订单PDF导出成功！');
              } catch (error) {
                toast.error('PDF导出失败，请重试');
                console.error('PDF export error:', error);
              } finally {
                setExportingPDF(false);
              }
            }}
            className="gap-2"
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                下载PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!poPDFRef.current) return;
              const filename = generatePDFFilename('Purchase_Order', normalizedPOData.poNo);
              await exportToPDFPrint(poPDFRef.current, filename);
            }}
            className="gap-2"
            disabled={exportingPDF}
          >
            <Printer className="h-4 w-4" />
            打印
          </Button>
        </>
      )}
    >
      <div ref={poPDFRef}>
        <PurchaseOrderDocumentA4Pages data={normalizedPOData} />
      </div>
    </ProcurementDocumentViewerShell>
  );
};
