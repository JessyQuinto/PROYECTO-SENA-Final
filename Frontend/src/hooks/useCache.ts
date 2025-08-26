import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UseCachedDataOptions {
  enabled?: boolean;
  ttl?: number;
  refreshOnMount?: boolean;
  onError?: (error: Error) => void;
}

interface UseCachedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Generic hook for data fetching (simplified, no caching)
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataReturn<T> {
  const {
    enabled = true,
    refreshOnMount = false,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      try {
        setLoading(true);
        setError(null);

        const result = await fetcher();
        setData(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [key, enabled, onError]
  );

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(() => {
    setData(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    if (refreshOnMount || !data) {
      fetchData(refreshOnMount);
    }
  }, [key, enabled, refreshOnMount, data, fetchData]);

  return { data, loading, error, refresh, invalidate };
}

/**
 * Hook for categories data
 */
export function useCachedCategories(options: UseCachedDataOptions = {}) {
  return useCachedData(
    'categories',
    async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data || [];
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for featured products
 */
export function useCachedFeaturedProducts(options: UseCachedDataOptions = {}) {
  const result = useCachedData(
    'featured_products',
    async () => {
      const { data, error } = await supabase
        .from('productos')
        .select(
          `
          id,
          nombre,
          precio,
          imagen_url,
          users!productos_vendedor_id_fkey(nombre_completo)
        `
        )
        .eq('estado', 'activo')
        .gt('stock', 0)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    { refreshOnMount: true, ...options }
  );

  return {
    ...result,
    data: result.data || [],
  };
}

/**
 * Hook for product ratings
 */
export function useCachedProductRatings(
  productIds: string[],
  options: UseCachedDataOptions = {}
) {
  const cacheKey = `product_ratings_${productIds.sort().join(',')}`;

  return useCachedData(
    cacheKey,
    async () => {
      if (productIds.length === 0) return {};

      const { data, error } = await supabase
        .from('mv_promedio_calificaciones')
        .select('producto_id,promedio')
        .in('producto_id', productIds);

      if (error) throw error;

      const ratingsMap: Record<string, number> = {};
      (data || []).forEach((rating: any) => {
        ratingsMap[rating.producto_id] = Number(rating.promedio || 0);
      });

      return ratingsMap;
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for app configuration
 */
export function useCachedAppConfig(
  configKey: string,
  options: UseCachedDataOptions = {}
) {
  const cacheKey = `app_config_${configKey}`;

  return useCachedData(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', configKey)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for product story/details
 */
export function useCachedProductStory(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useCachedData(
    `product_story_${productId}`,
    async () => {
      const key = `product_story:${productId}`;
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for individual product details
 */
export function useCachedProduct(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useCachedData(
    `product_detail_${productId}`,
    async () => {
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
          categorias(nombre)
        `)
        .eq('id', productId)
        .eq('estado', 'activo')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for individual product average rating
 */
export function useCachedProductAverageRating(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useCachedData(
    `product_avg_rating_${productId}`,
    async () => {
      const { data, error } = await supabase
        .from('mv_promedio_calificaciones')
        .select('promedio')
        .eq('producto_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data?.promedio ? Number(data.promedio) : null;
    },
    { refreshOnMount: true, ...options }
  );
}

/**
 * Hook for cache management (simplified)
 */
export function useCacheManager() {
  const [stats, setStats] = useState({
    memoryItems: 0,
    localStorageItems: 0,
  });

  const refreshStats = useCallback(() => {
    setStats({ memoryItems: 0, localStorageItems: 0 });
  }, []);

  const invalidateProductCache = useCallback(() => {
    // No-op for now
  }, []);

  const invalidateProductCacheById = useCallback((productId: string) => {
    // No-op for now
  }, []);

  const invalidateAllProductDetails = useCallback(() => {
    // No-op for now
  }, []);

  const invalidateUserCache = useCallback((userId?: string) => {
    // No-op for now
  }, []);

  const invalidateConfigCache = useCallback(() => {
    // No-op for now
  }, []);

  const clearAllCache = useCallback(() => {
    // No-op for now
  }, []);

  return {
    stats,
    refreshStats,
    invalidateProductCache,
    invalidateProductCacheById,
    invalidateAllProductDetails,
    invalidateUserCache,
    invalidateConfigCache,
    clearAllCache,
  };
}

/**
 * Hook for cache warming (simplified)
 */
export function useCacheWarming() {
  const warmCategories = useCallback(async () => {
    // No-op for now
  }, []);

  const warmFeaturedProducts = useCallback(async () => {
    // No-op for now
  }, []);

  const warmEssentialData = useCallback(async () => {
    // No-op for now
  }, [warmCategories, warmFeaturedProducts]);

  const warmProductData = useCallback(async (productId: string) => {
    // No-op for now
  }, []);

  return {
    warmCategories,
    warmFeaturedProducts,
    warmEssentialData,
    warmProductData,
  };
}

export default useCachedData;
