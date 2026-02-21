import { useState, useEffect } from 'react';
import { X, Play, ChevronRight, ChevronLeft, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { ProductDetail } from '../data/productDetailsData';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getAccessoriesForProduct } from '../data/accessoryProductsData';
import { useRouter } from '../contexts/RouterContext';

interface ProductDetailDialogProps {
  product: ProductDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowQuantityAlert: (item: any) => void;
}

// Mock data for customers also viewed
const customersAlsoViewed = [
  {
    id: 1,
    name: 'Home Decorators Collection Collette 72 in...',
    image: 'https://images.unsplash.com/photo-1600488999585-e4364713b90a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eXxlbnwxfHx8fDE3NjEyNDU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1429.00,
    wasPrice: 1599.00,
    rating: 4.3,
    reviews: 187
  },
  {
    id: 2,
    name: 'ARIEL Hepburn 72 in. W x 22 in. D x 36 in. H Double...',
    image: 'https://images.unsplash.com/photo-1618231308504-0a2ceebee131?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMGZhdWNldHxlbnwxfHx8fDE3NjEyNjc5NzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1899.00,
    wasPrice: 2579.00,
    rating: 4.6,
    reviews: 534
  },
  {
    id: 3,
    name: 'Home Decorators Collection Danby 72 in...',
    image: 'https://images.unsplash.com/photo-1563520240344-52b067aa5f84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZpeHR1cmVzfGVufDF8fHx8MTc2MTIzODY2MHww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1559.00,
    wasPrice: 2599.00,
    rating: 4.8,
    reviews: 68
  },
  {
    id: 4,
    name: 'ARIEL Cambridge 72 in. W x 22 in. D x 36 in. H Double...',
    image: 'https://images.unsplash.com/photo-1657558665549-bd7d82afed8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHBhcnRzfGVufDF8fHx8MTc2MTI2Nzk3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1967.00,
    wasPrice: 3597.00,
    rating: 4.5,
    reviews: 385
  },
  {
    id: 5,
    name: 'Home Decorators Collection Talmore 72 in...',
    image: 'https://images.unsplash.com/photo-1654440122140-f1fc995ddb34?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5rJTIwZHJhaW58ZW58MXx8fHwxNzYxMjY3OTc1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1234.00,
    wasPrice: 1899.00,
    rating: 4.2,
    reviews: 93
  },
  {
    id: 6,
    name: 'Home Decorators Collection Sonoma 72 in...',
    image: 'https://images.unsplash.com/photo-1758400826781-a350d02cda6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMHN1cHBseXxlbnwxfHx8fDE3NjEyNjc5NzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1819.00,
    wasPrice: 2399.00,
    rating: 4.7,
    reviews: 2263
  },
  {
    id: 7,
    name: 'Home Decorators Collection Fremont 72 in...',
    image: 'https://images.unsplash.com/photo-1600488999585-e4364713b90a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMHZhbml0eXxlbnwxfHx8fDE3NjEyNDU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    price: 1079.00,
    wasPrice: 1799.00,
    rating: 4.9,
    reviews: 235
  }
];

// Mock data for customer reviews
const customerReviews = [
  {
    id: 1,
    userName: 'John Smith',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-10-15',
    verified: true,
    comment: 'Excellent quality! The material is top-notch and the finish is perfect. Delivery was fast and packaging was secure. Highly recommend for bulk orders.',
    helpful: 45
  },
  {
    id: 2,
    userName: 'Sarah Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 4,
    date: '2024-10-10',
    verified: true,
    comment: 'Good product overall. The specifications matched exactly what was described. Only minor issue was slight color variation in one batch, but customer service resolved it quickly.',
    helpful: 32
  },
  {
    id: 3,
    userName: 'Michael Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-10-05',
    verified: true,
    comment: 'Been ordering from COSUN for 2 years now. Consistent quality, competitive pricing, and reliable shipping. Perfect for our B2B needs.',
    helpful: 58
  },
  {
    id: 4,
    userName: 'Emily Rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    date: '2024-09-28',
    verified: true,
    comment: 'Outstanding! The packaging information was accurate and helped us calculate shipping costs precisely. Will definitely order again.',
    helpful: 27
  },
  {
    id: 5,
    userName: 'David Kim',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 4,
    date: '2024-09-20',
    verified: false,
    comment: 'Great value for money. Product meets industrial standards. The per-carton pricing makes it easy to manage inventory.',
    helpful: 19
  }
];

export function ProductDetailDialog({ 
  product, 
  open, 
  onOpenChange,
  onShowQuantityAlert 
}: ProductDetailDialogProps) {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorQuantities, setColorQuantities] = useState<{ [color: string]: number }>({});
  const { addToCart } = useCart();
  const [viewedScrollPosition, setViewedScrollPosition] = useState(0);
  const [accessoryScrollPosition, setAccessoryScrollPosition] = useState(0);
  const [suggestedQuantities, setSuggestedQuantities] = useState<{ qty: number; cartons: number }[]>([]);
  const [selectedSuggestedQty, setSelectedSuggestedQty] = useState<number | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [nestedProduct, setNestedProduct] = useState<ProductDetail | null>(null);
  const [nestedDialogOpen, setNestedDialogOpen] = useState(false);
  const router = useRouter();

  // Reset state when dialog closes or product changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setOrderQuantity(1);
      setSelectedColors([]);
      setColorQuantities({});
      setSuggestedQuantities([]);
      setSelectedSuggestedQty(null);
      setShowVideo(false);
      setSelectedMediaIndex(0);
      setNestedProduct(null);
      setNestedDialogOpen(false);
    }
    onOpenChange(newOpen);
  };

  // Handler for opening accessory product details
  const handleAccessoryClick = (accessoryDetails: ProductDetail) => {
    setNestedProduct(accessoryDetails);
    setNestedDialogOpen(true);
  };

  // Update suggested quantities when orderQuantity changes
  useEffect(() => {
    if (product && orderQuantity > 0) {
      const isNotFullCarton = orderQuantity % product.pcsPerCarton !== 0;
      
      if (isNotFullCarton) {
        const suggestedLower = Math.floor(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        const suggestedHigher = Math.ceil(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        
        setSuggestedQuantities([
          { 
            qty: suggestedLower || product.pcsPerCarton, 
            cartons: (suggestedLower || product.pcsPerCarton) / product.pcsPerCarton 
          },
          { 
            qty: suggestedHigher, 
            cartons: suggestedHigher / product.pcsPerCarton 
          }
        ]);
      }
    }
  }, [orderQuantity, product]);

  if (!product) return null;

  const handleAddToCart = () => {
    // Handle products WITH color options
    if (product.colorOptions && product.colorOptions.length > 0) {
      if (selectedColors.length === 0) {
        toast.error('Please select at least one color');
        return;
      }
      
      // Check for non-full cartons
      const nonFullCartonColors = selectedColors.filter(colorName => {
        const quantity = colorQuantities[colorName] || 1;
        return quantity % product.pcsPerCarton !== 0;
      });
      
      if (nonFullCartonColors.length > 0) {
        const firstNonFullColor = nonFullCartonColors[0];
        const firstNonFullQuantity = colorQuantities[firstNonFullColor] || 1;
        const suggestedLower = Math.floor(firstNonFullQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        const suggestedHigher = Math.ceil(firstNonFullQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        
        onShowQuantityAlert({
          productName: product.name,
          color: firstNonFullColor,
          quantity: firstNonFullQuantity,
          pcsPerCarton: product.pcsPerCarton,
          suggestedLower: suggestedLower || product.pcsPerCarton,
          suggestedHigher: suggestedHigher,
        });
        return;
      }
      
      // All quantities are full cartons, add to cart
      selectedColors.forEach((colorName) => {
        const colorOption = product.colorOptions!.find(c => c.name === colorName);
        if (!colorOption) return;
        
        const quantity = colorQuantities[colorName] || 1;
        
        addToCart({
          productName: product.name,
          image: product.image,
          material: product.material,
          color: colorName,
          specification: product.specification,
          unitPrice: colorOption.unitPrice,
          quantity: quantity,
          pcsPerCarton: product.pcsPerCarton,
          cartonGrossWeight: product.cartonGrossWeight,
          cartonNetWeight: product.cartonNetWeight,
          cartonSize: product.cartonSize,
          cbmPerCarton: product.cbmPerCarton,
        });
      });
      
      // Reset and close
      setSelectedColors([]);
      setColorQuantities({});
      setOrderQuantity(1);
      handleOpenChange(false);
      
      toast.success('Products added to cart!', {
        description: `${selectedColors.length} color variant(s) added`,
        action: {
          label: 'View Cart',
          onClick: () => router.navigateTo('cart')
        },
      });
    }
    // Handle products WITHOUT color options
    else {
      if (orderQuantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }
      
      // Check if quantity is a full carton
      if (orderQuantity % product.pcsPerCarton !== 0) {
        const suggestedLower = Math.floor(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        const suggestedHigher = Math.ceil(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
        
        onShowQuantityAlert({
          productName: product.name,
          quantity: orderQuantity,
          pcsPerCarton: product.pcsPerCarton,
          suggestedLower: suggestedLower || product.pcsPerCarton,
          suggestedHigher: suggestedHigher,
        });
        return;
      }
      
      // Quantity is a full carton, add to cart
      addToCart({
        productName: product.name,
        image: product.image,
        material: product.material,
        color: product.color,
        specification: product.specification,
        unitPrice: product.unitPrice,
        quantity: orderQuantity,
        pcsPerCarton: product.pcsPerCarton,
        cartonGrossWeight: product.cartonGrossWeight,
        cartonNetWeight: product.cartonNetWeight,
        cartonSize: product.cartonSize,
        cbmPerCarton: product.cbmPerCarton,
      });
      
      // Reset and close
      setOrderQuantity(1);
      handleOpenChange(false);
      
      toast.success('Product added to cart!', {
        description: `${orderQuantity} pcs added`,
        action: {
          label: 'View Cart',
          onClick: () => router.navigateTo('cart')
        },
      });
    }
  };

  const totalPrice = product.colorOptions && product.colorOptions.length > 0
    ? selectedColors.reduce((sum, colorName) => {
        const colorOption = product.colorOptions!.find(c => c.name === colorName);
        const quantity = colorQuantities[colorName] || 1;
        return sum + (colorOption ? colorOption.unitPrice * quantity : 0);
      }, 0)
    : product.unitPrice * orderQuantity;

  const scrollViewed = (direction: 'left' | 'right') => {
    const container = document.getElementById('viewed-products-scroll');
    if (!container) return;
    const scrollAmount = 300;
    const newPosition = direction === 'left'
      ? Math.max(0, viewedScrollPosition - scrollAmount)
      : viewedScrollPosition + scrollAmount;
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setViewedScrollPosition(newPosition);
  };

  const scrollAccessory = (direction: 'left' | 'right') => {
    const container = document.getElementById('accessory-products-scroll');
    if (!container) return;
    const scrollAmount = 450;
    const newPosition = direction === 'left'
      ? Math.max(0, accessoryScrollPosition - scrollAmount)
      : accessoryScrollPosition + scrollAmount;
    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setAccessoryScrollPosition(newPosition);
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = product.videoUrl ? getYouTubeVideoId(product.videoUrl) : null;

  // Create media gallery array (images + video)
  const mediaGallery = [
    { type: 'image', url: product.image },
    { type: 'image', url: 'https://images.unsplash.com/photo-1759262151424-7b8ed20a31a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXRocm9vbSUyMGZhdWNldCUyMGRldGFpbHN8ZW58MXx8fHwxNzYxMjgyMTcwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1741277469445-08700414b344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5rJTIwZHJhaW4lMjBjbG9zZXVwfGVufDF8fHx8MTc2MTI4MjE3MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1650246363606-a2402ec42b08?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbHVtYmluZyUyMGZpeHR1cmUlMjBjaHJvbWV8ZW58MXx8fHwxNzYxMjgyMTcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
  ];

  // Add video to gallery if exists
  if (videoId) {
    mediaGallery.push({ type: 'video', url: videoId });
  }

  const currentMedia = mediaGallery[selectedMediaIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  // Handle media selection
  const handleMediaSelect = (index: number) => {
    setSelectedMediaIndex(index);
    if (mediaGallery[index].type === 'video') {
      setShowVideo(true);
    } else {
      setShowVideo(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-4 pt-3 pb-2 border-b flex-shrink-0">
          <DialogTitle className="text-base">Product Details</DialogTitle>
          <DialogDescription className="sr-only">
            View detailed product information including specifications, pricing, and packaging details
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Top Section: Left/Right Split */}
          <div className="flex border-b">
            {/* Left Side - Images (60%) */}
            <div className="w-[60%] flex-shrink-0 p-4">
              <div className="space-y-3">
                {/* Main Product Image / Video */}
                <div className="bg-gray-100 rounded-lg aspect-square relative group" style={{ overflow: isCurrentVideo && showVideo ? 'visible' : 'hidden' }}>
                  {isCurrentVideo && showVideo ? (
                    <div className="absolute inset-0 z-50">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentMedia.url}?autoplay=1&rel=0&modestbranding=1`}
                        title="Product Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                      <button
                        onClick={() => setShowVideo(false)}
                        className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition-colors z-[60]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <img 
                        src={currentMedia.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 gap-2">
                  {mediaGallery.map((media, index) => (
                    <div 
                      key={index} 
                      onClick={() => handleMediaSelect(index)}
                      className={`bg-gray-100 rounded aspect-square overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all ${
                        selectedMediaIndex === index ? 'ring-2 ring-orange-500' : ''
                      }`}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-black/80">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                      ) : (
                        <img 
                          src={media.url}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Product Info (40%) */}
            <div className="w-[40%] flex-shrink-0 p-4 border-l">
              <div className="space-y-3">
                {/* Product Name & Price */}
                <div>
                  <h2 className="text-lg mb-2">{product.name}</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl text-orange-600">
                      {product.colorOptions && product.colorOptions.length > 0 
                        ? `$${Math.min(...product.colorOptions.map(c => c.unitPrice)).toFixed(2)}`
                        : `$${product.unitPrice.toFixed(2)}`
                      }
                    </span>
                    <span className="text-sm text-gray-500">/piece</span>
                  </div>
                  {product.colorOptions && product.colorOptions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Price varies by color selection
                    </p>
                  )}
                </div>

                {/* Product Features */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-xs mb-2">Product Features:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• High-quality {product.material}</li>
                    <li>• Professional manufacturing standards</li>
                    <li>• Bulk order discounts available</li>
                    <li>• Fast shipping worldwide</li>
                  </ul>
                </div>

                {/* Specifications Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b">
                    <h4 className="font-medium text-xs">Product Specifications</h4>
                  </div>
                  <div className="divide-y text-xs">
                    <div className="flex px-3 py-1.5">
                      <span className="w-32 text-gray-600">Material:</span>
                      <span className="flex-1 text-gray-900">{product.material}</span>
                    </div>
                    {product.size && (
                      <div className="flex px-3 py-1.5">
                        <span className="w-32 text-gray-600">Size:</span>
                        <span className="flex-1 text-gray-900">{product.size}</span>
                      </div>
                    )}
                    <div className="flex px-3 py-1.5">
                      <span className="w-32 text-gray-600">Specification:</span>
                      <span className="flex-1 text-gray-900">{product.specification}</span>
                    </div>
                    {!product.colorOptions && (
                      <div className="flex px-3 py-1.5">
                        <span className="w-32 text-gray-600">Color:</span>
                        <span className="flex-1 text-gray-900">{product.color}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Packaging Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b">
                    <h4 className="font-medium text-xs">Packaging Information</h4>
                  </div>
                  <div className="grid grid-cols-3 text-xs">
                    <div className="flex flex-col px-2 py-1.5 border-r border-b">
                      <span className="text-gray-600">Pcs/Carton:</span>
                      <span className="text-gray-900 mt-0.5">{product.pcsPerCarton} pcs</span>
                    </div>
                    <div className="flex flex-col px-2 py-1.5 border-r border-b">
                      <span className="text-gray-600">Carton Size:</span>
                      <span className="text-gray-900 mt-0.5">{product.cartonSize}</span>
                    </div>
                    <div className="flex flex-col px-2 py-1.5 border-b">
                      <span className="text-gray-600">Gross Weight:</span>
                      <span className="text-gray-900 mt-0.5">{product.cartonGrossWeight} kg</span>
                    </div>
                    <div className="flex flex-col px-2 py-1.5 border-r">
                      <span className="text-gray-600">Net Weight:</span>
                      <span className="text-gray-900 mt-0.5">{product.cartonNetWeight} kg</span>
                    </div>
                    <div className="flex flex-col px-2 py-1.5 col-span-2">
                      <span className="text-gray-600">CBM per Carton:</span>
                      <span className="text-gray-900 mt-0.5">{product.cbmPerCarton} m³</span>
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                {product.colorOptions && product.colorOptions.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-xs mb-2">Select Color(s):</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {product.colorOptions.map((colorOption) => (
                        <label 
                          key={colorOption.name} 
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedColors.includes(colorOption.name)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedColors([...selectedColors, colorOption.name]);
                                setColorQuantities({...colorQuantities, [colorOption.name]: product.pcsPerCarton});
                              } else {
                                setSelectedColors(selectedColors.filter(c => c !== colorOption.name));
                                const newQuantities = {...colorQuantities};
                                delete newQuantities[colorOption.name];
                                setColorQuantities(newQuantities);
                              }
                            }}
                          />
                          <span className="flex-1 text-xs">{colorOption.name}</span>
                          <span className="text-xs text-orange-600">
                            ${colorOption.unitPrice.toFixed(2)}/pc
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Quantity inputs for selected colors */}
                    {selectedColors.length > 0 && (
                      <div className="mt-3 space-y-2 pt-3 border-t max-h-40 overflow-y-auto">
                        {selectedColors.map((colorName) => {
                          const colorOption = product.colorOptions!.find(c => c.name === colorName);
                          if (!colorOption) return null;
                          const quantity = colorQuantities[colorName] || 1;
                          const subtotal = colorOption.unitPrice * quantity;
                          
                          return (
                            <div key={colorName} className="bg-gray-50 rounded p-2 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">{colorName}</span>
                                <button
                                  onClick={() => {
                                    setSelectedColors(selectedColors.filter(c => c !== colorName));
                                    const newQuantities = {...colorQuantities};
                                    delete newQuantities[colorName];
                                    setColorQuantities(newQuantities);
                                  }}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="number"
                                  min={product.pcsPerCarton}
                                  step={product.pcsPerCarton}
                                  value={quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || product.pcsPerCarton;
                                    setColorQuantities({...colorQuantities, [colorName]: val});
                                  }}
                                  className="h-7 text-xs"
                                />
                                <span className="text-xs text-gray-600 whitespace-nowrap">
                                  = ${subtotal.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Min: {product.pcsPerCarton} pcs
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity for non-color products */}
                {(!product.colorOptions || product.colorOptions.length === 0) && (
                  <div className="border rounded-lg p-3">
                    <h4 className="font-medium text-xs mb-2">Order Quantity:</h4>
                    <Input
                      type="number"
                      min={product.pcsPerCarton}
                      step={product.pcsPerCarton}
                      value={orderQuantity}
                      onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum order: {product.pcsPerCarton} pcs (1 carton)
                    </p>
                  </div>
                )}

                {/* Suggested Quantities - Now appears above Total Price */}
                {(!product.colorOptions || product.colorOptions.length === 0) && suggestedQuantities.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                      <span className="text-yellow-600">💡</span>
                      Suggested Quantities:
                    </h4>
                    <div className="space-y-1.5">
                      {suggestedQuantities.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setOrderQuantity(suggestion.qty);
                            setSelectedSuggestedQty(suggestion.qty);
                          }}
                          className={`w-full bg-white rounded px-3 py-1.5 flex justify-between items-center text-xs transition-all ${
                            orderQuantity === suggestion.qty 
                              ? 'border-2 border-orange-500 bg-orange-50' 
                              : 'border border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                          }`}
                        >
                          <span className="font-medium">{suggestion.qty} pcs</span>
                          <span className="text-gray-600">= {suggestion.cartons} carton(s)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total and Add to Cart */}
                <div className="border-t pt-3 space-y-3 sticky bottom-0 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Price:</span>
                    <span className="text-2xl text-orange-600">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full h-11 text-sm bg-red-600 hover:bg-red-700"
                    onClick={handleAddToCart}
                    disabled={(product.colorOptions && product.colorOptions.length > 0 && selectedColors.length === 0)}
                  >
                    Add to Cart
                    {selectedColors.length > 0 && ` (${selectedColors.length} color${selectedColors.length > 1 ? 's' : ''})`}
                  </Button>

                  {product.colorOptions && product.colorOptions.length > 0 && selectedColors.length === 0 && (
                    <p className="text-xs text-center text-gray-500">
                      Please select at least one color
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Recommendation Modules */}

          {/* Module 1: Accessory Recommendations Carousel */}
          <div className="p-3 border-t bg-teal-800">
            <div className="flex gap-4">
              {/* Left Side - Description (Fixed and Vertically Centered) */}
              <div className="w-56 flex-shrink-0 text-white flex flex-col justify-center">
                <h3 className="text-lg font-medium mb-2">{getAccessoriesForProduct(product.name, product.material, product.specification).description.title}</h3>
                <p className="text-xs leading-relaxed">
                  {getAccessoriesForProduct(product.name, product.material, product.specification).description.text}
                </p>
              </div>

              {/* Right Side - Scrollable Product Categories */}
              <div className="flex-1 relative min-w-0">
                {/* Scroll Controls */}
                <div className="absolute right-0 -top-1 flex gap-2 z-10">
                  <button
                    onClick={() => scrollAccessory('left')}
                    disabled={accessoryScrollPosition === 0}
                    className="bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => scrollAccessory('right')}
                    className="bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Scrollable Categories Container */}
                <div
                  id="accessory-products-scroll"
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-2.5 w-max pb-1">
                    {getAccessoriesForProduct(product.name, product.material, product.specification).categories.map((category) => (
                      <div key={category.id} className="w-[420px] bg-white rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2.5">{category.title}</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                          {category.products.map((accessoryProduct) => (
                            <div key={accessoryProduct.id} className="border rounded-lg p-2 flex flex-col">
                              <div 
                                className="bg-gray-100 rounded overflow-hidden mb-1.5 aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleAccessoryClick(accessoryProduct.fullDetails)}
                              >
                                <img
                                  src={accessoryProduct.image}
                                  alt={accessoryProduct.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <h5 
                                className="text-xs mb-1 line-clamp-2 min-h-[2rem] cursor-pointer hover:text-orange-600 transition-colors"
                                onClick={() => handleAccessoryClick(accessoryProduct.fullDetails)}
                              >
                                {accessoryProduct.name}
                              </h5>
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-2.5 w-2.5 ${
                                      i < accessoryProduct.rating
                                        ? 'fill-orange-400 text-orange-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs text-gray-500">({accessoryProduct.reviews})</span>
                              </div>
                              <div className="mb-1">
                                <span className="text-sm font-medium">
                                  ${accessoryProduct.price.toFixed(2)}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  // Add accessory to cart using fullDetails
                                  const details = accessoryProduct.fullDetails;
                                  addToCart({
                                    productName: details.name,
                                    image: details.image,
                                    material: details.material,
                                    color: details.color,
                                    specification: details.specification,
                                    unitPrice: details.unitPrice,
                                    quantity: details.pcsPerCarton,
                                    pcsPerCarton: details.pcsPerCarton,
                                    cartonGrossWeight: details.cartonGrossWeight,
                                    cartonNetWeight: details.cartonNetWeight,
                                    cartonSize: details.cartonSize,
                                    cbmPerCarton: details.cbmPerCarton,
                                  });
                                  
                                  toast.success('Accessory added to cart!', {
                                    description: `${accessoryProduct.name} - $${accessoryProduct.price.toFixed(2)}`,
                                    action: {
                                      label: 'View Cart',
                                      onClick: () => router.navigateTo('cart')
                                    },
                                  });
                                }}
                                className="w-full text-xs py-1.5 px-2 border border-orange-500 text-orange-600 rounded hover:bg-orange-50 transition-colors mt-auto"
                              >
                                Add to Cart
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Module 4: Customer Also View */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-medium">Customer Also Viewed</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollViewed('left')}
                  disabled={viewedScrollPosition === 0}
                  className="bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => scrollViewed('right')}
                  className="bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              id="viewed-products-scroll"
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {customersAlsoViewed.map((item) => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-44 bg-white rounded-lg border p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="bg-gray-100 rounded overflow-hidden mb-2 aspect-square">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-xs mb-1 line-clamp-2">{item.name}</h4>
                  <div className="flex items-center gap-1 text-xs mb-1">
                    {item.wasPrice && (
                      <span className="line-through text-gray-400">${item.wasPrice.toFixed(2)}</span>
                    )}
                  </div>
                  <p className="text-sm text-orange-600">${item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                    <span>{item.rating}</span>
                    <span>({item.reviews})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module 5: Customer Reviews */}
          <div className="p-4 border-t bg-gray-50">
            <div className="mb-3">
              <h3 className="text-base font-medium mb-1">Customer Reviews</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-4 w-4 fill-orange-400 text-orange-400"
                    />
                  ))}
                </div>
                <span className="text-sm">4.6 out of 5</span>
                <span className="text-sm text-gray-500">({customerReviews.length} reviews)</span>
              </div>
            </div>
            <div className="space-y-3">
              {customerReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{review.userName}</span>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= review.rating
                                ? 'fill-orange-400 text-orange-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{review.comment}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <button className="hover:text-gray-700">
                          Helpful ({review.helpful})
                        </button>
                        <button className="hover:text-gray-700">Report</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Nested Product Detail Dialog for Accessories */}
    {nestedProduct && (
      <ProductDetailDialog
        product={nestedProduct}
        open={nestedDialogOpen}
        onOpenChange={setNestedDialogOpen}
        onShowQuantityAlert={onShowQuantityAlert}
      />
    )}
    </>
  );
}