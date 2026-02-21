import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pencil, Trash2, Check, X, Package } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner@2.0.3';
import { productDetailsData } from '../../data/productDetailsData';

interface ResizableProformaTableProps {
  orderItems: any[];
  selectedProduct: any;
  setSelectedProduct: (product: any) => void;
  updateQuantity: (index: number, qty: number) => void;
  removeProduct: (index: number) => void;
  saveDraftOrder: () => void;
  totals: {
    totalAmount: number;
    totalNetWeight: number;
    totalGrossWeight: number;
  };
}

export function ResizableProformaTable({
  orderItems,
  selectedProduct,
  setSelectedProduct,
  updateQuantity,
  removeProduct,
  saveDraftOrder,
  totals
}: ResizableProformaTableProps) {
  // Column widths state
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    no: 64,
    itemNumber: 140,
    image: 80,
    name: 180,
    quantity: 100,
    unit: 60,
    unitPrice: 120,
    amount: 140,
    netWeight: 100,
    grossWeight: 100,
    actions: 80
  });

  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Handle mouse down on resizer
  const handleMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey]);
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const diff = e.clientX - startX;
      const newWidth = Math.max(40, startWidth + diff); // Minimum width of 40px

      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }));
    };

    const handleMouseUp = () => {
      if (resizing) {
        // Save to localStorage
        localStorage.setItem('proformaTableColumnWidths', JSON.stringify(columnWidths));
      }
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, startX, startWidth, columnWidths]);

  // Load column widths from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('proformaTableColumnWidths');
    if (saved) {
      try {
        setColumnWidths(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load column widths:', error);
      }
    }
  }, []);

  // Resizer component
  const Resizer = ({ columnKey }: { columnKey: string }) => (
    <div
      onMouseDown={(e) => handleMouseDown(columnKey, e)}
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-white/40 hover:bg-red-400 transition-colors group"
      style={{ userSelect: 'none' }}
    />
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white" data-version="v2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-900 hover:bg-gray-900">
              <TableHead 
                className="text-white text-center relative" 
                style={{ width: `${columnWidths.no}px`, minWidth: `${columnWidths.no}px` }}
              >
                No.
                <Resizer columnKey="no" />
              </TableHead>
              <TableHead 
                className="text-white text-center relative" 
                style={{ width: `${columnWidths.itemNumber}px`, minWidth: `${columnWidths.itemNumber}px` }}
              >
                Item #
                <Resizer columnKey="itemNumber" />
              </TableHead>
              <TableHead 
                className="text-white text-center relative" 
                style={{ width: `${columnWidths.image}px`, minWidth: `${columnWidths.image}px` }}
              >
                Item Image
                <Resizer columnKey="image" />
              </TableHead>
              <TableHead 
                className="text-white text-center relative" 
                style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}
              >
                Item Name
                <Resizer columnKey="name" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-1 relative" 
                style={{ width: `${columnWidths.quantity}px`, minWidth: `${columnWidths.quantity}px` }}
              >
                Quantity
                <Resizer columnKey="quantity" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-1 relative" 
                style={{ width: `${columnWidths.unit}px`, minWidth: `${columnWidths.unit}px` }}
              >
                Unit
                <Resizer columnKey="unit" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-1 relative" 
                style={{ width: `${columnWidths.unitPrice}px`, minWidth: `${columnWidths.unitPrice}px` }}
              >
                Unit Price (USD)
                <Resizer columnKey="unitPrice" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-2 relative" 
                style={{ width: `${columnWidths.amount}px`, minWidth: `${columnWidths.amount}px` }}
              >
                Amount (USD)
                <Resizer columnKey="amount" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-2 relative" 
                style={{ width: `${columnWidths.netWeight}px`, minWidth: `${columnWidths.netWeight}px` }}
              >
                N.W (kg)
                <Resizer columnKey="netWeight" />
              </TableHead>
              <TableHead 
                className="text-white text-center px-2 relative" 
                style={{ width: `${columnWidths.grossWeight}px`, minWidth: `${columnWidths.grossWeight}px` }}
              >
                G.W (kg)
                <Resizer columnKey="grossWeight" />
              </TableHead>
              <TableHead 
                className="text-white text-center relative" 
                style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
              >
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderItems.map((item: any, index: number) => {
              const totalQty = item.qty;
              const totalNW = (totalQty * (item.netWeight || 0)).toFixed(2);
              const totalGW = (totalQty * (item.grossWeight || 0)).toFixed(2);
              
              // 🔍 Dynamic SKU lookup from productDetailsData
              let itemSKU = item.itemNumber || item.id || `SKU-${index + 1}`;
              let itemImage = item.image;
              
              // Try to find real SKU and image from productDetailsData
              for (const [key, data] of Object.entries(productDetailsData)) {
                if (key === item.id || key === item.name || data.name === item.name) {
                  itemSKU = data.sku;  // ✅ Use real SKU field from productData
                  itemImage = itemImage || data.image;  // Use real image if missing
                  break;
                }
              }
              
              return (
                <TableRow key={index} className="border-b">
                  <TableCell 
                    className="font-medium text-gray-900" 
                    style={{ width: `${columnWidths.no}px`, minWidth: `${columnWidths.no}px` }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell 
                    className="font-mono text-sm text-gray-600" 
                    style={{ width: `${columnWidths.itemNumber}px`, minWidth: `${columnWidths.itemNumber}px` }}
                  >
                    {itemSKU}
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.image}px`, minWidth: `${columnWidths.image}px` }}>
                    <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center overflow-hidden">
                      {itemImage ? (
                        <ImageWithFallback
                          src={itemImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell style={{ width: `${columnWidths.name}px`, minWidth: `${columnWidths.name}px` }}>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                  </TableCell>
                  <TableCell 
                    className="text-right px-2" 
                    style={{ width: `${columnWidths.quantity}px`, minWidth: `${columnWidths.quantity}px` }}
                  >
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || (item.moq || 1);
                        updateQuantity(index, newQty);
                        const updatedItems = [...orderItems];
                        updatedItems[index].qty = newQty;
                        setSelectedProduct({ ...selectedProduct, orderItems: updatedItems });
                        saveDraftOrder();
                      }}
                      min={item.moq || 1}
                      className="w-20 h-9 text-right px-2"
                    />
                  </TableCell>
                  <TableCell 
                    className="text-center px-2" 
                    style={{ width: `${columnWidths.unit}px`, minWidth: `${columnWidths.unit}px` }}
                  >
                    <p className="text-sm text-gray-500">pcs</p>
                  </TableCell>
                  <TableCell 
                    className="text-right px-2 font-medium text-gray-900" 
                    style={{ width: `${columnWidths.unitPrice}px`, minWidth: `${columnWidths.unitPrice}px` }}
                  >
                    ${item.price.toFixed(2)}
                  </TableCell>
                  <TableCell 
                    className="text-right px-2 font-semibold text-gray-900" 
                    style={{ width: `${columnWidths.amount}px`, minWidth: `${columnWidths.amount}px` }}
                  >
                    ${(item.qty * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell 
                    className="text-right px-2 text-gray-700" 
                    style={{ width: `${columnWidths.netWeight}px`, minWidth: `${columnWidths.netWeight}px` }}
                  >
                    {totalNW} kg
                  </TableCell>
                  <TableCell 
                    className="text-right px-2 text-gray-700" 
                    style={{ width: `${columnWidths.grossWeight}px`, minWidth: `${columnWidths.grossWeight}px` }}
                  >
                    {totalGW} kg
                  </TableCell>
                  <TableCell 
                    className="text-center" 
                    style={{ width: `${columnWidths.actions}px`, minWidth: `${columnWidths.actions}px` }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Remove ${item.name} from order?`)) {
                          removeProduct(index);
                          const updatedItems = orderItems.filter((_: any, i: number) => i !== index);
                          if (updatedItems.length > 0) {
                            setSelectedProduct({ ...selectedProduct, orderItems: updatedItems });
                          }
                          saveDraftOrder();
                          toast.success('Product removed');
                        }
                      }}
                      title="Remove product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Subtotal Row */}
            <TableRow className="bg-gray-50 border-t-2 border-gray-300">
              <TableCell colSpan={8} className="text-right font-semibold text-gray-900">
                SUBTOTAL
              </TableCell>
              <TableCell 
                className="text-right px-2 font-bold text-gray-900" 
                style={{ width: `${columnWidths.amount}px`, minWidth: `${columnWidths.amount}px` }}
              >
                ${totals.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell 
                className="text-right px-2 text-gray-700" 
                style={{ width: `${columnWidths.netWeight}px`, minWidth: `${columnWidths.netWeight}px` }}
              >
                {totals.totalNetWeight.toFixed(1)} kg
              </TableCell>
              <TableCell 
                className="text-right px-2 text-gray-700" 
                style={{ width: `${columnWidths.grossWeight}px`, minWidth: `${columnWidths.grossWeight}px` }}
              >
                {totals.totalGrossWeight.toFixed(1)} kg
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}