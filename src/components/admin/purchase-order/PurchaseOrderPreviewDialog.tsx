import React from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../../utils/pdfExport';
import { PurchaseOrderDocument, PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';

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
  return (
    <Dialog open={showPOPreview} onOpenChange={setShowPOPreview}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle style={{ fontSize: '15px' }}>📋 采购订单预览 - {currentPOData?.poNo}</DialogTitle>
          <DialogDescription style={{ fontSize: '12px' }}>Purchase Order Preview - 引用文档中心统一模板</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {currentPOData && (
            <div className="print-contract-content">
              <PurchaseOrderDocument ref={poPDFRef} data={currentPOData} />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white">
          <Button variant="outline" onClick={() => setShowPOPreview(false)} className="text-xs">
            关闭预览
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!poPDFRef.current || !currentPOData) return;
              const filename = generatePDFFilename('Purchase_Order', currentPOData.poNo);
              await exportToPDFPrint(poPDFRef.current, filename);
            }}
            className="text-xs"
            disabled={exportingPDF}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            打印/另存为PDF
          </Button>
          <Button
            onClick={async () => {
              if (!poPDFRef.current || !currentPOData) return;
              setExportingPDF(true);
              try {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const filename = generatePDFFilename('Purchase_Order', currentPOData.poNo);
                await exportToPDF(poPDFRef.current, filename);
                toast.success('采购订单PDF导出成功！');
              } catch (error) {
                toast.error('PDF导出失败，请重试');
                console.error('PDF export error:', error);
              } finally {
                setExportingPDF(false);
              }
            }}
            className="bg-[#F96302] hover:bg-[#E05502] text-xs"
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                导出PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
