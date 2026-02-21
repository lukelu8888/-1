import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from '../contexts/RouterContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { 
  ChevronRight, 
  Grid3x3, 
  List, 
  ChevronDown,
  ArrowLeft,
  Calculator,
  Box,
  Layers,
  Weight,
  Package,
  Ruler,
  ShoppingCart
} from 'lucide-react';
import { productCatalog, MainCategory, SubCategory, ProductCategory, ProductSpec } from '../data/productData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { OrderEditingBanner } from './OrderEditingBanner';
import { useUser } from '../contexts/UserContext';

type ViewMode = 'level1' | 'level2' | 'level3' | 'products' | 'detail';

export function ProductCatalog() {
  const { t } = useLanguage();
  const { navigateTo } = useRouter();
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('level1');
  const [selectedLevel1, setSelectedLevel1] = useState<MainCategory | null>(null);
  const [selectedLevel2, setSelectedLevel2] = useState<SubCategory | null>(null);
  const [selectedLevel3, setSelectedLevel3] = useState<ProductCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSpec | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const handleReturnToOrder = () => {
    // Navigate back to dashboard with create-order view
    if (user) {
      localStorage.setItem('dashboardActiveView', 'create-order');
      navigateTo('dashboard');
    } else {
      // If not logged in, prompt to login first
      navigateTo('login');
    }
  };

  const handleLevel1Click = (category: MainCategory) => {
    setSelectedLevel1(category);
    setViewMode('level2');
  };

  const handleLevel2Click = (subCategory: SubCategory) => {
    setSelectedLevel2(subCategory);
    setViewMode('level3');
  };

  const handleLevel3Click = (productCategory: ProductCategory) => {
    setSelectedLevel3(productCategory);
    setViewMode('products');
  };

  const handleProductClick = (product: ProductSpec) => {
    console.log('✅ ProductCatalog: 点击产品', product.name, product.id);
    console.log('✅ ProductCatalog: 设置 selectedProduct', product);
    setSelectedProduct(product);
    setViewMode('detail');
    console.log('✅ ProductCatalog: viewMode 设置为 detail');
  };

  const handleBack = () => {
    if (viewMode === 'detail') {
      setViewMode('products');
      setSelectedProduct(null);
    } else if (viewMode === 'products') {
      setViewMode('level3');
      setSelectedLevel3(null);
    } else if (viewMode === 'level3') {
      setViewMode('level2');
      setSelectedLevel2(null);
    } else if (viewMode === 'level2') {
      setViewMode('level1');
      setSelectedLevel1(null);
    }
  };

  const updateQuantity = (productId: string, cartons: number) => {
    setQuantities({
      ...quantities,
      [productId]: Math.max(0, cartons),
    });
  };

  const calculateTotals = (product: ProductSpec, cartons: number) => {
    const totalUnits = cartons * product.unitsPerCarton;
    const totalCartons = cartons;
    const totalNetWeight = (cartons * product.cartonNetWeight).toFixed(2);
    const totalGrossWeight = (cartons * product.cartonGrossWeight).toFixed(2);
    const cartonVolume = (product.cartonDimensions.length * product.cartonDimensions.width * product.cartonDimensions.height) / 1000000; // m³
    const totalVolume = (totalCartons * cartonVolume).toFixed(3);

    return {
      totalUnits,
      totalCartons,
      totalNetWeight,
      totalGrossWeight,
      totalVolume,
    };
  };

  const getBreadcrumb = () => {
    const crumbs = [];
    if (selectedLevel1) crumbs.push(selectedLevel1.name);
    if (selectedLevel2) crumbs.push(selectedLevel2.name);
    if (selectedLevel3) crumbs.push(selectedLevel3.name);
    if (selectedProduct) crumbs.push(selectedProduct.name);
    return crumbs.join(' > ');
  };

  // Level 1 - Main Categories (一级类目)
  if (viewMode === 'level1') {
    return (
      <>
        <OrderEditingBanner onReturnToOrder={handleReturnToOrder} />
        <section className="min-h-screen bg-gray-50 py-16 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-600">
                {t.productCatalog?.badge || 'Product Catalog'}
              </Badge>
              <h1 className="text-gray-900 mb-4">
                {t.productCatalog?.level1Title || 'Level 1: Main Categories'}
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                {t.productCatalog?.level1Subtitle || 'Select a main category to browse products'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productCatalog.map((category) => (
                <Card 
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => handleLevel1Click(category)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{category.icon}</div>
                        <div>
                          <CardTitle className="group-hover:text-blue-600 transition-colors">
                            {category.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // Level 2 - SubCategories (二级类目)
  if (viewMode === 'level2' && selectedLevel1) {
    return (
      <section className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.productCatalog?.back || 'Back'}
          </Button>

          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-4">{getBreadcrumb()}</div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-5xl">{selectedLevel1.icon}</div>
              <div>
                <h1 className="text-gray-900">{selectedLevel1.name}</h1>
                <p className="text-gray-600">{selectedLevel1.description}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Badge variant="outline" className="mb-4">
              {t.productCatalog?.level2 || 'Level 2: Product Categories'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedLevel1.subCategories.map((subCategory) => (
              <Card 
                key={subCategory.id}
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleLevel2Click(subCategory)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        {subCategory.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {subCategory.description}
                      </CardDescription>
                      <div className="mt-3 text-sm text-gray-500">
                        {subCategory.productCategories.length} {t.productCatalog?.subcategories || 'subcategories'}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-2" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Level 3 - Product Categories (三级类目)
  if (viewMode === 'level3' && selectedLevel2) {
    return (
      <section className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.productCatalog?.back || 'Back'}
          </Button>

          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-4">{getBreadcrumb()}</div>
            <h1 className="text-gray-900 mb-2">{selectedLevel2.name}</h1>
            <p className="text-gray-600">{selectedLevel2.description}</p>
          </div>

          <div className="mb-6">
            <Badge variant="outline" className="mb-4">
              <Layers className="h-3 w-3 mr-1" />
              {t.productCatalog?.level3 || 'Level 3: Product Types'}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedLevel2.productCategories.map((productCategory) => (
              <Card 
                key={productCategory.id}
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleLevel3Click(productCategory)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:text-blue-600 transition-colors">
                        {productCategory.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {productCategory.description}
                      </CardDescription>
                      <div className="mt-3 text-sm text-gray-500">
                        {productCategory.products.length} {t.productCatalog?.products || 'products'}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ml-2" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Products List (产品列表)
  if (viewMode === 'products' && selectedLevel3) {
    return (
      <section className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.productCatalog?.back || 'Back'}
          </Button>

          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-4">{getBreadcrumb()}</div>
            <h1 className="text-gray-900 mb-2">{selectedLevel3.name}</h1>
            <p className="text-gray-600 mb-4">{selectedLevel3.description}</p>
            <div className="text-sm text-gray-500">
              {selectedLevel3.products.length} {t.productCatalog?.modelsAvailable || 'models available'}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedLevel3.products.map((product) => (
              <Card 
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('✅ ProductCatalog: 产品卡片被点击', product.name);
                  handleProductClick(product);
                }}
              >
                <div className="aspect-video overflow-hidden bg-gray-200">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {product.model}
                      </Badge>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </CardTitle>
                    </div>
                    {product.price && (
                      <div className="text-right">
                        <div className="text-blue-600">${product.price}</div>
                      </div>
                    )}
                  </div>
                  <CardDescription className="mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Weight className="h-4 w-4" />
                      <span>
                        {t.productCatalog?.weight || 'Weight'}: {product.netWeight}kg / {product.grossWeight}kg
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span>
                        {product.unitsPerCarton} {t.productCatalog?.unitsPerCarton || 'units/carton'}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Product Detail (产品详情)
  if (viewMode === 'detail' && selectedProduct) {
    console.log('✅ ProductCatalog: 渲染产品详情页面', selectedProduct.name);
    const cartons = quantities[selectedProduct.id] || 0;
    const totals = calculateTotals(selectedProduct, cartons);

    return (
      <section className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="mx-auto max-w-7xl">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.productCatalog?.back || 'Back'}
          </Button>

          <div className="text-sm text-gray-500 mb-6">{getBreadcrumb()}</div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Product Image */}
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-200">
              <ImageWithFallback
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div>
              <Badge className="mb-3 bg-blue-600">
                {t.productCatalog?.model || 'Model'}: {selectedProduct.model}
              </Badge>
              <h1 className="text-gray-900 mb-4">{selectedProduct.name}</h1>
              
              {selectedProduct.price && (
                <div className="mb-6">
                  <span className="text-3xl text-blue-600">${selectedProduct.price}</span>
                  <span className="text-gray-500 ml-2">/ {t.productCatalog?.unit || 'unit'}</span>
                </div>
              )}

              {/* Specifications */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="h-5 w-5" />
                    {t.productCatalog?.specifications || 'Specifications'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between border-b pb-2">
                        <span className="text-sm text-gray-600">{key}:</span>
                        <span className="text-sm text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Packaging Info */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5" />
                    {t.productCatalog?.packagingInfo || 'Packaging Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.unitsPerCarton || 'Units per Carton'}:</span>
                    <span className="text-gray-900">{selectedProduct.unitsPerCarton}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.unitNetWeight || 'Unit Net Weight'}:</span>
                    <span className="text-gray-900">{selectedProduct.netWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.unitGrossWeight || 'Unit Gross Weight'}:</span>
                    <span className="text-gray-900">{selectedProduct.grossWeight} kg</span>
                  </div>
                  <div className="border-t pt-3 mt-3"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.cartonDimensions || 'Carton Dimensions'}:</span>
                    <span className="text-gray-900">
                      {selectedProduct.cartonDimensions.length} × {selectedProduct.cartonDimensions.width} × {selectedProduct.cartonDimensions.height} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.cartonNetWeight || 'Carton Net Weight'}:</span>
                    <span className="text-gray-900">{selectedProduct.cartonNetWeight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t.productCatalog?.cartonGrossWeight || 'Carton Gross Weight'}:</span>
                    <span className="text-gray-900">{selectedProduct.cartonGrossWeight} kg</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity Calculator */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Calculator className="h-5 w-5" />
                    {t.productCatalog?.orderCalculator || 'Order Calculator'}
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {t.productCatalog?.orderInCartons || 'Orders must be in full cartons'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="cartons" className="text-blue-900">
                      {t.productCatalog?.numberOfCartons || 'Number of Cartons'}
                    </Label>
                    <Input
                      id="cartons"
                      type="number"
                      min="0"
                      step="1"
                      value={cartons}
                      onChange={(e) => updateQuantity(selectedProduct.id, parseInt(e.target.value) || 0)}
                      className="mt-2 bg-white border-blue-300"
                      placeholder="0"
                    />
                    <p className="text-xs text-blue-700 mt-1">
                      {t.productCatalog?.cartonMultipleNote || 'Quantity must be in multiples of cartons'} ({selectedProduct.unitsPerCarton} {t.productCatalog?.unitsPerCarton || 'units/carton'})
                    </p>
                  </div>

                  {cartons > 0 && (
                    <div className="space-y-3 pt-4 border-t-2 border-blue-300">
                      <h3 className="text-blue-900 flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        {t.productCatalog?.orderSummary || 'Order Summary'}
                      </h3>
                      <div className="flex justify-between">
                        <span className="text-blue-900">{t.productCatalog?.totalUnits || 'Total Units'}:</span>
                        <span className="text-blue-900">{totals.totalUnits} {t.productCatalog?.units || 'units'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-900">{t.productCatalog?.totalCartons || 'Total Cartons'}:</span>
                        <span className="text-blue-900">{totals.totalCartons} {t.productCatalog?.cartons || 'cartons'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-900">{t.productCatalog?.totalNetWeight || 'Total Net Weight'}:</span>
                        <span className="text-blue-900">{totals.totalNetWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-900">{t.productCatalog?.totalGrossWeight || 'Total Gross Weight'}:</span>
                        <span className="text-blue-900">{totals.totalGrossWeight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-900">{t.productCatalog?.totalVolume || 'Total Volume'}:</span>
                        <span className="text-blue-900">{totals.totalVolume} m³</span>
                      </div>
                      {selectedProduct.price && (
                        <div className="flex justify-between pt-3 border-t-2 border-blue-300">
                          <span className="text-blue-900">{t.productCatalog?.totalPrice || 'Total Price'}:</span>
                          <span className="text-xl text-blue-900">${(selectedProduct.price * totals.totalUnits).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4" disabled={cartons === 0} onClick={handleReturnToOrder}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t.productCatalog?.addToCart || 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}