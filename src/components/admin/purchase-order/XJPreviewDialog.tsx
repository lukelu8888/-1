import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { XJDocument, SupplierRFQData } from '../../documents/templates/XJDocument';

type XJPreviewDialogProps = {
  showRFQPreview: boolean;
  setShowRFQPreview: React.Dispatch<React.SetStateAction<boolean>>;
  currentRFQData: SupplierRFQData | null;
  rfqDocRef: React.RefObject<HTMLDivElement>;
  handleExportRFQPDF: (download: boolean) => void;
};

export const XJPreviewDialog: React.FC<XJPreviewDialogProps> = ({
  showRFQPreview,
  setShowRFQPreview,
  currentRFQData,
  rfqDocRef,
  handleExportRFQPDF,
}) => {
  return (
    <Dialog open={showRFQPreview} onOpenChange={setShowRFQPreview}>
      <DialogContent className="max-w-[95vw] h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📋 采购询价单预览 - {currentRFQData?.rfqNo}
          </DialogTitle>
          <DialogDescription style={{ fontSize: '12px' }}>
            Procurement Inquiry Preview - 可直接发送给供应商的询价单文档
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          {currentRFQData && <XJDocument ref={rfqDocRef} data={currentRFQData} />}
        </div>

        <div className="border-t bg-white px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">💡 此询价单可发送给供应商进行报价</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRFQPreview(false)} className="text-xs">
              关闭
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportRFQPDF(false)} className="text-xs flex items-center gap-1">
              <Printer className="w-3 h-3" />
              打印
            </Button>
            <Button size="sm" onClick={() => handleExportRFQPDF(true)} className="bg-[#F96302] hover:bg-[#E05502] text-xs flex items-center gap-1">
              <Download className="w-3 h-3" />
              下载PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
