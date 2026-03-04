import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Home,
  ArrowRight,
  Plus,
  Check,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { MainCategory } from '../../data/productData';
import { fetchProductCatalog } from '../../lib/services/productCatalogService';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { ProductDetailModal } from './ProductDetailModal';

interface InquiryProductHomeProps {
  onAddProduct: (product: any) => void;
  addedProductIds: Set<string>;
  onSelectCategory: (categoryId: string) => void;
}

export function InquiryProductHome({ onAddProduct, addedProductIds, onSelectCategory }: InquiryProductHomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('appliances');
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [productCatalog, setProductCatalog] = useState<MainCategory[]>([]);

  useEffect(() => {
    fetchProductCatalog().then(setProductCatalog).catch(console.error);
  }, []);

  // Toggle sub-category expansion
  const toggleSubCategory = (subCategoryId: string) => {
    const newSet = new Set(expandedSubCategories);
    if (newSet.has(subCategoryId)) {
      newSet.delete(subCategoryId);
    } else {
      newSet.add(subCategoryId);
    }
    setExpandedSubCategories(newSet);
  };

  // Calculate product counts
  const getCategoryProductCount = (categoryId: string) => {
    const category = productCatalog.find(c => c.id === categoryId);
    if (!category) return 0;
    return category.subCategories.reduce((total, sub) => {
      return total + sub.productCategories.reduce((subTotal, prodCat) => {
        return subTotal + prodCat.products.length;
      }, 0);
    }, 0);
  };

  const getSubCategoryProductCount = (categoryId: string, subCategoryId: string) => {
    const category = productCatalog.find(c => c.id === categoryId);
    if (!category) return 0;
    const subCat = category.subCategories.find(s => s.id === subCategoryId);
    if (!subCat) return 0;
    return subCat.productCategories.reduce((total, prodCat) => {
      return total + prodCat.products.length;
    }, 0);
  };

  const getProductCategoryProductCount = (categoryId: string, subCategoryId: string, productCategoryId: string) => {
    const category = productCatalog.find(c => c.id === categoryId);
    if (!category) return 0;
    const subCat = category.subCategories.find(s => s.id === subCategoryId);
    if (!subCat) return 0;
    const prodCat = subCat.productCategories.find(p => p.id === productCategoryId);
    if (!prodCat) return 0;
    return prodCat.products.length;
  };

  const currentCategory = productCatalog.find(c => c.id === expandedCategory);

  // Filter categories based on search
  const filteredCategories = productCatalog.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subCategories.some(sub => 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.productCategories.some(prodCat => 
        prodCat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  // Get products to display
  const getProductsToDisplay = () => {
    if (!currentCategory) return [];

    if (selectedProductCategory && selectedSubCategory) {
      // Show products from selected product category
      const subCat = currentCategory.subCategories.find(s => s.id === selectedSubCategory);
      if (!subCat) return [];
      const prodCat = subCat.productCategories.find(p => p.id === selectedProductCategory);
      if (!prodCat) return [];
      return prodCat.products.map(p => ({
        ...p,
        categoryId: currentCategory.id,
        subCategoryId: selectedSubCategory,
        productCategoryId: selectedProductCategory,
        uniqueId: `${currentCategory.id}-${selectedSubCategory}-${selectedProductCategory}-${p.id}`,
      }));
    }

    if (selectedSubCategory) {
      // Show all products from selected sub category
      const subCat = currentCategory.subCategories.find(s => s.id === selectedSubCategory);
      if (!subCat) return [];
      return subCat.productCategories.flatMap(prodCat =>
        prodCat.products.map(p => ({
          ...p,
          categoryId: currentCategory.id,
          subCategoryId: selectedSubCategory,
          productCategoryId: prodCat.id,
          productCategoryName: prodCat.name,
          uniqueId: `${currentCategory.id}-${selectedSubCategory}-${prodCat.id}-${p.id}`,
        }))
      );
    }

    // Show all products from current category
    return currentCategory.subCategories.flatMap(subCat =>
      subCat.productCategories.flatMap(prodCat =>
        prodCat.products.map(p => ({
          ...p,
          categoryId: currentCategory.id,
          subCategoryId: subCat.id,
          productCategoryId: prodCat.id,
          subCategoryName: subCat.name,
          productCategoryName: prodCat.name,
          uniqueId: `${currentCategory.id}-${subCat.id}-${prodCat.id}-${p.id}`,
        }))
      )
    );
  };

  const productsToDisplay = getProductsToDisplay();

  const handleAddProduct = (product: any) => {
    const productToAdd = {
      id: product.uniqueId,
      productName: product.name,
      quantity: 100,
      unit: 'pcs',
      targetPrice: product.price || 0,
      specifications: Object.entries(product.specifications || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join(', '),
      image: product.image,
      source: 'website' as const
    };

    onAddProduct(productToAdd);
    toast.success(`${product.name} added to inquiry`);
  };

  const getBreadcrumb = () => {
    const parts = [currentCategory?.name];
    
    if (selectedSubCategory) {
      const subCat = currentCategory?.subCategories.find(s => s.id === selectedSubCategory);
      if (subCat) parts.push(subCat.name);
    }
    
    if (selectedProductCategory && selectedSubCategory) {
      const subCat = currentCategory?.subCategories.find(s => s.id === selectedSubCategory);
      const prodCat = subCat?.productCategories.find(p => p.id === selectedProductCategory);
      if (prodCat) parts.push(prodCat.name);
    }
    
    return parts.filter(Boolean);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProduct(null);
          }}
          onAddProduct={handleAddProduct}
          isAdded={addedProductIds.has(selectedProduct.uniqueId)}
        />
      )}

      {/* Left Sidebar - Tree Navigation */}
      <div className="w-[280px] bg-white border-r flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b bg-[#F96302]">
          <h2 className="text-white font-medium">Browse Products</h2>
        </div>

        <div className="p-4">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                className="pl-10 border-[#F96302]/30 focus:border-[#F96302]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tree */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 mb-2 px-2 uppercase">Categories</div>
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategory === category.id;
              const productCount = getCategoryProductCount(category.id);

              return (
                <div key={category.id}>
                  {/* Main Category */}
                  <button
                    onClick={() => {
                      setExpandedCategory(isExpanded ? null : category.id);
                      if (!isExpanded) {
                        setSelectedSubCategory(null);
                        setSelectedProductCategory(null);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[#F96302]/10 rounded text-left group transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#F96302] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F96302] flex-shrink-0" />
                    )}
                    <span className="text-xl flex-shrink-0">{category.icon}</span>
                    <span className={`flex-1 text-sm ${isExpanded ? 'text-[#F96302] font-medium' : 'text-gray-700'}`}>
                      {category.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {productCount}
                    </Badge>
                  </button>

                  {/* Sub Categories */}
                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {category.subCategories.map((subCat) => {
                        const subCount = getSubCategoryProductCount(category.id, subCat.id);
                        const isSelected = selectedSubCategory === subCat.id;
                        const isSubExpanded = expandedSubCategories.has(subCat.id);

                        return (
                          <div key={subCat.id}>
                            <button
                              onClick={() => {
                                setSelectedSubCategory(isSelected ? null : subCat.id);
                                setSelectedProductCategory(null);
                                toggleSubCategory(subCat.id);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm hover:bg-[#F96302]/10 transition-colors ${
                                isSelected ? 'bg-[#F96302]/10 text-[#F96302] font-medium' : 'text-gray-700'
                              }`}
                            >
                              <span className="flex-1">{subCat.name}</span>
                              <span className="text-xs text-gray-500">({subCount})</span>
                            </button>

                            {/* Product Categories */}
                            {isSubExpanded && (
                              <div className="ml-4 mt-1 space-y-1 border-l-2 border-[#F96302]/20 pl-2">
                                {subCat.productCategories.map((prodCat) => {
                                  const count = getProductCategoryProductCount(
                                    category.id,
                                    subCat.id,
                                    prodCat.id
                                  );
                                  const isProdCatSelected = selectedProductCategory === prodCat.id;

                                  return (
                                    <button
                                      key={prodCat.id}
                                      onClick={() => setSelectedProductCategory(prodCat.id)}
                                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs hover:bg-[#F96302]/10 transition-colors ${
                                        isProdCatSelected ? 'bg-[#F96302]/10 text-[#F96302] font-medium' : 'text-gray-600'
                                      }`}
                                    >
                                      <span className="flex-1 line-clamp-1">{prodCat.name}</span>
                                      <span className="text-xs text-gray-400">({count})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {currentCategory && (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm mb-6 text-gray-600">
                <button
                  onClick={() => {
                    setExpandedCategory(null);
                    setSelectedSubCategory(null);
                    setSelectedProductCategory(null);
                  }}
                  className="hover:text-[#F96302] transition-colors"
                  title="Back to home"
                >
                  <Home className="w-4 h-4" />
                </button>
                <ChevronRight className="w-3 h-3" />
                
                {/* Level 1: Category */}
                {currentCategory && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedSubCategory(null);
                        setSelectedProductCategory(null);
                      }}
                      className={`hover:text-[#F96302] transition-colors ${
                        !selectedSubCategory ? 'text-[#F96302] font-medium' : 'hover:underline'
                      }`}
                    >
                      {currentCategory.name}
                    </button>
                  </>
                )}
                
                {/* Level 2: Sub Category */}
                {selectedSubCategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <button
                      onClick={() => {
                        setSelectedProductCategory(null);
                      }}
                      className={`hover:text-[#F96302] transition-colors ${
                        !selectedProductCategory ? 'text-[#F96302] font-medium' : 'hover:underline'
                      }`}
                    >
                      {currentCategory?.subCategories.find(s => s.id === selectedSubCategory)?.name}
                    </button>
                  </>
                )}
                
                {/* Level 3: Product Category */}
                {selectedProductCategory && selectedSubCategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-[#F96302] font-medium">
                      {currentCategory?.subCategories.find(s => s.id === selectedSubCategory)?.productCategories.find(p => p.id === selectedProductCategory)?.name}
                    </span>
                  </>
                )}
              </div>

              {/* Content based on selection */}
              {selectedProductCategory && selectedSubCategory ? (
                // Show Products Grid
                <>
                  <h2 className="text-[#F96302] mb-6">
                    {currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.productCategories.find(p => p.id === selectedProductCategory)?.name}
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    {productsToDisplay.map((product) => {
                      const isAdded = addedProductIds.has(product.uniqueId);

                      return (
                        <Card 
                          key={product.id} 
                          className="overflow-hidden border-2 hover:border-[#F96302] transition-all hover:shadow-lg cursor-pointer"
                          onClick={() => {
                            setSelectedProduct({
                              ...product,
                              categoryName: currentCategory.name,
                              subCategoryName: currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.name,
                            });
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <div className="aspect-square bg-gray-100 relative">
                            <ImageWithFallback
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                            {product.price && (
                              <div className="absolute top-2 right-2 bg-[#F96302] text-white px-2 py-1 rounded font-medium text-sm">
                                ${product.price.toFixed(2)}
                              </div>
                            )}
                            {isAdded && (
                              <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded flex items-center gap-1 text-xs font-medium">
                                <Check className="w-3 h-3" />
                                Added
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm text-[#1A1A1A] mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">Model: {product.model}</p>
                            
                            {/* 🛒 操作按钮组 */}
                            <div className="flex gap-2">
                              {/* 加入购物车按钮 */}
                              <Button
                                size="sm"
                                className={`flex-1 ${
                                  isAdded 
                                    ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#F96302] hover:bg-[#F96302]/90 text-white'
                                }`}
                                disabled={isAdded}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isAdded) {
                                    handleAddProduct({
                                      ...product,
                                      categoryName: currentCategory.name,
                                      subCategoryName: currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.name,
                                    });
                                  }
                                }}
                              >
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                {isAdded ? 'Added' : 'Add'}
                              </Button>
                              
                              {/* View Details按钮 */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-2 border-[#F96302] text-[#F96302] hover:bg-[#F96302] hover:text-white"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : selectedSubCategory ? (
                // Show Product Categories Grid
                <>
                  <h2 className="text-[#F96302] mb-6">
                    {currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.name}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {currentCategory.subCategories
                      .find(s => s.id === selectedSubCategory)
                      ?.productCategories.map((prodCat) => {
                        const count = getProductCategoryProductCount(
                          currentCategory.id,
                          selectedSubCategory,
                          prodCat.id
                        );

                        return (
                          <Card
                            key={prodCat.id}
                            className="p-4 hover:shadow-lg transition-all border-2 hover:border-[#F96302] cursor-pointer"
                            onClick={() => setSelectedProductCategory(prodCat.id)}
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 bg-[#F96302]/10 rounded flex items-center justify-center text-2xl flex-shrink-0">
                                {currentCategory.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-[#1A1A1A] mb-1">{prodCat.name}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2">{prodCat.description}</p>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-[#F96302] text-[#F96302] hover:bg-[#F96302] hover:text-white"
                            >
                              View Products ({count})
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Card>
                        );
                      })}
                  </div>
                </>
              ) : (
                // Show Sub-Category Grid Cards
                <>
                  <h2 className="text-[#F96302] mb-6">
                    All {currentCategory.name} Categories
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {currentCategory.subCategories.map((subCat) => {
                      const subCount = getSubCategoryProductCount(currentCategory.id, subCat.id);

                      return (
                        <Card
                          key={subCat.id}
                          className="p-4 hover:shadow-lg transition-all border-2 hover:border-[#F96302] cursor-pointer"
                          onClick={() => setSelectedSubCategory(subCat.id)}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 bg-[#F96302]/10 rounded flex items-center justify-center text-2xl flex-shrink-0">
                              {currentCategory.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-[#1A1A1A] mb-1">{subCat.name}</h3>
                              <p className="text-xs text-gray-500 line-clamp-2">{subCat.description}</p>
                            </div>
                          </div>

                          {/* Product Categories Preview */}
                          <div className="space-y-1 mb-3">
                            {subCat.productCategories.slice(0, 4).map((prodCat) => (
                              <div key={prodCat.id} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1 h-1 bg-[#F96302] rounded-full flex-shrink-0" />
                                <span className="line-clamp-1">{prodCat.name}</span>
                              </div>
                            ))}
                            {subCat.productCategories.length > 4 && (
                              <div className="text-xs text-gray-400 ml-3">
                                +{subCat.productCategories.length - 4} more
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-[#F96302] text-[#F96302] hover:bg-[#F96302] hover:text-white"
                          >
                            View All ({subCount})
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {!currentCategory && (
            <div className="text-center py-12 text-gray-500">
              <p>Select a category from the left to browse products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}