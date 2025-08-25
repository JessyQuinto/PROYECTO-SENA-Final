import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useAuth } from '@/auth/AuthContext';

export interface CartItem {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagenUrl?: string | null;
  stock?: number;
}

interface CartContextValue {
  items: CartItem[];
  total: number;
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
  
  // Memoized storage key to prevent unnecessary localStorage operations
  const storageKey = useMemo(() => 
    user?.id ? `${STORAGE_KEY_BASE}_${user.id}` : null, 
    [user?.id]
  );

  // Load cart from localStorage on mount and when user changes
  useEffect(() => {
    if (!storageKey) {
      setItems([]);
      return;
    }
    
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(Array.isArray(parsed) ? parsed : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Persist cart to localStorage when items change
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to persist cart to localStorage:', error);
    }
  }, [items, storageKey]);

  // Memoized cart operations to prevent unnecessary re-renders
  const add = useCallback((item: CartItem) => {
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
  }, []);

  const update = useCallback((productoId: string, cantidad: number) => {
    setItems(prev =>
      prev.map(i =>
        i.productoId === productoId
          ? {
              ...i,
              cantidad: Math.max(1, Math.min(cantidad, i.stock ?? Infinity)),
            }
          : i
      )
    );
  }, []);

  const remove = useCallback((productoId: string) => {
    setItems(prev => prev.filter(i => i.productoId !== productoId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  // Memoized total calculation - only recalculates when items change
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [items]
  );

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<CartContextValue>(() => ({
    items,
    total,
    add,
    update,
    remove,
    clear,
  }), [items, total, add, update, remove, clear]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
