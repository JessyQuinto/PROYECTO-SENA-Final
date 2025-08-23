import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface PerformanceData {
  metric: string;
  value: number;
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceThresholds {
  LCP: { good: number; poor: number };
  FID: { good: number; poor: number };
  CLS: { good: number; poor: number };
  FCP: { good: number; poor: number };
  TTFB: { good: number; poor: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, poor: 300 }, // First Input Delay (ms) - kept for compatibility
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

// Performance monitoring class
class PerformanceMonitor {
  private isEnabled: boolean;
  private analyticsEndpoint?: string;
  private metrics: PerformanceData[] = [];

  constructor(enabled: boolean = true, analyticsEndpoint?: string) {
    this.isEnabled = enabled;
    this.analyticsEndpoint = analyticsEndpoint;
  }

  // Initialize Web Vitals monitoring
  public init(): void {
    if (!this.isEnabled) return;

    // Monitor Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this)); // Interaction to Next Paint (replaces FID)
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Monitor navigation timing
    this.monitorNavigationTiming();

    // Monitor resource loading
    this.monitorResourceTiming();

    // Set up periodic reporting
    this.setupPeriodicReporting();
  }

  // Handle individual metrics
  private handleMetric(metric: Metric): void {
    const performanceData: PerformanceData = {
      metric: metric.name,
      value: metric.value,
      id: metric.id,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(performanceData);
    this.logMetric(performanceData);
    this.sendToAnalytics(performanceData);
  }

  // Monitor navigation timing
  private monitorNavigationTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        
        // Calculate various timing metrics
        const metrics = {
          DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
          TCP: navigation.connectEnd - navigation.connectStart,
          Request: navigation.responseStart - navigation.requestStart,
          Response: navigation.responseEnd - navigation.responseStart,
          Processing: navigation.domComplete - navigation.responseEnd,
          Load: navigation.loadEventEnd - navigation.loadEventStart,
        };

        Object.entries(metrics).forEach(([name, value]) => {
          if (value > 0) {
            const performanceData: PerformanceData = {
              metric: `Navigation_${name}`,
              value,
              id: `nav_${name.toLowerCase()}`,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
            };
            
            this.metrics.push(performanceData);
            this.sendToAnalytics(performanceData);
          }
        });
      }
    }
  }

  // Monitor resource loading
  private monitorResourceTiming(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      // Monitor slow resources (over 1 second)
      const slowResources = resourceEntries.filter(entry => entry.duration > 1000);
      
      slowResources.forEach(resource => {
        const performanceData: PerformanceData = {
          metric: 'SlowResource',
          value: resource.duration,
          id: resource.name,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        };
        
        this.metrics.push(performanceData);
        this.sendToAnalytics(performanceData);
      });
    }
  }

  // Setup periodic reporting
  private setupPeriodicReporting(): void {
    // Report metrics every 30 seconds
    setInterval(() => {
      this.reportSummary();
    }, 30000);

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportSummary();
    });
  }

  // Log metric to console (development only)
  private logMetric(data: PerformanceData): void {
    if (import.meta.env.DEV) {
      const threshold = PERFORMANCE_THRESHOLDS[data.metric as keyof PerformanceThresholds];
      let status = 'good';
      
      if (threshold) {
        if (data.value > threshold.poor) {
          status = 'poor';
        } else if (data.value > threshold.good) {
          status = 'needs improvement';
        }
      }

      console.log(`🚀 ${data.metric}:`, {
        value: data.value,
        status,
        threshold,
        url: data.url,
      });
    }
  }

  // Send metric to analytics endpoint
  private sendToAnalytics(data: PerformanceData): void {
    if (!this.analyticsEndpoint) return;

    // Use sendBeacon for reliability
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(
        this.analyticsEndpoint,
        JSON.stringify(data)
      );
    } else {
      // Fallback to fetch
      fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(() => {
        // Silently handle errors
      });
    }
  }

  // Report performance summary
  private reportSummary(): void {
    if (this.metrics.length === 0) return;

    const summary = this.generateSummary();
    
    if (import.meta.env.DEV) {
      console.group('📊 Performance Summary');
      console.table(summary);
      console.groupEnd();
    }

    // Send summary to analytics
    if (this.analyticsEndpoint) {
      this.sendToAnalytics({
        metric: 'PerformanceSummary',
        value: 0,
        id: 'summary',
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    }
  }

  // Generate performance summary
  private generateSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = [];
      }
      acc[metric.metric].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([metric, values]) => {
      summary[metric] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
      };
    });

    return summary;
  }

  // Get current metrics
  public getMetrics(): PerformanceData[] {
    return [...this.metrics];
  }

  // Clear metrics
  public clearMetrics(): void {
    this.metrics = [];
  }

  // Get Core Web Vitals score
  public getCoreWebVitalsScore(): number {
    const coreMetrics = ['LCP', 'INP', 'CLS']; // Updated to use INP instead of FID
    const scores: number[] = [];

    coreMetrics.forEach(metricName => {
      const metric = this.metrics.find(m => m.metric === metricName);
      if (metric) {
        const threshold = PERFORMANCE_THRESHOLDS[metricName as keyof PerformanceThresholds] || 
                         PERFORMANCE_THRESHOLDS.FID; // Fallback for INP
        if (metric.value <= threshold.good) {
          scores.push(100);
        } else if (metric.value <= threshold.poor) {
          scores.push(75);
        } else {
          scores.push(50);
        }
      }
    });

    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }
}

// Create and export singleton instance
export const performanceMonitor = new PerformanceMonitor(
  true, // Enable in all environments
  // You can configure an analytics endpoint here
  // import.meta.env.VITE_ANALYTICS_ENDPOINT
);

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  performanceMonitor.init();
};

// Export utilities
export { PERFORMANCE_THRESHOLDS };
export type { PerformanceData, PerformanceThresholds };