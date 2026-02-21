import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useUser } from '../contexts/UserContext';
import { useInquiry } from '../contexts/InquiryContext';
import { useRouter } from '../contexts/RouterContext';
import { Trash2, ShoppingBag, ArrowLeft, ChevronDown, ChevronUp, Plus, X, Package, FileText, Building2, Mail, Phone, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { InquiryPreviewDialog } from './InquiryPreviewDialogNew';
import { toast } from 'sonner';

type ContainerType = '20GP' | '20HV' | '40GP' | '40HQ';

interface Container {
  id: string;
  type: ContainerType;
  quantity: number;
}

interface ContainerSpec {
  name: string;
  volume: number; // m³
  maxPayload: number; // kg
  internalDim: string;
  tareWeight: number; // kg
  maxGross: number; // kg
}

const containerSpecs: Record<ContainerType, ContainerSpec> = {
  '20GP': {
    name: "20'GP",
    volume: 28,
    maxPayload: 25000,
    internalDim: '5.90×2.35×2.39m',
    tareWeight: 2300,
    maxGross: 27300
  },
  '20HV': {
    name: "20'HV",
    volume: 33,
    maxPayload: 27000,
    internalDim: '5.90×2.35×2.69m',
    tareWeight: 2500,
    maxGross: 29500
  },
  '40GP': {
    name: "40'GP",
    volume: 58,
    maxPayload: 26000,
    internalDim: '12.03×2.35×2.39m',
    tareWeight: 3700,
    maxGross: 29700
  },
  '40HQ': {
    name: "40'HQ",
    volume: 68,
    maxPayload: 28000,
    internalDim: '12.03×2.35×2.69m',
    tareWeight: 4000,
    maxGross: 32000
  }
};

export function Cart() {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { user } = useUser();
  const { addInquiry } = useInquiry();
  const { navigateTo } = useRouter();
  const [showContainerDetails, setShowContainerDetails] = React.useState(false);
  const [planningMode, setPlanningMode] = React.useState<'automatic' | 'custom'>('automatic');
  const [customContainers, setCustomContainers] = React.useState<Container[]>([
    { id: '1', type: '20GP', quantity: 1 }
  ]);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);

  const calculateItemShipping = (item: any) => {
    // Add safety checks for undefined values
    const pcsPerCarton = item.pcsPerCarton || 1;
    const cbmPerCarton = item.cbmPerCarton || 0;
    const cartonGrossWeight = item.cartonGrossWeight || 0;
    const cartonNetWeight = item.cartonNetWeight || 0;
    
    // Calculate actual cartons (may be decimal)
    const exactCartons = item.quantity / pcsPerCarton;
    const cartons = exactCartons;
    const isExactCartons = Number.isInteger(exactCartons);
    
    // Calculate suggested quantities
    const cartonsLower = Math.floor(exactCartons);
    const cartonsHigher = Math.ceil(exactCartons);
    const suggestedLower = cartonsLower * pcsPerCarton;
    const suggestedHigher = cartonsHigher * pcsPerCarton;
    
    // Use ceiling for shipping calculations (you need full cartons)
    const fullCartons = Math.ceil(item.quantity / pcsPerCarton);
    const cbm = (fullCartons * cbmPerCarton).toFixed(3);
    const totalGrossWeight = (fullCartons * cartonGrossWeight).toFixed(2);
    const totalNetWeight = (fullCartons * cartonNetWeight).toFixed(2);
    
    return { 
      cartons, 
      cbm, 
      totalGrossWeight, 
      totalNetWeight,
      isExactCartons,
      suggestedLower,
      suggestedHigher
    };
  };

  const calculateTotalShipping = () => {
    let totalCartons = 0;
    let totalCbm = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;

    cartItems.forEach(item => {
      const shipping = calculateItemShipping(item);
      totalCartons += shipping.cartons;
      totalCbm += parseFloat(shipping.cbm);
      totalGrossWeight += parseFloat(shipping.totalGrossWeight);
      totalNetWeight += parseFloat(shipping.totalNetWeight);
    });

    return {
      cartons: totalCartons.toFixed(2),
      cbm: totalCbm.toFixed(3),
      totalGrossWeight: totalGrossWeight.toFixed(2),
      totalNetWeight: totalNetWeight.toFixed(2),
    };
  };

  const getRecommendedContainer = (totalCbm: number, totalWeight: number): ContainerType => {
    // Find the smallest container that fits the cargo
    if (totalCbm <= containerSpecs['20GP'].volume && totalWeight <= containerSpecs['20GP'].maxPayload) {
      return '20GP';
    } else if (totalCbm <= containerSpecs['20HV'].volume && totalWeight <= containerSpecs['20HV'].maxPayload) {
      return '20HV';
    } else if (totalCbm <= containerSpecs['40GP'].volume && totalWeight <= containerSpecs['40GP'].maxPayload) {
      return '40GP';
    } else {
      return '40HQ';
    }
  };

  const calculateContainerUtilization = (containerType: ContainerType, totalCbm: number, totalWeight: number) => {
    const spec = containerSpecs[containerType];
    const spaceUsed = totalCbm;
    const spaceLeft = spec.volume - totalCbm;
    const spaceUtilization = (totalCbm / spec.volume) * 100;
    
    const weightUsed = totalWeight;
    const weightLeft = spec.maxPayload - totalWeight;
    const weightUtilization = (totalWeight / spec.maxPayload) * 100;
    
    return {
      spec,
      spaceUsed,
      spaceLeft,
      spaceUtilization,
      weightUsed,
      weightLeft,
      weightUtilization
    };
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return 'text-red-600';
    if (utilization >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization > 100) return 'bg-red-600';
    if (utilization >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  const getUtilizationTip = (spaceUtil: number, weightUtil: number) => {
    if (spaceUtil > 100 || weightUtil > 100) {
      return '⚠️ Overloaded - Consider adding more containers';
    } else if (spaceUtil >= 80 && weightUtil >= 80) {
      return '✓ Excellent utilization';
    } else if (spaceUtil >= 60 || weightUtil >= 60) {
      return '✓ Good utilization';
    } else if (spaceUtil < 30 && weightUtil < 30) {
      return '💡 Consider LCL (Less than Container Load) to save costs';
    } else {
      return '💡 Moderate utilization - Room for more orders';
    }
  };

  const addCustomContainer = () => {
    const newId = (customContainers.length + 1).toString();
    setCustomContainers([...customContainers, { id: newId, type: '20GP', quantity: 1 }]);
  };

  const removeCustomContainer = (id: string) => {
    if (customContainers.length > 1) {
      setCustomContainers(customContainers.filter(c => c.id !== id));
    }
  };

  const updateCustomContainer = (id: string, field: 'type' | 'quantity', value: any) => {
    setCustomContainers(customContainers.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </button>
            
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <ShoppingBag className="h-24 w-24 mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add some products to get started!</p>
              <Button
                onClick={() => navigateTo('home')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalShipping = calculateTotalShipping();
  const totalCbm = parseFloat(totalShipping.cbm);
  const totalWeight = parseFloat(totalShipping.totalGrossWeight);
  const recommendedContainer = getRecommendedContainer(totalCbm, totalWeight);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl">Shopping Cart</h1>
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => {
                const shipping = calculateItemShipping(item);
                const itemTotal = (item.unitPrice || 0) * item.quantity;

                return (
                  <div key={`${item.productName}-${item.color}-${index}`} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex gap-6">
                      {/* Product Image */}
                      <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg mb-2">{item.productName}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>Material: {item.material}</p>
                              <p><span className="font-medium">Color:</span> <span className="text-blue-600">{item.color}</span></p>
                              <p>Specification: {item.specification}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.productName, item.color)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Price and Quantity */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Unit Price</p>
                            <p className="text-orange-600">${(item.unitPrice || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Quantity</p>
                            <div className="flex items-center gap-2">
                              <button
                                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                                onClick={() => {
                                  if (item.quantity > 0) {
                                    updateQuantity(item.productName, item.color, item.quantity - 1);
                                  }
                                }}
                              >
                                -
                              </button>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    updateQuantity(item.productName, item.color, 0);
                                  } else {
                                    const num = parseInt(value);
                                    if (!isNaN(num) && num >= 0) {
                                      updateQuantity(item.productName, item.color, num);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  if (item.quantity === 0) {
                                    updateQuantity(item.productName, item.color, 1);
                                  }
                                }}
                                className="w-16 border rounded px-2 py-1 text-center text-sm"
                              />
                              <button
                                className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100"
                                onClick={() => updateQuantity(item.productName, item.color, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Subtotal:</span>
                            <span className="text-lg text-blue-600">${itemTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Shipping Details */}
                        <div className="space-y-2">
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-700">Cartons:</span>
                                <span className={`${!shipping.isExactCartons ? 'text-red-600' : 'text-orange-600'}`}>
                                  {shipping.cartons.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">CBM:</span>
                                <span className="text-orange-600">{shipping.cbm} m³</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Gross Weight:</span>
                                <span className="text-orange-600">{shipping.totalGrossWeight} kg</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-700">Net Weight:</span>
                                <span className="text-orange-600">{shipping.totalNetWeight} kg</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Quantity Suggestion */}
                          {!shipping.isExactCartons && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs">
                              <p className="text-yellow-800 font-medium mb-1">💡 Suggested:</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateQuantity(item.productName, item.color, shipping.suggestedLower)}
                                  className="flex-1 px-2 py-1 bg-white rounded border border-yellow-300 hover:bg-yellow-100 transition-colors text-gray-700"
                                >
                                  {shipping.suggestedLower} pcs
                                </button>
                                <button
                                  onClick={() => updateQuantity(item.productName, item.color, shipping.suggestedHigher)}
                                  className="flex-1 px-2 py-1 bg-white rounded border border-yellow-300 hover:bg-yellow-100 transition-colors text-gray-700"
                                >
                                  {shipping.suggestedHigher} pcs
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl mb-6">Order Summary</h2>

                {/* 📦 Shipping Summary */}
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm">Shipping Summary</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cartons:</span>
                      <span className="text-orange-600">{totalShipping.cartons}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total CBM:</span>
                      <span className="text-orange-600">{totalShipping.cbm} m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Gross Weight:</span>
                      <span className="text-orange-600">{totalShipping.totalGrossWeight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Net Weight:</span>
                      <span className="text-orange-600">{totalShipping.totalNetWeight} kg</span>
                    </div>
                  </div>
                </div>

                {/* 🚢 Container Planning */}
                <div className="mb-6 pb-6 border-b">
                  <h3 className="text-sm mb-3">🚢 Container Planning</h3>
                  
                  {/* Planning Mode Selection */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setPlanningMode('automatic')}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        planningMode === 'automatic'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Automatic
                    </button>
                    <button
                      onClick={() => setPlanningMode('custom')}
                      className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                        planningMode === 'custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Automatic Mode */}
                  {planningMode === 'automatic' && (() => {
                    const util = calculateContainerUtilization(recommendedContainer, totalCbm, totalWeight);
                    return (
                      <div className="space-y-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Recommended:</span>
                            <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded">
                              1 × {util.spec.name}
                            </span>
                          </div>
                          
                          {/* Space Utilization */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">📊 Space</span>
                              <span className={getUtilizationColor(util.spaceUtilization)}>
                                {util.spaceUsed.toFixed(2)}/{util.spec.volume} m³ ({util.spaceUtilization.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(util.spaceUtilization, 100)} 
                              className="h-2"
                              indicatorClassName={getUtilizationBgColor(util.spaceUtilization)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {util.spaceLeft > 0 ? '+' : ''}{util.spaceLeft.toFixed(2)} m³ {util.spaceLeft > 0 ? 'left' : 'over'}
                            </p>
                          </div>

                          {/* Weight Utilization */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">⚖️ Weight</span>
                              <span className={getUtilizationColor(util.weightUtilization)}>
                                {(util.weightUsed / 1000).toFixed(2)}/{(util.spec.maxPayload / 1000).toFixed(0)} T ({util.weightUtilization.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(util.weightUtilization, 100)} 
                              className="h-2"
                              indicatorClassName={getUtilizationBgColor(util.weightUtilization)}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {util.weightLeft > 0 ? '+' : ''}{(util.weightLeft / 1000).toFixed(2)} T {util.weightLeft > 0 ? 'left' : 'over'}
                            </p>
                          </div>

                          {/* Tip */}
                          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-blue-200">
                            {getUtilizationTip(util.spaceUtilization, util.weightUtilization)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Custom Mode */}
                  {planningMode === 'custom' && (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600 mb-2">
                        Configure your containers:
                      </div>
                      
                      {/* Container List */}
                      {customContainers.map((container, index) => {
                        const totalCapacity = containerSpecs[container.type].volume * container.quantity;
                        const totalWeightCapacity = containerSpecs[container.type].maxPayload * container.quantity;
                        const spaceUtil = (totalCbm / totalCapacity) * 100;
                        const weightUtil = (totalWeight / totalWeightCapacity) * 100;
                        
                        return (
                          <div key={container.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                            <div className="flex items-center gap-2 mb-3">
                              <select
                                value={container.type}
                                onChange={(e) => updateCustomContainer(container.id, 'type', e.target.value as ContainerType)}
                                className="flex-1 border rounded px-2 py-1 text-xs"
                              >
                                <option value="20GP">20'GP</option>
                                <option value="20HV">20'HV</option>
                                <option value="40GP">40'GP</option>
                                <option value="40HQ">40'HQ</option>
                              </select>
                              <span className="text-xs text-gray-600">×</span>
                              <input
                                type="number"
                                min="1"
                                value={container.quantity}
                                onChange={(e) => updateCustomContainer(container.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-16 border rounded px-2 py-1 text-xs text-center"
                              />
                              {customContainers.length > 1 && (
                                <button
                                  onClick={() => removeCustomContainer(container.id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            
                            {/* Mini Utilization Display */}
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Space</span>
                                  <span className={getUtilizationColor(spaceUtil)}>
                                    {spaceUtil.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(spaceUtil, 100)} 
                                  className="h-1.5"
                                  indicatorClassName={getUtilizationBgColor(spaceUtil)}
                                />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-600">Weight</span>
                                  <span className={getUtilizationColor(weightUtil)}>
                                    {weightUtil.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress 
                                  value={Math.min(weightUtil, 100)} 
                                  className="h-1.5"
                                  indicatorClassName={getUtilizationBgColor(weightUtil)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Add Container Button */}
                      <button
                        onClick={addCustomContainer}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Container
                      </button>
                    </div>
                  )}

                  {/* View Container Specs */}
                  <button
                    onClick={() => setShowContainerDetails(!showContainerDetails)}
                    className="flex items-center justify-between w-full mt-3 pt-3 border-t border-gray-200 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <span>View Detailed Container Specs</span>
                    {showContainerDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {/* Detailed Container Information Table */}
                  {showContainerDetails && (
                    <div className="mt-3 overflow-x-auto">
                      <div className="text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                              <th className="border border-gray-300 px-2 py-1 text-left">Internal Dim (L×W×H)</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'GP</td>
                              <td className="border border-gray-300 px-2 py-1">5.90×2.35×2.39m</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'HV</td>
                              <td className="border border-gray-300 px-2 py-1">5.90×2.35×2.69m</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'GP</td>
                              <td className="border border-gray-300 px-2 py-1">12.03×2.35×2.39m</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'HQ</td>
                              <td className="border border-gray-300 px-2 py-1">12.03×2.35×2.69m</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        <table className="w-full border-collapse mt-3">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                              <th className="border border-gray-300 px-2 py-1 text-right">Volume</th>
                              <th className="border border-gray-300 px-2 py-1 text-right">Max Payload</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'GP</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">28 m³</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">25 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'HV</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">33 m³</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">27 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'GP</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">58 m³</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">26 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'HQ</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">68 m³</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">28 T</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        <table className="w-full border-collapse mt-3">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-2 py-1 text-left">Type</th>
                              <th className="border border-gray-300 px-2 py-1 text-right">Tare Weight</th>
                              <th className="border border-gray-300 px-2 py-1 text-right">Max Gross</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'GP</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">2.3 T</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">27.3 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">20'HV</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">2.5 T</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">29.5 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'GP</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">3.7 T</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">29.7 T</td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-2 py-1">40'HQ</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">4.0 T</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">32.0 T</td>
                            </tr>
                          </tbody>
                        </table>
                        
                        <div className="mt-2 text-gray-500 italic">
                          <p>* Internal dimensions may vary by manufacturer</p>
                          <p>* Tare Weight = Empty container weight</p>
                          <p>* Max Gross = Maximum total weight (container + cargo)</p>
                          <p>* Max Payload = Maximum cargo weight allowed</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 💰 Total */}
                <div className="mb-6">
                  {/* Suggested Quantities - Show common bulk quantity suggestions */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                      <span className="text-yellow-600">💡</span>
                      Suggested Order Adjustments:
                    </h4>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          // Increase all items by 1 carton
                          cartItems.forEach(item => {
                            updateQuantity(item.productName, item.color, item.quantity + item.pcsPerCarton);
                          });
                        }}
                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 flex justify-between items-center text-xs hover:border-orange-500 hover:bg-orange-50 transition-colors"
                      >
                        <span className="font-medium">+1 carton to all items</span>
                        <span className="text-gray-600">Quick Add</span>
                      </button>
                      <button
                        onClick={() => {
                          // Double all quantities
                          cartItems.forEach(item => {
                            updateQuantity(item.productName, item.color, item.quantity * 2);
                          });
                        }}
                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 flex justify-between items-center text-xs hover:border-orange-500 hover:bg-orange-50 transition-colors"
                      >
                        <span className="font-medium">Double all quantities</span>
                        <span className="text-gray-600">×2</span>
                      </button>
                      <button
                        onClick={() => {
                          // Round all items to full cartons
                          cartItems.forEach(item => {
                            const exactCartons = item.quantity / item.pcsPerCarton;
                            if (!Number.isInteger(exactCartons)) {
                              const fullCartons = Math.ceil(exactCartons);
                              updateQuantity(item.productName, item.color, fullCartons * item.pcsPerCarton);
                            }
                          });
                        }}
                        className="w-full bg-white border border-gray-200 rounded px-3 py-1.5 flex justify-between items-center text-xs hover:border-orange-500 hover:bg-orange-50 transition-colors"
                      >
                        <span className="font-medium">Round to full cartons</span>
                        <span className="text-gray-600">Optimize</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-lg">Total:</span>
                    <span className="text-2xl text-orange-600">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>

                {/* 🎯 Action Buttons */}
                <div className="space-y-3">
                  {/* Preview Inquiry Dialog */}
                  <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4" />
                        Preview My Inquiry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto p-2">
                      <DialogHeader className="px-4 pt-2">
                        <DialogTitle>Request for Quotation Preview</DialogTitle>
                        <DialogDescription>
                          Review your inquiry details before submitting.
                        </DialogDescription>
                      </DialogHeader>
                      <InquiryPreviewDialog
                        cartItems={cartItems}
                        totalShipping={totalShipping}
                        planningMode={planningMode}
                        recommendedContainer={recommendedContainer}
                        customContainers={customContainers}
                        containerSpecs={containerSpecs}
                        getTotalPrice={getTotalPrice}
                        calculateItemShipping={calculateItemShipping}
                        calculateContainerUtilization={calculateContainerUtilization}
                        getUtilizationColor={getUtilizationColor}
                        getUtilizationBgColor={getUtilizationBgColor}
                        getUtilizationTip={getUtilizationTip}
                        onClose={() => setPreviewDialogOpen(false)}
                        isOpen={previewDialogOpen}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* 🔥 Removed "Submit Inquiry" button - users must use "Preview My Inquiry" to submit */}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigateTo('home')}
                  >
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}