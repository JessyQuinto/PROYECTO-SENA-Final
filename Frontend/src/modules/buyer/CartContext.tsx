import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useCleanupListener } from '@/lib/stateCleanup';
import { useDebounce } from '@/hooks/useDebounce';

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
  const { user, isSigningOut } = useAuth();
  const storageKey = user?.id ? `${STORAGE_KEY_BASE}_${user.id}` : null;
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounce storage operations to improve performance
  const debouncedItems = useDebounce(items, 500);

  // Clear cart immediately when logout starts
  useEffect(() => {
    if (isSigningOut) {
      setItems([]);
      // Clear any pending storage operations
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    }
  }, [isSigningOut]);

  // Listen for cleanup events and clear cart
  useCleanupListener(
    useCallback(() => {
      setItems([]);
    }, [])
  );

  useEffect(() => {
    // cargar carrito por usuario; si no hay usuario, mantener vacío
    if (!storageKey) {
      setItems([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, [storageKey]);

  // Debounced persistence to localStorage
  useEffect(() => {
    if (!storageKey) return; // no persistir sin usuario
    
    // Clear any existing timeout
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }
    
    // Debounce the storage operation
    persistTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(debouncedItems));
      } catch (error) {
        console.warn('[Cart] Failed to persist cart to localStorage:', error);
      }
    }, 100);
    
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [debouncedItems, storageKey]);

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

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [items]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ items, total, add, update, remove, clear }),
    [items, total, add, update, remove, clear]
  );

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
