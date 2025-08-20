import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Producto, ProductoRow } from '../types/domain';
import { mapProducto } from '../types/dto';

export function useProducts() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // Ejemplo: si aún no existe tabla productos, mock temporal
      if (!supabase) {
        // sin configuración, usar mock
        if (active) setProducts([
          { id: 'm1', vendedorId: 'v1', nombre: 'Producto Demo', descripcion: 'Descripción mock', precio: 10000, stock: 5, estado: 'activo' },
          { id: 'm2', vendedorId: 'v1', nombre: 'Artesanía', descripcion: 'Hecha a mano', precio: 25000, stock: 3, estado: 'activo' }
        ] as unknown as Producto[]);
        if (active) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('productos')
        .select('id,vendedor_id,categoria_id,nombre,descripcion,precio,stock,imagen_url,estado,created_at,updated_at')
        .limit(20);
      if (error) {
        // fallback mock
        if (active) setProducts([
          { id: 'm1', vendedorId: 'v1', nombre: 'Producto Demo', descripcion: 'Descripción mock', precio: 10000, stock: 5, estado: 'activo' },
          { id: 'm2', vendedorId: 'v1', nombre: 'Artesanía', descripcion: 'Hecha a mano', precio: 25000, stock: 3, estado: 'activo' }
        ] as unknown as Producto[]);
      } else if (data && active) {
        const mapped = (data as ProductoRow[]).map(mapProducto);
        setProducts(mapped);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { products, loading };
}
