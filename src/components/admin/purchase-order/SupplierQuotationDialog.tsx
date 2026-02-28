import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
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
  if (!selectedSupplierQuotation) return null;

  const isSubmitted = selectedSupplierQuotation.status === 'submitted';

  const actions = isSubmitted ? (
    <>
      <Button
        size="sm"
        className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
        onClick={onAccept}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">接受报价</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 border-red-200"
        onClick={onReject}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">拒绝报价</span>
      </Button>
    </>
  ) : undefined;

  return (
    <SupplierQuotationDocumentViewer
      open={showSupplierQuotationDialog}
      onClose={() => setShowSupplierQuotationDialog(false)}
      quotation={selectedSupplierQuotation}
      onEdit={undefined}
      onSubmit={undefined}
      extraActions={actions}
    />
  );
};
