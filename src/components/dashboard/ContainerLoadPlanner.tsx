import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Container,
  Package,
  Weight,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Save,
  RotateCcw,
  Calculator,
  Boxes,
  ChevronDown,
  ChevronUp,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DraggableContainerCard } from './DraggableContainerCard';

// Container specifications (standard 集装箱规格)
const CONTAINER_TYPES = {
  '20GP': {
    name: '20GP (20ft General Purpose)',
    length: 5.898,
    width: 2.352,
    height: 2.385,
    volume: 33.1, // CBM
    maxWeight: 28000, // kg (含柜重)
    tareWeight: 2300, // kg (柜重)
    maxPayload: 25700, // kg (最大载重)
  },
  '40GP': {
    name: '40GP (40ft General Purpose)',
    length: 12.032,
    width: 2.352,
    height: 2.385,
    volume: 67.5,
    maxWeight: 28000,
    tareWeight: 3700,
    maxPayload: 24300,
  },
  '40HQ': {
    name: '40HQ (40ft High Cube)',
    length: 12.032,
    width: 2.352,
    height: 2.698,
    volume: 76.3,
    maxWeight: 28000,
    tareWeight: 4000,
    maxPayload: 24000,
  },
  '20HV': {
    name: '20HV (20ft High Ventilation)',
    length: 5.898,
    width: 2.352,
    height: 2.698,
    volume: 37.4,
    maxWeight: 28000,
    tareWeight: 2500,
    maxPayload: 25500,
  },
};

interface Product {
  id: string;
  sku?: string; // SKU字段
  productName: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  image?: string;
  // Product dimensions
  length?: number; // cm
  width?: number; // cm
  height?: number; // cm
  weight?: number; // kg per unit (gross weight)
  netWeight?: number; // kg per unit (net weight)
  pcsPerCarton?: number; // pieces per carton
}

interface ContainerLoadPlannerProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: any;
  onSaveQuantities: (updatedProducts: Product[]) => void;
}

export function ContainerLoadPlanner({
  isOpen,
  onClose,
  inquiry,
  onSaveQuantities,
}: ContainerLoadPlannerProps) {
  const dialogContentRef = useRef<HTMLDivElement | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<keyof typeof CONTAINER_TYPES>('40HQ');
  const [products, setProducts] = useState<Product[]>([]);
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingDialog, setIsDraggingDialog] = useState(false);
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  
  // Container order state
  const [containerOrder, setContainerOrder] = useState<(keyof typeof CONTAINER_TYPES)[]>([
    '20GP',
    '40GP',
    '40HQ',
    '20HV',
  ]);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Planning mode state
  const [planningMode, setPlanningMode] = useState<'automatic' | 'custom'>('automatic');
  
  // View detailed specs state
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
  
  // State to track which containers have expanded product lists
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(new Set());
  
  // Custom containers state with product allocation
  type ContainerProduct = {
    sku: string;
    productName: string;
    quantity: number;
    unitVolume: number;
    unitWeight: number;
    totalVolume: number;
    totalWeight: number;
  };

  const [customContainers, setCustomContainers] = useState<Array<{
    id: string;
    type: keyof typeof CONTAINER_TYPES;
    quantity: number;
    products?: ContainerProduct[]; // 装载的产品清单
    actualVolume?: number; // 实际装载体积
    actualWeight?: number; // 实际装载重量
  }>>([
    { id: '1', type: '40HQ', quantity: 1 }
  ]);

  useEffect(() => {
    if (inquiry?.products) {
      // Add default dimensions and weight if not present
      const productsWithDefaults = inquiry.products.map((p: Product) => ({
        ...p,
        length: p.length || 30, // default 30cm
        width: p.width || 30,
        height: p.height || 30,
        weight: p.weight || 1.5, // default 1.5kg gross weight
        netWeight: p.netWeight || 1.3, // default 1.3kg net weight
        pcsPerCarton: p.pcsPerCarton || 12, // default 12 pcs per carton
      }));
      setProducts(productsWithDefaults);
      setOriginalProducts(JSON.parse(JSON.stringify(productsWithDefaults)));
    }
  }, [inquiry]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const body = document.body;
    const html = document.documentElement;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      html.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset({ x: 0, y: 0 });
      setIsDraggingDialog(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDraggingDialog) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const content = dialogContentRef.current;
      if (!content) {
        return;
      }

      const nextX = dragStartOffset.x + (event.clientX - dragStartMouse.x);
      const nextY = dragStartOffset.y + (event.clientY - dragStartMouse.y);
      const rect = content.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const minMargin = 32;
      const baseCenterX = viewportWidth / 2;
      const baseCenterY = viewportHeight / 2;

      const maxMoveX = Math.max(0, (viewportWidth - rect.width) / 2 - minMargin);
      const maxMoveY = Math.max(0, (viewportHeight - rect.height) / 2 - minMargin);

      const clampedCenterX = baseCenterX + Math.min(Math.max(nextX, -maxMoveX), maxMoveX);
      const clampedCenterY = baseCenterY + Math.min(Math.max(nextY, -maxMoveY), maxMoveY);

      setDragOffset({
        x: clampedCenterX - baseCenterX,
        y: clampedCenterY - baseCenterY,
      });
    };

    const onMouseUp = () => {
      setIsDraggingDialog(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragStartMouse.x, dragStartMouse.y, dragStartOffset.x, dragStartOffset.y, isDraggingDialog]);

  const dialogTransform = useMemo(
    () => `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`,
    [dragOffset.x, dragOffset.y],
  );

  const calculateTotals = () => {
    let totalVolume = 0;
    let totalWeight = 0;

    products.forEach(product => {
      const unitVolume = ((product.length || 0) * (product.width || 0) * (product.height || 0)) / 1000000; // cm³ to m³
      totalVolume += unitVolume * product.quantity;
      totalWeight += (product.weight || 0) * product.quantity;
    });

    return { totalVolume, totalWeight };
  };

  const { totalVolume, totalWeight } = calculateTotals();
  const container = CONTAINER_TYPES[selectedContainer];
  const volumeUtilization = (totalVolume / container.volume) * 100;
  const weightUtilization = (totalWeight / container.maxPayload) * 100;
  const isOverWeight = totalWeight > container.maxPayload;
  const isOverVolume = totalVolume > container.volume;

  // Suggest optimal container
  const getSuggestedContainer = (): keyof typeof CONTAINER_TYPES => {
    for (const [key, spec] of Object.entries(CONTAINER_TYPES)) {
      if (totalVolume <= spec.volume && totalWeight <= spec.maxPayload) {
        return key as keyof typeof CONTAINER_TYPES;
      }
    }
    return '40HQ'; // Default to largest
  };

  const suggestedContainer = getSuggestedContainer();

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, quantity: newQuantity } : p))
    );
  };

  const updateDimensions = (productId: string, field: string, value: number) => {
    if (value < 0) return;
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, [field]: value } : p))
    );
  };

  const removeProductItem = (productId: string) => {
    setProducts(prev => {
      const remaining = prev.filter(p => p.id !== productId);
      if (remaining.length === 0) {
        toast.error('At least one item is required');
        return prev;
      }
      toast.success('Item removed');
      return remaining;
    });
  };

  const handleReset = () => {
    setProducts(JSON.parse(JSON.stringify(originalProducts)));
    toast.success('Reset to original quantities');
  };

  const handleSave = () => {
    onSaveQuantities(products);
    toast.success('Container plan saved successfully');
    onClose();
  };

  const handleResetPosition = () => {
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDialogHeaderMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, a, [role="button"]')) {
      return;
    }
    event.preventDefault();
    setIsDraggingDialog(true);
    setDragStartMouse({ x: event.clientX, y: event.clientY });
    setDragStartOffset(dragOffset);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-600';
    if (percentage > 90) return 'text-orange-500';
    if (percentage > 75) return 'text-green-600';
    return 'text-blue-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-600';
    if (percentage > 90) return 'bg-orange-500';
    if (percentage > 75) return 'bg-green-600';
    return 'bg-blue-600';
  };

  // Move container in order
  const moveContainer = useCallback((dragIndex: number, hoverIndex: number) => {
    setContainerOrder(prev => {
      const newOrder = [...prev];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      return newOrder;
    });
  }, []);

  // Drag handlers for native HTML5 drag and drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveContainer(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDrop = (index: number) => {
    setDraggedIndex(null);
  };

  // Custom container functions
  const addCustomContainer = () => {
    const newId = (parseInt(customContainers[customContainers.length - 1]?.id || '0') + 1).toString();
    const newContainers = [...customContainers, { id: newId, type: '20GP' as keyof typeof CONTAINER_TYPES, quantity: 1 }];
    const updated = allocateProductsToContainers(products, newContainers);
    setCustomContainers(updated);
  };

  const removeCustomContainer = (id: string) => {
    if (customContainers.length > 1) {
      const newContainers = customContainers.filter(c => c.id !== id);
      const updated = allocateProductsToContainers(products, newContainers);
      setCustomContainers(updated);
    } else {
      toast.error('At least one container is required');
    }
  };

  const updateCustomContainer = (id: string, field: 'type' | 'quantity', value: any) => {
    const newContainers = customContainers.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    );
    const updated = allocateProductsToContainers(products, newContainers);
    setCustomContainers(updated);
  };

  // 智能装柜分配算法 (First Fit Decreasing)
  const allocateProductsToContainers = useCallback((currentProducts: Product[], currentContainers: typeof customContainers) => {
    if (!currentProducts || currentProducts.length === 0) return currentContainers;
    
    console.log('🚀 Allocating products to containers:', {
      productsCount: currentProducts.length,
      containersCount: currentContainers.length,
      products: currentProducts.map(p => ({ name: p.productName, qty: p.quantity, sku: p.sku || p.id }))
    });

    // 准备产品列表（按体积从大到小排序）
    const sortedProducts = currentProducts
      .map(p => {
        const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000; // m³
        const weight = (p.weight || 1.5) * (p.quantity || 0); // kg
        const totalVolume = volume * (p.quantity || 0);
        
        return {
          sku: p.sku || p.id || p.productName.substring(0, 10), // 使用sku, id或产品名称前10个字符作为标识
          productName: p.productName,
          quantity: p.quantity || 0,
          unitVolume: volume,
          unitWeight: p.weight || 1.5,
          totalVolume: totalVolume,
          totalWeight: weight,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume); // 按总体积从大到小排序

    // 展开柜子（如果quantity > 1，展开成多个独立的柜子）
    const expandedContainers: Array<{
      id: string;
      type: keyof typeof CONTAINER_TYPES;
      products: ContainerProduct[];
      currentVolume: number;
      currentWeight: number;
      capacity: { volume: number; weight: number };
    }> = [];

    currentContainers.forEach((container, idx) => {
      for (let i = 0; i < container.quantity; i++) {
        const spec = CONTAINER_TYPES[container.type];
        expandedContainers.push({
          id: `${container.id}-${i}`,
          type: container.type,
          products: [],
          currentVolume: 0,
          currentWeight: 0,
          capacity: {
            volume: spec.volume,
            weight: spec.maxPayload,
          },
        });
      }
    });

    // FFD算法：将每个产品放入第一个能装下的柜子
    sortedProducts.forEach(product => {
      let remainingQty = product.quantity;
      
      for (const container of expandedContainers) {
        if (remainingQty <= 0) break;

        const availableVolume = container.capacity.volume - container.currentVolume;
        const availableWeight = container.capacity.weight - container.currentWeight;

        // 计算这个柜子能装多少件
        const maxByVolume = Math.floor(availableVolume / product.unitVolume);
        const maxByWeight = Math.floor(availableWeight / product.unitWeight);
        const canFit = Math.min(maxByVolume, maxByWeight, remainingQty);

        if (canFit > 0) {
          container.products.push({
            sku: product.sku,
            productName: product.productName,
            quantity: canFit,
            unitVolume: product.unitVolume,
            unitWeight: product.unitWeight,
            totalVolume: product.unitVolume * canFit,
            totalWeight: product.unitWeight * canFit,
          });

          container.currentVolume += product.unitVolume * canFit;
          container.currentWeight += product.unitWeight * canFit;
          remainingQty -= canFit;
        }
      }

      // 如果还有剩余，说明柜子不够
      if (remainingQty > 0) {
        console.warn(`Product ${product.sku} has ${remainingQty} units that couldn't fit`);
      }
    });

    // 将展开的柜子合并回原来的分组
    const updatedContainers = currentContainers.map(container => {
      const containerExpanded = expandedContainers.filter(ec => 
        ec.id.startsWith(container.id + '-')
      );

      // 合并所有产品
      const allProducts: { [key: string]: ContainerProduct } = {};
      let totalActualVolume = 0;
      let totalActualWeight = 0;

      containerExpanded.forEach(ec => {
        ec.products.forEach(p => {
          if (allProducts[p.sku]) {
            allProducts[p.sku].quantity += p.quantity;
            allProducts[p.sku].totalVolume += p.totalVolume;
            allProducts[p.sku].totalWeight += p.totalWeight;
          } else {
            allProducts[p.sku] = { ...p };
          }
        });
        totalActualVolume += ec.currentVolume;
        totalActualWeight += ec.currentWeight;
      });

      return {
        ...container,
        products: Object.values(allProducts),
        actualVolume: totalActualVolume,
        actualWeight: totalActualWeight,
      };
    });

    console.log('✅ Allocation complete:', updatedContainers.map(c => ({
      id: c.id,
      type: c.type,
      quantity: c.quantity,
      productsCount: c.products?.length || 0,
      actualVolume: c.actualVolume,
      actualWeight: c.actualWeight
    })));

    return updatedContainers;
  }, []);

  // 智能自动装柜方案生成（Automatic模式）
  const generateAutomaticLoadingPlan = useCallback(() => {
    if (!products || products.length === 0) return [];
    
    console.log('🤖 Generating automatic loading plan...');
    
    // 准备产品列表
    const sortedProducts = products
      .map(p => {
        const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000;
        const weight = (p.weight || 1.5);
        const netWeight = p.netWeight || 1.3;
        const totalVolume = volume * (p.quantity || 0);
        const totalWeight = weight * (p.quantity || 0);
        
        return {
          sku: p.sku || p.id || p.productName.substring(0, 10),
          productName: p.productName,
          quantity: p.quantity || 0,
          unitVolume: volume,
          unitWeight: weight,
          netWeight: netWeight,
          totalVolume: totalVolume,
          totalWeight: totalWeight,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume);

    // 定义柜子优先级：优先使用小柜子
    const containerPriority: (keyof typeof CONTAINER_TYPES)[] = ['20GP', '20HV', '40GP', '40HQ'];
    
    // 装柜结果
    const containers: Array<{
      id: string;
      type: keyof typeof CONTAINER_TYPES;
      products: ContainerProduct[];
      currentVolume: number;
      currentWeight: number;
      capacity: { volume: number; weight: number };
    }> = [];

    let remainingProducts = [...sortedProducts];
    let containerIdCounter = 1;

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
        id: `auto-${containerIdCounter++}`,
        type: selectedType,
        products: [] as ContainerProduct[],
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
          newContainer.products.push({
            sku: product.sku,
            productName: product.productName,
            quantity: canFit,
            unitVolume: product.unitVolume,
            unitWeight: product.unitWeight,
            totalVolume: product.unitVolume * canFit,
            totalWeight: product.unitWeight * canFit,
          });

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

    console.log('✅ Automatic plan generated:', containers.map(c => ({
      id: c.id,
      type: c.type,
      productsCount: c.products.length,
      volume: c.currentVolume.toFixed(2),
      weight: c.currentWeight.toFixed(2)
    })));

    return containers;
  }, [products]);

  // 自动装柜方案
  const [automaticPlan, setAutomaticPlan] = useState<ReturnType<typeof generateAutomaticLoadingPlan>>([]);

  // 当产品变化或切换到Automatic模式时，生成自动装柜方案
  useEffect(() => {
    if (products && products.length > 0 && planningMode === 'automatic') {
      const plan = generateAutomaticLoadingPlan();
      setAutomaticPlan(plan);
    }
  }, [products, planningMode, generateAutomaticLoadingPlan]);

  // 当产品变化或切换到Custom模式时，自动重新分配
  useEffect(() => {
    if (products && products.length > 0 && customContainers.length > 0 && planningMode === 'custom') {
      const updatedContainers = allocateProductsToContainers(products, customContainers);
      // 只有当产品列表实际变化时才更新
      setCustomContainers(updatedContainers);
    }
  }, [products, planningMode]);

  // Calculate totals for custom containers
  const calculateCustomContainerUtilization = () => {
    let totalCapacityVolume = 0;
    let totalCapacityWeight = 0;

    customContainers.forEach(container => {
      const spec = CONTAINER_TYPES[container.type];
      totalCapacityVolume += spec.volume * container.quantity;
      totalCapacityWeight += spec.maxPayload * container.quantity;
    });

    const volumeUtil = (totalVolume / totalCapacityVolume) * 100;
    const weightUtil = (totalWeight / totalCapacityWeight) * 100;

    return { 
      volumeUtil, 
      weightUtil,
      totalCapacityVolume,
      totalCapacityWeight
    };
  };

  const customUtilization = calculateCustomContainerUtilization();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={dialogContentRef}
        style={{ transform: dialogTransform }}
        onWheelCapture={(event) => event.stopPropagation()}
        className="!top-1/2 !left-1/2 w-[min(1520px,calc(100vw-120px))] max-w-none !h-[calc(100dvh-120px)] !max-h-[calc(100dvh-120px)] min-h-[560px] p-0 flex flex-col overflow-hidden overscroll-contain rounded-xl"
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div
            onMouseDown={handleDialogHeaderMouseDown}
            className={`px-8 py-5 border-b border-gray-200 bg-white flex-shrink-0 select-none ${isDraggingDialog ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-[#F96302] flex items-center gap-2">
                  <Container className="w-6 h-6" />
                  Container Load Planner
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Inquiry: {inquiry?.id} - Optimize your container loading
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetPosition}
                className="h-9 border-gray-300 bg-white/90"
                title="Reset dialog position"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Position
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden bg-gray-50/40">
            <div className="flex h-full min-h-0">
            {/* Left: Product List */}
            <div className="flex-[1.9] border-r border-gray-200 flex flex-col bg-white min-w-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F96302]" />
                  Products ({products.length})
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-3">
                {products.map((product, index) => {
                  const pcsPerCarton = product.pcsPerCarton || 1;
                  const isExactMultiple = product.quantity % pcsPerCarton === 0;
                  const totalCartons = Math.ceil(product.quantity / pcsPerCarton);
                  const exactCartons = Math.floor(product.quantity / pcsPerCarton);
                  
                  // Calculate suggested quantities
                  const lowerSuggestion = exactCartons * pcsPerCarton;
                  const upperSuggestion = (exactCartons + 1) * pcsPerCarton;
                  
                  const totalGrossWeight = (product.weight || 0) * product.quantity;
                  const totalNetWeight = (product.netWeight || 0) * product.quantity;
                  const totalVolume = (((product.length || 0) * (product.width || 0) * (product.height || 0) * product.quantity) / 1000000);

                  // Check if this is one of the last 3 products - popup upward
                  const isNearBottom = index >= products.length - 3;

                  return (
                    <Card
                      key={product.id}
                      className="p-4 border border-gray-200 hover:border-[#F96302] transition-all shadow-sm"
                    >
                      <div className="space-y-2">
                        {/* Product Name */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm text-gray-900">
                            {index + 1}. {product.productName}
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeProductItem(product.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            title="Remove item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* All Fields in One Row - Compact Layout with Center Alignment */}
                        <div className="grid grid-cols-7 gap-1.5 text-xs">
                          {/* Quantity */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">Qty</Label>
                            <div className="flex items-center gap-0.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(product.id, Math.max(0, product.quantity - pcsPerCarton))}
                                className="h-8 w-7 p-0 text-xs"
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={product.quantity}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                                className="h-8 text-center text-xs px-1 w-24"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(product.id, product.quantity + pcsPerCarton)}
                                className="h-8 w-7 p-0 text-xs"
                              >
                                +
                              </Button>
                            </div>
                          </div>

                          {/* Pcs/Ctn */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">Pcs/Ctn</Label>
                            <Input
                              type="number"
                              value={product.pcsPerCarton}
                              onChange={(e) => updateDimensions(product.id, 'pcsPerCarton', parseInt(e.target.value) || 1)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>

                          {/* L */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">L(cm)</Label>
                            <Input
                              type="number"
                              value={product.length}
                              onChange={(e) => updateDimensions(product.id, 'length', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>

                          {/* W */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">W(cm)</Label>
                            <Input
                              type="number"
                              value={product.width}
                              onChange={(e) => updateDimensions(product.id, 'width', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>

                          {/* H */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">H(cm)</Label>
                            <Input
                              type="number"
                              value={product.height}
                              onChange={(e) => updateDimensions(product.id, 'height', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>

                          {/* G.W */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">G.W(kg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={product.weight}
                              onChange={(e) => updateDimensions(product.id, 'weight', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>

                          {/* N.W */}
                          <div>
                            <Label className="text-[10px] text-gray-500 mb-0.5 block text-center">N.W(kg)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={product.netWeight}
                              onChange={(e) => updateDimensions(product.id, 'netWeight', parseFloat(e.target.value) || 0)}
                              className="h-8 text-xs px-1 text-center"
                            />
                          </div>
                        </div>

                        {/* Calculated Totals - One Line */}
                        <div className="flex items-center gap-4 pt-1 border-t text-[11px]">
                          {/* Cartons with Warning/Suggestions */}
                          <div className="text-gray-600 relative">
                            <span className="text-gray-500">Ctns:</span>{' '}
                            {isExactMultiple ? (
                              <span className="font-semibold text-gray-900">{totalCartons}</span>
                            ) : (
                              <div 
                                className="inline-block relative"
                                onMouseEnter={() => setHoveredProductId(product.id)}
                                onMouseLeave={() => setHoveredProductId(null)}
                              >
                                <span className="font-semibold text-orange-600 cursor-pointer">{totalCartons}⚠</span>
                                {hoveredProductId === product.id && (
                                  <div className={`absolute left-0 z-50 ${
                                    isNearBottom 
                                      ? 'bottom-full pb-1' 
                                      : 'top-full pt-1'
                                  }`}>
                                    <div className="bg-white border-2 border-orange-400 rounded shadow-lg p-2 whitespace-nowrap">
                                      <div className="text-orange-700 font-semibold mb-1">Not a full carton!</div>
                                      <div className="text-xs space-y-1">
                                        <button
                                          onClick={() => {
                                            updateQuantity(product.id, lowerSuggestion);
                                            setHoveredProductId(null);
                                          }}
                                          className="block w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                                        >
                                          ↓ {lowerSuggestion} pcs ({exactCartons} ctns)
                                        </button>
                                        <button
                                          onClick={() => {
                                            updateQuantity(product.id, upperSuggestion);
                                            setHoveredProductId(null);
                                          }}
                                          className="block w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                                        >
                                          ↑ {upperSuggestion} pcs ({exactCartons + 1} ctns)
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-500">Vol:</span>{' '}
                            <span className="font-semibold text-gray-900">{totalVolume.toFixed(2)} m³</span>
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-500">G.W:</span>{' '}
                            <span className="font-semibold text-gray-900">{totalGrossWeight.toFixed(1)} kg</span>
                          </div>
                          <div className="text-gray-600">
                            <span className="text-gray-500">N.W:</span>{' '}
                            <span className="font-semibold text-gray-900">{totalNetWeight.toFixed(1)} kg</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Container Summary */}
            <div className="w-[460px] flex flex-col bg-white min-h-0">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#F96302]" />
                  Container Analysis
                </h3>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-5">
                {/* Order Summary */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Order Summary
                  </Label>
                  <Card className="p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#F96302]" />
                      <span className="font-semibold text-sm">Shipping Summary</span>
                    </div>
                    <div className="text-xs">
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Total Cartons:</span>
                        <span className="font-semibold text-[#F96302]">
                          {products.reduce((sum, p) => sum + Math.ceil(p.quantity / (p.pcsPerCarton || 1)), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Total CBM:</span>
                        <span className="font-semibold text-[#F96302]">{totalVolume.toFixed(3)} m³</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Total Gross Weight:</span>
                        <span className="font-semibold text-[#F96302]">{totalWeight.toFixed(2)} kg</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Total Net Weight:</span>
                        <span className="font-semibold text-[#F96302]">
                          {products.reduce((sum, p) => sum + (p.netWeight || 0) * p.quantity, 0).toFixed(2)} kg
                        </span>
                      </div>
                    </div>
                    {/* Recommended Containers */}
                    {automaticPlan.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Boxes className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-sm text-blue-900">Recommended Containers</span>
                        </div>
                        <div className="space-y-1">
                          {(() => {
                            // 统计各种柜型的数量
                            const containerCounts: { [key: string]: number } = {};
                            automaticPlan.forEach(container => {
                              containerCounts[container.type] = (containerCounts[container.type] || 0) + 1;
                            });
                            
                            return Object.entries(containerCounts).map(([type, count]) => (
                              <div key={type} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600">{type}:</span>
                                <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  {count} × {type}
                                </span>
                              </div>
                            ));
                          })()}
                          
                          {/* Total */}
                          <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gray-100">
                            <span className="text-gray-700 font-semibold">Total:</span>
                            <span className="font-semibold text-blue-700">
                              {automaticPlan.length} {automaticPlan.length === 1 ? 'Container' : 'Containers'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                <Separator className="my-4" />

                {/* Container Planning Mode */}
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                    <Truck className="w-4 h-4 inline mr-2 text-[#F96302]" />
                    Container Planning
                  </Label>
                  <Button
                    variant="default"
                    className="w-full border-2 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled
                  >
                    Automatic
                  </Button>

                  {/* Recommended Section - Only in Automatic Mode */}
                  {planningMode === 'automatic' && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-semibold text-gray-700">Recommended:</div>
                      
                      {/* 显示每个柜子的装载方案 */}
                      {automaticPlan.map((container, index) => {
                        const spec = CONTAINER_TYPES[container.type];
                        const volumeUtil = (container.currentVolume / spec.volume) * 100;
                        const weightUtil = (container.currentWeight / spec.maxPayload) * 100;
                        const isExpanded = expandedContainers.has(container.id);

                        return (
                          <div key={container.id} className="bg-blue-50 border-2 border-blue-200 rounded p-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-gray-600">Container #{index + 1}</span>
                              <Badge className="bg-blue-600 text-white">
                                1 × {container.type}
                              </Badge>
                            </div>
                            
                            {/* Space Utilization */}
                            <div className="mb-1.5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 flex items-center gap-1">
                                  <Boxes className="w-3 h-3" />
                                  Space
                                </span>
                                <span className={`font-semibold ${getUtilizationColor(volumeUtil)}`}>
                                  {container.currentVolume.toFixed(2)}/{spec.volume} m³ ({volumeUtil.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(volumeUtil, 100)} 
                                className="h-2" 
                              />
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                +{(spec.volume - container.currentVolume).toFixed(2)} m³ left
                              </div>
                            </div>

                            {/* Weight Utilization */}
                            <div className="mb-1.5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 flex items-center gap-1">
                                  <Weight className="w-3 h-3" />
                                  Weight
                                </span>
                                <span className={`font-semibold ${getUtilizationColor(weightUtil)}`}>
                                  {(container.currentWeight / 1000).toFixed(2)}/{(spec.maxPayload / 1000).toFixed(1)} T ({weightUtil.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(weightUtil, 100)} 
                                className="h-2" 
                              />
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                +{((spec.maxPayload - container.currentWeight) / 1000).toFixed(2)} T left
                              </div>
                            </div>

                            {/* Loading List Toggle */}
                            <div className="pt-1.5 border-t border-blue-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-xs text-blue-700 hover:bg-blue-100 flex items-center justify-between px-2"
                                onClick={() => {
                                  const newExpanded = new Set(expandedContainers);
                                  if (isExpanded) {
                                    newExpanded.delete(container.id);
                                  } else {
                                    newExpanded.add(container.id);
                                  }
                                  setExpandedContainers(newExpanded);
                                }}
                              >
                                <span>Loading List ({container.products.length} SKUs)</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </Button>

                              {/* Product List */}
                              {isExpanded && (
                                <div className="mt-1.5 space-y-1 max-h-48 overflow-y-auto">
                                  {container.products.map((product, pIdx) => (
                                    <div key={pIdx} className="bg-white rounded p-2 text-[10px] border border-blue-100">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-gray-700 flex-1 pr-2">{product.productName}</span>
                                        <span className="text-gray-500 text-[9px]">SKU: {product.sku}</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-1 text-gray-600">
                                        <div>
                                          <span className="text-gray-400">Qty:</span> {product.quantity}
                                        </div>
                                        <div>
                                          <span className="text-gray-400">Vol:</span> {product.totalVolume.toFixed(2)} m³
                                        </div>
                                        <div>
                                          <span className="text-gray-400">G.W:</span> {product.totalWeight.toFixed(1)} kg
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* View Detailed Container Specs - Expandable */}
                <div>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-between"
                    onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}
                  >
                    <span className="flex items-center gap-2">
                      <Container className="w-4 h-4" />
                      View Detailed Container Specs
                    </span>
                    {showDetailedSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  {showDetailedSpecs && (
                    <div className="mt-3 space-y-3 border-2 border-gray-200 rounded p-3 bg-white">
                      {/* Internal Dimensions Table */}
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1.5">Internal Dim (L×W×H)</div>
                        <div className="border-2 border-gray-300 rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2 border-b-2 border-r border-gray-300">Type</th>
                                <th className="text-right p-2 border-b-2 border-gray-300">Internal Dim (L×W×H)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'GP</td>
                                <td className="p-2 text-right">5.90×2.35×2.39m</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'HV</td>
                                <td className="p-2 text-right">5.90×2.35×2.69m</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">40'GP</td>
                                <td className="p-2 text-right">12.03×2.35×2.39m</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-gray-300">40'HQ</td>
                                <td className="p-2 text-right">12.03×2.35×2.69m</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Volume and Max Payload Table */}
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1.5">Volume & Max Payload</div>
                        <div className="border-2 border-gray-300 rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2 border-b-2 border-r border-gray-300">Type</th>
                                <th className="text-right p-2 border-b-2 border-r border-gray-300">Volume</th>
                                <th className="text-right p-2 border-b-2 border-gray-300">Max Payload</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'GP</td>
                                <td className="p-2 text-right border-r border-gray-300">28 m³</td>
                                <td className="p-2 text-right">25 T</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'HV</td>
                                <td className="p-2 text-right border-r border-gray-300">33 m³</td>
                                <td className="p-2 text-right">27 T</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">40'GP</td>
                                <td className="p-2 text-right border-r border-gray-300">58 m³</td>
                                <td className="p-2 text-right">26 T</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-gray-300">40'HQ</td>
                                <td className="p-2 text-right border-r border-gray-300">68 m³</td>
                                <td className="p-2 text-right">28 T</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Tare Weight and Max Gross Table */}
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1.5">Tare Weight & Max Gross</div>
                        <div className="border-2 border-gray-300 rounded overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-2 border-b-2 border-r border-gray-300">Type</th>
                                <th className="text-right p-2 border-b-2 border-r border-gray-300">Tare Weight</th>
                                <th className="text-right p-2 border-b-2 border-gray-300">Max Gross</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'GP</td>
                                <td className="p-2 text-right border-r border-gray-300">2.3 T</td>
                                <td className="p-2 text-right">27.3 T</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">20'HV</td>
                                <td className="p-2 text-right border-r border-gray-300">2.5 T</td>
                                <td className="p-2 text-right">29.5 T</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                <td className="p-2 border-r border-gray-300">40'GP</td>
                                <td className="p-2 text-right border-r border-gray-300">3.7 T</td>
                                <td className="p-2 text-right">29.7 T</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-r border-gray-300">40'HQ</td>
                                <td className="p-2 text-right border-r border-gray-300">4.0 T</td>
                                <td className="p-2 text-right">32.0 T</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div className="text-[10px] text-gray-500 italic space-y-0.5 pt-1.5 border-t border-gray-200">
                        <div>* Internal dimensions may vary by manufacturer</div>
                        <div>* Tare Weight = Empty container weight</div>
                        <div>* Tare Weight = Empty container weight</div>
                        <div>* Max Gross = Maximum total weight (container + cargo)</div>
                        <div>* Max Payload = Maximum cargo weight allowed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="px-8 py-4 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleResetPosition} className="border-2">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Position
            </Button>
            <Button variant="outline" onClick={handleReset} className="border-2">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} className="bg-[#F96302] hover:bg-[#E05502]">
              <Save className="w-4 h-4 mr-2" />
              Save Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
