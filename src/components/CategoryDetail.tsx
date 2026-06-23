import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Home, X, Package } from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';
import { productDetailsData, ProductDetail } from '../data/productDetailsData';
import { useCart } from '../contexts/CartContext';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { ProductDetailPage } from './ProductDetailPage';
import { getLeafCategoryImage } from '../data/categoryLeafImages';
import type { MainCategory, ProductSpec } from '../data/productData';
import { fetchProductCatalog } from '../lib/services/productCatalogService';
import { getProductMoq, getProductQuantityStep, getProductUnit } from '../lib/productPublication';
import { storefrontBaselineDepartments as fallbackDepartments } from '../lib/storefrontDepartmentBaseline';
import { useStorefrontDepartments } from '../hooks/useStorefrontDepartments';

interface CategoryDetailProps {
  category?: string;
  subcategory?: string;
}

export function CategoryDetail({ category = 'Building Materials', subcategory }: CategoryDetailProps) {
  const { navigateTo } = useRouter();
  const { addToCart } = useCart();
  const { departments: storefrontDepartments } = useStorefrontDepartments();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorQuantities, setColorQuantities] = useState<{ [color: string]: number }>({});
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [selectedLeafCategory, setSelectedLeafCategory] = useState<string | null>(null);
  const [productCatalog, setProductCatalog] = useState<MainCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<ProductSpec | null>(null);
  const staticProductMapping: { [key: string]: string[] } = {
    'Shop All Lumber': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
    'Dimensional Lumber': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts'],
    'Plywood': ['Dryer Parts', 'Dishwasher Parts', 'Refrigerator Parts'],
    'OSB Boards': ['Refrigerator Parts', 'Dryer Parts', 'Washer Parts'],
    'Hardwood Lumber': ['Washer Parts', 'Dishwasher Parts', 'Dryer Parts'],
    'Pressure Treated Lumber': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
    'Shop All Masonry': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
    'Concrete Mix': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts'],
    'Cement': ['Dryer Parts', 'Dishwasher Parts', 'Washer Parts'],
    'Mortar': ['Refrigerator Parts', 'Dryer Parts', 'Washer Parts'],
    'Grout': ['Washer Parts', 'Dishwasher Parts', 'Refrigerator Parts'],
    'Bricks & Blocks': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
    'Shop All Appliances': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
    'Refrigerators': ['Refrigerator Parts'],
    'Washers & Dryers': ['Washer Parts', 'Dryer Parts'],
    'Ranges, Cooktops & Ovens': ['Refrigerator Parts', 'Washer Parts'],
    'Dishwashers': ['Dishwasher Parts'],
    'Freezers': ['Refrigerator Parts', 'Dryer Parts'],
    'Range Hoods': ['Washer Parts', 'Dishwasher Parts'],
  };

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    fetchProductCatalog()
      .then((catalog) => {
        if (!cancelled) setProductCatalog(catalog);
      })
      .catch((error) => {
        console.warn('Category catalog fetch failed; falling back to static category data.', error);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getDynamicDepartmentData = (cat: string) => {
    const department = productCatalog.find((item) => item.name === cat);
    if (!department) return null;
    return {
      title: department.name,
      subcategories: department.subCategories.map((subcat) => ({
        name: subcat.name,
        items: subcat.productCategories.map((leaf) => leaf.name),
        productCategories: subcat.productCategories,
      })),
    };
  };

  const getDynamicLeafProducts = (leafName: string): ProductSpec[] => {
    const department = productCatalog.find((item) => item.name === category);
    if (!department) return [];
    for (const subcat of department.subCategories) {
      const leaf = subcat.productCategories.find((item) => item.name === leafName);
      if (leaf) return leaf.products || [];
    }
    return [];
  };

  // Dynamic category data based on the category passed
  const getCategoryData = (cat: string) => {
    const departmentData = storefrontDepartments.find((dept) => dept.name === cat) || fallbackDepartments.find((dept) => dept.name === cat);
    if (departmentData) {
      return {
        title: departmentData.name,
        subcategories: departmentData.subcategories,
      };
    }

    // Default to Building Materials if category not found
    const categoryMap: { [key: string]: any } = {
      'Appliances': {
        title: 'Appliances',
        subcategories: [
          {
            name: 'Major Appliances',
            items: [
              'Shop All Appliances',
              'Refrigerators',
              'Washers & Dryers',
              'Ranges, Cooktops & Ovens',
              'Dishwashers',
              'Freezers',
              'Range Hoods'
            ]
          },
          {
            name: 'Small Appliances',
            items: [
              'Shop All Small Appliances',
              'Coffee Makers',
              'Blenders',
              'Toasters',
              'Microwaves',
              'Slow Cookers',
              'Air Fryers'
            ]
          },
          {
            name: 'Appliance Parts & Accessories',
            items: [
              'Shop All Parts',
              'Refrigerator Parts',
              'Washer Parts',
              'Dryer Parts',
              'Dishwasher Parts',
              'Range Parts'
            ]
          }
        ]
      },
      'Bath': {
        title: 'Bath',
        subcategories: [
          {
            name: 'Toilets & Bidets',
            items: [
              'Shop All Toilets',
              'Two-Piece Toilets',
              'One-Piece Toilets',
              'Bidets',
              'Toilet Seats',
              'Toilet Parts'
            ]
          },
          {
            name: 'Faucets',
            items: [
              'Shop All Faucets',
              'Bathroom Faucets',
              'Shower Faucets',
              'Tub Faucets',
              'Faucet Parts'
            ]
          },
          {
            name: 'Showers',
            items: [
              'Shop All Showers',
              'Shower Doors',
              'Shower Heads',
              'Shower Panels',
              'Shower Accessories'
            ]
          },
          {
            name: 'Vanities',
            items: [
              'Shop All Vanities',
              'Single Vanities',
              'Double Vanities',
              'Vanity Tops',
              'Vanity Cabinets'
            ]
          }
        ]
      },
      'Building Materials': {
        title: 'Building Materials',
        subcategories: [
          {
            name: 'Lumber & Wood',
            items: [
              'Shop All Lumber',
              'Dimensional Lumber',
              'Plywood',
              'OSB Boards',
              'Hardwood Lumber',
              'Pressure Treated Lumber'
            ]
          },
          {
            name: 'Concrete & Cement',
            items: [
              'Shop All Masonry',
              'Concrete Mix',
              'Cement',
              'Mortar',
              'Grout',
              'Bricks & Blocks'
            ]
          },
          {
            name: 'Insulation',
            items: [
              'Shop All Insulation',
              'Fiberglass Insulation',
              'Foam Board Insulation',
              'Spray Foam',
              'Radiant Barriers'
            ]
          },
          {
            name: 'Roofing',
            items: [
              'Shop All Roofing',
              'Shingles',
              'Metal Roofing',
              'Roof Underlayment',
              'Flashing',
              'Roof Vents'
            ]
          },
          {
            name: 'Siding',
            items: [
              'Shop All Siding',
              'Vinyl Siding',
              'Fiber Cement Siding',
              'Wood Siding',
              'Metal Siding',
              'Siding Accessories'
            ]
          }
        ]
      },
      'Doors & Windows': {
        title: 'Doors & Windows',
        subcategories: [
          {
            name: 'Doors',
            items: [
              'Shop All Doors',
              'Interior Doors',
              'Exterior Doors',
              'Storm Doors',
              'Sliding Doors',
              'French Doors',
              'Door Hardware'
            ]
          },
          {
            name: 'Windows',
            items: [
              'Shop All Windows',
              'Double Hung Windows',
              'Casement Windows',
              'Sliding Windows',
              'Bay & Bow Windows',
              'Window Hardware'
            ]
          },
          {
            name: 'Garage Doors',
            items: [
              'Shop All Garage Doors',
              'Single Garage Doors',
              'Double Garage Doors',
              'Garage Door Openers',
              'Garage Door Parts'
            ]
          }
        ]
      },
      'Electrical': {
        title: 'Electrical',
        subcategories: [
          {
            name: 'Wire & Cable',
            items: [
              'Shop All Wire',
              'Electrical Wire',
              'Cable',
              'Cord Management',
              'Wire Connectors'
            ]
          },
          {
            name: 'Outlets & Switches',
            items: [
              'Shop All Outlets',
              'Standard Outlets',
              'GFCI Outlets',
              'Light Switches',
              'Dimmers',
              'Smart Switches'
            ]
          },
          {
            name: 'Circuit Breakers',
            items: [
              'Shop All Breakers',
              'Standard Breakers',
              'GFCI Breakers',
              'AFCI Breakers',
              'Breaker Panels'
            ]
          }
        ]
      },
      'Flooring': {
        title: 'Flooring',
        subcategories: [
          {
            name: 'Hardwood Flooring',
            items: [
              'Shop All Hardwood',
              'Solid Hardwood',
              'Engineered Hardwood',
              'Bamboo Flooring',
              'Hardwood Accessories'
            ]
          },
          {
            name: 'Laminate Flooring',
            items: [
              'Shop All Laminate',
              'Wood Look Laminate',
              'Stone Look Laminate',
              'Laminate Underlayment'
            ]
          },
          {
            name: 'Tile Flooring',
            items: [
              'Shop All Tile',
              'Ceramic Tile',
              'Porcelain Tile',
              'Natural Stone Tile',
              'Mosaic Tile',
              'Tile Accessories'
            ]
          },
          {
            name: 'Vinyl Flooring',
            items: [
              'Shop All Vinyl',
              'Luxury Vinyl Plank',
              'Vinyl Sheet',
              'Vinyl Tile'
            ]
          }
        ]
      },
      'Hardware': {
        title: 'Hardware',
        subcategories: [
          {
            name: 'Door Hardware',
            items: [
              'Shop All Door Hardware',
              'Door Knobs',
              'Door Handles',
              'Deadbolts',
              'Door Hinges',
              'Door Closers'
            ]
          },
          {
            name: 'Cabinet Hardware',
            items: [
              'Shop All Cabinet Hardware',
              'Cabinet Knobs',
              'Cabinet Pulls',
              'Cabinet Hinges',
              'Drawer Slides'
            ]
          },
          {
            name: 'Fasteners',
            items: [
              'Shop All Fasteners',
              'Screws',
              'Nails',
              'Bolts',
              'Anchors',
              'Nuts & Washers'
            ]
          }
        ]
      },
      'Kitchen': {
        title: 'Kitchen',
        subcategories: [
          {
            name: 'Kitchen Cabinets',
            items: [
              'Shop All Cabinets',
              'Base Cabinets',
              'Wall Cabinets',
              'Pantry Cabinets',
              'Cabinet Accessories'
            ]
          },
          {
            name: 'Countertops',
            items: [
              'Shop All Countertops',
              'Laminate Countertops',
              'Granite Countertops',
              'Quartz Countertops',
              'Butcher Block'
            ]
          },
          {
            name: 'Kitchen Sinks',
            items: [
              'Shop All Sinks',
              'Undermount Sinks',
              'Drop-In Sinks',
              'Farmhouse Sinks',
              'Sink Accessories'
            ]
          }
        ]
      },
      'Lawn & Garden': {
        title: 'Lawn & Garden',
        subcategories: [
          {
            name: 'Lawn Mowers',
            items: [
              'Shop All Mowers',
              'Push Mowers',
              'Riding Mowers',
              'Zero-Turn Mowers',
              'Robotic Mowers'
            ]
          },
          {
            name: 'Garden Tools',
            items: [
              'Shop All Tools',
              'Shovels & Spades',
              'Rakes',
              'Pruners',
              'Garden Hoses'
            ]
          },
          {
            name: 'Outdoor Power Equipment',
            items: [
              'Shop All Power Equipment',
              'String Trimmers',
              'Leaf Blowers',
              'Chainsaws',
              'Pressure Washers'
            ]
          }
        ]
      },
      'Lighting': {
        title: 'Lighting',
        subcategories: [
          {
            name: 'Indoor Lighting',
            items: [
              'Shop All Indoor Lighting',
              'Ceiling Lights',
              'Chandeliers',
              'Pendant Lights',
              'Wall Sconces',
              'Table Lamps',
              'Floor Lamps'
            ]
          },
          {
            name: 'Outdoor Lighting',
            items: [
              'Shop All Outdoor Lighting',
              'Porch Lights',
              'Landscape Lighting',
              'Security Lights',
              'String Lights'
            ]
          },
          {
            name: 'Light Bulbs',
            items: [
              'Shop All Bulbs',
              'LED Bulbs',
              'CFL Bulbs',
              'Incandescent Bulbs',
              'Specialty Bulbs'
            ]
          }
        ]
      },
      'Paint': {
        title: 'Paint',
        subcategories: [
          {
            name: 'Interior Paint',
            items: [
              'Shop All Interior Paint',
              'Wall Paint',
              'Ceiling Paint',
              'Trim Paint',
              'Primer'
            ]
          },
          {
            name: 'Exterior Paint',
            items: [
              'Shop All Exterior Paint',
              'House Paint',
              'Deck Stain',
              'Concrete Paint',
              'Exterior Primer'
            ]
          },
          {
            name: 'Paint Supplies',
            items: [
              'Shop All Supplies',
              'Paint Brushes',
              'Paint Rollers',
              'Paint Trays',
              'Painter\'s Tape',
              'Drop Cloths'
            ]
          }
        ]
      },
      'Plumbing': {
        title: 'Plumbing',
        subcategories: [
          {
            name: 'Pipes & Fittings',
            items: [
              'Shop All Pipes',
              'PVC Pipes',
              'Copper Pipes',
              'PEX Pipes',
              'Pipe Fittings',
              'Pipe Hangers'
            ]
          },
          {
            name: 'Water Heaters',
            items: [
              'Shop All Water Heaters',
              'Tank Water Heaters',
              'Tankless Water Heaters',
              'Heat Pump Water Heaters',
              'Water Heater Parts'
            ]
          },
          {
            name: 'Plumbing Tools',
            items: [
              'Shop All Tools',
              'Pipe Wrenches',
              'Plungers',
              'Drain Snakes',
              'Pipe Cutters'
            ]
          }
        ]
      },
      'Tools': {
        title: 'Tools',
        subcategories: [
          {
            name: 'Power Tools',
            items: [
              'Shop All Power Tools',
              'Drills',
              'Saws',
              'Sanders',
              'Grinders',
              'Nailers'
            ]
          },
          {
            name: 'Hand Tools',
            items: [
              'Shop All Hand Tools',
              'Hammers',
              'Screwdrivers',
              'Wrenches',
              'Pliers',
              'Tape Measures'
            ]
          },
          {
            name: 'Tool Storage',
            items: [
              'Shop All Storage',
              'Tool Boxes',
              'Tool Chests',
              'Tool Bags',
              'Tool Cabinets'
            ]
          }
        ]
      },
      'Outdoor Living': {
        title: 'Outdoor Living',
        subcategories: [
          {
            name: 'Patio Furniture',
            items: [
              'Shop All Furniture',
              'Patio Sets',
              'Outdoor Chairs',
              'Outdoor Tables',
              'Outdoor Sofas',
              'Patio Umbrellas',
              'Outdoor Cushions'
            ]
          },
          {
            name: 'Grills & Outdoor Cooking',
            items: [
              'Shop All Grills',
              'Gas Grills',
              'Charcoal Grills',
              'Pellet Grills',
              'Grill Accessories'
            ]
          },
          {
            name: 'Outdoor Structures',
            items: [
              'Shop All Structures',
              'Gazebos',
              'Pergolas',
              'Sheds',
              'Playsets'
            ]
          }
        ]
      },
    };

    return categoryMap[cat] || categoryMap['Building Materials'];
  };

  const dynamicDepartmentData = getDynamicDepartmentData(category);
  const data = dynamicDepartmentData || getCategoryData(category);
  const selectedSecondLevelCategory = subcategory
    ? data.subcategories.find((subcat: any) => subcat.name === subcategory) ?? null
    : null;
  const selectedLeafParentCategory = selectedLeafCategory
    ? data.subcategories.find((subcat: any) => subcat.items?.includes(selectedLeafCategory)) ?? null
    : null;

  const getCategorySlug = (categoryName: string) =>
    categoryName
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const navigateToCategoryLevel = (nextCategory: string, nextSubcategory?: string) => {
    navigateTo(`category-${getCategorySlug(nextCategory)}`, {
      category: nextCategory,
      ...(nextSubcategory ? { subcategory: nextSubcategory } : {}),
    });
  };

  // Auto-expand all subcategories when category changes
  useEffect(() => {
    const initialExpanded: { [key: string]: boolean } = {};
    data.subcategories.forEach((_: any, idx: number) => {
      initialExpanded[`${category}-${idx}`] = true;
    });
    setExpandedCategories(initialExpanded);
  }, [category]); // Only depend on category, not data.subcategories

  useEffect(() => {
    if (!subcategory) {
      setSelectedLeafCategory(null);
      return;
    }

    const isSecondLevelCategory = data.subcategories.some((subcat: any) => subcat.name === subcategory);
    if (isSecondLevelCategory) {
      setSelectedLeafCategory(null);
      return;
    }

    const leafExists = data.subcategories.some((subcat: any) =>
      subcat.items?.includes(subcategory)
    );
    setSelectedLeafCategory(leafExists ? subcategory : null);
  }, [category, subcategory]);

  // Toggle category expansion
  const toggleCategory = (categoryPath: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryPath]: !prev[categoryPath]
    }));
  };

  // Get products for a specific item (third-level category)
  const getItemProducts = (itemName: string) => {
    if (productDetailsData[itemName]) return [itemName];
    return staticProductMapping[itemName] || [];
  };

  // Handle adding multiple colors to inquiry list
  const handleAddToCart = () => {
    if (!selectedProduct || selectedColors.length === 0) {
      toast.error('Please select at least one color');
      return;
    }

    const product = productDetailsData[selectedProduct];
    let itemsAdded = 0;

    selectedColors.forEach(colorName => {
      const quantity = colorQuantities[colorName] || 1;
      const colorOption = product.colorOptions?.find(c => c.name === colorName);
      const price = colorOption ? colorOption.unitPrice : product.unitPrice;

      addToCart({
        productName: product.name,
        modelNo: product.sku || selectedProduct,
        image: product.image,
        material: product.material,
        color: colorName,
        specification: product.specification,
        unitPrice: price,
        quantity,
        pcsPerCarton: product.pcsPerCarton,
        cartonGrossWeight: product.cartonGrossWeight,
        cartonNetWeight: product.cartonNetWeight,
        cartonSize: product.cartonSize,
        cbmPerCarton: product.cbmPerCarton,
      });
      itemsAdded++;
    });

    toast.success(`Added ${itemsAdded} item${itemsAdded > 1 ? 's' : ''} to inquiry list`);
    setSelectedProduct(null);
    setSelectedColors([]);
    setColorQuantities({});
  };

  const handleColorToggle = (colorName: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorName)) {
        // Remove color and its quantity
        const newQuantities = { ...colorQuantities };
        delete newQuantities[colorName];
        setColorQuantities(newQuantities);
        return prev.filter(c => c !== colorName);
      } else {
        // Add color with default quantity of 1
        setColorQuantities(prev => ({ ...prev, [colorName]: 1 }));
        return [...prev, colorName];
      }
    });
  };

  const updateColorQuantity = (colorName: string, quantity: number) => {
    if (quantity < 1) return;
    setColorQuantities(prev => ({ ...prev, [colorName]: quantity }));
  };

  const getTotalQuantity = () => {
    return Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    if (!selectedProduct) return 0;
    const product = productDetailsData[selectedProduct];
    return selectedColors.reduce((total, colorName) => {
      const quantity = colorQuantities[colorName] || 1;
      const colorOption = product.colorOptions?.find(c => c.name === colorName);
      const price = colorOption ? colorOption.unitPrice : product.unitPrice;
      return total + (price * quantity);
    }, 0);
  };

  const handleAddCatalogProductToCart = () => {
    if (!selectedCatalogProduct) return;
    const quantity = Math.max(getProductMoq(selectedCatalogProduct), 1);
    addToCart({
      productName: selectedCatalogProduct.name,
      modelNo: selectedCatalogProduct.model || selectedCatalogProduct.id,
      image: selectedCatalogProduct.image,
      material: String(selectedCatalogProduct.specifications?.Material || selectedCatalogProduct.specifications?.Brand || ''),
      color: String(selectedCatalogProduct.specifications?.['Color/Finish'] || selectedCatalogProduct.specifications?.Color || ''),
      specification: Object.entries(selectedCatalogProduct.specifications || {})
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' / '),
      unitPrice: Number(selectedCatalogProduct.price || 0),
      quantity,
      pcsPerCarton: Number(selectedCatalogProduct.unitsPerCarton || 1),
      cartonGrossWeight: String(selectedCatalogProduct.cartonGrossWeight || 0),
      cartonNetWeight: String(selectedCatalogProduct.cartonNetWeight || 0),
      cartonSize: `${selectedCatalogProduct.cartonDimensions.length} x ${selectedCatalogProduct.cartonDimensions.width} x ${selectedCatalogProduct.cartonDimensions.height}`,
      cbmPerCarton: '0',
    });
    toast.success(`${selectedCatalogProduct.name} added to inquiry list`);
    setSelectedCatalogProduct(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b bg-gray-50">
        <div className="cosun-shell py-3">
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => navigateTo('home')} 
              className="flex items-center gap-1 text-gray-600 hover:text-orange-600"
              type="button"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">{category}</span>
            {selectedSecondLevelCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{selectedSecondLevelCategory.name}</span>
              </>
            )}
            {selectedLeafCategory && selectedLeafParentCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                  onClick={() => navigateToCategoryLevel(category, selectedLeafParentCategory.name)}
                  className="text-gray-600 hover:text-orange-600"
                  type="button"
                >
                  {selectedLeafParentCategory.name}
                </button>
              </>
            )}
            {selectedLeafCategory && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{selectedLeafCategory}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar - Collapsible Category Tree */}
          <div className="w-64 flex-shrink-0">
            {/* First-level category - Bold title */}
            <h2 className="mb-6 pb-4 border-b font-bold text-gray-900">{data.title}</h2>
            
            {/* Second-level categories - Always visible with expand arrows */}
            <div className="space-y-0">
              {data.subcategories.map((subcat: any, idx: number) => {
                const subcatPath = `${category}-${idx}`;
                const isExpanded = expandedCategories[subcatPath];
                
                return (
                  <div key={idx} className="border-b border-gray-200 last:border-b-0">
                    {/* Second-level category button */}
                    <button
                      onClick={() => navigateToCategoryLevel(category, subcat.name)}
                      className="flex items-center gap-2 w-full text-left py-3 hover:text-orange-600 transition-colors group"
                    >
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${
                        selectedSecondLevelCategory?.name === subcat.name
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`} />
                      <span className={`text-sm group-hover:text-orange-600 ${
                        selectedSecondLevelCategory?.name === subcat.name
                          ? 'font-medium text-orange-600'
                          : 'text-gray-900'
                      }`}>{subcat.name}</span>
                    </button>

                    {/* Third-level items - Collapsible */}
                    {isExpanded && subcat.items && (
                      <div className="ml-6 pb-3 space-y-2">
                        {subcat.items.map((item: string, itemIdx: number) => (
                          <button
                            key={itemIdx}
                            onClick={() => navigateToCategoryLevel(category, item)}
                            className={`block w-full text-left py-1 text-sm transition-colors ${
                              selectedLeafCategory === item
                                ? 'text-orange-600 font-medium'
                                : 'text-gray-700 hover:text-orange-600'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content - Product Grid */}
          <div className="flex-1">
            {selectedLeafCategory ? (
              <>
                {(() => {
                  const dynamicLeafProducts = getDynamicLeafProducts(selectedLeafCategory);
                  const staticLeafProducts = getItemProducts(selectedLeafCategory);
                  const productCount = dynamicLeafProducts.length + staticLeafProducts.length;
                  return (
                    <>
                {/* Category Title */}
                <div className="mb-6">
                  <h1 className="text-gray-900 mb-2">{selectedLeafCategory}</h1>
                  <p className="text-gray-600">
                    {productCount} products available
                    {catalogLoading && <span className="ml-2 text-sm text-gray-400">Loading live catalog...</span>}
                  </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-4 gap-6">
                  {dynamicLeafProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedCatalogProduct(product);
                        setSelectedProduct(null);
                        return false;
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="group text-left border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      type="button"
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">Model# {product.model}</p>
                        <p className="font-medium text-gray-900">
                          ${Number(product.price || 0).toFixed(2)} / {getProductUnit(product)}
                        </p>
                      </div>
                    </button>
                  ))}

                  {dynamicLeafProducts.length === 0 && staticLeafProducts.map((productKey, idx) => {
                    const product = productDetailsData[productKey];
                    if (!product) return null;
                    
                    return (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('✅ 点击产品:', productKey, product.name);
                          console.log('✅ 设置 selectedProduct:', productKey);
                          setSelectedProduct(productKey);
                          setSelectedColors([]);
                          setColorQuantities({});
                          // 确保不会触发路由导航
                          return false;
                        }}
                        onMouseDown={(e) => {
                          // 阻止鼠标按下事件冒泡
                          e.stopPropagation();
                        }}
                        className="group text-left border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        type="button"
                      >
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          <ImageWithFallback
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{product.material}</p>
                          <p className="font-medium text-gray-900">
                            ${product.unitPrice.toFixed(2)} / unit
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {productCount === 0 && !catalogLoading && (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                    No products have been published for this category yet.
                  </div>
                )}
                    </>
                  );
                })()}
              </>
            ) : selectedSecondLevelCategory ? (
              <>
                <div className="mb-6">
                  <h1 className="text-gray-900 mb-2">{selectedSecondLevelCategory.name}</h1>
                  <p className="text-gray-600">
                    {selectedSecondLevelCategory.items?.length ?? 0} categories available
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  {selectedSecondLevelCategory.items?.map((item: string, idx: number) => {
                    const itemImage = getLeafCategoryImage(item) || selectedSecondLevelCategory.image;

                    return (
                      <button
                        key={`${selectedSecondLevelCategory.name}-${item}-${idx}`}
                        onClick={() => navigateToCategoryLevel(category, item)}
                        className="group overflow-hidden rounded-lg border bg-white text-left transition-shadow hover:shadow-lg"
                        type="button"
                      >
                        <div className="aspect-square overflow-hidden bg-gray-100">
                          {itemImage ? (
                            <ImageWithFallback
                              src={itemImage}
                              alt={item}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-orange-600">
                            {item}
                          </h3>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-gray-900 mb-2">{data.title}</h1>
                  <p className="text-gray-600">{data.subcategories.length} categories available</p>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  {data.subcategories.map((subcat: any, idx: number) => (
                    <button
                      key={`${data.title}-${subcat.name}-${idx}`}
                      onClick={() => navigateToCategoryLevel(category, subcat.name)}
                      className="group overflow-hidden rounded-lg border bg-white text-left transition-shadow hover:shadow-lg"
                      type="button"
                    >
                      <div className="aspect-square overflow-hidden bg-gray-100">
                        {subcat.image ? (
                          <ImageWithFallback
                            src={subcat.image}
                            alt={subcat.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-gray-900 transition-colors group-hover:text-orange-600">
                          {subcat.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">{subcat.items?.length ?? 0} categories</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <>
          {console.log('✅ 渲染产品详情页:', selectedProduct)}
        <ProductDetailPage
          productKey={selectedProduct}
          categoryName={category}
          subcategoryName={selectedLeafCategory || undefined}
            onClose={() => {
              console.log('✅ 关闭产品详情页');
              setSelectedProduct(null);
            }}
        />
        </>
      )}

      <Dialog open={Boolean(selectedCatalogProduct)} onOpenChange={(open) => !open && setSelectedCatalogProduct(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {selectedCatalogProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCatalogProduct.name}</DialogTitle>
                <DialogDescription>
                  Model# {selectedCatalogProduct.model} / {selectedLeafCategory || category}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <ImageWithFallback
                    src={selectedCatalogProduct.image}
                    alt={selectedCatalogProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      ${Number(selectedCatalogProduct.price || 0).toFixed(2)}
                      <span className="ml-2 text-sm font-medium text-gray-500">/ {getProductUnit(selectedCatalogProduct)}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      MOQ {getProductMoq(selectedCatalogProduct)} / Step {getProductQuantityStep(selectedCatalogProduct)}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Specifications</h3>
                    <div className="grid gap-2">
                      {Object.entries(selectedCatalogProduct.specifications || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 border-b border-gray-100 pb-2 text-sm">
                          <span className="text-gray-500">{key}</span>
                          <span className="text-right font-medium text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleAddCatalogProductToCart} className="w-full bg-orange-600 text-white hover:bg-orange-700">
                    Add to Inquiry List
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
