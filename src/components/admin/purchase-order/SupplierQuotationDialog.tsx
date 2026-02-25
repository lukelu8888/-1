import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import SupplierQuotationDocumentViewer from '../../supplier/SupplierQuotationDocumentViewer';

type SupplierQuotationDialogProps = {
  showSupplierQuotationDialog: boolean;
  setShowSupplierQuotationDialog: React.Dispatch<React.SetStateAction<boolean>>;
  selectedSupplierQuotation: any;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
};

export const SupplierQuotationDialog: React.FC<SupplierQuotationDialogProps> = ({
  showSupplierQuotationDialog,
  setShowSupplierQuotationDialog,
  selectedSupplierQuotation,
  onAccept,
  onReject,
}) => {
  return (
    <Dialog open={showSupplierQuotationDialog} onOpenChange={setShowSupplierQuotationDialog}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>供应商报价单</DialogTitle>
          <DialogDescription>查看供应商提交的完整报价单文档 | 报价单号: {selectedSupplierQuotation?.quotationNo}</DialogDescription>
        </DialogHeader>

        {selectedSupplierQuotation && (
          <div className="space-y-4">
            <SupplierQuotationDocumentViewer quotation={selectedSupplierQuotation} onEdit={undefined} onSubmit={undefined} />

            {selectedSupplierQuotation.status === 'submitted' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onAccept}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  接受报价
                </Button>

                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onReject}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  拒绝报价
                </Button>
              </div>
            )}

            {selectedSupplierQuotation.status === 'accepted' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">✅ 此报价已被接受 | {selectedSupplierQuotation.submittedDate || ''}</p>
              </div>
            )}

            {selectedSupplierQuotation.status === 'rejected' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">❌ 此报价已被拒绝 | {selectedSupplierQuotation.submittedDate || ''}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
