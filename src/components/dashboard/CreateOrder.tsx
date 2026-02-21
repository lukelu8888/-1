import React, { useState, useEffect, useRef } from 'react';
import { Plus, History, Trash2, Eye, Copy, CheckCircle2, AlertCircle, Package, Calendar, ShoppingBag, Save, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { AddProductDialog } from './AddProductDialog';
import { ResizableProformaTable } from './ResizableProformaTable';
import { productDetailsData } from '../../data/productDetailsData';
import { copyToClipboard } from '../../utils/clipboard';
import { useUser } from '../../contexts/UserContext';

interface DraftOrder {
  id: string;
  orderDate: string;
  deliveryDate: string;
  sourceOrderId?: string;
  products: any[];
  status: 'draft';
  createdAt: string;
  updatedAt: string;
}

interface CreateOrderProps {
  draftOrder?: any;
  onOrderSubmitted?: (order: any) => void;
  onNavigateToHistory?: () => void;
  onNavigateToShop?: () => void;
}

export function CreateOrder({ draftOrder, onOrderSubmitted, onNavigateToHistory, onNavigateToShop }: CreateOrderProps) {
  const { user } = useUser(); // 🔥 获取当前用户信息
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadHistoryOpen, setIsLoadHistoryOpen] = useState(false);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
  const [manualProduct, setManualProduct] = useState({
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

  // Column widths state for resizable columns
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    no: 64,
    itemNumber: 128,
    image: 80,
    name: 160,
    description: 300,
    quantity: 80,
    unit: 48,
    unitPrice: 96,
    amount: 144,
    netWeight: 96,
    grossWeight: 96,
    actions: 80
  });
  
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Load draft orders from localStorage on mount
  useEffect(() => {
    const loadDrafts = () => {
      const savedDrafts = localStorage.getItem('draftOrders');
      let drafts: DraftOrder[] = [];
      if (savedDrafts) {
        try {
          drafts = JSON.parse(savedDrafts);
          
          // Auto-fix missing images and itemNumbers from productDetailsData
          let hasChanges = false;
          drafts = drafts.map(draft => {
            const updatedProducts = draft.products.map(product => {
              if (!product.image || !product.itemNumber) {
                // Try to find matching product in productDetailsData
                // First try by product.id, then by product.name
                let productKey = null;
                let productData = null;
                
                // Search for matching key in productDetailsData
                for (const [key, data] of Object.entries(productDetailsData)) {
                  if (key === product.id || key === product.name || data.name === product.name) {
                    productKey = key;
                    productData = data;
                    break;
                  }
                }
                
                if (productData && productKey) {
                  hasChanges = true;
                  console.log(`🔧 Auto-fixing product: ${product.name}`, {
                    addedImage: !product.image && productData.image,
                    addedItemNumber: !product.itemNumber && productData.sku,
                    sku: productData.sku
                  });
                  return {
                    ...product,
                    image: product.image || productData.image,
                    itemNumber: product.itemNumber || productData.sku  // ✅ Use real SKU from productData
                  };
                }
              }
              return product;
            });
            
            return {
              ...draft,
              products: updatedProducts
            };
          });
          
          // Save if we made any changes
          if (hasChanges) {
            console.log('✅ Auto-fixed missing product images and SKUs');
            localStorage.setItem('draftOrders', JSON.stringify(drafts));
            toast.success('Product data synchronized', { duration: 2000 });
          }
          
          setDraftOrders(drafts);
          
          // 🔥 Update current order items if viewing a draft
          if (currentDraftId) {
            const currentDraft = drafts.find(d => d.id === currentDraftId);
            if (currentDraft) {
              setOrderItems(currentDraft.products);
              
              // 🔥 If dialog is open, also update selectedProduct
              if (selectedProduct) {
                setSelectedProduct({ 
                  ...selectedProduct, 
                  orderItems: currentDraft.products 
                });
                console.log('🔄 Updated dialog data:', { 
                  orderId: currentDraftId, 
                  productsCount: currentDraft.products.length 
                });
              }
              
              console.log('🔄 Refreshed order items for:', currentDraftId);
            }
          }
        } catch (error) {
          console.error('Failed to load draft orders:', error);
        }
      }

      // Restore view state AFTER drafts are loaded - ONLY ON INITIAL MOUNT
      const savedViewState = localStorage.getItem('createOrderViewState');
      if (savedViewState && drafts.length > 0 && !currentDraftId) {
        try {
          const viewState = JSON.parse(savedViewState);
          if (viewState.currentDraftId) {
            // Load the draft order
            const draft = drafts.find(d => d.id === viewState.currentDraftId);
            if (draft) {
              setCurrentDraftId(draft.id);
              setNewOrderId(draft.id);
              setOrderDate(draft.orderDate);
              setDeliveryDate(draft.deliveryDate);
              setOrderItems(draft.products);
              
              // Restore dialog state if it was open
              if (viewState.isProductDetailOpen && draft.products.length > 0) {
                setSelectedProduct({ orderItems: draft.products, itemNumber: draft.id });
                setIsProductDetailOpen(true);
                console.log('✅ Restored view state: Dialog opened for order', draft.id);
              }
            }
          }
        } catch (error) {
          console.error('Failed to restore view state:', error);
        }
      }
    };

    // Load on mount
    loadDrafts();

    // 🔥 Listen for draft order updates from ProductDetailPage
    const handleDraftUpdate = () => {
      console.log('🔔 Draft order updated - reloading data');
      loadDrafts();
    };

    window.addEventListener('draftOrderUpdated', handleDraftUpdate);
    window.addEventListener('storage', handleDraftUpdate);

    return () => {
      window.removeEventListener('draftOrderUpdated', handleDraftUpdate);
      window.removeEventListener('storage', handleDraftUpdate);
    };
  }, []); // ✅ Remove all dependencies - only run on mount

  // Load draft order when provided (from Order History reorder)
  useEffect(() => {
    if (draftOrder && draftOrder.products) {
      const orderId = draftOrder.id || generateOrderId();
      const newDraft: DraftOrder = {
        id: orderId,
        orderDate: draftOrder.date,
        deliveryDate: draftOrder.deliveryDate,
        sourceOrderId: draftOrder.sourceOrderId,
        products: draftOrder.products.map((p: any, idx: number) => ({
          ...p,
          id: `product-${Date.now()}-${idx}`,
          itemNumber: `${orderId}-${String(idx + 1).padStart(3, '0')}`,
          pcsPerCarton: p.pcsPerCarton || 4,
          cartonSize: p.cartonSize || '60x60x18cm',
          moq: p.moq || 100
        })),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Read latest drafts from localStorage to ensure we have the most recent data
      const savedDrafts = localStorage.getItem('draftOrders');
      let existingDrafts: DraftOrder[] = [];
      if (savedDrafts) {
        try {
          existingDrafts = JSON.parse(savedDrafts);
        } catch (error) {
          console.error('Failed to load existing drafts:', error);
        }
      }

      // Add to draft orders
      const updatedDrafts = [...existingDrafts, newDraft];
      setDraftOrders(updatedDrafts);
      saveDraftsToLocalStorage(updatedDrafts);
      
      // Set as current draft
      loadDraftOrder(newDraft.id, updatedDrafts);
      
      toast.success('Draft order created from history');
    }
  }, [draftOrder]);

  // Save view state whenever it changes
  useEffect(() => {
    if (currentDraftId) {
      const viewState = {
        currentDraftId,
        orderDate,
        deliveryDate,
        isProductDetailOpen
      };
      localStorage.setItem('createOrderViewState', JSON.stringify(viewState));
    } else {
      localStorage.removeItem('createOrderViewState');
    }
  }, [currentDraftId, orderDate, deliveryDate, isProductDetailOpen]);

  // Mock product catalog
  const productCatalog = [
    { 
      id: 'P001', 
      name: 'LED Panel Light 60x60cm',
      image: 'https://images.unsplash.com/photo-1584259432824-3d124136ea4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMRUQlMjBwYW5lbCUyMGxpZ2h0fGVufDF8fHx8MTc2MzE5ODEyMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: 15.50, 
      cbm: 0.045, 
      grossWeight: 3.5, 
      netWeight: 3.2,
      pcsPerCarton: 4,
      cartonSize: '62x62x18cm',
      moq: 100
    },
    { 
      id: 'P002', 
      name: 'Stainless Steel Door Handle',
      image: 'https://images.unsplash.com/photo-1577554969358-472ed2afa866?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb29yJTIwaGFuZGxlJTIwc3RlZWx8ZW58MXx8fHwxNzYzMTk4MTIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: 2.50, 
      cbm: 0.008, 
      grossWeight: 0.5, 
      netWeight: 0.45,
      pcsPerCarton: 50,
      cartonSize: '45x30x25cm',
      moq: 500
    },
    { 
      id: 'P003', 
      name: 'Ceramic Floor Tiles 60x60cm',
      image: 'https://images.unsplash.com/photo-1695191388218-f6259600223f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjZXJhbWljJTIwZmxvb3IlMjB0aWxlc3xlbnwxfHx8fDE3NjMxNzI2MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      price: 8.90, 
      cbm: 0.036, 
      grossWeight: 18.5, 
      netWeight: 18.0,
      pcsPerCarton: 4,
      cartonSize: '62x62x8cm',
      moq: 200
    },
  ];

  // Mock historical orders - Orders that have completed business cycle (customer paid balance after QC)
  const historicalOrders = [
    {
      id: 'ORD-20241215-8934',
      date: '2024-12-15',
      deliveryDate: '2025-01-10',
      completedDate: '2025-01-15',
      products: [
        { ...productCatalog[0], qty: 1500 },
        { id: 'P004', name: 'LED Strip 5050', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', price: 8.90, qty: 300, cbm: 0.012, grossWeight: 0.8, netWeight: 0.7, pcsPerCarton: 100, cartonSize: '30x20x15cm', moq: 200 },
      ],
      totalAmount: 25925,
      status: 'completed'
    },
    {
      id: 'ORD-20241128-7823',
      date: '2024-11-28',
      deliveryDate: '2024-12-20',
      completedDate: '2024-12-25',
      products: [
        { ...productCatalog[1], qty: 3000 },
        { id: 'P005', name: 'Cabinet Hinges', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', price: 1.20, qty: 5000, cbm: 0.005, grossWeight: 0.3, netWeight: 0.28, pcsPerCarton: 200, cartonSize: '40x30x20cm', moq: 1000 },
      ],
      totalAmount: 13500,
      status: 'completed'
    },
    {
      id: 'ORD-20241015-6712',
      date: '2024-10-15',
      deliveryDate: '2024-11-08',
      completedDate: '2024-11-12',
      products: [
        { ...productCatalog[2], qty: 8000 },
        { ...productCatalog[0], qty: 1500 },
        { id: 'P004', name: 'LED Strip 5050', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', price: 8.90, qty: 300, cbm: 0.012, grossWeight: 0.8, netWeight: 0.7, pcsPerCarton: 100, cartonSize: '30x20x15cm', moq: 200 },
      ],
      totalAmount: 97895,
      status: 'completed'
    },
  ];

  const saveDraftsToLocalStorage = (drafts: DraftOrder[]) => {
    localStorage.setItem('draftOrders', JSON.stringify(drafts));
  };

  const generateOrderId = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    return `ORD-${year}${month}${day}-${random}`;
  };

  const generateDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const createNewDraft = () => {
    const newDraft: DraftOrder = {
      id: generateOrderId(),
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: generateDeliveryDate(),
      products: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDrafts = [...draftOrders, newDraft];
    setDraftOrders(updatedDrafts);
    saveDraftsToLocalStorage(updatedDrafts);
    loadDraftOrder(newDraft.id, updatedDrafts);
    
    toast.success('New draft order created');
  };

  const loadDraftOrder = (draftId: string, drafts?: DraftOrder[]) => {
    const draftsToSearch = drafts || draftOrders;
    const draft = draftsToSearch.find(d => d.id === draftId);
    if (draft) {
      setCurrentDraftId(draft.id);
      setNewOrderId(draft.id);
      setOrderDate(draft.orderDate);
      setDeliveryDate(draft.deliveryDate);
      setOrderItems(draft.products);
    }
  };

  const saveDraftOrder = () => {
    if (!currentDraftId) return;

    const updatedDrafts = draftOrders.map(draft => {
      if (draft.id === currentDraftId) {
        return {
          ...draft,
          products: orderItems,
          updatedAt: new Date().toISOString()
        };
      }
      return draft;
    });

    setDraftOrders(updatedDrafts);
    saveDraftsToLocalStorage(updatedDrafts);
  };

  // Auto-save whenever orderItems change
  useEffect(() => {
    if (currentDraftId && orderItems.length >= 0) {
      const updatedDrafts = draftOrders.map(draft => {
        if (draft.id === currentDraftId) {
          return {
            ...draft,
            products: orderItems,
            updatedAt: new Date().toISOString()
          };
        }
        return draft;
      });

      setDraftOrders(updatedDrafts);
      saveDraftsToLocalStorage(updatedDrafts);
      
      // If dialog is open, sync selectedProduct with latest orderItems
      if (isProductDetailOpen && selectedProduct) {
        setSelectedProduct({ ...selectedProduct, orderItems: orderItems });
        console.log('🔄 Synced selectedProduct with updated orderItems:', { 
          orderId: currentDraftId, 
          productsCount: orderItems.length 
        });
      }
      
      console.log('Auto-saved draft order:', { currentDraftId, productsCount: orderItems.length, updatedDrafts });
    }
  }, [orderItems, currentDraftId]);

  const deleteDraftOrder = (draftId: string) => {
    const updatedDrafts = draftOrders.filter(d => d.id !== draftId);
    setDraftOrders(updatedDrafts);
    saveDraftsToLocalStorage(updatedDrafts);
    
    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
      setOrderItems([]);
      setNewOrderId('');
      setOrderDate('');
      setDeliveryDate('');
    }
    
    toast.success('Draft order deleted');
  };

  const submitOrder = () => {
    if (!currentDraftId || orderItems.length === 0) {
      toast.error('Please add products to the order');
      return;
    }

    // 🔥 检查用户是否已登录
    if (!user || !user.email) {
      toast.error('Please login to submit order');
      return;
    }

    const currentDraft = draftOrders.find(d => d.id === currentDraftId);
    if (!currentDraft) return;

    // Calculate totals
    const totals = calculateTotals();

    // Create active order
    const activeOrder = {
      id: currentDraft.id,
      customerEmail: user.email, // 🔥 添加用户邮箱用于数据隔离
      orderDate: currentDraft.orderDate,
      deliveryDate: currentDraft.deliveryDate,
      sourceOrderId: currentDraft.sourceOrderId,
      products: orderItems,
      status: 'processing',
      totalAmount: totals.totalAmount,
      totalCBM: totals.totalCBM,
      totalGrossWeight: totals.totalGrossWeight,
      totalNetWeight: totals.totalNetWeight,
      totalCartons: totals.totalCartons,
      submittedAt: new Date().toISOString()
    };

    // Save to Active Orders
    const existingActiveOrders = localStorage.getItem('activeOrders');
    const activeOrders = existingActiveOrders ? JSON.parse(existingActiveOrders) : [];
    activeOrders.unshift(activeOrder);
    localStorage.setItem('activeOrders', JSON.stringify(activeOrders));

    // Remove from draft orders
    const updatedDrafts = draftOrders.filter(d => d.id !== currentDraftId);
    setDraftOrders(updatedDrafts);
    saveDraftsToLocalStorage(updatedDrafts);

    // Clear current draft
    setCurrentDraftId(null);
    setOrderItems([]);
    setNewOrderId('');
    setOrderDate('');
    setDeliveryDate('');

    // Callback
    if (onOrderSubmitted) {
      onOrderSubmitted(activeOrder);
    }

    toast.success('Order submitted successfully!');
  };

  const updateQuantity = (index: number, qty: number) => {
    const newItems = [...orderItems];
    newItems[index].qty = Math.max(newItems[index].moq || 1, qty);
    setOrderItems(newItems);
  };

  const removeProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const loadFromHistoricalOrder = (order: any) => {
    const productsWithIds = order.products.map((p: any, idx: number) => ({
      ...p,
      id: `product-${Date.now()}-${idx}`,
      itemNumber: `${newOrderId || generateOrderId()}-${String(idx + 1).padStart(3, '0')}`,
    }));
    setOrderItems(productsWithIds);
    toast.success('Products loaded from historical order');
  };

  const calculateTotals = () => {
    return orderItems.reduce((acc, item) => {
      const pcsPerCarton = item.pcsPerCarton || 4;
      const cartons = Math.ceil(item.qty / pcsPerCarton);
      return {
        totalAmount: acc.totalAmount + (item.qty * item.price),
        totalCBM: acc.totalCBM + (item.cbm * item.qty),
        totalGrossWeight: acc.totalGrossWeight + (item.grossWeight * item.qty),
        totalNetWeight: acc.totalNetWeight + (item.netWeight * item.qty),
        totalCartons: acc.totalCartons + cartons,
      };
    }, { totalAmount: 0, totalCBM: 0, totalGrossWeight: 0, totalNetWeight: 0, totalCartons: 0 });
  };

  const getContainerRecommendation = (cbm: number) => {
    if (cbm <= 28) return { type: '20ft Container', capacity: 28, utilization: (cbm / 28 * 100).toFixed(1) };
    if (cbm <= 58) return { type: '40ft Container', capacity: 58, utilization: (cbm / 58 * 100).toFixed(1) };
    return { type: '40ft HQ Container', capacity: 68, utilization: (cbm / 68 * 100).toFixed(1) };
  };

  const totals = calculateTotals();
  const containerInfo = getContainerRecommendation(totals.totalCBM);

  const currentDraft = draftOrders.find(d => d.id === currentDraftId);

  // Get status badge for product
  const getProductStatusBadge = (index: number) => {
    return (
      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
        Draft
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Draft Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Create New Order</h1>
          <p className="text-gray-600 mt-1">Manage draft orders and create new orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsLoadHistoryOpen(true)}>
            <History className="h-4 w-4 mr-2" />
            Load from History
          </Button>
          <Button onClick={createNewDraft} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Draft Order
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {draftOrders.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-20 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Draft Orders</h3>
            <p className="text-gray-600 mb-6">Create a new draft order or load from history to get started</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={createNewDraft} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Draft Order
              </Button>
              <Button variant="outline" onClick={() => setIsLoadHistoryOpen(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Load from History
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-b">
                    <TableHead className="text-gray-700">Order #</TableHead>
                    <TableHead className="text-gray-700">Date</TableHead>
                    <TableHead className="text-gray-700">Delivery Date</TableHead>
                    <TableHead className="text-gray-700">Total SKUs</TableHead>
                    <TableHead className="text-gray-700">Total Quantity</TableHead>
                    <TableHead className="text-gray-700">Total Amount</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                    <TableHead className="text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftOrders.map((draft) => {
                    const draftTotals = draft.products.reduce((acc, item) => ({
                      totalQty: acc.totalQty + item.qty,
                      totalAmount: acc.totalAmount + (item.qty * item.price)
                    }), { totalQty: 0, totalAmount: 0 });

                    return (
                      <TableRow key={draft.id} className="border-b hover:bg-gray-50">
                        {/* Order # */}
                        <TableCell>
                          <button
                            onClick={() => {
                              setSelectedProduct({ orderItems: draft.products, itemNumber: draft.id });
                              setIsProductDetailOpen(true);
                              setCurrentDraftId(draft.id);
                              setNewOrderId(draft.id);
                              setOrderDate(draft.orderDate);
                              setDeliveryDate(draft.deliveryDate);
                              setOrderItems(draft.products);
                            }}
                            className="flex items-center gap-1.5 text-blue-600 hover:underline"
                          >
                            <span>{draft.id}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                        
                        {/* Date */}
                        <TableCell className="text-gray-700">{draft.orderDate}</TableCell>
                        
                        {/* Delivery Date */}
                        <TableCell className="text-gray-700">{draft.deliveryDate}</TableCell>
                        
                        {/* Total SKUs */}
                        <TableCell className="text-gray-900">
                          {draft.products.length} SKUs
                        </TableCell>
                        
                        {/* Total Quantity */}
                        <TableCell className="text-gray-900">
                          {draftTotals.totalQty.toLocaleString()} pcs
                        </TableCell>
                        
                        {/* Total Amount */}
                        <TableCell className="text-gray-900">
                          ${draftTotals.totalAmount.toLocaleString()}
                        </TableCell>
                        
                        {/* Status */}
                        <TableCell>
                          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                            Draft
                          </Badge>
                        </TableCell>
                        
                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedProduct({ orderItems: draft.products, itemNumber: draft.id });
                                setIsProductDetailOpen(true);
                                setCurrentDraftId(draft.id);
                                setNewOrderId(draft.id);
                                setOrderDate(draft.orderDate);
                                setDeliveryDate(draft.deliveryDate);
                                setOrderItems(draft.products);
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              onClick={() => {
                                copyToClipboard(draft.id);
                                toast.success('Order number copied');
                              }}
                              title="Copy order number"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete order ${draft.id}?`)) {
                                  deleteDraftOrder(draft.id);
                                }
                              }}
                              title="Delete order"
                            >
                              <Trash2 className="h-4 w-4" />
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
      )}

      {/* Product Detail Dialog - Professional Trade Order Format */}
      <Dialog open={isProductDetailOpen} onOpenChange={(open) => {
        console.log('🔴 Dialog onOpenChange triggered:', open);
        if (!open) {
          // Clear view state when closing to prevent auto-reopen on refresh
          const currentViewState = localStorage.getItem('createOrderViewState');
          if (currentViewState) {
            try {
              const viewState = JSON.parse(currentViewState);
              // Keep other state but set dialog to closed
              localStorage.setItem('createOrderViewState', JSON.stringify({
                ...viewState,
                isProductDetailOpen: false
              }));
              console.log('🔴 Cleared isProductDetailOpen from viewState');
            } catch (error) {
              console.error('Failed to update viewState:', error);
            }
          }
        }
        setIsProductDetailOpen(open);
      }}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Proforma Invoice - {selectedProduct?.itemNumber}</DialogTitle>
            <DialogDescription>
              Professional trade order format with complete product specifications and shipping details
            </DialogDescription>
          </DialogHeader>
          
          {/* Professional Order Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-10 -mx-6 -mt-6 relative">
            {/* Order Number - Bottom Right */}
            <div className="absolute bottom-4 right-8">
              <p className="text-xs text-red-100 mb-0.5">Order Number</p>
              <p className="text-sm font-semibold">{selectedProduct?.itemNumber}</p>
            </div>
            
            {/* Centered Title - Lower Position */}
            <div className="text-center mt-8">
              <h2 className="text-2xl font-bold">PROFORMA INVOICE</h2>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 -mx-6">
            {selectedProduct?.orderItems && (
              <div className="space-y-6">
                {/* Supplier & Customer Information */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Supplier (Seller) */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                        <Package className="h-4 w-4 text-red-600" />
                      </div>
                      SUPPLIER (SELLER)
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">Fujian Gaoshengda Jiancai Co., Ltd.</p>
                      <p className="text-gray-600">Building Materials Export Division</p>
                      <p className="text-gray-600">123 Industrial Park, Fuzhou, Fujian, China</p>
                      <p className="text-gray-600">Tel: +86-591-8888-8888</p>
                      <p className="text-gray-600">Email: export@cosun-building.com</p>
                    </div>
                  </div>

                  {/* Customer (Buyer) */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                      </div>
                      CUSTOMER (BUYER)
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">[Customer Company Name]</p>
                      <p className="text-gray-600">[Customer Address Line 1]</p>
                      <p className="text-gray-600">[City, State/Province, Country]</p>
                      <p className="text-gray-600">Tel: [Customer Phone]</p>
                      <p className="text-gray-600">Email: [Customer Email]</p>
                    </div>
                  </div>
                </div>

                {/* Products Table - Professional Format */}
                <div>
                  <div className="border rounded-lg overflow-hidden">
                    <ResizableProformaTable
                      orderItems={selectedProduct.orderItems}
                      selectedProduct={selectedProduct}
                      setSelectedProduct={setSelectedProduct}
                      updateQuantity={updateQuantity}
                      removeProduct={removeProduct}
                      saveDraftOrder={saveDraftOrder}
                      totals={totals}
                    />
                  </div>
                  
                  <div className="flex items-center justify-end mt-3">
                    <Button
                      onClick={() => setIsAddProductOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Shipping & Container Information */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Shipping Summary */}
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-3">SHIPPING INFORMATION</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-600">Total Cartons</p>
                        <p className="font-semibold text-gray-900">{totals.totalCartons} ctns</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Total CBM</p>
                        <p className="font-semibold text-gray-900">{totals.totalCBM.toFixed(3)} m³</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Net Weight</p>
                        <p className="font-semibold text-gray-900">{totals.totalNetWeight.toFixed(1)} kg</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Gross Weight</p>
                        <p className="font-semibold text-gray-900">{totals.totalGrossWeight.toFixed(1)} kg</p>
                      </div>
                    </div>
                  </div>

                  {/* Container Recommendation */}
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-green-900 mb-3">CONTAINER LOADING</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">Recommended Container:</span>
                        <span className="font-semibold text-gray-900">{containerInfo.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Container Capacity:</span>
                        <span className="font-semibold text-gray-900">{containerInfo.capacity} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Utilization:</span>
                        <span className={`font-semibold ${parseFloat(containerInfo.utilization) > 95 ? 'text-red-600' : 'text-green-600'}`}>
                          {containerInfo.utilization}%
                        </span>
                      </div>
                      {parseFloat(containerInfo.utilization) > 95 && (
                        <Alert className="mt-2 bg-red-50 border-red-200">
                          <AlertDescription className="text-xs text-red-800">
                            ⚠️ Container utilization exceeds 95%. Consider adjusting quantity or using a larger container.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-3">TERMS & CONDITIONS</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Payment Terms:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 30% T/T deposit before production</li>
                        <li>• 70% T/T balance before shipment</li>
                        <li>• L/C at sight acceptable</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">Delivery Terms:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• FOB Fuzhou Port, China</li>
                        <li>• Delivery: 30-45 days after deposit</li>
                        <li>• Port of Loading: Fuzhou, China</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h3 className="font-semibold text-yellow-900 mb-3">BANK INFORMATION</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-yellow-700 text-xs">Beneficiary Name:</p>
                      <p className="font-semibold text-gray-900">Fujian Gaoshengda Jiancai Co., Ltd.</p>
                    </div>
                    <div>
                      <p className="text-yellow-700 text-xs">Bank Name:</p>
                      <p className="font-semibold text-gray-900">Bank of China, Fuzhou Branch</p>
                    </div>
                    <div>
                      <p className="text-yellow-700 text-xs">Account Number:</p>
                      <p className="font-semibold text-gray-900">1234 5678 9012 3456</p>
                    </div>
                    <div>
                      <p className="text-yellow-700 text-xs">SWIFT Code:</p>
                      <p className="font-semibold text-gray-900">BKCHCNBJ950</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">NOTES</h3>
                  <p className="text-sm text-gray-600 italic">
                    This is a draft proforma invoice. Final PI will be issued upon order confirmation. 
                    All specifications and prices are subject to confirmation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer Actions */}
          <div className="flex gap-3 justify-between items-center pt-4 border-t px-8 pb-6 -mx-6 -mb-6 bg-gray-50">
            <div className="text-sm text-gray-600">
              <Badge className="bg-yellow-500 text-white mr-2">DRAFT</Badge>
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsProductDetailOpen(false)}>
                Close
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  window.print();
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  saveDraftOrder();
                  setIsProductDetailOpen(false);
                  toast.success('Order saved successfully');
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
        productCatalog={productCatalog}
        orderItems={orderItems}
        setOrderItems={setOrderItems}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        newOrderId={newOrderId}
        saveDraftOrder={saveDraftOrder}
        onNavigateToShop={onNavigateToShop}
      />
    </div>
  );
}