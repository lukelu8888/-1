import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Button } from '../../ui/button';
import { XJDocument, XJData } from '../../documents/templates/XJDocument';
import type { ProjectExecutionBaseline } from './purchaseOrderUtils';
import { ProcurementDocumentViewerShell } from './ProcurementDocumentViewerShell';

type XJPreviewDialogProps = {
  showXJPreview: boolean;
  setShowXJPreview: React.Dispatch<React.SetStateAction<boolean>>;
  currentXJData: XJData | null;
  projectExecutionBaseline?: ProjectExecutionBaseline | null;
  xjDocRef: React.RefObject<HTMLDivElement>;
  handleExportXJPDF: (download: boolean) => void;
};

export const XJPreviewDialog: React.FC<XJPreviewDialogProps> = ({
  showXJPreview,
  setShowXJPreview,
  currentXJData,
  projectExecutionBaseline,
  xjDocRef,
  handleExportXJPDF,
}) => {
  const templateLabel = currentXJData?.projectInfo?.templateVersion || '统一采购询价模板';

  return (
    <ProcurementDocumentViewerShell
      open={showXJPreview}
      onClose={() => setShowXJPreview(false)}
      title="采购询价单"
      subtitle={currentXJData?.xjNo}
      templateLabel={templateLabel}
      icon={<FileText className="h-6 w-6" />}
      actions={(
        <>
          <Button variant="outline" size="sm" onClick={() => handleExportXJPDF(true)} className="gap-2 text-xs">
            <Download className="h-4 w-4" />
            下载PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportXJPDF(false)} className="gap-2 text-xs">
            <Printer className="h-4 w-4" />
            打印
          </Button>
        </>
      )}
    >
      {currentXJData ? <XJDocument ref={xjDocRef} data={currentXJData} /> : null}
    </ProcurementDocumentViewerShell>
  );
};
