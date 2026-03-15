import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui/button';

interface CartButtonProps {
  totalItems: number;
  onNavigateToCart: () => void;
}

export function CartButton({ totalItems, onNavigateToCart }: CartButtonProps) {
  return (
    <Button
      variant="ghost"
      className="relative"
      onClick={onNavigateToCart}
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
          {totalItems}
        </span>
      )}
      <span className="hidden xl:inline ml-2">Cart</span>
    </Button>
  );
}
