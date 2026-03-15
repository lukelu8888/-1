import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface PendingCartItem {
  color?: string;
  quantity?: number;
  pcsPerCarton?: number;
  suggestedLower?: number;
  suggestedHigher?: number;
}

interface QuantityAlertDialogProps {
  open: boolean;
  pendingCartItem: PendingCartItem | null;
  selectedSuggestedQuantity: number | null;
  onOpenChange: (open: boolean) => void;
  onSelectSuggestedQuantity: (qty: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function QuantityAlertDialog({
  open,
  pendingCartItem,
  selectedSuggestedQuantity,
  onOpenChange,
  onSelectSuggestedQuantity,
  onConfirm,
  onCancel,
}: QuantityAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Quantity Not in Full Cartons</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCartItem?.color ? (
              <>
                The quantity you entered for <strong>{pendingCartItem.color}</strong> ({pendingCartItem?.quantity} pcs) is not a multiple of the carton size ({pendingCartItem?.pcsPerCarton} pcs/carton).
              </>
            ) : (
              <>
                The quantity you entered ({pendingCartItem?.quantity} pcs) is not a multiple of the carton size ({pendingCartItem?.pcsPerCarton} pcs/carton).
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-900 mb-3">💡 Suggested Quantities:</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                const newQuantity = pendingCartItem?.suggestedLower || 1;
                onSelectSuggestedQuantity(newQuantity);
              }}
              className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                selectedSuggestedQuantity === pendingCartItem?.suggestedLower
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'
                  : 'bg-white border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900">
                  <strong>{pendingCartItem?.suggestedLower}</strong> pcs
                </span>
                <span className="text-gray-600 text-sm">
                  = {Math.floor((pendingCartItem?.quantity || 0) / (pendingCartItem?.pcsPerCarton || 1))} carton(s)
                </span>
              </div>
            </button>
            <button
              onClick={() => {
                const newQuantity = pendingCartItem?.suggestedHigher || 1;
                onSelectSuggestedQuantity(newQuantity);
              }}
              className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
                selectedSuggestedQuantity === pendingCartItem?.suggestedHigher
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500'
                  : 'bg-white border-yellow-300 hover:bg-yellow-100'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900">
                  <strong>{pendingCartItem?.suggestedHigher}</strong> pcs
                </span>
                <span className="text-gray-600 text-sm">
                  = {Math.ceil((pendingCartItem?.quantity || 0) / (pendingCartItem?.pcsPerCarton || 1))} carton(s)
                </span>
              </div>
            </button>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={selectedSuggestedQuantity === null}
            onClick={onConfirm}
            className={selectedSuggestedQuantity === null ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
