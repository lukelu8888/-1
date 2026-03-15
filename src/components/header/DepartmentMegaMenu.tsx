import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Department } from '../../data/header/departmentsData';
import { RecommendedProduct } from '../../data/header/recommendedProductsData';
import { DepartmentList } from './DepartmentList';
import { SubcategoryPanel } from './SubcategoryPanel';
import { ProductRecommendations } from './ProductRecommendations';

interface DepartmentMegaMenuProps {
  isDepartmentOpen: boolean;
  currentPage: string;
  hoveredDept: number | null;
  hoveredSubcat: string | null;
  hoveredProduct: string | null;
  showQuantityAlert: boolean;
  departments: Department[];
  onOpenChange: (open: boolean) => void;
  /** Sets hoveredDept and clears hoveredSubcat */
  onHoverDept: (index: number) => void;
  onHoverSubcat: (name: string) => void;
  /** Sets hoveredProduct and resets orderQuantity / colors / quantities */
  onHoverProduct: (name: string) => void;
  onNavigateToDept: (categoryName: string) => void;
  onNavigateToDeptSubcat: (categoryName: string, subcategoryName: string) => void;
  onNavigateToCatalog: () => void;
  onNavigateToSpecials: () => void;
  onCloseMenu: () => void;
  onProductItemClick: (productName: string) => void;
  /** Called on mouseLeave of the far-right product/recommendation column */
  onMouseLeaveProductArea: () => void;
  getRecommendedProducts: (subcategoryName: string) => RecommendedProduct[];
  /**
   * Pass the ProductPanel JSX from Header.tsx here when hoveredProduct has details.
   * Pass null to show ProductRecommendations instead.
   * Keeping ProductPanel logic in Header.tsx for this refactor pass.
   */
  productPanelNode: ReactNode;
}

export function DepartmentMegaMenu({
  isDepartmentOpen,
  currentPage,
  hoveredDept,
  hoveredSubcat,
  hoveredProduct,
  showQuantityAlert,
  departments,
  onOpenChange,
  onHoverDept,
  onHoverSubcat,
  onHoverProduct,
  onNavigateToDept,
  onNavigateToDeptSubcat,
  onNavigateToCatalog,
  onNavigateToSpecials,
  onCloseMenu,
  onProductItemClick,
  onMouseLeaveProductArea,
  getRecommendedProducts,
  productPanelNode,
}: DepartmentMegaMenuProps) {
  const department = hoveredDept !== null ? departments[hoveredDept] : null;

  return (
    <DropdownMenu open={isDepartmentOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          currentPage === 'catalog' || isDepartmentOpen
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}>
          Shop by Department
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={`p-0 max-h-[600px] overflow-hidden transition-all ${
        hoveredDept === null
          ? 'w-[225px]'
          : hoveredSubcat === null
            ? 'w-[465px]'
            : 'w-[1150px]'
      }`}>
        <div className="flex">
          {/* Left Column - Featured Events & Departments List */}
          <DepartmentList
            departments={departments}
            hoveredDept={hoveredDept}
            showQuantityAlert={showQuantityAlert}
            onHoverDept={onHoverDept}
            onNavigateToDept={onNavigateToDept}
            onNavigateToCatalog={onNavigateToCatalog}
            onCloseMenu={onCloseMenu}
          />

          {/* Middle Column - Subcategories */}
          {department !== null && (
            <SubcategoryPanel
              department={department}
              hoveredSubcat={hoveredSubcat}
              showQuantityAlert={showQuantityAlert}
              onHoverSubcat={onHoverSubcat}
              onNavigateToDept={onNavigateToDept}
            />
          )}

          {/* Right Column - When hovering dept AND subcat */}
          {department !== null && hoveredSubcat && (
            <div className="flex flex-1">
              {/* Third Level Items */}
              <div className="w-[280px] flex-shrink-0 border-r bg-white overflow-y-auto max-h-[600px] relative z-10">
                <div className="px-4 py-4">
                  {(() => {
                    const subcat = department.subcategories.find(s => s.name === hoveredSubcat);
                    if (!subcat) return null;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="underline">{subcat.name}</h3>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onNavigateToDeptSubcat(department.name, subcat.name);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Shop All
                          </button>
                        </div>
                        <div className="space-y-2">
                          {subcat.items && subcat.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`block text-sm py-1 cursor-pointer transition-colors ${
                                hoveredProduct === item ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                              }`}
                              onMouseEnter={() => {
                                if (!showQuantityAlert) {
                                  onHoverProduct(item);
                                }
                              }}
                              onMouseLeave={() => {
                                // Don't clear if user is interacting with product details
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onProductItemClick(item);
                              }}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                        <button className="flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700">
                          <ChevronDown className="h-4 w-4 rotate-90" />
                          <span>Back</span>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Far Right Column - Product Details or Recommended Products */}
              <div
                className="w-[390px] flex-shrink-0 bg-white overflow-y-auto max-h-[600px] relative z-0"
                onMouseLeave={onMouseLeaveProductArea}
              >
                <div className="p-4">
                  {productPanelNode ?? (
                    <ProductRecommendations
                      products={(() => {
                        const subcat = department.subcategories.find(s => s.name === hoveredSubcat);
                        return subcat
                          ? getRecommendedProducts(subcat.name)
                          : getRecommendedProducts('');
                      })()}
                      priceLabel="Starting from"
                      onProductClick={onNavigateToSpecials}
                      onViewAllClick={onNavigateToSpecials}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Column - When hovering dept but NOT subcat */}
          {department !== null && !hoveredSubcat && (
            <>
              {/* Recommended Products - Right side when not hovering subcat */}
              <div className="w-[300px] bg-white overflow-y-auto max-h-[600px]">
                <div className="p-4">
                  <ProductRecommendations
                    products={getRecommendedProducts(department.subcategories[0].name)}
                    priceLabel="From"
                    onProductClick={onNavigateToSpecials}
                    onViewAllClick={onNavigateToSpecials}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
