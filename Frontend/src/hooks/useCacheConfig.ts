import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { useCachedData } from './useCache';

// Import types directly since they're not exported from useCache
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

interface CacheConfig {
  key: string | ((params?: any) => string);
  fetcher: (params?: any) => Promise<any>;
  ttl: number;
  defaultValue?: any;
  transform?: (data: any) => any;
}

// Centralized cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  categories: {
    key: CACHE_KEYS.CATEGORIES,
    fetcher: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.LONG,
    defaultValue: []
  },

  featuredProducts: {
    key: CACHE_KEYS.FEATURED_PRODUCTS,
    fetcher: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          precio,
          imagen_url,
          users!productos_vendedor_id_fkey(nombre_completo)
        `)
        .eq('estado', 'activo')
        .gt('stock', 0)
        .limit(6)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    ttl: CACHE_TTL.MEDIUM,
    defaultValue: []
  },

  productRatings: {
    key: (productIds: string[]) => `${CACHE_KEYS.PRODUCT_RATINGS}_${productIds.sort().join(',')}`,
    fetcher: async (productIds: string[]) => {
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
    ttl: CACHE_TTL.MEDIUM,
    defaultValue: {}
  },

  product: {
    key: (productId: string) => CACHE_KEYS.PRODUCT_DETAIL(productId),
    fetcher: async (productId: string) => {
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
    ttl: CACHE_TTL.MEDIUM,
    defaultValue: null
  },

  productAverageRating: {
    key: (productId: string) => CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId),
    fetcher: async (productId: string) => {
      const { data, error } = await supabase
        .from('mv_promedio_calificaciones')
        .select('promedio')
        .eq('producto_id', productId)
        .maybeSingle();

      if (error) throw error;
      return data?.promedio ? Number(data.promedio) : null;
    },
    ttl: CACHE_TTL.MEDIUM,
    defaultValue: null
  },

  productStory: {
    key: (productId: string) => CACHE_KEYS.PRODUCT_STORY(productId),
    fetcher: async (productId: string) => {
      const key = `product_story:${productId}`;
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    },
    ttl: CACHE_TTL.LONG,
    defaultValue: null
  },

  appConfig: {
    key: (configKey: string) => `${CACHE_KEYS.APP_CONFIG}_${configKey}`,
    fetcher: async (configKey: string) => {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', configKey)
        .maybeSingle();

      if (error) throw error;
      return data?.value || null;
    },
    ttl: CACHE_TTL.LONG,
    defaultValue: null
  }
};

/**
 * Generic hook that uses configuration-based caching
 * Replaces multiple similar cache hooks with a single configurable one
 */
export function useConfiguredCache<T = any>(
  configName: string,
  params?: any,
  options: UseCachedDataOptions = {}
): UseCachedDataReturn<T> {
  const config = CACHE_CONFIGS[configName];
  
  if (!config) {
    throw new Error(`Cache config "${configName}" not found. Available configs: ${Object.keys(CACHE_CONFIGS).join(', ')}`);
  }

  const cacheKey = typeof config.key === 'function' 
    ? config.key(params) 
    : config.key;

  const fetcher = () => config.fetcher(params);

  const result = useCachedData<T>(
    cacheKey,
    fetcher,
    { 
      ttl: config.ttl,
      ...options 
    }
  );

  // Apply default value and transformation if specified
  const processedData = config.defaultValue !== undefined && result.data === null 
    ? config.defaultValue 
    : result.data;

  const finalData = config.transform 
    ? config.transform(processedData) 
    : processedData;

  return {
    ...result,
    data: finalData
  };
}

// Convenience hooks that maintain the same API but use the new system
export function useCachedCategories(options: UseCachedDataOptions = {}) {
  return useConfiguredCache('categories', undefined, options);
}

export function useCachedFeaturedProducts(options: UseCachedDataOptions = {}) {
  return useConfiguredCache('featuredProducts', undefined, options);
}

export function useCachedProductRatings(
  productIds: string[],
  options: UseCachedDataOptions = {}
) {
  return useConfiguredCache('productRatings', productIds, options);
}

export function useCachedProduct(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useConfiguredCache('product', productId, options);
}

export function useCachedProductAverageRating(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useConfiguredCache('productAverageRating', productId, options);
}

export function useCachedProductStory(
  productId: string,
  options: UseCachedDataOptions = {}
) {
  return useConfiguredCache('productStory', productId, options);
}

export function useCachedAppConfig(
  configKey: string,
  options: UseCachedDataOptions = {}
) {
  return useConfiguredCache('appConfig', configKey, options);
}

// Export types for external use
export type { CacheConfig };
export { CACHE_CONFIGS };