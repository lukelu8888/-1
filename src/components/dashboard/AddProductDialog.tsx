import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Search, History, Package, Edit2, Plus, Info, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItems: any[];
  setOrderItems: (items: any[]) => void;
  selectedProduct: any;
  setSelectedProduct: (product: any) => void;
  newOrderId: string;
  saveDraftOrder: () => void;
  productCatalog: any[];
  onNavigateToShop?: () => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  orderItems,
  setOrderItems,
  selectedProduct,
  setSelectedProduct,
  newOrderId,
  saveDraftOrder,
  productCatalog,
  onNavigateToShop
}: AddProductDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [manualProduct, setManualProduct] = useState({
    itemNumber: '', // SKU number
    name: '',
    price: '',
    qty: '',
    cbm: '',
    grossWeight: '',
    netWeight: '',
    pcsPerCarton: '',
    cartonSize: '',
    moq: ''
  });

  const addProductToOrder = (product: any) => {
    const newProduct = {
      ...product,
      id: product.id || `product-${Date.now()}`,
      // Use product's itemNumber (SKU) if available, otherwise use product id
      itemNumber: product.itemNumber || product.id || `SKU-${Date.now()}`
    };

    const updatedItems = [...orderItems, newProduct];
    setOrderItems(updatedItems);

    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, orderItems: updatedItems });
    }

    saveDraftOrder();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Item to Order</DialogTitle>
          <DialogDescription>
            Choose from order history, product catalog, or manually add a new product
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="history" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              From Order History
            </TabsTrigger>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              From Shop by Department
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: From Order History */}
          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search order history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {(() => {
              const orderHistory = localStorage.getItem('orderHistory');
              const activeOrders = localStorage.getItem('activeOrders');
              const allOrders = [];
              
              if (orderHistory) {
                try {
                  allOrders.push(...JSON.parse(orderHistory));
                } catch (e) {}
              }
              if (activeOrders) {
                try {
                  allOrders.push(...JSON.parse(activeOrders));
                } catch (e) {}
              }

              // Get all unique products from all historical orders
              const allHistoricalProducts: any[] = [];
              const seenProductIds = new Set();

              allOrders.forEach((order: any) => {
                order.products?.forEach((product: any) => {
                  const productKey = `${product.name}-${product.price}`;
                  if (!seenProductIds.has(productKey)) {
                    seenProductIds.add(productKey);
                    allHistoricalProducts.push({
                      ...product,
                      sourceOrderId: order.id,
                      sourceOrderDate: order.date || order.orderDate
                    });
                  }
                });
              });

              const filteredProducts = allHistoricalProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
              );

              return filteredProducts.length > 0 ? (
                <div className="grid gap-2">
                  {filteredProducts.map((product, idx) => {
                    const alreadyInOrder = orderItems.some(item => 
                      item.name === product.name && item.price === product.price
                    );

                    return (
                      <Card
                        key={`history-${idx}`}
                        className={`cursor-pointer transition-all ${
                          alreadyInOrder ? 'bg-gray-50 opacity-50' : 'hover:shadow-md hover:border-blue-300'
                        }`}
                        onClick={() => {
                          if (alreadyInOrder) {
                            toast.error('Product already in order');
                            return;
                          }

                          const newProduct = {
                            ...product,
                            qty: product.qty || product.moq || 100,
                            id: `product-${Date.now()}`
                          };

                          addProductToOrder(newProduct);
                          toast.success(`${product.name} added from order history`);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  From: {product.sourceOrderId}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-3 text-sm">
                                <div>
                                  <p className="text-gray-500 text-xs">Price</p>
                                  <p className="font-medium">${product.price.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Last Qty</p>
                                  <p className="font-medium">{product.qty || 0} pcs</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">MOQ</p>
                                  <p className="font-medium">{product.moq || 100} pcs</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 text-xs">CBM</p>
                                  <p className="font-medium">{product.cbm.toFixed(3)} m³</p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {alreadyInOrder ? (
                                <Badge className="bg-gray-500">Added</Badge>
                              ) : (
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No products found in order history</p>
                  <p className="text-sm mt-2">Try searching or use the Catalog tab</p>
                </div>
              );
            })()}
          </TabsContent>

          {/* Tab 2: From Catalog */}
          <TabsContent value="catalog" className="flex-1 overflow-y-auto mt-4 space-y-3">
            {/* Navigate to Shop by Department Button */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-6 mb-4">
              <div className="flex items-start gap-4">
                <div className="bg-red-600 rounded-full p-3 flex-shrink-0">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Browse Products by Department</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Explore our complete product catalog organized by categories. Select your region to view products available in your market.
                  </p>
                  <Button 
                    onClick={() => {
                      if (onNavigateToShop) {
                        // Save order editing session to localStorage
                        const orderEditingSession = {
                          orderId: newOrderId,
                          orderDate: orderItems.length > 0 ? new Date().toISOString() : null,
                          isEditing: true,
                          timestamp: Date.now()
                        };
                        localStorage.setItem('orderEditingSession', JSON.stringify(orderEditingSession));
                        console.log('💾 Saved order editing session:', orderEditingSession);
                        
                        // Trigger custom event to notify other components
                        window.dispatchEvent(new Event('orderSessionUpdated'));
                        
                        onOpenChange(false);
                        onNavigateToShop();
                        toast.success('Navigating to Shop by Department');
                      } else {
                        toast.error('Navigation not available');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Go to Shop by Department
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search product catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {productCatalog
              .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((product) => {
                const alreadyInOrder = orderItems.some(item => item.id === product.id);

                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all ${
                      alreadyInOrder ? 'bg-gray-50 opacity-50' : 'hover:shadow-md hover:border-red-300'
                    }`}
                    onClick={() => {
                      if (alreadyInOrder) {
                        toast.error('Product already in order');
                        return;
                      }

                      const newProduct = {
                        ...product,
                        qty: product.moq || 100
                      };

                      addProductToOrder(newProduct);
                      toast.success(`${product.name} added to order`);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 mb-2">{product.name}</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Unit Price</p>
                              <p className="font-medium">${product.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">MOQ</p>
                              <p className="font-medium">{product.moq} pcs</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">CBM</p>
                              <p className="font-medium">{product.cbm.toFixed(3)} m³</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">Carton Size</p>
                              <p className="font-medium">{product.cartonSize}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Pcs/Carton</p>
                              <p className="font-medium">{product.pcsPerCarton}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs">Weight</p>
                              <p className="font-medium">{product.grossWeight.toFixed(1)} kg</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {alreadyInOrder ? (
                            <Badge className="bg-gray-500">Added</Badge>
                          ) : (
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>

          {/* Tab 3: Manual Entry */}
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-sm text-yellow-800">
                  Manually add a product by filling in all required fields below
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="manual-sku">Item # / SKU *</Label>
                  <Input
                    id="manual-sku"
                    placeholder="e.g. LED-PANEL-6060"
                    value={manualProduct.itemNumber}
                    onChange={(e) => setManualProduct({ ...manualProduct, itemNumber: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="manual-name">Product Name *</Label>
                  <Input
                    id="manual-name"
                    placeholder="e.g. LED Panel Light 60x60cm"
                    value={manualProduct.name}
                    onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-price">Unit Price (USD) *</Label>
                  <Input
                    id="manual-price"
                    type="number"
                    step="0.01"
                    placeholder="15.50"
                    value={manualProduct.price}
                    onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-qty">Quantity (pcs) *</Label>
                  <Input
                    id="manual-qty"
                    type="number"
                    placeholder="1000"
                    value={manualProduct.qty}
                    onChange={(e) => setManualProduct({ ...manualProduct, qty: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-cbm">CBM per piece *</Label>
                  <Input
                    id="manual-cbm"
                    type="number"
                    step="0.001"
                    placeholder="0.045"
                    value={manualProduct.cbm}
                    onChange={(e) => setManualProduct({ ...manualProduct, cbm: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-moq">MOQ (pcs) *</Label>
                  <Input
                    id="manual-moq"
                    type="number"
                    placeholder="100"
                    value={manualProduct.moq}
                    onChange={(e) => setManualProduct({ ...manualProduct, moq: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-gw">Gross Weight (kg) *</Label>
                  <Input
                    id="manual-gw"
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={manualProduct.grossWeight}
                    onChange={(e) => setManualProduct({ ...manualProduct, grossWeight: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-nw">Net Weight (kg) *</Label>
                  <Input
                    id="manual-nw"
                    type="number"
                    step="0.1"
                    placeholder="3.2"
                    value={manualProduct.netWeight}
                    onChange={(e) => setManualProduct({ ...manualProduct, netWeight: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-pcs">Pcs/Carton *</Label>
                  <Input
                    id="manual-pcs"
                    type="number"
                    placeholder="4"
                    value={manualProduct.pcsPerCarton}
                    onChange={(e) => setManualProduct({ ...manualProduct, pcsPerCarton: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="manual-carton">Carton Size (cm) *</Label>
                  <Input
                    id="manual-carton"
                    placeholder="62x62x18cm"
                    value={manualProduct.cartonSize}
                    onChange={(e) => setManualProduct({ ...manualProduct, cartonSize: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualProduct({
                      itemNumber: '',
                      name: '',
                      price: '',
                      qty: '',
                      cbm: '',
                      grossWeight: '',
                      netWeight: '',
                      pcsPerCarton: '',
                      cartonSize: '',
                      moq: ''
                    });
                  }}
                  className="flex-1"
                >
                  Clear Form
                </Button>
                <Button
                  onClick={() => {
                    // Validate all required fields
                    if (!manualProduct.itemNumber || !manualProduct.name || !manualProduct.price || !manualProduct.qty ||
                        !manualProduct.cbm || !manualProduct.grossWeight || !manualProduct.netWeight ||
                        !manualProduct.pcsPerCarton || !manualProduct.cartonSize || !manualProduct.moq) {
                      toast.error('Please fill in all required fields');
                      return;
                    }

                    const newProduct = {
                      id: `manual-${Date.now()}`,
                      itemNumber: manualProduct.itemNumber,
                      name: manualProduct.name,
                      price: parseFloat(manualProduct.price),
                      qty: parseInt(manualProduct.qty),
                      cbm: parseFloat(manualProduct.cbm),
                      grossWeight: parseFloat(manualProduct.grossWeight),
                      netWeight: parseFloat(manualProduct.netWeight),
                      pcsPerCarton: parseInt(manualProduct.pcsPerCarton),
                      cartonSize: manualProduct.cartonSize,
                      moq: parseInt(manualProduct.moq)
                    };

                    addProductToOrder(newProduct);
                    setManualProduct({
                      itemNumber: '',
                      name: '',
                      price: '',
                      qty: '',
                      cbm: '',
                      grossWeight: '',
                      netWeight: '',
                      pcsPerCarton: '',
                      cartonSize: '',
                      moq: ''
                    });
                    toast.success(`${newProduct.name} added to order`);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Order
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}