import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import type { CartItem } from '@/types/domain';

interface CartContextValue {
  items: CartItem[];
  add(item: CartItem): void;
  update(productoId: string, cantidad: number): void;
  remove(productoId: string): void;
  clear(): void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY_BASE = 'tc_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  
  const storageKey = user?.id ? `${STORAGE_KEY_BASE}_${user.id}` : null;

  // Clear cart when user changes
  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      return;
    }
    
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Persist cart to localStorage
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}
  }, [items, storageKey]);

  const add = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productoId === item.productoId);
      if (existing) {
        return prev.map(i =>
          i.productoId === item.productoId
            ? {
                ...i,
                cantidad: Math.min(
                  i.cantidad + item.cantidad,
                  i.stock ?? Infinity
                ),
              }
            : i
        );
      }
      return [...prev, item];
    });
  };

  const update = (productoId: string, cantidad: number) => {
    setItems(prev =>
      prev.map(item =>
        item.productoId === productoId
          ? { ...item, cantidad: Math.max(0, Math.min(cantidad, item.stock ?? Infinity)) }
          : item
      )
    );
  };

  const remove = (productoId: string) => {
    setItems(prev => prev.filter(item => item.productoId !== productoId));
  };

  const clear = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
