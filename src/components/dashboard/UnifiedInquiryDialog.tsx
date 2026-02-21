import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  History,
  Globe,
  FileEdit,
  Plus,
  Save,
  X,
  Package,
  Trash2,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Container,
  Box,
  TrendingUp,
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { InquiryProductHome } from './InquiryProductHome';
import { InquiryHistorySelector } from './InquiryHistorySelector';
import { ManualProductEntry } from './ManualProductEntry';
import { toast } from 'sonner';

interface UnifiedInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInquiry: (products: any[], additionalInfo?: any) => void;
  editMode?: boolean;
  existingInquiry?: any;
  onUpdateInquiry?: (updatedInquiry: any) => void;
}

type ViewMode = 'selection' | 'history' | 'website' | 'manual';

export function UnifiedInquiryDialog({
  isOpen,
  onClose,
  onCreateInquiry,
  editMode = false,
  existingInquiry = null,
  onUpdateInquiry,
}: UnifiedInquiryDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Track initial state for comparison in edit mode
  const [initialState, setInitialState] = useState<{
    products: any[];
    notes: string;
    address: string;
  } | null>(null);

  // Initialize state when editing
  useEffect(() => {
    if (editMode && existingInquiry && isOpen) {
      const products = existingInquiry.products || [];
      const notes = existingInquiry.message || '';
      const address = existingInquiry.deliveryAddress || '';
      
      setSelectedProducts(products);
      setAdditionalNotes(notes);
      setDeliveryAddress(address);
      
      // Save initial state for comparison
      setInitialState({
        products: JSON.parse(JSON.stringify(products)),
        notes,
        address,
      });
    } else if (!editMode && isOpen) {
      // Reset initial state for new inquiry
      setInitialState(null);
    }
  }, [editMode, existingInquiry, isOpen]);

  // Track which products have been added (by unique ID)
  const addedProductIds = new Set(selectedProducts.map(p => p.id));

  const handleAddProduct = (product: any) => {
    // Check if product already exists
    if (addedProductIds.has(product.id)) {
      toast.error('Product already added');
      return;
    }

    setSelectedProducts(prev => [...prev, {
      ...product,
      source: product.source || viewMode, // Track source
      addedFrom: viewMode === 'history' ? 'History' : 
                 viewMode === 'website' ? 'Website' : 
                 'Manual Entry'
    }]);
    
    toast.success(`${product.productName} added to inquiry`);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product removed');
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    const nextQuantity = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);

    setSelectedProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, quantity: nextQuantity } : p))
    );
  };

  const handleQuantityBlur = (productId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const safeQuantity = Number.isFinite(p.quantity) && p.quantity > 0 ? p.quantity : 1;
        return { ...p, quantity: safeQuantity };
      })
    );
  };

  const handleProductsFromHistory = (products: any[]) => {
    const newProducts = products
      .filter(p => !addedProductIds.has(p.id))
      .map(p => ({
        ...p,
        source: 'history',
        addedFrom: 'History'
      }));
    
    if (newProducts.length > 0) {
      setSelectedProducts(prev => [...prev, ...newProducts]);
      toast.success(`${newProducts.length} products added from history`);
    }
    
    setViewMode('selection');
  };

  const handleCreateInquiry = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    onCreateInquiry(selectedProducts, {
      notes: additionalNotes,
      deliveryAddress,
    });

    // Reset state
    setSelectedProducts([]);
    setAdditionalNotes('');
    setDeliveryAddress('');
    setViewMode('selection');
    onClose();
  };

  const handleUpdateInquiry = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const updatedInquiry = {
      products: selectedProducts,
      notes: additionalNotes,
      deliveryAddress,
    };

    onUpdateInquiry?.(updatedInquiry);

    // Reset state
    setSelectedProducts([]);
    setAdditionalNotes('');
    setDeliveryAddress('');
    setViewMode('selection');
    onClose();
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    let hasChanges = false;
    
    if (editMode && initialState) {
      // In edit mode, check if anything changed
      const productsChanged = JSON.stringify(selectedProducts) !== JSON.stringify(initialState.products);
      const notesChanged = additionalNotes !== initialState.notes;
      const addressChanged = deliveryAddress !== initialState.address;
      
      hasChanges = productsChanged || notesChanged || addressChanged;
    } else if (!editMode && selectedProducts.length > 0) {
      // In create mode, warn if products are selected
      hasChanges = true;
    }
    
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    
    // Reset state
    setSelectedProducts([]);
    setAdditionalNotes('');
    setDeliveryAddress('');
    setViewMode('selection');
    setInitialState(null);
    onClose();
  };

  const getTotalQuantity = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  };

  const getTotalValue = () => {
    return selectedProducts.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0);
  };

  // 🔥 计算货柜信息 - 使用与Container Load Planner完全相同的智能装柜算法
  const getContainerInfo = () => {
    // 标准集装箱规格（与Container Load Planner一致）
    const CONTAINER_TYPES = {
      '20GP': {
        name: '20GP',
        volume: 33.1, // CBM
        maxPayload: 25700, // kg
      },
      '40GP': {
        name: '40GP',
        volume: 67.5,
        maxPayload: 24300,
      },
      '40HQ': {
        name: '40HQ',
        volume: 76.3,
        maxPayload: 24000,
      },
      '20HV': {
        name: '20HV',
        volume: 37.4,
        maxPayload: 25500,
      },
    };

    // 准备产品列表（与Container Load Planner相同）
    const sortedProducts = selectedProducts
      .map(p => {
        const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000;
        const weight = (p.weight || 1.5);
        const totalVolume = volume * (p.quantity || 0);
        const totalWeight = weight * (p.quantity || 0);
        
        return {
          productName: p.productName,
          quantity: p.quantity || 0,
          unitVolume: volume,
          unitWeight: weight,
          totalVolume: totalVolume,
          totalWeight: totalWeight,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume);

    // 定义柜子优先级：优先使用小柜子
    const containerPriority: (keyof typeof CONTAINER_TYPES)[] = ['20GP', '20HV', '40GP', '40HQ'];
    
    // 装柜结果
    const containers: Array<{
      type: keyof typeof CONTAINER_TYPES;
      currentVolume: number;
      currentWeight: number;
    }> = [];

    let remainingProducts = [...sortedProducts];
    let containerIdCounter = 1;

    // FFD算法装柜
    while (remainingProducts.some(p => p.quantity > 0)) {
      // 计算剩余货物的总体积和总重量
      const remainingVolume = remainingProducts.reduce((sum, p) => sum + (p.unitVolume * p.quantity), 0);
      const remainingWeight = remainingProducts.reduce((sum, p) => sum + (p.unitWeight * p.quantity), 0);

      // 选择合适的柜子类型
      let selectedType: keyof typeof CONTAINER_TYPES = '40HQ';
      for (const type of containerPriority) {
        const spec = CONTAINER_TYPES[type];
        if (remainingVolume <= spec.volume && remainingWeight <= spec.maxPayload) {
          selectedType = type;
          break;
        }
      }

      const spec = CONTAINER_TYPES[selectedType];
      const newContainer = {
        type: selectedType,
        currentVolume: 0,
        currentWeight: 0,
        capacity: {
          volume: spec.volume,
          weight: spec.maxPayload,
        },
      };

      // FFD算法：将产品放入这个柜子
      remainingProducts.forEach(product => {
        if (product.quantity <= 0) return;

        const availableVolume = newContainer.capacity.volume - newContainer.currentVolume;
        const availableWeight = newContainer.capacity.weight - newContainer.currentWeight;

        const maxByVolume = Math.floor(availableVolume / product.unitVolume);
        const maxByWeight = Math.floor(availableWeight / product.unitWeight);
        const canFit = Math.min(maxByVolume, maxByWeight, product.quantity);

        if (canFit > 0) {
          newContainer.currentVolume += product.unitVolume * canFit;
          newContainer.currentWeight += product.unitWeight * canFit;
          product.quantity -= canFit;
        }
      });

      containers.push(newContainer);

      // 防止无限循环
      if (containers.length > 20) {
        console.error('Too many containers generated, breaking loop');
        break;
      }
    }

    // 统计各种柜型的数量
    const containerCounts: { [key: string]: number } = {};
    containers.forEach(container => {
      containerCounts[container.type] = (containerCounts[container.type] || 0) + 1;
    });

    // 计算总体积和总重量
    const totalCBM = selectedProducts.reduce((sum, p) => {
      const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000;
      return sum + (volume * (p.quantity || 0));
    }, 0);

    const totalWeight = selectedProducts.reduce((sum, p) => {
      const weight = (p.weight || 1.5);
      return sum + (weight * (p.quantity || 0));
    }, 0);

    // 计算总柜子容量
    const totalContainerVolume = containers.reduce((sum, c) => {
      const spec = CONTAINER_TYPES[c.type];
      return sum + spec.volume;
    }, 0);

    const utilizationRate = totalContainerVolume > 0 ? ((totalCBM / totalContainerVolume) * 100) : 0;

    // 生成推荐文本
    const recommendedText = Object.entries(containerCounts)
      .map(([type, count]) => `${count}×${type}`)
      .join(' + ');

    return {
      totalCBM: totalCBM.toFixed(2),
      totalWeight: totalWeight.toFixed(0),
      recommendedText: recommendedText || '0×Container',
      containerCount: containers.length,
      utilizationRate: utilizationRate.toFixed(1),
      containerBreakdown: containerCounts,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={`max-w-7xl p-0 ${
        viewMode === 'selection' ? 'max-h-[95vh]' : 'h-[90vh]'
      } overflow-hidden`}>
        {viewMode === 'selection' && (
          <>
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-2xl text-[#F96302]">
                {editMode ? `Edit Inquiry - ${existingInquiry?.id}` : 'Create New Inquiry'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                {editMode 
                  ? 'Modify your inquiry by adding or removing products from 3 sources'
                  : 'Choose how you want to add products to your inquiry'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(95vh - 280px)' }}>
              {/* Method Selection Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#F96302] group"
                  onClick={() => setViewMode('history')}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-[#0D3B66] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#0A2F52] transition-colors">
                      <History className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Copy from History</h3>
                    <p className="text-xs text-gray-600">
                      Use previous inquiry as template
                    </p>
                  </div>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#F96302] group"
                  onClick={() => setViewMode('website')}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-[#F96302] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#E05502] transition-colors">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Select from Website</h3>
                    <p className="text-xs text-gray-600">
                      Browse and select products from catalog
                    </p>
                  </div>
                </Card>

                <Card
                  className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#F96302] group"
                  onClick={() => setViewMode('manual')}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-[#2E7D32] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#256428] transition-colors">
                      <FileEdit className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-[#1A1A1A] mb-2">Your Items</h3>
                    <p className="text-xs text-gray-600">
                      Manually enter product details
                    </p>
                  </div>
                </Card>
              </div>

              {/* Selected Products List */}
              {selectedProducts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#1A1A1A] flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#F96302]" />
                      Selected Products ({selectedProducts.length})
                    </h3>
                    <Badge className="bg-[#F96302]">
                      Total: {getTotalQuantity()} pcs
                    </Badge>
                  </div>

                  {/* 🔥 Products Table */}
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="w-[80px]">Image</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-center w-[100px]">Qty</TableHead>
                          <TableHead className="text-right w-[120px]">Unit Price</TableHead>
                          <TableHead className="text-right w-[120px]">Subtotal</TableHead>
                          <TableHead className="w-[100px]">Source</TableHead>
                          <TableHead className="text-center w-[80px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((product) => (
                          <TableRow key={product.id} className="hover:bg-orange-50/50">
                            {/* Product Image */}
                            <TableCell>
                              <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                                {product.image ? (
                                  <ImageWithFallback
                                    src={product.image}
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Product Name */}
                            <TableCell>
                              <div className="font-medium text-sm text-[#1A1A1A]">
                                {product.productName}
                              </div>
                              {product.specification && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {product.specification}
                                </div>
                              )}
                            </TableCell>

                            {/* Quantity */}
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min={1}
                                step={1}
                                value={product.quantity ?? 1}
                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                onBlur={() => handleQuantityBlur(product.id)}
                                className="h-8 w-20 mx-auto text-center"
                              />
                              <div className="text-xs text-gray-500">{product.unit || 'pcs'}</div>
                            </TableCell>

                            {/* Unit Price */}
                            <TableCell className="text-right">
                              <div className="text-sm font-medium text-[#F96302]">
                                ${product.targetPrice?.toFixed(2) || '0.00'}
                              </div>
                            </TableCell>

                            {/* Subtotal */}
                            <TableCell className="text-right">
                              <div className="text-sm font-bold text-[#1A1A1A]">
                                ${((product.targetPrice || 0) * (product.quantity || 0)).toFixed(2)}
                              </div>
                            </TableCell>

                            {/* Source */}
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {product.addedFrom}
                              </Badge>
                            </TableCell>

                            {/* Remove Button */}
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Total Summary Bar */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-t-2 border-[#F96302]/30 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-xs text-gray-600">Total Items</span>
                            <div className="text-lg font-bold text-[#1A1A1A]">{selectedProducts.length}</div>
                          </div>
                          <Separator orientation="vertical" className="h-10" />
                          <div>
                            <span className="text-xs text-gray-600">Total Quantity</span>
                            <div className="text-lg font-bold text-[#1A1A1A]">{getTotalQuantity()} pcs</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-600">Estimated Total Value</span>
                          <div className="text-2xl font-bold text-[#F96302]">
                            ${getTotalValue().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 🔥 Container Information Card */}
                  {(() => {
                    const containerInfo = getContainerInfo();
                    return (
                      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Container className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-[#1A1A1A]">Container Load Planning</h4>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="text-xs text-gray-600 mb-1">Total Volume</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-blue-600">{containerInfo.totalCBM}</span>
                                <span className="text-xs text-gray-500">CBM</span>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="text-xs text-gray-600 mb-1">Total Weight</div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-blue-600">{containerInfo.totalWeight}</span>
                                <span className="text-xs text-gray-500">kg</span>
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="text-xs text-gray-600 mb-1">Recommended</div>
                              <div className="text-sm font-bold text-blue-600">
                                {containerInfo.recommendedText}
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="text-xs text-gray-600 mb-1">Utilization</div>
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-lg font-bold text-green-600">{containerInfo.utilizationRate}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-600 bg-white rounded p-2 border border-blue-100">
                            <strong>Note:</strong> Container recommendations based on standard sizes. 
                            20GP: 33.1 CBM / 25,700 kg max. 40HQ: 76.3 CBM / 24,000 kg max.
                          </div>
                        </div>
                      </Card>
                    );
                  })()}

                  {/* Additional Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Delivery Address (Optional)
                      </label>
                      <Input
                        placeholder="Enter delivery address..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Additional Notes (Optional)
                      </label>
                      <Input
                        placeholder="Any special requirements..."
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="font-medium">No products selected yet</p>
                  <p className="text-sm mt-1">Choose a method above to start adding products</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedProducts.length > 0 ? (
                  <span>
                    <strong>{selectedProducts.length}</strong> products selected
                  </span>
                ) : (
                  <span>Select products to create inquiry</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="border-2"
                >
                  Cancel
                </Button>
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleUpdateInquiry}
                      disabled={selectedProducts.length === 0}
                      className="border-2"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleUpdateInquiry}
                      disabled={selectedProducts.length === 0}
                      className="bg-[#F96302] hover:bg-[#E05502]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Update Inquiry
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleCreateInquiry}
                    disabled={selectedProducts.length === 0}
                    className="bg-[#F96302] hover:bg-[#E05502]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Inquiry
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {viewMode === 'history' && (
          <>
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl text-[#F96302]">Copy from History</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Select products from your previous inquiries
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('selection')}
                  className="border-2"
                >
                  <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                  Back
                </Button>
              </div>
            </DialogHeader>
            <div style={{ height: 'calc(90vh - 120px)', overflow: 'hidden' }}>
              <InquiryHistorySelector
                onSelectProducts={handleProductsFromHistory}
                onCancel={() => setViewMode('selection')}
              />
            </div>
          </>
        )}

        {viewMode === 'website' && (
          <>
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl text-[#F96302]">Select from Website</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Browse our product catalog
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('selection')}
                  className="border-2"
                >
                  <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                  Back to Inquiry ({selectedProducts.length})
                </Button>
              </div>
            </DialogHeader>
            <div style={{ height: 'calc(90vh - 120px)', overflow: 'hidden' }}>
              <InquiryProductHome
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onSelectCategory={() => {}}
              />
            </div>
          </>
        )}

        {viewMode === 'manual' && (
          <>
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl text-[#F96302]">Your Items</DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 mt-1">
                    Manually enter product details
                  </DialogDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('selection')}
                  className="border-2"
                >
                  <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                  Back
                </Button>
              </div>
            </DialogHeader>
            <div style={{ height: 'calc(90vh - 120px)', overflow: 'hidden' }}>
              <ManualProductEntry
                onAddProduct={handleAddProduct}
                onCancel={() => setViewMode('selection')}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
