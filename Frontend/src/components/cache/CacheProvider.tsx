import React, { createContext, useContext } from 'react';


interface CacheContextValue {
  isReady: boolean;
  stats: {
    memoryItems: number;
    localStorageItems: number;
  };
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
}) => {
  const contextValue: CacheContextValue = {
    isReady: true,
    stats: {
      memoryItems: 0,
      localStorageItems: 0,
    },
    actions: {
      refresh: () => {},
      warmCache: async () => {},
      warmProductCache: async () => {},
      invalidateProductCache: () => {},
      invalidateProductCacheById: () => {},
      invalidateAllProductDetails: () => {},
      invalidateUserCache: () => {},
      invalidateConfigCache: () => {},
      clearAllCache: () => {},
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
 * Cache management panel for admin users
 */
export const CacheManagementPanel: React.FC = () => {
  const { stats, actions } = useCache();
  const [isLoading, setIsLoading] = React.useState(false);

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const mutate = async (variables: TVariables): Promise<TData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mutationFn(variables);

      // Invalidate specified cache keys
      options.invalidateKeys?.forEach(key => {
        // Cache invalidation would be handled by external cache system
        console.log(`Invalidating cache key: ${key}`);
      });

      // Invalidate cache patterns
      options.invalidatePatterns?.forEach(pattern => {
        // Cache pattern invalidation would be handled by external cache system
        console.log(`Invalidating cache pattern: ${pattern}`);
      });

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

export { CacheProvider as default };
