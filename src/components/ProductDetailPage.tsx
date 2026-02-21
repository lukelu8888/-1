import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Home, ChevronRight, Star, Play, ThumbsUp, Flag, FileText } from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { productDetailsData } from '../data/productDetailsData';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner@2.0.3';
import { useUser } from '../contexts/UserContext';

interface ProductDetailPageProps {
  productKey: string;
  categoryName?: string;
  subcategoryName?: string;
  onClose: () => void;
}

export function ProductDetailPage({ productKey, categoryName, subcategoryName, onClose }: ProductDetailPageProps) {
  const { navigateTo } = useRouter();
  const { addToCart } = useCart();
  const { user } = useUser();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(8); // Default to minimum order
  const [orderSession, setOrderSession] = useState<any>(null);
  
  const product = productDetailsData[productKey];
  
  if (!product) {
    console.error('Product not found:', productKey);
    console.log('Available products:', Object.keys(productDetailsData));
    const errorContent = (
      <div 
        className="fixed inset-0 bg-white z-[9999] overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-4">The product "{productKey}" could not be found.</p>
            <Button onClick={onClose} className="bg-orange-600 hover:bg-orange-700 text-white">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
    
    if (typeof window === 'undefined') {
      return errorContent;
    }
    
    return createPortal(errorContent, document.body);
  }

  // Check if there's an active order editing session
  useEffect(() => {
    const checkOrderSession = () => {
      const sessionData = localStorage.getItem('orderEditingSession');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          console.log('📋 Order editing session detected:', session);
          setOrderSession(session);
        } catch (error) {
          console.error('Failed to parse order session:', error);
          setOrderSession(null);
        }
      } else {
        setOrderSession(null);
      }
    };

    // Check on mount
    checkOrderSession();

    // Listen for storage changes
    window.addEventListener('storage', checkOrderSession);
    window.addEventListener('orderSessionUpdated', checkOrderSession);

    return () => {
      window.removeEventListener('storage', checkOrderSession);
      window.removeEventListener('orderSessionUpdated', checkOrderSession);
    };
  }, []);

  // Generate multiple product images (in real scenario, these would come from data)
  const productImages = [
    product.image,
    product.image,
    product.image,
    product.image,
  ];

  // Calculate suggested quantities based on pieces per carton
  const currentCartons = Math.ceil(quantity / product.pcsPerCarton);
  const suggestedQuantities = [
    { pieces: product.pcsPerCarton * currentCartons, cartons: currentCartons },
    { pieces: product.pcsPerCarton * (currentCartons + 1), cartons: currentCartons + 1 },
  ];

  const handleAddToCart = () => {
    const totalCartons = Math.ceil(quantity / product.pcsPerCarton);
    addToCart({
      id: productKey,
      name: product.name,
      price: product.unitPrice,
      quantity: quantity,
      image: product.image,
    });
    toast.success(`Added ${quantity} pieces (${totalCartons} carton${totalCartons > 1 ? 's' : ''}) to cart`);
  };

  const handleAddToProformaInvoice = () => {
    if (!orderSession) return;

    // Load draft orders
    const draftsData = localStorage.getItem('draftOrders');
    if (!draftsData) {
      toast.error('Draft order not found');
      return;
    }

    try {
      const drafts = JSON.parse(draftsData);
      const draftIndex = drafts.findIndex((d: any) => d.id === orderSession.orderId);
      
      if (draftIndex === -1) {
        toast.error('Order not found');
        return;
      }

      const draft = drafts[draftIndex];
      
      // Check if product already exists
      const existingProductIndex = draft.products.findIndex(
        (p: any) => p.name === product.name && p.price === product.unitPrice
      );

      if (existingProductIndex !== -1) {
        // Product exists, update quantity and ensure image is set
        draft.products[existingProductIndex].qty += quantity;
        draft.products[existingProductIndex].image = product.image; // Sync image
        draft.products[existingProductIndex].itemNumber = productKey; // Sync SKU
        toast.success(`Updated ${product.name} quantity in Proforma Invoice`, {
          action: {
            label: 'View Invoice',
            onClick: () => {
              localStorage.setItem('dashboardActiveView', 'create-order');
              navigateTo('dashboard');
            }
          }
        });
      } else {
        // Add new product
        const newProduct = {
          id: productKey,
          name: product.name,
          image: product.image, // Add product image
          price: product.unitPrice,
          qty: quantity,
          cbm: parseFloat(product.cbmPerCarton) / product.pcsPerCarton,
          grossWeight: parseFloat(product.cartonGrossWeight) / product.pcsPerCarton,
          netWeight: parseFloat(product.cartonNetWeight) / product.pcsPerCarton,
          pcsPerCarton: product.pcsPerCarton,
          cartonSize: product.cartonSize,
          moq: product.pcsPerCarton,
          itemNumber: product.sku || productKey // Use real SKU from productData
        };

        draft.products.push(newProduct);
        toast.success(`Added ${product.name} to Proforma Invoice`, {
          action: {
            label: 'View Invoice',
            onClick: () => {
              localStorage.setItem('dashboardActiveView', 'create-order');
              navigateTo('dashboard');
            }
          }
        });
      }

      // Save updated drafts
      drafts[draftIndex] = {
        ...draft,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('draftOrders', JSON.stringify(drafts));
      
      // Trigger custom event to update banner
      window.dispatchEvent(new Event('draftOrderUpdated'));
    } catch (error) {
      console.error('Failed to add product to Proforma Invoice:', error);
      toast.error('Failed to add product');
    }
  };

  const calculateTotalPrice = () => {
    return (quantity * product.unitPrice).toFixed(2);
  };

  const calculateCartons = (pieces: number) => {
    return Math.ceil(pieces / product.pcsPerCarton);
  };

  // Mock related products
  const relatedProducts = [
    {
      name: 'Heavy Duty 3-Prong Power Cord 6ft',
      rating: 4.5,
      reviews: 823,
      price: 12.99,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    },
    {
      name: 'Heavy Duty 3-Prong Power Cord 10ft',
      rating: 4.5,
      reviews: 654,
      price: 16.99,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'
    },
    {
      name: 'Stainless Steel Washing Machine Hose 6ft',
      rating: 4.5,
      reviews: 1245,
      price: 18.99,
      image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400'
    },
    {
      name: 'Refrigerator Water Line Kit',
      rating: 4,
      reviews: 876,
      price: 22.99,
      image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=400'
    },
  ];

  // Mock "Customer Also Viewed" products
  const customerViewed = [
    {
      name: 'Home Decorators Collection Collette 72 in...',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400'
    },
    {
      name: 'ARIEL Hepburn 72 in. W x 22 in. D x 36 in. H...',
      image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400'
    },
    {
      name: 'Home Decorators Collection Danby 72 in...',
      image: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400'
    },
    {
      name: 'ARIEL Cambridge 72 in. W x 22 in. D x 36 in. H...',
      image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400'
    },
    {
      name: 'Home Decorators Collection Talmore 72 in...',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400'
    },
    {
      name: 'Home Decorators Collection Sonoma 72 in...',
      image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=400'
    },
  ];

  // 使用 Portal 渲染到 body，避免被父容器遮挡
  const content = (
    <div 
      className="fixed inset-0 bg-white z-[9999] overflow-y-auto"
      onClick={(e) => {
        // 阻止点击事件冒泡，防止触发其他导航
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // 阻止鼠标按下事件冒泡
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Product Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={(e) => {
                e.preventDefault();
                onClose(); // 关闭详情页，返回分类页面
              }} 
              className="flex items-center gap-1 text-gray-600 hover:text-orange-600"
            >
              <Home className="h-4 w-4" />
              <span>Back to Category</span>
            </button>
            {categoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{categoryName}</span>
              </>
            )}
            {subcategoryName && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{subcategoryName}</span>
              </>
            )}
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 mb-12">
          {/* Left: Product Images */}
          <div>
            {/* Main Image */}
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
              <ImageWithFallback
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-5 gap-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-square overflow-hidden rounded border-2 transition-colors ${
                    selectedImage === idx ? 'border-orange-600' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              
              {/* Video Thumbnail */}
              {product.videoUrl && (
                <button
                  className="aspect-square overflow-hidden rounded border-2 border-gray-200 hover:border-gray-300 bg-gray-900 flex items-center justify-center"
                >
                  <Play className="h-8 w-8 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Product Information */}
          <div className="space-y-6">
            {/* Product Title & Price */}
            <div>
              <h1 className="text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-orange-600" style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  ${product.unitPrice.toFixed(2)}
                </span>
                <span className="text-gray-600">/piece</span>
              </div>
            </div>

            {/* Product Features */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Product Features:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• High-quality {product.material}</li>
                <li>• Professional manufacturing standards</li>
                <li>• Bulk order discounts available</li>
                <li>• Fast shipping worldwide</li>
              </ul>
            </div>

            {/* Product Specifications */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Product Specifications</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Material:</span>
                  <p className="text-gray-900">{product.material}</p>
                </div>
                {product.size && (
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <p className="text-gray-900">{product.size}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Specification:</span>
                  <p className="text-gray-900">{product.specification}</p>
                </div>
                <div>
                  <span className="text-gray-600">Color:</span>
                  <p className="text-gray-900">{product.color}</p>
                </div>
              </div>
            </div>

            {/* Packaging Information */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Packaging Information</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Pcs/Carton:</span>
                  <p className="text-gray-900">{product.pcsPerCarton} pcs</p>
                </div>
                <div>
                  <span className="text-gray-600">Carton Size:</span>
                  <p className="text-gray-900">{product.cartonSize}</p>
                </div>
                <div>
                  <span className="text-gray-600">Gross Weight:</span>
                  <p className="text-gray-900">{product.cartonGrossWeight} kg</p>
                </div>
                <div>
                  <span className="text-gray-600">Net Weight:</span>
                  <p className="text-gray-900">{product.cartonNetWeight} kg</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">CBM per Carton:</span>
                  <p className="text-gray-900">{product.cbmPerCarton} m³</p>
                </div>
              </div>
            </div>

            {/* Order Quantity */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Order Quantity:</h3>
              <div className="relative">
                <input
                  type="number"
                  min={product.pcsPerCarton}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.pcsPerCarton, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Minimum order: {product.pcsPerCarton} pcs (1 carton)
              </p>

              {/* Suggested Quantities */}
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Suggested Quantities:</p>
                <div className="space-y-2">
                  {suggestedQuantities.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuantity(suggestion.pieces)}
                      className="w-full flex justify-between items-center text-sm text-gray-700 hover:text-orange-600 transition-colors"
                    >
                      <span>{suggestion.pieces} pcs</span>
                      <span>= {suggestion.cartons} carton(s)</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Price & Add to Cart */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-900 font-medium">Total Price:</span>
                <span className="text-orange-600" style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  ${calculateTotalPrice()}
                </span>
              </div>
              
              {orderSession && (
                <div className="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      Editing Order: {orderSession.orderId}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Click below to add this product to your Proforma Invoice
                  </p>
                </div>
              )}

              {orderSession ? (
                <>
                  <Button
                    onClick={handleAddToProformaInvoice}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg mb-3"
                  >
                    <FileText className="h-5 w-5 mr-2" />
                    Add to Proforma Invoice
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50 py-6 text-lg"
                  >
                    Add to Cart
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
                >
                  Add to Cart
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="mb-12">
          <h2 className="text-gray-900 mb-6">Customer Reviews</h2>
          
          {/* Overall Rating */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < 4 ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="font-medium text-gray-900">4.6 out of 5</span>
            <span className="text-gray-600">(5 reviews)</span>
          </div>

          {/* Review List */}
          <div className="space-y-4">
            {/* Review 1 */}
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                    alt="John Smith"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">John Smith</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">2024-10-15</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-orange-500 text-orange-500"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Excellent quality! The material is top-notch and the finish is perfect. Delivery was fast and packaging was secure. Highly recommend for bulk orders.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful (45)</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
                    alt="Sarah Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">Sarah Johnson</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">2024-10-10</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < 4 ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Good product overall. The specifications matched exactly what was described. Only minor issue was slight color variation in one batch, but customer service resolved it quickly.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful (32)</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100"
                    alt="Michael Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">Michael Chen</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">2024-10-05</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-orange-500 text-orange-500"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Outstanding value for money. We've been ordering from COSUN for 3 years now and the quality has always been consistent. Great for our wholesale business.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span>Helpful (28)</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                      <Flag className="h-4 w-4" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You Will Also Need These */}
        <div className="mb-12">
          <div className="bg-teal-700 text-white p-6 rounded-lg mb-6">
            <h2 className="mb-2">You Will Also Need These</h2>
            <p className="text-sm text-teal-100">
              For complete appliance installation, you'll need power cords for electrical connection, 
              water hoses for plumbing, and mounting hardware for secure attachment.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {relatedProducts.map((item, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden bg-white">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(item.rating) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({item.reviews})</span>
                  </div>
                  <p className="font-medium text-gray-900 mb-3">${item.price}</p>
                  <Button
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Also Viewed */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900">Customer Also Viewed</h2>
            <div className="flex gap-2">
              <button className="p-2 border rounded-lg hover:bg-gray-50">
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
              <button className="p-2 border rounded-lg hover:bg-gray-50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {customerViewed.map((item, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-900 line-clamp-2">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 渲染到 body，避免被父容器遮挡
  if (typeof window === 'undefined') {
    return content;
  }
  
  return createPortal(content, document.body);
}