import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  X,
  Plus,
  Check,
  Package,
  Ruler,
  Zap,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: any) => void;
  isAdded: boolean;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddProduct,
  isAdded,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!product) return null;

  // Simulate multiple images (in real scenario, products would have image arrays)
  const productImages = [product.image, product.image]; // Could be extended with more images

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
  };

  const specifications = product.specifications || {};
  const specEntries = Object.entries(specifications);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-[#F96302] pr-8">Product Details</DialogTitle>
          <DialogDescription className="sr-only">
            View detailed product information and specifications
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 mt-4">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <ImageWithFallback
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Image Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Price Tag */}
              {product.price && (
                <div className="absolute top-4 right-4 bg-[#F96302] text-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="text-xs opacity-90">Unit Price</div>
                  <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>
                </div>
              )}

              {/* Image Indicator */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-[#F96302] w-6'
                          : 'bg-white/60 hover:bg-white/90'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-[#F96302] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Quality Assured</span>
                </div>
                <p className="text-xs text-gray-600">Factory Certified</p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">In Stock</span>
                </div>
                <p className="text-xs text-gray-600">Ready to Ship</p>
              </div>
            </div>
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <Badge className="bg-[#F96302]">
                  <Package className="w-3 h-3 mr-1" />
                  {product.categoryName || 'Product'}
                </Badge>
                {product.subCategoryName && (
                  <Badge variant="secondary">{product.subCategoryName}</Badge>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">{product.name}</h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Model:</span>
                  <span className="text-[#F96302]">{product.model}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <span className="font-medium">SKU:</span>
                  <span>{product.id}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Product Description */}
            <div>
              <h3 className="font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F96302]" />
                Product Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description || 
                  `High-quality ${product.name} designed for professional and commercial use. 
                  This product meets international standards and specifications, ensuring reliable 
                  performance and durability. Suitable for various applications in ${product.categoryName || 'industrial'} sector.`
                }
              </p>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h3 className="font-medium text-[#1A1A1A] mb-3 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#F96302]" />
                Technical Specifications
              </h3>
              
              {specEntries.length > 0 ? (
                <div className="bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {specEntries.map(([key, value], index) => (
                        <tr
                          key={key}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-700 border-r border-gray-200 w-1/3">
                            {key}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {String(value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4 text-sm text-gray-500 text-center">
                  Detailed specifications available upon request
                </div>
              )}
            </div>

            <Separator />

            {/* Pricing & MOQ Info */}
            <div className="bg-orange-50 border-2 border-[#F96302]/30 rounded-lg p-4">
              <h3 className="font-medium text-[#1A1A1A] mb-3">Order Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Minimum Order Quantity</div>
                  <div className="font-medium text-[#F96302]">100 pcs</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Lead Time</div>
                  <div className="font-medium text-[#F96302]">15-30 days</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Packaging</div>
                  <div className="font-medium text-gray-700">Standard Export Carton</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Payment Terms</div>
                  <div className="font-medium text-gray-700">T/T, L/C</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => onAddProduct(product)}
                disabled={isAdded}
                className={`flex-1 h-12 text-base ${
                  isAdded
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#F96302] hover:bg-[#E05502]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added to Inquiry
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Inquiry
                  </>
                )}
              </Button>
              
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 h-12 border-2 border-gray-300 hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>

            {/* Additional Info */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-xs text-blue-800">
                <strong>💡 Note:</strong> Prices and specifications are subject to change. 
                Final quotation will be provided based on your specific requirements and order quantity.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}