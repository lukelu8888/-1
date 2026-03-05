import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  productName: string;
  modelNo?: string; // 🔥 产品型号（如 TL-001, FL-001）
  image: string;
  material: string;
  color: string;
  specification: string;
  unitPrice: number;
  quantity: number;
  pcsPerCarton: number;
  cartonGrossWeight: number;
  cartonNetWeight: number;
  cartonSize: string;
  cbmPerCarton: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productName: string, color: string) => void;
  updateQuantity: (productName: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // 🔥 数据持久化规则：从localStorage加载购物车数据，刷新不丢失
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cosun_cart_items');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed;
        } catch (e) {
          console.error('❌ 加载购物车数据失败:', e);
        }
      }
    }
    return []; // 初始为空，用户自行添加产品
  });

  // 🔥 自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cosun_cart_items', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(i => i.productName === item.productName && i.color === item.color);
      
      if (existingItem) {
        // If item with same name AND color already exists, update quantity and move to top
        const updatedItem = { ...existingItem, quantity: existingItem.quantity + item.quantity };
        const otherItems = prevItems.filter(i => !(i.productName === item.productName && i.color === item.color));
        return [updatedItem, ...otherItems]; // Move updated item to top
      } else {
        // Add new item at the beginning (reverse order - newest first)
        return [item, ...prevItems];
      }
    });
  };

  const removeFromCart = (productName: string, color: string) => {
    setCartItems((prevItems) => prevItems.filter(item => !(item.productName === productName && item.color === color)));
  };

  const updateQuantity = (productName: string, color: string, quantity: number) => {
    // Allow 0 quantity temporarily (for manual input)
    // Only remove when quantity is negative
    if (quantity < 0) {
      return;
    }
    
    setCartItems((prevItems) =>
      prevItems.map(item =>
        item.productName === productName && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + ((item.unitPrice || 0) * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}