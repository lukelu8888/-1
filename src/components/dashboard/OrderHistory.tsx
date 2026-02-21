import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Eye,
  Copy,
  Download,
  MessageCircle,
  Phone,
  ExternalLink,
  Package,
  Trash2,
  Plus,
  ShoppingCart,
  Pencil
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { useOrders } from '../../contexts/OrderContext';
import { useUser } from '../../contexts/UserContext';

interface OrderHistoryProps {
  orders: any[];
  onCreateOrder: () => void;
  onAddActiveOrder: (order: any) => void;
  onReorder: (order: any) => void;
}

export function OrderHistory({ orders, onCreateOrder, onAddActiveOrder, onReorder }: OrderHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [editableProducts, setEditableProducts] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // 🔥 使用Context获取真实数据
  const { orders: allOrders } = useOrders();
  const { user } = useUser();

  // 🔥 筛选当前用户的已完成订单
  const historicalOrders = allOrders.filter(order => 
    user?.email && 
    order.customerEmail === user.email &&
    (order.status === 'delivered' || order.status === 'completed' || order.status === 'cancelled')
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-green-500 hover:bg-green-600">Delivered</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
      case 'returned':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Returned</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
    }
  };

  const filteredOrders = historicalOrders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateOrderTotals = (products: any[]) => {
    return products.reduce((acc, product) => {
      return {
        totalCBM: acc.totalCBM + (product.cbm * product.qty),
        totalGrossWeight: acc.totalGrossWeight + (product.grossWeight * product.qty),
        totalNetWeight: acc.totalNetWeight + (product.netWeight * product.qty),
      };
    }, { totalCBM: 0, totalGrossWeight: 0, totalNetWeight: 0 });
  };

  // Handle checkbox selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds([orderId]); // Only allow one selection for reorder
    } else {
      setSelectedOrderIds([]);
    }
  };

  // Handle reorder selected orders - send to Create New Order page
  const handleReorderSelected = () => {
    if (selectedOrderIds.length === 0) return;

    // Get selected order
    const selectedOrder = historicalOrders.find(order => 
      order.id === selectedOrderIds[0]
    );

    if (!selectedOrder) return;

    // Generate new order ID with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const newOrderId = `ORD-${dateStr}-${randomNum}`;
    
    // Calculate delivery date (30 days from now)
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];
    
    // Calculate total amount
    const totalAmount = selectedOrder.products.reduce((sum: number, p: any) => 
      sum + (p.qty * p.price), 0
    );
    
    // Create new draft order
    const draftOrder = {
      id: newOrderId,
      date: now.toISOString().split('T')[0],
      deliveryDate: deliveryDateStr,
      products: selectedOrder.products.map((p: any) => ({ ...p })), // Deep copy products
      totalAmount: totalAmount,
      status: 'draft',
      sourceOrderId: selectedOrder.id
    };

    // Clear selection
    setSelectedOrderIds([]);
    
    // Send to Create New Order page
    onReorder(draftOrder);
  };

  // Handle reorder - copy order with editable products
  const handleReorder = () => {
    if (selectedOrderIds.length === 0) return;
    
    const orderToReorder = historicalOrders.find(o => o.id === selectedOrderIds[0]);
    if (orderToReorder) {
      // Copy products with unique IDs for editing
      const copiedProducts = orderToReorder.products.map((product, idx) => ({
        ...product,
        id: `product-${Date.now()}-${idx}`,
      }));
      setEditableProducts(copiedProducts);
      setIsReorderDialogOpen(true);
    }
  };

  // Update product quantity
  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setEditableProducts(products =>
      products.map(p => p.id === productId ? { ...p, qty: Math.max(1, newQty) } : p)
    );
  };

  // Remove product from order
  const handleRemoveProduct = (productId: string) => {
    setEditableProducts(products => products.filter(p => p.id !== productId));
  };

  // Calculate editable order total
  const calculateEditableTotal = () => {
    return editableProducts.reduce((sum, p) => sum + (p.qty * p.price), 0);
  };

  // Submit reorder
  const handleSubmitReorder = () => {
    // Generate new order ID with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const newOrderId = `ORD-${dateStr}-${randomNum}`;
    
    // Calculate delivery date (30 days from now)
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    const deliveryDateStr = deliveryDate.toISOString().split('T')[0];
    
    // Create new order
    const newOrder = {
      id: newOrderId,
      date: now.toISOString().split('T')[0],
      deliveryDate: deliveryDateStr,
      products: editableProducts.map(({ id, ...product }) => product), // Remove temporary id
      totalAmount: calculateEditableTotal(),
      status: 'pending',
      invoice: `INV-${dateStr}-${randomNum}.pdf`,
      packingList: `PL-${dateStr}-${randomNum}.pdf`,
      // Additional fields for Active Orders
      estimatedDelivery: deliveryDateStr,
      progress: 0,
      trackingNumber: '-',
      currentLocation: 'Processing',
      container: 'Pending'
    };
    
    // Add new order to the beginning of the list
    setHistoricalOrders([newOrder, ...historicalOrders]);
    
    // Also add to Active Orders
    onAddActiveOrder(newOrder);
    
    // Close dialog and reset states
    setIsReorderDialogOpen(false);
    setSelectedOrderIds([]);
    setEditableProducts([]);
    
    // Show success message
    alert(`Reorder submitted successfully!\nNew Order ID: ${newOrderId}\nExpected Delivery: ${deliveryDateStr}\n\nThis order is now visible in Active Orders.`);
  };

  // Handle edit order - open edit dialog for pending orders
  const handleEditOrder = (order: any) => {
    const copiedProducts = order.products.map((product: any, idx: number) => ({
      ...product,
      id: `product-${Date.now()}-${idx}`,
    }));
    setEditableProducts(copiedProducts);
    setEditingOrderId(order.id);
    setIsEditDialogOpen(true);
  };

  // Submit edited order
  const handleSubmitEditOrder = () => {
    if (!editingOrderId) return;
    
    // Update the order in the list
    setHistoricalOrders(orders =>
      orders.map(order => {
        if (order.id === editingOrderId) {
          return {
            ...order,
            products: editableProducts.map(({ id, ...product }) => product),
            totalAmount: calculateEditableTotal(),
          };
        }
        return order;
      })
    );
    
    // Close dialog and reset states
    setIsEditDialogOpen(false);
    setEditingOrderId(null);
    setEditableProducts([]);
    
    // Show success message
    alert(`Order ${editingOrderId} updated successfully!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Order History</h1>
        <p className="text-gray-600 mt-1">View and manage your completed orders</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order ID or product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'all' ? 'default' : 'outline'}
                onClick={() => setDateRange('all')}
                className={dateRange === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                All Time
              </Button>
              <Button
                variant={dateRange === '3months' ? 'default' : 'outline'}
                onClick={() => setDateRange('3months')}
                className={dateRange === '3months' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                3 Months
              </Button>
              <Button
                variant={dateRange === '6months' ? 'default' : 'outline'}
                onClick={() => setDateRange('6months')}
                className={dateRange === '6months' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                6 Months
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-3xl text-gray-900">{filteredOrders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-3xl text-gray-900">
                ${filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
              <p className="text-3xl text-gray-900">
                ${Math.round(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0) / filteredOrders.length).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {/* Action Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="text-blue-900">
                  {selectedOrderIds.length} order selected
                </span>
              </div>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReorderSelected}
              >
                <Copy className="h-4 w-4 mr-2" />
                Reorder Selected
              </Button>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-gray-500">Select</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Order #</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Order Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Delivery Date</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Product</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Quantity</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Price</TableHead>
                  <TableHead className="font-bold" style={{ fontSize: '14px' }}>Status</TableHead>
                  <TableHead className="font-bold text-right" style={{ fontSize: '14px' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const firstProduct = order.products[0];
                  const totalQty = order.products.reduce((sum, p) => sum + p.qty, 0);
                  const productSummary = order.products.length > 1 
                    ? `${firstProduct.name} +${order.products.length - 1} more`
                    : firstProduct.name;
                  const isSelected = selectedOrderIds.includes(order.id);
                  
                  return (
                    <TableRow key={order.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {order.id}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{order.date}</TableCell>
                      <TableCell className="text-xs text-gray-700">{order.deliveryDate}</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900 max-w-xs truncate">
                        {productSummary}
                      </TableCell>
                      <TableCell className="text-xs text-gray-700">{totalQty} pcs</TableCell>
                      <TableCell className="text-xs font-medium text-gray-900">${order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              onClick={() => handleEditOrder(order)}
                              title="Edit Order"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={onCreateOrder}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-8 py-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Order Details - {selectedOrder?.id}</DialogTitle>
              <DialogDescription className="sr-only">
                View complete order history details
              </DialogDescription>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={onCreateOrder}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Reorder
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Invoice
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Packing List
                </Button>
              </div>
            </div>
          </div>
          {selectedOrder && (
            <div className="p-8 space-y-6 bg-white">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Order Date</p>
                  <p className="text-gray-900">{selectedOrder.date}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Delivery Date</p>
                  <p className="text-gray-900">{selectedOrder.deliveryDate}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="text-xl text-gray-900">${selectedOrder.totalAmount.toLocaleString()}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {/* Products & Packing Details Table */}
              <div>
                <h4 className="mb-3 text-gray-900">Products & Packing Details</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">CBM/pc</TableHead>
                        <TableHead className="text-right">GW/pc</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.products.map((product: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-gray-900">{product.name}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.qty.toLocaleString()} pcs</TableCell>
                          <TableCell className="text-right text-gray-700">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.cbm.toFixed(3)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.grossWeight.toFixed(2)} kg</TableCell>
                          <TableCell className="text-right text-gray-900">
                            ${(product.qty * product.price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="text-right text-gray-900">
                          TOTAL:
                        </TableCell>
                        <TableCell className="text-right text-red-600 text-lg">
                          ${selectedOrder.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Shipping Totals */}
              <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total CBM</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(selectedOrder.products).totalCBM.toFixed(2)} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gross Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(selectedOrder.products).totalGrossWeight.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Net Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(selectedOrder.products).totalNetWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Reorder - {selectedOrderIds[0]}</DialogTitle>
                <DialogDescription>
                  Edit the quantities of the products you want to reorder.
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleSubmitReorder}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Submit Reorder
                </Button>
              </div>
            </div>
          </div>
          {editableProducts.length > 0 && (
            <div className="p-8 space-y-6 bg-white">
              {/* Products & Packing Details Table */}
              <div>
                <h4 className="mb-3 text-gray-900">Products & Packing Details</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">CBM/pc</TableHead>
                        <TableHead className="text-right">GW/pc</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableProducts.map((product: any, idx: number) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-gray-900">{product.name}</TableCell>
                          <TableCell className="text-right text-gray-700">
                            <Input
                              type="number"
                              min="1"
                              value={product.qty}
                              onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right text-gray-700">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.cbm.toFixed(3)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.grossWeight.toFixed(2)} kg</TableCell>
                          <TableCell className="text-right text-gray-900">
                            ${(product.qty * product.price).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveProduct(product.id)}
                              disabled={editableProducts.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="text-right text-gray-900">
                          TOTAL:
                        </TableCell>
                        <TableCell className="text-right text-red-600 text-lg">
                          ${calculateEditableTotal().toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Shipping Totals */}
              <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total CBM</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalCBM.toFixed(2)} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gross Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalGrossWeight.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Net Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalNetWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 border-b px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Edit Order - {editingOrderId}</DialogTitle>
                <DialogDescription>
                  Edit the quantities of the products in the order.
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleSubmitEditOrder}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
          {editableProducts.length > 0 && (
            <div className="p-8 space-y-6 bg-white">
              {/* Products & Packing Details Table */}
              <div>
                <h4 className="mb-3 text-gray-900">Products & Packing Details</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">CBM/pc</TableHead>
                        <TableHead className="text-right">GW/pc</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editableProducts.map((product: any, idx: number) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-gray-900">{product.name}</TableCell>
                          <TableCell className="text-right text-gray-700">
                            <Input
                              type="number"
                              min="1"
                              value={product.qty}
                              onChange={(e) => handleUpdateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="w-24 text-right"
                            />
                          </TableCell>
                          <TableCell className="text-right text-gray-700">${product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.cbm.toFixed(3)}</TableCell>
                          <TableCell className="text-right text-gray-700">{product.grossWeight.toFixed(2)} kg</TableCell>
                          <TableCell className="text-right text-gray-900">
                            ${(product.qty * product.price).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveProduct(product.id)}
                              disabled={editableProducts.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={5} className="text-right text-gray-900">
                          TOTAL:
                        </TableCell>
                        <TableCell className="text-right text-red-600 text-lg">
                          ${calculateEditableTotal().toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Shipping Totals */}
              <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total CBM</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalCBM.toFixed(2)} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Gross Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalGrossWeight.toFixed(2)} kg
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Net Weight</p>
                  <p className="text-xl text-gray-900">
                    {calculateOrderTotals(editableProducts).totalNetWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}