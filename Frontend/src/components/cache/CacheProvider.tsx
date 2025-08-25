import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useCacheWarming, useCacheManager } from '@/hooks/useCache';
import { cache } from '@/lib/cache';

interface CacheContextValue {
  isReady: boolean;
  stats: ReturnType<typeof useCacheManager>['stats'];
  actions: {
    refresh: () => void;
    warmCache: () => Promise<void>;
    warmProductCache: (productId: string) => Promise<void>;
    invalidateProductCache: () => void;
    invalidateProductCacheById: (productId: string) => void;
    invalidateAllProductDetails: () => void;
    invalidateUserCache: (userId?: string) => void;
    invalidateConfigCache: () => void;
    clearAllCache: () => void;
  };
}

const CacheContext = createContext<CacheContextValue | null>(null);

interface CacheProviderProps {
  children: React.ReactNode;
  enableAutoWarming?: boolean;
  warmOnMount?: boolean;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({
  children,
  enableAutoWarming = true,
  warmOnMount = true,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const cacheManager = useCacheManager();
  const cacheWarming = useCacheWarming();

  // Memoized initialization function
  const initializeCache = useCallback(async () => {
    if (!enableAutoWarming || !warmOnMount) {
      setIsReady(true);
      setIsInitializing(false);
      return;
    }

    try {
      console.log('🗂️ Initializing cache system...');
      
      // Use requestIdleCallback for non-blocking initialization
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          try {
            console.log('🔥 Warming cache with essential data...');
            await cacheWarming.warmEssentialData();
            console.log('✅ Cache warming completed');
          } catch (error) {
            console.warn('⚠️ Cache warming failed:', error);
          } finally {
            setIsReady(true);
            setIsInitializing(false);
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          try {
            console.log('🔥 Warming cache with essential data...');
            await cacheWarming.warmEssentialData();
            console.log('✅ Cache warming completed');
          } catch (error) {
            console.warn('⚠️ Cache warming failed:', error);
          } finally {
            setIsReady(true);
            setIsInitializing(false);
          }
        }, 100);
      }
    } catch (error) {
      console.warn('⚠️ Cache initialization failed:', error);
      setIsReady(true);
      setIsInitializing(false);
    }
  }, [enableAutoWarming, warmOnMount, cacheWarming]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await initializeCache();
      if (mounted) {
        setIsReady(true);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [initializeCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cache.destroy();
    };
  }, []);

  // Memoized context value
  const contextValue = useMemo<CacheContextValue>(() => ({
    isReady,
    stats: cacheManager.stats,
    actions: {
      refresh: cacheManager.refreshStats,
      warmCache: cacheManager.warmProductCache,
      warmProductCache: cacheManager.warmProductCache,
      invalidateProductCache: cacheManager.invalidateProductCache,
      invalidateProductCacheById: cacheManager.invalidateProductCacheById,
      invalidateAllProductDetails: cacheManager.invalidateAllProductDetails,
      invalidateUserCache: cacheManager.invalidateUserCache,
      invalidateConfigCache: cacheManager.invalidateConfigCache,
      clearAllCache: cacheManager.clearAllCache,
    },
  }), [isReady, cacheManager]);

  // Show loading state only during initialization
  if (isInitializing) {
    return (
      <div className="cache-loading">
        <CacheContext.Provider value={contextValue}>
          {children}
        </CacheContext.Provider>
      </div>
    );
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextValue => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

/**
 * Cache management panel for admin users
 */
export const CacheManagementPanel: React.FC = () => {
  const { stats, actions } = useCache();
  const [isLoading, setIsLoading] = useState(false);

  const handleWarmCache = useCallback(async () => {
    setIsLoading(true);
    try {
      await actions.warmCache();
      actions.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
      <h3 className='text-lg font-semibold mb-4'>Gestión de Caché</h3>

      {/* Statistics */}
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded'>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            Memoria
          </div>
          <div className='text-2xl font-bold'>{stats.memoryItems}</div>
          <div className='text-xs text-gray-500'>elementos</div>
        </div>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded'>
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            Almacenamiento
          </div>
          <div className='text-2xl font-bold'>{stats.localStorageItems}</div>
          <div className='text-xs text-gray-500'>elementos</div>
        </div>
      </div>

      {/* Actions */}
      <div className='space-y-2'>
        <button
          onClick={handleWarmCache}
          disabled={isLoading}
          className='btn btn-primary w-full'
        >
          {isLoading ? 'Calentando...' : 'Calentar Caché'}
        </button>

        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={actions.invalidateProductCache}
            className='btn btn-secondary text-xs'
          >
            Limpiar Productos
          </button>
          <button
            onClick={actions.invalidateAllProductDetails}
            className='btn btn-secondary text-xs'
          >
            Limpiar Detalles
          </button>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={actions.invalidateConfigCache}
            className='btn btn-secondary text-xs'
          >
            Limpiar Config
          </button>
          <button
            onClick={actions.clearAllCache}
            className='btn btn-destructive text-xs'
          >
            Limpiar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for cache-aware data mutations
 */
export const useCachedMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateKeys?: string[];
    invalidatePatterns?: string[];
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mutationFn(variables);

      // Invalidate specified cache keys
      options.invalidateKeys?.forEach(key => cache.delete(key));

      // Invalidate cache patterns
      options.invalidatePatterns?.forEach(pattern =>
        cache.deletePattern(pattern)
      );

      options.onSuccess?.(data, variables);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error, variables);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    isLoading,
    error,
  };
};

export default CacheProvider;
