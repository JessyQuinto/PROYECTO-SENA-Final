// Performance monitoring utilities for frontend optimization

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME: {
    GOOD: 1500,
    NEEDS_IMPROVEMENT: 3000,
    POOR: 4000
  },
  FCP: {
    GOOD: 1800,
    NEEDS_IMPROVEMENT: 3000,
    POOR: 4000
  },
  LCP: {
    GOOD: 2500,
    NEEDS_IMPROVEMENT: 4000,
    POOR: 6000
  },
  CLS: {
    GOOD: 0.1,
    NEEDS_IMPROVEMENT: 0.25,
    POOR: 0.4
  },
  FID: {
    GOOD: 100,
    NEEDS_IMPROVEMENT: 300,
    POOR: 500
  }
} as const;

// Initialize performance monitoring
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  // Monitor page load performance
  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      if (import.meta.env.DEV) {
        console.log(`[Performance] Page load time: ${loadTime.toFixed(2)}ms`);
      }
    }
  });

  // Monitor Web Vitals if available
  if ('PerformanceObserver' in window) {
    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            if (import.meta.env.DEV) {
              console.log(`[Performance] First Contentful Paint: ${fcp.toFixed(2)}ms`);
            }
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          if (import.meta.env.DEV) {
            console.log(`[Performance] Largest Contentful Paint: ${lcp.toFixed(2)}ms`);
          }
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        if (import.meta.env.DEV && clsValue > 0) {
          console.log(`[Performance] Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Performance] PerformanceObserver not fully supported:', error);
      }
    }
  }
}

// Get current performance metrics
export function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!navigation) {
    return null;
  }

  return {
    loadTime: navigation.loadEventEnd - navigation.loadEventStart,
    // Other metrics would be populated by PerformanceObserver
  };
}

// Performance monitoring hook (placeholder for React integration)
export function usePerformanceMonitoring() {
  return {
    metrics: getPerformanceMetrics(),
    thresholds: PERFORMANCE_THRESHOLDS
  };
}