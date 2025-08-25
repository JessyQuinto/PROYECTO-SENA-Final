// Enhanced data fetching with React Query (TanStack Query)
// File: Frontend/src/hooks/useProductsQuery.ts

import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url?: string;
  vendedor_id: string;
  categoria_id?: string;
  created_at: string;
  categorias?: { nombre: string };
}

interface ProductFilters {
  searchTerm?: string;
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name';
}

interface ProductsResponse {
  products: Product[];
  total: number;
  hasMore: boolean;
}

const PRODUCTS_PER_PAGE = 20;

// Query Keys Factory for better cache management
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productQueryKeys.lists(), { filters }] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  ratings: () => [...productQueryKeys.all, 'ratings'] as const,
  rating: (productIds: string[]) => [...productQueryKeys.ratings(), { productIds }] as const,
};

// Fetch products with filters and pagination
const fetchProducts = async (
  filters: ProductFilters = {},
  pageParam: number = 0
): Promise<ProductsResponse> => {
  const { searchTerm, categoryId, priceMin, priceMax, sortBy = 'newest' } = filters;
  
  let query = supabase
    .from('productos')
    .select(`
      id,
      nombre,
      precio,
      stock,
      imagen_url,
      vendedor_id,
      categoria_id,
      created_at,
      categorias(nombre)
    `, { count: 'exact' })
    .eq('estado', 'activo')
    .eq('archivado', false)
    .gt('stock', 0);

  // Apply filters
  if (searchTerm) {
    query = query.ilike('nombre', `%${searchTerm}%`);
  }
  
  if (categoryId) {
    query = query.eq('categoria_id', categoryId);
  }
  
  if (priceMin !== undefined) {
    query = query.gte('precio', priceMin);
  }
  
  if (priceMax !== undefined) {
    query = query.lte('precio', priceMax);
  }

  // Apply sorting
  switch (sortBy) {
    case 'price_asc':
      query = query.order('precio', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('precio', { ascending: false });
      break;
    case 'name':
      query = query.order('nombre', { ascending: true });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Apply pagination
  const start = pageParam * PRODUCTS_PER_PAGE;
  const end = start + PRODUCTS_PER_PAGE - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data || [],
    total: count || 0,
    hasMore: (count || 0) > (pageParam + 1) * PRODUCTS_PER_PAGE,
  };
};

// Hook for paginated products with filters
export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: productQueryKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

// Hook for infinite scroll products
export const useInfiniteProducts = (filters: ProductFilters = {}) => {
  return useInfiniteQuery({
    queryKey: [...productQueryKeys.list(filters), 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchProducts(filters, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// Hook for single product details
export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: productQueryKeys.detail(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          stock,
          imagen_url,
          estado,
          created_at,
          vendedor_id,
          categoria_id,
          categorias(nombre),
          users!productos_vendedor_id_fkey(nombre_completo, email)
        `)
        .eq('id', productId)
        .eq('estado', 'activo')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for product ratings
export const useProductRatings = (productIds: string[]) => {
  return useQuery({
    queryKey: productQueryKeys.rating(productIds),
    queryFn: async () => {
      if (productIds.length === 0) return {};

      const { data, error } = await supabase
        .from('mv_promedio_calificaciones')
        .select('producto_id, promedio')
        .in('producto_id', productIds);

      if (error) throw error;

      const ratingsMap: Record<string, number> = {};
      (data || []).forEach((rating: any) => {
        ratingsMap[rating.producto_id] = Number(rating.promedio || 0);
      });

      return ratingsMap;
    },
    enabled: productIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Hook for categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
  });
};

// Utility hook for cache management
export const useProductCache = () => {
  const queryClient = useQueryClient();

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() });
  };

  const invalidateProduct = (productId: string) => {
    queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(productId) });
  };

  const prefetchProduct = (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: productQueryKeys.detail(productId),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const warmCache = async () => {
    // Prefetch categories
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const { data } = await supabase.from('categorias').select('*').order('nombre');
        return data || [];
      },
    });

    // Prefetch first page of products
    queryClient.prefetchQuery({
      queryKey: productQueryKeys.list({}),
      queryFn: () => fetchProducts({}),
    });
  };

  return {
    invalidateProducts,
    invalidateProduct,
    prefetchProduct,
    warmCache,
  };
};