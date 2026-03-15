import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import { ProductDetail } from '../../data/productDetailsData';

interface ProductPanelProps {
  hoveredProduct: string;
  orderQuantity: number;
  selectedColors: string[];
  colorQuantities: { [color: string]: number };
  suggestedQuantities: { qty: number; cartons: number }[];
  setOrderQuantity: (qty: number) => void;
  setSelectedColors: (colors: string[]) => void;
  setColorQuantities: (quantities: { [color: string]: number }) => void;
  setSuggestedQuantities: (suggestions: { qty: number; cartons: number }[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPendingCartItem: (item: any) => void;
  setShowQuantityAlert: (show: boolean) => void;
  setIsDepartmentOpen: (open: boolean) => void;
  setHoveredDept: (dept: number | null) => void;
  setHoveredSubcat: (subcat: string | null) => void;
  setHoveredProduct: (product: string | null) => void;
  getProductDetails: (name: string) => ProductDetail | null;
  calculateShipping: (quantity: number, productName: string) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addToCart: (item: any) => void;
}

export function ProductPanel({
  hoveredProduct,
  orderQuantity,
  selectedColors,
  colorQuantities,
  suggestedQuantities,
  setOrderQuantity,
  setSelectedColors,
  setColorQuantities,
  setSuggestedQuantities,
  setPendingCartItem,
  setShowQuantityAlert,
  setIsDepartmentOpen,
  setHoveredDept,
  setHoveredSubcat,
  setHoveredProduct,
  getProductDetails,
  calculateShipping,
  addToCart,
}: ProductPanelProps) {
  const product = getProductDetails(hoveredProduct);
  if (!product) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shipping = calculateShipping(orderQuantity, hoveredProduct);

  return (
    <>
      <h3 className="mb-4">Product Details</h3>
      <div className="space-y-4">
        {/* Product Image */}
        <div className="bg-gray-100 rounded-lg overflow-hidden aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Name */}
        <h4 className="text-sm">{product.name}</h4>

        {/* Product Description */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">Material:</span>
            <span>{product.material}</span>
          </div>

          {/* Size */}
          {product.size && (
            <div className="flex justify-between">
              <span className="font-medium">Size:</span>
              <span>{product.size}</span>
            </div>
          )}

          {/* Color Options with Checkboxes */}
          {product.colorOptions && product.colorOptions.length > 0 ? (
            <div className="border-t pt-2">
              <span className="font-medium block mb-2">Select Color(s):</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 max-h-[150px] overflow-y-auto">
                {product.colorOptions.map((colorOption) => (
                  <label
                    key={colorOption.name}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5"
                  >
                    <Checkbox
                      checked={selectedColors.includes(colorOption.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedColors([...selectedColors, colorOption.name]);
                          setColorQuantities({ ...colorQuantities, [colorOption.name]: 1 });
                        } else {
                          setSelectedColors(selectedColors.filter(c => c !== colorOption.name));
                          const newQuantities = { ...colorQuantities };
                          delete newQuantities[colorOption.name];
                          setColorQuantities(newQuantities);
                        }
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex-1 text-xs">{colorOption.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="font-medium">Color:</span>
              <span>{product.color}</span>
            </div>
          )}

          <div className="flex justify-between border-t pt-2">
            <span className="font-medium">Specification:</span>
            <span>{product.specification}</span>
          </div>
        </div>

        {/* No Color Selected Message */}
        {product.colorOptions && product.colorOptions.length > 0 && selectedColors.length === 0 && (
          <div className="border-t pt-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              ℹ️ Please select at least one color to view pricing and add to cart
            </div>
          </div>
        )}

        {/* Selected Colors with Quantities and Subtotals */}
        {selectedColors.length > 0 && product.colorOptions && (
          <div className="border-t pt-3 space-y-3">
            <h5 className="text-xs font-medium text-gray-700">Selected Colors:</h5>
            {selectedColors.map((colorName) => {
              const colorOption = product.colorOptions!.find(c => c.name === colorName);
              if (!colorOption) return null;
              const quantity = colorQuantities[colorName] || 1;
              const subtotal = colorOption.unitPrice * quantity;

              return (
                <div key={colorName} className="bg-gray-50 rounded-lg p-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">{colorName}</span>
                    <button
                      onClick={() => {
                        setSelectedColors(selectedColors.filter(c => c !== colorName));
                        const newQuantities = { ...colorQuantities };
                        delete newQuantities[colorName];
                        setColorQuantities(newQuantities);
                      }}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Unit Price:</span>
                    <span className="text-orange-600 font-medium">${colorOption.unitPrice.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Quantity:</label>
                    <div className="flex items-center gap-2">
                      <button
                        className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100 text-xs"
                        onClick={() => {
                          const newQty = Math.max(1, quantity - 1);
                          setColorQuantities({ ...colorQuantities, [colorName]: newQty });
                        }}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        value={quantity === 0 ? '' : quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setColorQuantities({ ...colorQuantities, [colorName]: 0 });
                          } else {
                            const num = parseInt(value);
                            if (!isNaN(num) && num >= 0) {
                              setColorQuantities({ ...colorQuantities, [colorName]: num });
                            }
                          }
                        }}
                        onBlur={() => {
                          if (quantity === 0) {
                            setColorQuantities({ ...colorQuantities, [colorName]: 1 });
                          }
                        }}
                        className="flex-1 border rounded px-2 py-1 text-center text-xs"
                      />
                      <button
                        className="w-6 h-6 border rounded flex items-center justify-center hover:bg-gray-100 text-xs"
                        onClick={() => {
                          setColorQuantities({ ...colorQuantities, [colorName]: quantity + 1 });
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="font-medium text-gray-700">Subtotal:</span>
                    <span className="font-medium text-blue-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quantity Selector for Non-Color Products */}
        {!product.colorOptions && (
          <div className="border-t pt-3 space-y-3">
            <div className="flex justify-between text-xs text-gray-600">
              <span className="font-medium">Unit Price:</span>
              <span className="text-orange-600 font-medium">${product.unitPrice.toFixed(2)}</span>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block font-medium">Order Quantity:</label>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setOrderQuantity(Math.max(1, orderQuantity - 1));
                  }}
                >
                  -
                </button>
                <input
                  type="text"
                  value={orderQuantity === 0 ? '' : orderQuantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setOrderQuantity(0);
                    } else {
                      const num = parseInt(value);
                      if (!isNaN(num) && num >= 0) {
                        setOrderQuantity(num);
                      }
                    }
                  }}
                  onBlur={() => {
                    if (orderQuantity === 0) {
                      setOrderQuantity(1);
                    }
                  }}
                  className="flex-1 border rounded px-3 py-2 text-center text-sm"
                />
                <button
                  className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setOrderQuantity(orderQuantity + 1);
                  }}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Minimum order: {product.pcsPerCarton} pcs (1 carton)
              </p>
            </div>

            {/* Suggested Quantities */}
            {suggestedQuantities.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                  <span className="text-yellow-600">💡</span>
                  Suggested Quantities:
                </h4>
                <div className="space-y-1.5">
                  {suggestedQuantities.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setOrderQuantity(suggestion.qty);
                      }}
                      className={`w-full bg-white rounded px-3 py-1.5 flex justify-between items-center text-xs transition-all ${
                        orderQuantity === suggestion.qty
                          ? 'border-2 border-orange-500 bg-orange-50'
                          : 'border border-gray-200 hover:border-orange-500 hover:bg-orange-50'
                      }`}
                    >
                      <span className="font-medium">{suggestion.qty} pcs</span>
                      <span className="text-gray-600">= {suggestion.cartons} carton(s)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Price:</span>
                <span className="font-medium text-blue-600">
                  ${(product.unitPrice * orderQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Shipping Calculations */}
            {orderQuantity > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Shipping Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Cartons:</p>
                    <p className="font-medium">{Math.ceil(orderQuantity / product.pcsPerCarton)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total CBM:</p>
                    <p className="font-medium">{(Math.ceil(orderQuantity / product.pcsPerCarton) * product.cbmPerCarton).toFixed(3)} m³</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Gross Wt:</p>
                    <p className="font-medium">{(Math.ceil(orderQuantity / product.pcsPerCarton) * product.cartonGrossWeight).toFixed(2)} kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Net Wt:</p>
                    <p className="font-medium">{(Math.ceil(orderQuantity / product.pcsPerCarton) * product.cartonNetWeight).toFixed(2)} kg</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Packaging Info */}
        <div className="border-t pt-3 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Pcs/Carton:</span>
            <span>{product.pcsPerCarton} pcs</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Carton Size:</span>
            <span>{product.cartonSize}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">CBM per Carton:</span>
            <span>{product.cbmPerCarton} m³</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Gross Weight:</span>
            <span>{product.cartonGrossWeight} kg</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span className="font-medium">Net Weight:</span>
            <span>{product.cartonNetWeight} kg</span>
          </div>
        </div>

        {/* Total Price */}
        {selectedColors.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border-t mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total Price:</span>
              <span className="font-medium text-blue-600">
                ${(() => {
                  return selectedColors.reduce((total, colorName) => {
                    const colorOption = product.colorOptions!.find(c => c.name === colorName);
                    if (!colorOption) return total;
                    const quantity = colorQuantities[colorName] || 1;
                    return total + (colorOption.unitPrice * quantity);
                  }, 0).toFixed(2);
                })()}
              </span>
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          className={`w-full py-2 rounded-md transition-colors text-sm text-center ${
            (product.colorOptions ? selectedColors.length > 0 : orderQuantity > 0)
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={product.colorOptions ? selectedColors.length === 0 : orderQuantity === 0}
          onClick={() => {
            if (product) {
              // Handle products WITH color options
              if (product.colorOptions && selectedColors.length > 0) {
                // Check if any color has non-full carton quantity
                let hasNonFullCarton = false;
                let firstNonFullColor = '';
                let firstNonFullQuantity = 0;

                for (const colorName of selectedColors) {
                  const quantity = colorQuantities[colorName] || 1;
                  if (quantity % product.pcsPerCarton !== 0) {
                    hasNonFullCarton = true;
                    firstNonFullColor = colorName;
                    firstNonFullQuantity = quantity;
                    break;
                  }
                }

                if (hasNonFullCarton) {
                  // Show quantity alert for first non-full carton color
                  const suggestedLower = Math.floor(firstNonFullQuantity / product.pcsPerCarton) * product.pcsPerCarton;
                  const suggestedHigher = Math.ceil(firstNonFullQuantity / product.pcsPerCarton) * product.pcsPerCarton;

                  setPendingCartItem({
                    productName: product.name,
                    color: firstNonFullColor,
                    quantity: firstNonFullQuantity,
                    pcsPerCarton: product.pcsPerCarton,
                    suggestedLower: suggestedLower || product.pcsPerCarton,
                    suggestedHigher: suggestedHigher,
                  });
                  setShowQuantityAlert(true);
                  return;
                }

                // All quantities are full cartons, add to cart
                selectedColors.forEach((colorName) => {
                  const colorOption = product.colorOptions!.find(c => c.name === colorName);
                  if (!colorOption) return;

                  const quantity = colorQuantities[colorName] || 1;

                  addToCart({
                    productName: product.name,
                    image: product.image,
                    material: product.material,
                    color: colorName,
                    specification: product.specification,
                    unitPrice: colorOption.unitPrice,
                    quantity: quantity,
                    pcsPerCarton: product.pcsPerCarton,
                    cartonGrossWeight: product.cartonGrossWeight,
                    cartonNetWeight: product.cartonNetWeight,
                    cartonSize: product.cartonSize,
                    cbmPerCarton: product.cbmPerCarton,
                  });
                });

                // Reset and close menu
                setSelectedColors([]);
                setColorQuantities({});
                setIsDepartmentOpen(false);
                setHoveredDept(null);
                setHoveredSubcat(null);
                setHoveredProduct(null);

                // Show success message
                toast.success('Products added to cart!', {
                  description: `${selectedColors.length} color variant(s) added`,
                });
              }
              // Handle products WITHOUT color options
              else if (!product.colorOptions && orderQuantity > 0) {
                // Check if quantity is a full carton
                if (orderQuantity % product.pcsPerCarton !== 0) {
                  // Show quantity alert
                  const suggestedLower = Math.floor(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;
                  const suggestedHigher = Math.ceil(orderQuantity / product.pcsPerCarton) * product.pcsPerCarton;

                  setPendingCartItem({
                    productName: product.name,
                    quantity: orderQuantity,
                    pcsPerCarton: product.pcsPerCarton,
                    suggestedLower: suggestedLower || product.pcsPerCarton,
                    suggestedHigher: suggestedHigher,
                  });
                  setShowQuantityAlert(true);
                  return;
                }

                // Quantity is a full carton, add to cart
                addToCart({
                  productName: product.name,
                  image: product.image,
                  material: product.material,
                  color: product.color,
                  specification: product.specification,
                  unitPrice: product.unitPrice,
                  quantity: orderQuantity,
                  pcsPerCarton: product.pcsPerCarton,
                  cartonGrossWeight: product.cartonGrossWeight,
                  cartonNetWeight: product.cartonNetWeight,
                  cartonSize: product.cartonSize,
                  cbmPerCarton: product.cbmPerCarton,
                });

                // Reset and close menu
                setOrderQuantity(1);
                setSuggestedQuantities([]);
                setIsDepartmentOpen(false);
                setHoveredDept(null);
                setHoveredSubcat(null);
                setHoveredProduct(null);

                // Show success message
                toast.success('Product added to cart!', {
                  description: `${orderQuantity} pcs added`,
                });
              }
            }
          }}
        >
          Add to Cart {selectedColors.length > 0 && `(${selectedColors.length} color${selectedColors.length > 1 ? 's' : ''})`}
        </button>
      </div>
    </>
  );
}
