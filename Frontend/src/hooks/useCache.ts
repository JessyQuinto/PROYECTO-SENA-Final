import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { cache, CACHE_KEYS, CACHE_TTL, cacheUtils } from '@/lib/cache';

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
 * Generic hook for cached data fetching
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
): UseCachedDataReturn<T> {
  const {
    enabled = true,
    ttl = CACHE_TTL.MEDIUM,
    refreshOnMount = false,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(() =>
    enabled ? cache.get<T>(key) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) return;

      try {
        setLoading(true);
        setError(null);

        let result: T;
        if (forceRefresh) {
          result = await cache.refresh(key, fetcher, ttl);
        } else {
          result = await cache.getOrSet(key, fetcher, ttl);
        }

        setData(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [key, fetcher, ttl, enabled, onError]
  );

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    if (!enabled) return;

    const cachedData = cache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      if (!refreshOnMount) return;
    }

    fetchData(refreshOnMount);
  }, [key, enabled, refreshOnMount, fetchData]);

  return { data, loading, error, refresh, invalidate };
}

/**
 * Hook for cached categories data
 */
export function useCachedCategories(options: UseCachedDataOptions = {}) {
  return useCachedData(
    CACHE_KEYS.CATEGORIES,
    async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data || [];
    },
    { ttl: CACHE_TTL.LONG, ...options }
  );
}

/**
 * Hook for cached featured products
 */
export function useCachedFeaturedProducts(options: UseCachedDataOptions = {}) {
  const result = useCachedData(
    CACHE_KEYS.FEATURED_PRODUCTS,
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
    { ttl: CACHE_TTL.MEDIUM, ...options }
  );

  // Ensure data is always an array, never null
  return {
    ...result,
    data: result.data || [],
  };
}

/**
 * Hook for cached product ratings
 */
export function useCachedProductRatings(
  productIds: string[],
  options: UseCachedDataOptions = {}
) {
  const cacheKey = `${CACHE_KEYS.PRODUCT_RATINGS}_${productIds.sort().join(',')}`;

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
    { ttl: CACHE_TTL.MEDIUM, ...options }
  );
}

/**
 * Hook for cached app configuration
 */
export function useCachedAppConfig(
  configKey: string,
  options: UseCachedDataOptions = {}
) {
  const cacheKey = `${CACHE_KEYS.APP_CONFIG}_${configKey}`;

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
    { ttl: CACHE_TTL.LONG, ...options }
  );
}

/**
 * Hook for cached product story/details
 */
export function useCachedProductStory(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useCachedData(
    CACHE_KEYS.PRODUCT_STORY(productId),
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
    { ttl: CACHE_TTL.LONG, ...options }
  );
}

/**
 * Hook for bulk cache operations and utilities
 */
export function useCacheManager() {
  const [stats, setStats] = useState(cacheUtils.getStats());

  const refreshStats = useCallback(() => {
    setStats(cacheUtils.getStats());
  }, []);

  const invalidateProductCache = useCallback(() => {
    cacheUtils.invalidateProductCache();
    refreshStats();
  }, [refreshStats]);

  const invalidateUserCache = useCallback(
    (userId?: string) => {
      cacheUtils.invalidateUserCache(userId);
      refreshStats();
    },
    [refreshStats]
  );

  const invalidateConfigCache = useCallback(() => {
    cacheUtils.invalidateConfigCache();
    refreshStats();
  }, [refreshStats]);

  const clearAllCache = useCallback(() => {
    cacheUtils.clearAll();
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    refreshStats,
    invalidateProductCache,
    invalidateUserCache,
    invalidateConfigCache,
    clearAllCache,
  };
}

/**
 * Hook for managing cache warming and preloading
 */
export function useCacheWarming() {
  const warmCategories = useCallback(async () => {
    try {
      await cache.getOrSet(
        CACHE_KEYS.CATEGORIES,
        async () => {
          const { data } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre');
          return data || [];
        },
        CACHE_TTL.LONG
      );
    } catch (error) {
      console.warn('Failed to warm categories cache:', error);
    }
  }, []);

  const warmFeaturedProducts = useCallback(async () => {
    try {
      await cache.getOrSet(
        CACHE_KEYS.FEATURED_PRODUCTS,
        async () => {
          const { data } = await supabase
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
          return data || [];
        },
        CACHE_TTL.MEDIUM
      );
    } catch (error) {
      console.warn('Failed to warm featured products cache:', error);
    }
  }, []);

  const warmEssentialData = useCallback(async () => {
    await Promise.allSettled([warmCategories(), warmFeaturedProducts()]);
  }, [warmCategories, warmFeaturedProducts]);

  return {
    warmCategories,
    warmFeaturedProducts,
    warmEssentialData,
  };
}

export default cache;
