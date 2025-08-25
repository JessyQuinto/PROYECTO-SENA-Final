import { lazy, ComponentType } from 'react';

// Route preloading utilities for performance optimization
export interface RouteConfig {
  path: string;
  component: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  prefetch?: boolean;
  priority?: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

// Cache for loaded modules to prevent duplicate imports
const moduleCache = new Map<string, Promise<{ default: ComponentType<any> }>>();

// Cache for component instances
const componentCache = new Map<string, ComponentType<any>>();

/**
 * Enhanced lazy loading with caching and preloading
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): ComponentType<T> {
  // Check if component is already cached
  if (componentCache.has(componentName)) {
    return componentCache.get(componentName) as ComponentType<T>;
  }

  // Create cached import function
  const cachedImportFn = () => {
    if (moduleCache.has(componentName)) {
      return moduleCache.get(componentName) as Promise<{ default: ComponentType<T> }>;
    }

    const modulePromise = importFn();
    moduleCache.set(componentName, modulePromise);
    return modulePromise;
  };

  const LazyComponent = lazy(cachedImportFn);
  componentCache.set(componentName, LazyComponent);

  return LazyComponent;
}

/**
 * Preload route components in background
 */
export function preloadRoute(routeName: string, importFn: () => Promise<any>): Promise<void> {
  if (moduleCache.has(routeName)) {
    return Promise.resolve();
  }

  console.log(`[RoutePreload] Preloading route: ${routeName}`);
  
  const modulePromise = importFn().catch(error => {
    console.warn(`[RoutePreload] Failed to preload ${routeName}:`, error);
    moduleCache.delete(routeName); // Remove failed cache entry
    throw error;
  });

  moduleCache.set(routeName, modulePromise);
  
  return modulePromise.then(() => {
    console.log(`[RoutePreload] Successfully preloaded: ${routeName}`);
  });
}

/**
 * Preload multiple routes with priority and scheduling
 */
export function preloadRoutes(routes: RouteConfig[]): void {
  // Sort by priority
  const sortedRoutes = routes
    .filter(route => route.preload)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
    });

  // Use requestIdleCallback for low-priority preloading
  function schedulePreload(route: RouteConfig, isHighPriority: boolean) {
    const preloadFn = () => {
      preloadRoute(route.path, route.component).catch(error => {
        console.warn(`[RoutePreload] Failed to preload route ${route.path}:`, error);
      });
    };

    if (isHighPriority) {
      // High priority: load immediately
      setTimeout(preloadFn, 0);
    } else {
      // Low priority: wait for idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(preloadFn, { timeout: 5000 });
      } else {
        setTimeout(preloadFn, 100);
      }
    }
  }

  sortedRoutes.forEach(route => {
    const isHighPriority = route.priority === 'high';
    schedulePreload(route, isHighPriority);
  });
}

/**
 * Intelligent prefetching based on user behavior
 */
export class RoutePrefetcher {
  private prefetchedRoutes = new Set<string>();
  private intersectionObserver?: IntersectionObserver;
  private hoverTimeout?: NodeJS.Timeout;

  constructor() {
    this.setupIntersectionObserver();
    this.setupLinkHoverPrefetch();
  }

  private setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const link = entry.target as HTMLAnchorElement;
              const href = link.getAttribute('href');
              if (href && this.shouldPrefetch(href)) {
                this.prefetchRoute(href);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }
  }

  private setupLinkHoverPrefetch() {
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && this.shouldPrefetch(link.href)) {
        // Delay prefetch to avoid prefetching on quick mouse movements
        this.hoverTimeout = setTimeout(() => {
          this.prefetchRoute(link.href);
        }, 100);
      }
    });

    document.addEventListener('mouseout', () => {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = undefined;
      }
    });
  }

  private shouldPrefetch(href: string): boolean {
    // Only prefetch internal routes
    if (href.startsWith('http') && !href.includes(window.location.origin)) {
      return false;
    }

    // Avoid prefetching already prefetched routes
    if (this.prefetchedRoutes.has(href)) {
      return false;
    }

    // Skip certain routes that shouldn't be prefetched
    const skipPatterns = ['/admin', '/logout', '/api/', '?'];
    return !skipPatterns.some(pattern => href.includes(pattern));
  }

  private prefetchRoute(href: string) {
    if (this.prefetchedRoutes.has(href)) return;

    this.prefetchedRoutes.add(href);
    console.log(`[RoutePrefetch] Prefetching route: ${href}`);

    // Determine which component to prefetch based on route
    const routeComponentMap = this.getRouteComponentMap();
    const componentImport = routeComponentMap[href] || routeComponentMap[this.normalizeRoute(href)];

    if (componentImport) {
      preloadRoute(href, componentImport);
    }
  }

  private normalizeRoute(href: string): string {
    const url = new URL(href, window.location.origin);
    return url.pathname;
  }

  private getRouteComponentMap(): Record<string, () => Promise<any>> {
    return {
      '/': () => import('@/modules/Landing'),
      '/productos': () => import('@/modules/buyer/ProductCatalog'),
      '/carrito': () => import('@/modules/buyer/CartPage'),
      '/checkout': () => import('@/modules/buyer/CheckoutPage'),
      '/mis-pedidos': () => import('@/modules/buyer/MyOrdersPage'),
      '/admin': () => import('@/modules/admin/AdminDashboard'),
      '/admin/usuarios': () => import('@/modules/admin/UsersAdmin'),
      '/admin/metricas': () => import('@/modules/admin/MetricsAdmin'),
      '/login': () => import('@/pages/Login'),
      '/register': () => import('@/pages/Register'),
    };
  }

  /**
   * Observe links for intersection-based prefetching
   */
  observeLinks(container: HTMLElement = document.body) {
    if (!this.intersectionObserver) return;

    const links = container.querySelectorAll('a[href]');
    links.forEach(link => {
      this.intersectionObserver!.observe(link);
    });
  }

  /**
   * Stop observing and cleanup
   */
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }
}

// Global route prefetcher instance
export const routePrefetcher = new RoutePrefetcher();

// Utility to create route components with preloading
export const createRouteComponent = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  routeName: string,
  config?: {
    preload?: boolean;
    priority?: 'high' | 'medium' | 'low';
  }
) => {
  const component = createLazyComponent(importFn, routeName);

  // Schedule preloading if requested
  if (config?.preload) {
    const priority = config.priority || 'medium';
    const delay = priority === 'high' ? 0 : priority === 'medium' ? 1000 : 3000;
    
    setTimeout(() => {
      preloadRoute(routeName, importFn);
    }, delay);
  }

  return component;
};

// Performance monitoring for route loading
export class RoutePerformanceMonitor {
  private loadTimes = new Map<string, number>();
  private startTimes = new Map<string, number>();

  startTiming(routeName: string) {
    this.startTimes.set(routeName, performance.now());
  }

  endTiming(routeName: string) {
    const startTime = this.startTimes.get(routeName);
    if (startTime) {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      this.loadTimes.set(routeName, loadTime);
      
      console.log(`[RoutePerf] ${routeName} loaded in ${loadTime.toFixed(2)}ms`);
      
      // Report to analytics if available
      if ('gtag' in window) {
        (window as any).gtag('event', 'route_load_time', {
          event_category: 'Performance',
          event_label: routeName,
          value: Math.round(loadTime)
        });
      }
    }
  }

  getLoadTimes() {
    return Object.fromEntries(this.loadTimes.entries());
  }

  getAverageLoadTime() {
    const times = Array.from(this.loadTimes.values());
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
}

export const routePerformanceMonitor = new RoutePerformanceMonitor();