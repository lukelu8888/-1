import React from 'react';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { generatePDFFilename, exportToPDFPrint } from '../../../utils/pdfExport';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { QuoteRequirementDocumentA4Pages } from '../../documents/templates/paginated/QuoteRequirementDocumentA4';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../ui/dialog';
import { sanitizeQuoteRequirementDocumentForSales } from '../../../utils/purchaserFeedbackSanitizer';

type QuoteRequirementPreviewDialogProps = {
  showRequirementDialog: boolean;
  setShowRequirementDialog: React.Dispatch<React.SetStateAction<boolean>>;
  viewRequirement: QuoteRequirement | null;
  userRole?: string;
};

export const QuoteRequirementPreviewDialog: React.FC<QuoteRequirementPreviewDialogProps> = ({
  showRequirementDialog,
  setShowRequirementDialog,
  viewRequirement,
  userRole,
}) => {
  const templateSnapshot = viewRequirement?.templateSnapshot || viewRequirement?.template_snapshot || null;
  const templateVersion = templateSnapshot?.version || null;
  const rawDocumentData = viewRequirement?.documentDataSnapshot || viewRequirement?.document_data_snapshot || null;
  const documentData = sanitizeQuoteRequirementDocumentForSales(
    rawDocumentData,
    viewRequirement?.purchaserFeedback,
    userRole,
  );

  return (
    <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
      <DialogContent
        className="w-[calc(210mm+56px)] max-w-[calc(100vw-2rem)] max-h-[95vh] overflow-hidden border-none bg-[#525659] p-0 gap-0 shadow-2xl [&>button]:hidden"
      >
        <DialogTitle className="sr-only">报价请求单详情</DialogTitle>
        <DialogDescription className="sr-only">查看完整的报价请求单信息和产品详情</DialogDescription>

        <div className="absolute top-4 right-16 z-50 flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
            onClick={async () => {
              if (!templateVersion || !documentData) {
                toast.error('该 QR 未绑定模板中心版本快照，无法导出');
                return;
              }
              try {
                const filename = generatePDFFilename('QR', documentData.requirementNo);
                const el = document.getElementById('qr-document-view') as HTMLDivElement | null;
                if (!el) {
                  toast.error('未找到可导出的文档区域');
                  return;
                }
                await exportToPDFPrint(el, filename);
                toast.success('PDF已生成！');
              } catch (error) {
                console.error('PDF导出失败:', error);
                toast.error('PDF导出失败');
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            导出PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="w-4 h-4 mr-2" />
            打印
          </Button>
        </div>

        <button
          onClick={() => setShowRequirementDialog(false)}
          className="absolute right-4 top-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors print:hidden"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div
          id="qr-document-view"
          className="overflow-y-auto overflow-x-auto max-h-[95vh] bg-[#525659] px-3 py-4"
        >
          {templateVersion && documentData ? (
            <div className="mx-auto flex min-w-[210mm] flex-col items-center gap-4">
              <QuoteRequirementDocumentA4Pages data={documentData} />
            </div>
          ) : (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
              该 QR 未绑定模板中心版本快照，无法预览
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
