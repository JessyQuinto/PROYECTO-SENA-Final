import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const storageKey = user?.id ? `${STORAGE_KEY_BASE}_${user.id}` : null;

  // Limpiar carrito inmediatamente cuando el usuario cierre sesión
  useEffect(() => {
    const handleLogout = () => {
      setItems([]);
    };

    window.addEventListener('userLoggedOut', handleLogout);
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

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

  useEffect(() => {
    if (!storageKey) return; // no persistir sin usuario
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
      prev.map(i =>
        i.productoId === productoId
          ? {
              ...i,
              cantidad: Math.max(1, Math.min(cantidad, i.stock ?? Infinity)),
            }
          : i
      )
    );
  };

  const remove = (productoId: string) =>
    setItems(prev => prev.filter(i => i.productoId !== productoId));
  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, total, add, update, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
};
