import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { handleError } from '@/lib/errorHandler';

interface QueryPerformance {
  queryName: string;
  executionTime: number;
  timestamp: Date;
  rowsAffected?: number;
  success: boolean;
}

interface DatabaseHealth {
  metric: string;
  value: string;
  status: 'GOOD' | 'OK' | 'POOR' | 'healthy' | 'good' | 'poor';
  recommendation?: string;
}

interface TableStats {
  tableName: string;
  sizeMb: number;
  tupleCount: number;
  liveTuples: number;
  deadTuples: number;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
}

interface UseDatabaseMonitoringReturn {
  performanceMetrics: QueryPerformance[];
  healthStatus: DatabaseHealth[];
  tableStats: TableStats[];
  isLoading: boolean;
  error: string | null;
  trackQuery: (
    queryName: string,
    executionPromise: Promise<any>
  ) => Promise<any>;
  refreshHealthStatus: () => Promise<void>;
  refreshTableStats: () => Promise<void>;
  clearMetrics: () => void;
}

export const useDatabaseMonitoring = (): UseDatabaseMonitoringReturn => {
  const [performanceMetrics, setPerformanceMetrics] = useState<
    QueryPerformance[]
  >([]);
  const [healthStatus, setHealthStatus] = useState<DatabaseHealth[]>([]);
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track query performance - DISABLED
  const trackQuery = useCallback(
    async (queryName: string, executionPromise: Promise<any>) => {
      // Database monitoring disabled - just execute the query without tracking
      try {
        const result = await executionPromise;
        return result;
      } catch (err) {
        throw err;
      }
    },
    []
  );

  // Refresh database health status - DISABLED
  const refreshHealthStatus = useCallback(async () => {
    // Database monitoring disabled - return static data without network calls
    setIsLoading(false);
    setError(null);
    setHealthStatus([
      {
        metric: 'Connection Status',
        status: 'GOOD',
        value: 'Active',
        recommendation: 'Monitoring disabled',
      },
    ]);
  }, []);

  // Refresh table statistics - DISABLED
  const refreshTableStats = useCallback(async () => {
    // Database monitoring disabled - return static data without network calls
    setIsLoading(false);
    setError(null);
    setTableStats([
      {
        tableName: 'system',
        sizeMb: 0,
        tupleCount: 0,
        liveTuples: 0,
        deadTuples: 0,
        lastVacuum: null,
        lastAnalyze: null,
      },
    ]);
  }, []);

  // Clear performance metrics
  const clearMetrics = useCallback(() => {
    setPerformanceMetrics([]);
  }, []);

  // Database monitoring disabled - no automatic data fetching
  // useEffect(() => {
  //   if (import.meta.env.DEV) {
  //     refreshHealthStatus();
  //     refreshTableStats();

  //     // Set up periodic refresh (every 5 minutes)
  //     const interval = setInterval(
  //       () => {
  //         refreshHealthStatus();
  //         refreshTableStats();
  //       },
  //       5 * 60 * 1000
  //     );

  //     return () => clearInterval(interval);
  //   }
  // }, [refreshHealthStatus, refreshTableStats]);

  return {
    performanceMetrics,
    healthStatus,
    tableStats,
    isLoading,
    error,
    trackQuery,
    refreshHealthStatus,
    refreshTableStats,
    clearMetrics,
  };
};

// Higher-order component for automatic query tracking
export const withQueryTracking = <T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  queryName: string
): T => {
  return ((...args: any[]) => {
    // This would need to be implemented with a context provider
    // For now, just return the original function
    return queryFn(...args);
  }) as T;
};

// Hook for optimized product searches
export const useOptimizedProductSearch = () => {
  const { trackQuery } = useDatabaseMonitoring();

  const searchProducts = useCallback(
    async (params: {
      searchTerm?: string;
      categoryFilter?: string;
      priceMin?: number;
      priceMax?: number;
      limit?: number;
      offset?: number;
    }) => {
      return trackQuery(
        'search_productos_optimized',
        supabase.rpc('search_productos_optimized', {
          search_term: params.searchTerm || null,
          categoria_filter: params.categoryFilter || null,
          precio_min: params.priceMin || null,
          precio_max: params.priceMax || null,
          limit_count: params.limit || 20,
          offset_count: params.offset || 0,
        })
      );
    },
    [trackQuery]
  );

  return { searchProducts };
};

// Hook for seller dashboard analytics
export const useSellerDashboardStats = () => {
  const { trackQuery } = useDatabaseMonitoring();

  const getDashboardStats = useCallback(
    async (periodDays: number = 30) => {
      return trackQuery(
        'seller_dashboard_stats',
        supabase.rpc('seller_dashboard_stats', {
          periodo_dias: periodDays,
        })
      );
    },
    [trackQuery]
  );

  return { getDashboardStats };
};

// Hook for buyer order history
export const useBuyerOrderHistory = () => {
  const { trackQuery } = useDatabaseMonitoring();

  const getOrderHistory = useCallback(
    async (
      params: {
        limit?: number;
        offset?: number;
      } = {}
    ) => {
      return trackQuery(
        'buyer_order_history',
        supabase.rpc('buyer_order_history', {
          limit_count: params.limit || 20,
          offset_count: params.offset || 0,
        })
      );
    },
    [trackQuery]
  );

  return { getOrderHistory };
};

// Database performance metrics utilities
export const DatabaseUtils = {
  // Calculate query performance score
  getPerformanceScore: (metrics: QueryPerformance[]): number => {
    if (metrics.length === 0) return 100;

    const recentMetrics = metrics.slice(0, 20); // Last 20 queries
    const avgExecutionTime =
      recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) /
      recentMetrics.length;
    const successRate =
      recentMetrics.filter(m => m.success).length / recentMetrics.length;

    // Score based on execution time and success rate
    let score = 100;

    // Penalize slow queries (over 1000ms)
    if (avgExecutionTime > 1000) {
      score -= Math.min(50, (avgExecutionTime - 1000) / 100);
    }

    // Penalize low success rate
    score *= successRate;

    return Math.max(0, Math.round(score));
  },

  // Get slow queries
  getSlowQueries: (
    metrics: QueryPerformance[],
    thresholdMs: number = 1000
  ): QueryPerformance[] => {
    return metrics.filter(m => m.executionTime > thresholdMs);
  },

  // Get query statistics
  getQueryStats: (metrics: QueryPerformance[]) => {
    const totalQueries = metrics.length;
    const successfulQueries = metrics.filter(m => m.success).length;
    const avgExecutionTime =
      totalQueries > 0
        ? metrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
        : 0;

    return {
      totalQueries,
      successfulQueries,
      failedQueries: totalQueries - successfulQueries,
      successRate:
        totalQueries > 0 ? (successfulQueries / totalQueries) * 100 : 100,
      avgExecutionTime: Math.round(avgExecutionTime),
      slowQueries: metrics.filter(m => m.executionTime > 1000).length,
    };
  },

  // Format execution time for display
  formatExecutionTime: (timeMs: number): string => {
    if (timeMs < 1) return '<1ms';
    if (timeMs < 1000) return `${Math.round(timeMs)}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  },

  // Get health status summary
  getHealthSummary: (healthStatus: DatabaseHealth[]) => {
    const good = healthStatus.filter(h => h.status === 'GOOD').length;
    const ok = healthStatus.filter(h => h.status === 'OK').length;
    const poor = healthStatus.filter(h => h.status === 'POOR').length;
    const total = healthStatus.length;

    let overallStatus: 'GOOD' | 'OK' | 'POOR' = 'GOOD';
    if (poor > 0) overallStatus = 'POOR';
    else if (ok > good) overallStatus = 'OK';

    return {
      overallStatus,
      good,
      ok,
      poor,
      total,
      score:
        total > 0 ? Math.round(((good * 2 + ok) / (total * 2)) * 100) : 100,
    };
  },
};
