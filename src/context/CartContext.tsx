import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ApiService, initializeAuth, isAuthenticated } from '../services/apiService';

interface CartContextValue {
  itemCount: number;
  refreshCart: () => Promise<void>;
  setItemCount: (count: number) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated()) {
      setItemCount(0);
      return;
    }
    const cart = await ApiService.getCart();
    setItemCount(cart?.item_count ?? 0);
  }, []);

  useEffect(() => {
    void (async () => {
      await initializeAuth();
      await refreshCart();
    })();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart, setItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
