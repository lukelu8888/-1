import { RecommendedProduct } from '../../data/header/recommendedProductsData';

interface ProductRecommendationsProps {
  products: RecommendedProduct[];
  priceLabel: string;
  onProductClick: () => void;
  onViewAllClick: () => void;
}

export function ProductRecommendations({
  products,
  priceLabel,
  onProductClick,
  onViewAllClick,
}: ProductRecommendationsProps) {
  return (
    <>
      <h3 className="mb-4">Recommended Products</h3>

      <div className="space-y-4">
        {products.map((product, idx) => (
          <div
            key={idx}
            className="group cursor-pointer"
            onClick={onProductClick}
          >
            <div className="mb-2 bg-gray-100 rounded-lg overflow-hidden aspect-square relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${
                product.badge === 'Hot Deal' ? 'bg-red-600' :
                product.badge === 'New' ? 'bg-orange-500' :
                product.badge === 'Premium' ? 'bg-purple-600' :
                product.badge === 'Best Seller' ? 'bg-yellow-600' :
                product.badge === 'Eco-Friendly' ? 'bg-green-600' :
                'bg-blue-600'
              }`}>
                {product.badge}
              </div>
            </div>
            <p className="text-sm mb-1">{product.name}</p>
            <p className="text-xs text-gray-600">{priceLabel} {product.price}</p>
          </div>
        ))}

        {/* View All Link */}
        <button
          className="w-full py-2 px-4 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-600 hover:text-white transition-colors text-sm"
          onClick={onViewAllClick}
        >
          View All Deals →
        </button>
      </div>
    </>
  );
}
