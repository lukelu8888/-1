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

interface CategoryDetailProps {
  category?: string;
  subcategory?: string;
}

export function CategoryDetail({ category = 'Building Materials', subcategory }: CategoryDetailProps) {
  const { navigateTo } = useRouter();
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorQuantities, setColorQuantities] = useState<{ [color: string]: number }>({});
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [selectedLeafCategory, setSelectedLeafCategory] = useState<string | null>(null);

  // Dynamic category data based on the category passed
  const getCategoryData = (cat: string) => {
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

  const data = getCategoryData(category);

  // Auto-expand all subcategories when category changes
  useEffect(() => {
    const initialExpanded: { [key: string]: boolean } = {};
    data.subcategories.forEach((_: any, idx: number) => {
      initialExpanded[`${category}-${idx}`] = true;
    });
    setExpandedCategories(initialExpanded);
  }, [category]); // Only depend on category, not data.subcategories

  // Toggle category expansion
  const toggleCategory = (categoryPath: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryPath]: !prev[categoryPath]
    }));
  };

  // Get products for a specific item (third-level category)
  const getItemProducts = (itemName: string) => {
    // Map item names to product keys from productDetailsData
    const productMapping: { [key: string]: string[] } = {
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
      // Add default mappings for other categories
      'Shop All Appliances': ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'],
      'Refrigerators': ['Refrigerator Parts'],
      'Washers & Dryers': ['Washer Parts', 'Dryer Parts'],
      'Ranges, Cooktops & Ovens': ['Refrigerator Parts', 'Washer Parts'],
      'Dishwashers': ['Dishwasher Parts'],
      'Freezers': ['Refrigerator Parts', 'Dryer Parts'],
      'Range Hoods': ['Washer Parts', 'Dishwasher Parts'],
    };
    
    // Return mapped products or default products
    return productMapping[itemName] || ['Refrigerator Parts', 'Washer Parts', 'Dryer Parts', 'Dishwasher Parts'];
  };

  // Handle adding multiple colors to cart
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
        id: `${selectedProduct}-${colorName}`,
        name: product.name,
        price: price,
        quantity: quantity,
        image: product.image,
        color: colorName
      });
      itemsAdded++;
    });

    toast.success(`Added ${itemsAdded} item${itemsAdded > 1 ? 's' : ''} to cart`);
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

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-3">
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
                      onClick={() => toggleCategory(subcatPath)}
                      className="flex items-center gap-2 w-full text-left py-3 hover:text-orange-600 transition-colors group"
                    >
                      <ChevronRight className={`h-4 w-4 flex-shrink-0 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      <span className="text-sm text-gray-900 group-hover:text-orange-600">{subcat.name}</span>
                    </button>

                    {/* Third-level items - Collapsible */}
                    {isExpanded && subcat.items && (
                      <div className="ml-6 pb-3 space-y-2">
                        {subcat.items.map((item: string, itemIdx: number) => (
                          <button
                            key={itemIdx}
                            onClick={() => setSelectedLeafCategory(item)}
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
                {/* Category Title */}
                <div className="mb-6">
                  <h1 className="text-gray-900 mb-2">{selectedLeafCategory}</h1>
                  <p className="text-gray-600">
                    {getItemProducts(selectedLeafCategory).length} products available
                  </p>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-4 gap-6">
                  {getItemProducts(selectedLeafCategory).map((productKey, idx) => {
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
              </>
            ) : (
              /* Welcome message when no category selected */
              <div className="flex items-center justify-center h-96 text-center">
                <div>
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-gray-900 mb-2">Select a Category</h2>
                  <p className="text-gray-600">
                    Choose a category from the left sidebar to view products
                  </p>
                </div>
              </div>
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
    </div>
  );
}