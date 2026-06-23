import { ReactNode } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { RecommendedProduct } from '../../data/departmentRecommendedProductsData';
import { getLeafCategoryImage } from '../../data/categoryLeafImages';
import type { Department } from '../../lib/storefrontDepartmentBaseline';
import { SubcategoryPanel } from './SubcategoryPanel';
import { ProductRecommendations } from '../shared/ProductRecommendations';

interface DepartmentMegaMenuProps {
  isDepartmentOpen: boolean;
  currentPage: string;
  hoveredDept: number | null;
  hoveredSubcat: string | null;
  hoveredProduct: string | null;
  showQuantityAlert: boolean;
  departments: Department[];
  focusedDepartmentName?: string;
  onOpenChange: (open: boolean) => void;
  /** Sets hoveredDept and clears hoveredSubcat */
  onHoverDept: (index: number) => void;
  onClearDepartmentHover: () => void;
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
  isRtl?: boolean;
  isActive?: boolean;
  onTriggerClick?: () => void;
}

export function DepartmentMegaMenu({
  isDepartmentOpen,
  currentPage,
  hoveredDept,
  hoveredSubcat,
  hoveredProduct,
  showQuantityAlert,
  departments,
  focusedDepartmentName,
  onOpenChange,
  onHoverDept,
  onClearDepartmentHover,
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
  isRtl = false,
  isActive = false,
  onTriggerClick,
}: DepartmentMegaMenuProps) {
  const department = hoveredDept !== null ? departments[hoveredDept] : null;
  const menuDirection = isRtl ? 'rtl' : 'ltr';
  const selectedSubcategory = department?.subcategories.find(s => s.name === hoveredSubcat) ?? null;
  const menuWidthClass = hoveredDept === null
    ? 'w-[280px]'
    : hoveredSubcat === null
      ? 'w-[520px]'
      : 'w-[1200px]';

  return (
    <DropdownMenu open={isDepartmentOpen} onOpenChange={onOpenChange} dir={menuDirection}>
      <DropdownMenuTrigger asChild>
        <button
          onClick={onTriggerClick}
          className={`flex min-w-[260px] items-center justify-between rounded-sm px-4 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition-colors ${
            isActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-white text-gray-800 hover:bg-gray-100 hover:text-red-700'
          }`}
        >
          <span className="flex items-center gap-3">
            <Menu className="h-5 w-5" />
            <span>Shop by Department</span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        dir={menuDirection}
        onMouseLeave={() => onOpenChange(false)}
        className={`p-0 max-h-[600px] overflow-hidden transition-all ${menuWidthClass}`}
      >
        <div className="flex">
          <div className="w-[280px] flex-shrink-0 border-r bg-white overflow-y-auto max-h-[600px]">
            <div className="py-1">
              <div className="space-y-1">
                {departments.map((dept, index) => (
                  <button
                    type="button"
                    key={dept.name}
                    onMouseEnter={() => {
                      if (!showQuantityAlert) {
                        onHoverDept(index);
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigateToDept(dept.name);
                    }}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-left text-sm cursor-pointer transition-colors group ${
                      hoveredDept === index ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                    }`}
                  >
                    <span className="font-medium leading-snug">{dept.name}</span>
                    <ChevronDown className={`h-4 w-4 -rotate-90 transition-colors ${
                      hoveredDept === index ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600'
                    }`} />
                  </button>
                ))}
                <button
                  type="button"
                  onMouseEnter={() => {
                    if (!showQuantityAlert) {
                      onClearDepartmentHover();
                    }
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onNavigateToCatalog();
                  }}
                  className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:text-orange-600"
                >
                  <span>All Departments</span>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Subcategories */}
          {department !== null && (
            <SubcategoryPanel
              department={department}
              hoveredSubcat={hoveredSubcat}
              showQuantityAlert={showQuantityAlert}
              onHoverSubcat={onHoverSubcat}
              onNavigateToDept={onNavigateToDept}
              onNavigateToDeptSubcat={onNavigateToDeptSubcat}
            />
          )}

          {/* Right Column - When hovering dept AND subcat */}
          {department !== null && hoveredSubcat && (
            <div className="flex flex-1">
              {/* Third Level Items */}
              <div className="w-[280px] flex-shrink-0 border-r bg-white overflow-y-auto max-h-[600px] relative z-10">
                <div className="px-4 py-4">
                  {(() => {
                    const subcat = selectedSubcategory;
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
                          {subcat.items && subcat.items.map((item, idx) => {
                            const itemImage = getLeafCategoryImage(item);

                            return (
                            <div
                              key={idx}
                              className={`flex min-h-10 items-center gap-3 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
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
                              {itemImage && (
                                <img
                                  src={itemImage}
                                  alt={item}
                                  className="h-9 w-9 flex-shrink-0 rounded object-cover"
                                  loading="lazy"
                                />
                              )}
                              <span className="leading-snug">{item}</span>
                            </div>
                            );
                          })}
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
                  {productPanelNode ?? (hoveredProduct && getLeafCategoryImage(hoveredProduct) ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Category Preview</h3>
                      <div className="overflow-hidden rounded-lg bg-gray-100 aspect-square">
                        <img
                          src={getLeafCategoryImage(hoveredProduct)}
                          alt={hoveredProduct}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">{hoveredProduct}</h4>
                        <p className="mt-1 text-sm text-gray-500">Browse products and sourcing options in this category.</p>
                      </div>
                    </div>
                  ) : (
                    <ProductRecommendations
                      products={selectedSubcategory
                        ? getRecommendedProducts(selectedSubcategory.name)
                        : getRecommendedProducts('')
                      }
                      priceLabel="Starting from"
                      onProductClick={onNavigateToSpecials}
                      onViewAllClick={onNavigateToSpecials}
                    />
                  ))}
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
