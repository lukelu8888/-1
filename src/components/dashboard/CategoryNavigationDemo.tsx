import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import {
  Package,
  ChevronRight,
  ChevronDown,
  Search,
  TrendingUp,
  Zap,
  Star,
  Grid3x3,
  Menu,
  Layers,
  Home,
  ArrowRight,
} from 'lucide-react';
import { productCatalog } from '../../data/productData';

type ViewMode = 'tree-grid' | 'mega-menu' | 'layered-cards';

export function CategoryNavigationDemo() {
  const [viewMode, setViewMode] = useState<ViewMode>('tree-grid');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('appliances');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const currentCategory = productCatalog.find(c => c.id === expandedCategory);

  // Filter categories based on search
  const filteredCategories = productCatalog.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subCategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[#F96302]">Category Navigation - Demo Comparison</h1>
              <p className="text-gray-600 text-sm mt-1">
                Compare different navigation approaches to find the best browsing experience
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex gap-3">
            <Button
              onClick={() => setViewMode('tree-grid')}
              variant={viewMode === 'tree-grid' ? 'default' : 'outline'}
              className={viewMode === 'tree-grid' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Plan A: Tree + Grid Cards
            </Button>
            <Button
              onClick={() => setViewMode('mega-menu')}
              variant={viewMode === 'mega-menu' ? 'default' : 'outline'}
              className={viewMode === 'mega-menu' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
            >
              <Menu className="w-4 h-4 mr-2" />
              Plan B: Mega Menu
            </Button>
            <Button
              onClick={() => setViewMode('layered-cards')}
              variant={viewMode === 'layered-cards' ? 'default' : 'outline'}
              className={viewMode === 'layered-cards' ? 'bg-[#F96302] hover:bg-[#E05502]' : ''}
            >
              <Layers className="w-4 h-4 mr-2" />
              Plan C: Layered Cards
            </Button>
          </div>
        </div>
      </div>

      {/* Plan A: Tree + Grid Cards */}
      {viewMode === 'tree-grid' && (
        <div className="flex max-w-[1400px] mx-auto">
          {/* Left Sidebar - Tree Navigation */}
          <div className="w-[280px] bg-white border-r min-h-screen p-4">
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

            <div className="space-y-1">
              <div className="text-xs text-gray-500 mb-2 px-2">BROWSE BY CATEGORY</div>
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategory === category.id;
                const productCount = getCategoryProductCount(category.id);

                return (
                  <div key={category.id}>
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 hover:bg-[#F96302]/10 rounded text-left group"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#F96302]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F96302]" />
                      )}
                      <span className="text-xl">{category.icon}</span>
                      <span className={`flex-1 text-sm ${isExpanded ? 'text-[#F96302]' : ''}`}>
                        {category.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {productCount}
                      </Badge>
                    </button>

                    {/* Sub Categories */}
                    {isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {category.subCategories.map((subCat) => {
                          const subCount = getSubCategoryProductCount(category.id, subCat.id);
                          const isSelected = selectedSubCategory === subCat.id;

                          return (
                            <button
                              key={subCat.id}
                              onClick={() => setSelectedSubCategory(isSelected ? null : subCat.id)}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm hover:bg-[#F96302]/10 ${
                                isSelected ? 'bg-[#F96302]/10 text-[#F96302]' : 'text-gray-700'
                              }`}
                            >
                              <span>{subCat.name}</span>
                              <span className="text-xs text-gray-500">({subCount})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content - Grid Cards */}
          <div className="flex-1 p-6">
            {currentCategory && (
              <>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6 text-gray-600">
                  <Home className="w-4 h-4" />
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-[#F96302]">{currentCategory.name}</span>
                  {selectedSubCategory && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-[#F96302]">
                        {currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.name}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="text-[#F96302] mb-6">
                  {selectedSubCategory
                    ? currentCategory.subCategories.find(s => s.id === selectedSubCategory)?.name
                    : `All ${currentCategory.name} Categories`}
                </h2>

                {/* Sub-Category Grid Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {currentCategory.subCategories
                    .filter(sub => !selectedSubCategory || sub.id === selectedSubCategory)
                    .map((subCat) => {
                      const subCount = getSubCategoryProductCount(currentCategory.id, subCat.id);

                      return (
                        <Card
                          key={subCat.id}
                          className="p-4 hover:shadow-lg transition-shadow border-2 hover:border-[#F96302] cursor-pointer"
                          onClick={() => setSelectedSubCategory(subCat.id)}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-12 h-12 bg-[#F96302]/10 rounded flex items-center justify-center text-2xl">
                              {currentCategory.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#1A1A1A] mb-1">{subCat.name}</h3>
                              <p className="text-xs text-gray-500">{subCat.description}</p>
                            </div>
                          </div>

                          {/* Product Categories */}
                          <div className="space-y-1 mb-3">
                            {subCat.productCategories.slice(0, 4).map((prodCat) => (
                              <div key={prodCat.id} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1 h-1 bg-[#F96302] rounded-full" />
                                <span>{prodCat.name}</span>
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
          </div>
        </div>
      )}

      {/* Plan B: Mega Menu */}
      {viewMode === 'mega-menu' && (
        <div className="max-w-[1400px] mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Horizontal Category Bar */}
            <div className="flex border-b overflow-x-auto">
              {productCatalog.map((category) => {
                const isActive = hoveredCategory === category.id;
                const productCount = getCategoryProductCount(category.id);

                return (
                  <button
                    key={category.id}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onClick={() => setHoveredCategory(isActive ? null : category.id)}
                    className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-[#F96302] bg-[#F96302]/5'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <div className={`font-medium ${isActive ? 'text-[#F96302]' : 'text-gray-700'}`}>
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500">{productCount} products</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mega Menu Dropdown */}
            {hoveredCategory && (
              <div
                className="p-6 border-b bg-gray-50"
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {(() => {
                  const category = productCatalog.find(c => c.id === hoveredCategory);
                  if (!category) return null;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[#F96302]">{category.name} Categories</h3>
                        <Badge className="bg-[#F96302]">
                          {getCategoryProductCount(category.id)} Products
                        </Badge>
                      </div>

                      <div className="grid grid-cols-5 gap-6">
                        {category.subCategories.map((subCat) => {
                          const subCount = getSubCategoryProductCount(category.id, subCat.id);

                          return (
                            <div key={subCat.id} className="space-y-2">
                              <button className="font-medium text-[#1A1A1A] hover:text-[#F96302] text-left w-full flex items-center justify-between group">
                                <span>{subCat.name}</span>
                                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <div className="text-xs text-gray-500 mb-2">({subCount} items)</div>
                              <div className="space-y-1.5">
                                {subCat.productCategories.slice(0, 5).map((prodCat) => (
                                  <button
                                    key={prodCat.id}
                                    className="block text-sm text-gray-600 hover:text-[#F96302] text-left w-full"
                                  >
                                    • {prodCat.name}
                                  </button>
                                ))}
                                {subCat.productCategories.length > 5 && (
                                  <button className="text-xs text-[#F96302] hover:underline">
                                    View all {subCat.productCategories.length} →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Default View when no category hovered */}
            {!hoveredCategory && (
              <div className="p-12 text-center text-gray-500">
                <Menu className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Hover over a category above to see all subcategories</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan C: Layered Cards with Search */}
      {viewMode === 'layered-cards' && (
        <div className="max-w-[1400px] mx-auto p-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search all categories and products..."
                className="pl-12 h-12 text-base border-2 border-gray-200 focus:border-[#F96302]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Popular Categories */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">POPULAR CATEGORIES:</div>
              <div className="flex gap-2 flex-wrap">
                {productCatalog.slice(0, 6).map((cat) => (
                  <Button
                    key={cat.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedCategory(cat.id)}
                    className={`border-2 ${
                      expandedCategory === cat.id
                        ? 'border-[#F96302] bg-[#F96302] text-white'
                        : 'border-gray-200 hover:border-[#F96302]'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.name}
                    <Zap className="w-3 h-3 ml-2 text-orange-400" />
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* All Categories - Layered Card View */}
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategory === category.id;
              const productCount = getCategoryProductCount(category.id);

              return (
                <Card key={category.id} className="overflow-hidden border-2">
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="w-full p-4 bg-gradient-to-r from-[#F96302]/5 to-white hover:from-[#F96302]/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-2xl border-2 border-[#F96302]/20">
                          {category.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="text-[#1A1A1A] font-medium">{category.name}</h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#F96302]">{productCount} Products</Badge>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-[#F96302]" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Sub-Categories */}
                  {isExpanded && (
                    <div className="p-6 bg-gray-50 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        {category.subCategories.map((subCat) => {
                          const subCount = getSubCategoryProductCount(category.id, subCat.id);

                          return (
                            <div
                              key={subCat.id}
                              className="bg-white rounded-lg p-4 border-2 border-gray-100 hover:border-[#F96302] transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-[#1A1A1A]">{subCat.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {subCount}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mb-3">{subCat.description}</p>

                              {/* Product Categories List */}
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {subCat.productCategories.slice(0, 6).map((prodCat) => (
                                  <button
                                    key={prodCat.id}
                                    className="text-xs text-left text-gray-600 hover:text-[#F96302] flex items-center gap-1"
                                  >
                                    <div className="w-1 h-1 bg-[#F96302] rounded-full" />
                                    {prodCat.name}
                                  </button>
                                ))}
                              </div>

                              {subCat.productCategories.length > 6 && (
                                <button className="text-xs text-[#F96302] hover:underline">
                                  +{subCat.productCategories.length - 6} more categories →
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
