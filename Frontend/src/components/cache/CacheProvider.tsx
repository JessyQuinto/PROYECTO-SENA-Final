import React, { createContext, useContext, useEffect, useState } from 'react';
import { useCacheWarming, useCacheManager } from '@/hooks/useCache';
import { cache } from '@/lib/cache';

interface CacheContextValue {
  isReady: boolean;
  stats: ReturnType<typeof useCacheManager>['stats'];
  actions: {
    refresh: () => void;
    warmCache: () => Promise<void>;
    invalidateProductCache: () => void;
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
  const cacheManager = useCacheManager();
  const cacheWarming = useCacheWarming();

  useEffect(() => {
    let mounted = true;

    const initializeCache = async () => {
      try {
        // Initialize cache system
        console.log('🗂️ Initializing cache system...');

        // Warm essential data if enabled
        if (warmOnMount && enableAutoWarming) {
          console.log('🔥 Warming cache with essential data...');
          await cacheWarming.warmEssentialData();
          console.log('✅ Cache warming completed');
        }

        if (mounted) {
          setIsReady(true);
          console.log('🚀 Cache system ready');
        }
      } catch (error) {
        console.warn('⚠️ Cache initialization failed:', error);
        if (mounted) {
          setIsReady(true); // Still set ready to not block the app
        }
      }
    };

    initializeCache();

    return () => {
      mounted = false;
    };
  }, [enableAutoWarming, warmOnMount, cacheWarming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cache.destroy();
    };
  }, []);

  const contextValue: CacheContextValue = {
    isReady,
    stats: cacheManager.stats,
    actions: {
      refresh: cacheManager.refreshStats,
      warmCache: cacheWarming.warmEssentialData,
      invalidateProductCache: cacheManager.invalidateProductCache,
      invalidateUserCache: cacheManager.invalidateUserCache,
      invalidateConfigCache: cacheManager.invalidateConfigCache,
      clearAllCache: cacheManager.clearAllCache,
    },
  };

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
 * Cache status indicator component for development
 */
export const CacheStatusIndicator: React.FC = () => {
  const { isReady, stats } = useCache();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
          }`}
        />
        <span className="font-medium">Cache</span>
      </div>
      <div className="text-gray-600 dark:text-gray-400 mt-1">
        <div>Memory: {stats.memoryItems}</div>
        <div>Storage: {stats.localStorageItems}</div>
      </div>
    </div>
  );
};

/**
 * Cache management panel for admin users
 */
export const CacheManagementPanel: React.FC = () => {
  const { stats, actions } = useCache();
  const [isLoading, setIsLoading] = useState(false);

  const handleWarmCache = async () => {
    setIsLoading(true);
    try {
      await actions.warmCache();
      actions.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4">Gestión de Caché</h3>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Memoria</div>
          <div className="text-2xl font-bold">{stats.memoryItems}</div>
          <div className="text-xs text-gray-500">elementos</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-600 dark:text-gray-400">Almacenamiento</div>
          <div className="text-2xl font-bold">{stats.localStorageItems}</div>
          <div className="text-xs text-gray-500">elementos</div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleWarmCache}
          disabled={isLoading}
          className="w-full btn btn-primary disabled:opacity-50"
        >
          {isLoading ? 'Precargando...' : 'Precargar Caché'}
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={actions.invalidateProductCache}
            className="btn btn-secondary text-xs"
          >
            Limpiar Productos
          </button>
          <button
            onClick={actions.invalidateConfigCache}
            className="btn btn-secondary text-xs"
          >
            Limpiar Config
          </button>
        </div>
        
        <button
          onClick={actions.clearAllCache}
          className="w-full btn btn-danger text-xs"
        >
          Limpiar Todo
        </button>
      </div>

      {/* Configuration */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs">
        <div className="font-medium mb-1">Configuración</div>
        <div>TTL por defecto: {Math.round(stats.config.defaultTtl / 1000 / 60)}m</div>
        <div>Máximo en memoria: {stats.config.maxMemoryItems}</div>
        <div>Versión: {stats.config.version}</div>
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

  const mutate = async (variables: TVariables): Promise<TData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mutationFn(variables);

      // Invalidate specified cache keys
      options.invalidateKeys?.forEach(key => cache.delete(key));
      
      // Invalidate cache patterns
      options.invalidatePatterns?.forEach(pattern => cache.deletePattern(pattern));

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
  };

  return {
    mutate,
    isLoading,
    error,
  };
};

export default CacheProvider;