import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Grid3x3, 
  List, 
  Package, 
  ShoppingCart,
  Check,
  Plus
} from 'lucide-react';
import { MainCategory } from '../../data/productData';
import { fetchProductCatalog } from '../../lib/services/productCatalogService';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';

interface InquiryProductBrowserProps {
  onAddProduct: (product: any) => void;
  addedProductIds: Set<string>;
  onBackToHome?: () => void;
}

export function InquiryProductBrowser({ onAddProduct, addedProductIds, onBackToHome }: InquiryProductBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [productCatalog, setProductCatalog] = useState<MainCategory[]>([]);

  useEffect(() => {
    fetchProductCatalog().then(setProductCatalog).catch(console.error);
  }, []);

  // Flatten all products from all categories
  const allProducts = productCatalog.flatMap(category =>
    category.subCategories.flatMap(subCat =>
      (subCat.productCategories || []).flatMap(productCat =>
        (productCat.products || []).map(item => ({
          id: item.id,
          name: item.name,
          model: item.model,
          image: item.image,
          price: item.price ? `$${item.price.toFixed(2)}` : '$0.00',
          specs: Object.entries(item.specifications || {}).map(([key, value]) => ({ name: key, value })),
          badge: '',
          categoryName: category.name,
          subCategoryName: subCat.name,
          productCategoryName: productCat.name,
          categoryId: category.id,
          uniqueId: `${category.id}-${subCat.id}-${productCat.id}-${item.id}`,
          rawPrice: item.price || 0,
          netWeight: item.netWeight,
          grossWeight: item.grossWeight,
          unitsPerCarton: item.unitsPerCarton,
          cartonDimensions: item.cartonDimensions
        }))
      )
    )
  );

  // Filter products
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = (product: any) => {
    const productToAdd = {
      id: product.uniqueId,
      productName: product.name,
      quantity: 100, // Default quantity
      unit: 'pcs',
      targetPrice: parseFloat(product.price.replace(/[^\d.]/g, '')) || 0,
      specifications: product.specs?.[0]?.value || '',
      image: product.image,
      source: 'website' as const
    };

    onAddProduct(productToAdd);
    toast.success(`${product.name} added to inquiry`);
  };

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--hd-font)' }}>
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={2.5} />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-gray-200 rounded-sm"
            style={{ fontSize: '13px' }}
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap ${selectedCategory === 'all' ? 'bg-[#F96302] hover:bg-[#E05502]' : 'border-2'}`}
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            ALL
          </Button>
          {productCatalog.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className={`whitespace-nowrap ${selectedCategory === category.id ? 'bg-[#F96302] hover:bg-[#E05502]' : 'border-2'}`}
              style={{ fontSize: '12px', fontWeight: 600 }}
            >
              {category.name.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border-2 border-gray-200 rounded-sm p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-[#F96302] text-white hover:bg-[#E05502] hover:text-white' : ''}`}
          >
            <Grid3x3 className="h-4 w-4" strokeWidth={2.5} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-[#F96302] text-white hover:bg-[#E05502] hover:text-white' : ''}`}
          >
            <List className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600" style={{ fontSize: '13px', fontWeight: 400 }}>
          {filteredProducts.length} products found
        </p>
        {onBackToHome && (
          <Button
            onClick={onBackToHome}
            className="bg-[#F96302] hover:bg-[#E05502] text-white"
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            Back to Home
          </Button>
        )}
      </div>

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
          <p className="text-gray-600" style={{ fontSize: '14px', fontWeight: 400 }}>
            No products found. Try adjusting your search or filters.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isAdded = addedProductIds.has(product.uniqueId);
            
            return (
              <div
                key={product.uniqueId}
                className="bg-white border-2 border-gray-200 rounded-sm hover:border-[#F96302] transition-all overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {product.badge && (
                    <Badge className="absolute top-2 right-2 bg-[#F96302] text-white">
                      {product.badge}
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <p className="text-gray-500 uppercase text-[10px]" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                      {product.subCategoryName}
                    </p>
                    <h3 className="text-gray-900 mt-1 line-clamp-2" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-gray-900" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {product.price}
                    </div>
                    
                    {isAdded ? (
                      <Button
                        disabled
                        className="bg-green-600 text-white cursor-not-allowed"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      >
                        <Check className="w-4 h-4 mr-1" strokeWidth={2.5} />
                        ADDED
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleAddProduct(product)}
                        className="bg-[#F96302] hover:bg-[#E05502] text-white"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      >
                        <Plus className="w-4 h-4 mr-1" strokeWidth={2.5} />
                        ADD
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const isAdded = addedProductIds.has(product.uniqueId);
            
            return (
              <div
                key={product.uniqueId}
                className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-sm hover:border-[#F96302] transition-all"
              >
                {/* Product Image */}
                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-sm overflow-hidden">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 uppercase text-[10px] mb-1" style={{ fontWeight: 500, letterSpacing: '0.5px' }}>
                    {product.subCategoryName}
                  </p>
                  <h3 className="text-gray-900 truncate" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {product.name}
                  </h3>
                  <div className="text-gray-900 mt-1" style={{ fontSize: '16px', fontWeight: 700 }}>
                    {product.price}
                  </div>
                </div>

                {/* Add Button */}
                {isAdded ? (
                  <Button
                    disabled
                    className="flex-shrink-0 bg-green-600 text-white cursor-not-allowed"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    <Check className="w-4 h-4 mr-1" strokeWidth={2.5} />
                    ADDED
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAddProduct(product)}
                    className="flex-shrink-0 bg-[#F96302] hover:bg-[#E05502] text-white"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    <Plus className="w-4 h-4 mr-1" strokeWidth={2.5} />
                    ADD
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}