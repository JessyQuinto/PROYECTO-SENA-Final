import { useEffect, useState, useCallback } from 'react';
import { performanceMonitor, PerformanceData } from '@/lib/performance';

interface PerformanceMetrics {
  coreWebVitalsScore: number;
  metrics: PerformanceData[];
  isLoading: boolean;
}

export const usePerformanceMonitoring = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics>({
    coreWebVitalsScore: 0,
    metrics: [],
    isLoading: true,
  });

  // Memoized update metrics function
  const updateMetrics = useCallback(() => {
    setPerformanceData({
      coreWebVitalsScore: performanceMonitor.getCoreWebVitalsScore(),
      metrics: performanceMonitor.getMetrics(),
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.init();

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [updateMetrics]);

  return performanceData;
};

// Hook for monitoring specific component performance - optimized
export const useComponentPerformance = (componentName: string) => {
  const logSlowRender = useCallback((duration: number) => {
    if (import.meta.env.DEV && duration > 16) {
      // Log if component takes more than 16ms (one frame at 60fps)
      console.warn(
        `🐌 Slow component render: ${componentName} took ${duration.toFixed(2)}ms`
      );
    }
  }, [componentName]);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      logSlowRender(duration);
    };
  }, [logSlowRender]);
};

// Hook for monitoring route changes
export const useRoutePerformance = () => {
  useEffect(() => {
    const startTime = performance.now();

    const handleRouteChange = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (import.meta.env.DEV) {
        console.log(`📍 Route change took ${duration.toFixed(2)}ms`);
      }
    };

    // Monitor for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
};
