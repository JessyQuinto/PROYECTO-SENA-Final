/**
 * Comprehensive caching system for static and semi-static data
 * Implements in-memory cache with TTL, localStorage fallback, and cache invalidation
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

interface CacheConfig {
  defaultTtl: number;
  maxMemoryItems: number;
  enableLocalStorage: boolean;
  storagePrefix: string;
  version: string;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes default
      maxMemoryItems: 100,
      enableLocalStorage: true,
      storagePrefix: 'app_cache_',
      version: '1.0.0',
      ...config,
    };

    this.startCleanupInterval();
    this.loadFromLocalStorage();
  }

  /**
   * Get item from cache with automatic fallback and validation
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }

    // Try localStorage as fallback
    if (this.config.enableLocalStorage) {
      const storageItem = this.getFromLocalStorage<T>(key);
      if (storageItem && this.isValid(storageItem)) {
        // Restore to memory cache
        this.memoryCache.set(key, storageItem);
        return storageItem.data;
      }
    }

    return null;
  }

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
      version: this.config.version,
    };

    // Store in memory
    this.memoryCache.set(key, cacheItem);

    // Store in localStorage if enabled
    if (this.config.enableLocalStorage) {
      this.setInLocalStorage(key, cacheItem);
    }

    // Cleanup if memory cache is too large
    this.enforceMemoryLimit();
  }

  /**
   * Check if cache item is valid (not expired and correct version)
   */
  private isValid<T>(item: CacheItem<T>): boolean {
    const isNotExpired = Date.now() - item.timestamp < item.ttl;
    const isCorrectVersion = item.version === this.config.version;
    return isNotExpired && isCorrectVersion;
  }

  /**
   * Clear specific cache key
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    if (this.config.enableLocalStorage) {
      localStorage.removeItem(this.config.storagePrefix + key);
    }
  }

  /**
   * Clear cache by pattern
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern);

    // Clear from memory
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    if (this.config.enableLocalStorage) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          const cacheKey = key.replace(this.config.storagePrefix, '');
          if (regex.test(cacheKey)) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();
    if (this.config.enableLocalStorage) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Batch get operation for multiple keys
   */
  getBatch<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({ key, data: this.get<T>(key) }));
  }

  /**
   * Batch set operation for multiple items
   */
  setBatch<T>(items: Array<{ key: string; data: T; ttl?: number }>): void {
    items.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  /**
   * Preload data for multiple keys
   */
  async preload<T>(
    items: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>
  ): Promise<void> {
    const promises = items.map(async ({ key, fetcher, ttl }) => {
      const cached = this.get<T>(key);
      if (cached === null) {
        try {
          const data = await fetcher();
          this.set(key, data, ttl);
        } catch (error) {
          console.warn(`Cache preload failed for key ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    const localStorageSize = this.getLocalStorageSize();

    return {
      memoryItems: memorySize,
      localStorageItems: localStorageSize,
      config: this.config,
    };
  }

  /**
   * Get or set with async function - cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache and refresh with new data
   */
  async refresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    this.delete(key);
    return this.getOrSet(key, fetcher, ttl);
  }

  // Private methods

  private getFromLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const item = localStorage.getItem(this.config.storagePrefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  private setInLocalStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(
        this.config.storagePrefix + key,
        JSON.stringify(item)
      );
    } catch (error) {
      // Handle localStorage quota exceeded
      console.warn('Cache: localStorage quota exceeded', error);
    }
  }

  private loadFromLocalStorage(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          const cacheKey = key.replace(this.config.storagePrefix, '');
          const item = this.getFromLocalStorage(cacheKey);

          if (item && this.isValid(item)) {
            this.memoryCache.set(cacheKey, item);
          } else if (item) {
            // Remove expired items from localStorage
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Cache: Error loading from localStorage', error);
    }
  }

  private getLocalStorageSize(): number {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.storagePrefix)) {
        count++;
      }
    }
    return count;
  }

  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.config.maxMemoryItems) return;

    // Remove oldest items
    const entries = Array.from(this.memoryCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    const itemsToRemove = this.memoryCache.size - this.config.maxMemoryItems;
    for (let i = 0; i < itemsToRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        for (const [key, item] of this.memoryCache.entries()) {
          if (!this.isValid(item)) {
            this.memoryCache.delete(key);
          }
        }
      },
      5 * 60 * 1000
    );
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.memoryCache.clear();
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  CATEGORIES: 'categories',
  PRODUCT_RATINGS: 'product_ratings',
  FEATURED_PRODUCTS: 'featured_products',
  APP_CONFIG: 'app_config',
  PRODUCT_STORY: (id: string) => `product_story:${id}`,
  USER_PROFILE: (id: string) => `user_profile:${id}`,
  PRODUCT_DETAIL: (id: string) => `product_detail:${id}`,
  PRODUCT_AVERAGE_RATING: (id: string) => `product_avg_rating:${id}`,
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes
  MEDIUM: 10 * 60 * 1000, // 10 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Global cache instance
export const cache = new CacheManager({
  defaultTtl: CACHE_TTL.MEDIUM,
  maxMemoryItems: 200,
  enableLocalStorage: true,
  storagePrefix: 'tesoros_choco_',
  version: '1.0.0',
});

// Expose cache manager globally for theme and other components
if (typeof window !== 'undefined') {
  (window as any).__CACHE_MANAGER__ = cache;
}

// Utility functions for common cache operations
export const cacheUtils = {
  /**
   * Clear all product-related cache when products are updated
   */
  invalidateProductCache(): void {
    cache.delete(CACHE_KEYS.FEATURED_PRODUCTS);
    cache.delete(CACHE_KEYS.PRODUCT_RATINGS);
    cache.delete(CACHE_KEYS.CATEGORIES);
  },

  /**
   * Clear cache for a specific product
   */
  invalidateProductCacheById(productId: string): void {
    cache.delete(CACHE_KEYS.PRODUCT_DETAIL(productId));
    cache.delete(CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId));
    cache.delete(CACHE_KEYS.PRODUCT_STORY(productId));
  },

  /**
   * Clear all product detail caches
   */
  invalidateAllProductDetails(): void {
    cache.deletePattern('^product_detail:');
    cache.deletePattern('^product_avg_rating:');
    cache.deletePattern('^product_story:');
  },

  /**
   * Batch preload essential data for better performance
   */
  async preloadEssentials(): Promise<void> {
    const preloadItems = [
      {
        key: CACHE_KEYS.CATEGORIES,
        fetcher: async () => {
          // This will be replaced with actual Supabase call in useCache hook
          return [];
        },
        ttl: CACHE_TTL.LONG,
      },
      {
        key: CACHE_KEYS.FEATURED_PRODUCTS,
        fetcher: async () => {
          // This will be replaced with actual Supabase call in useCache hook
          return [];
        },
        ttl: CACHE_TTL.MEDIUM,
      },
    ];

    await cache.preload(preloadItems);
  },

  /**
   * Smart cache warming based on user behavior
   */
  async warmRelatedCache(productId: string): Promise<void> {
    // Preload related product data when user views a product
    const warmingItems = [
      {
        key: CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId),
        fetcher: async () => {
          // This will be implemented in the component
          return 0;
        },
        ttl: CACHE_TTL.MEDIUM,
      },
    ];

    await cache.preload(warmingItems);
  },

  /**
   * Clear user-specific cache
   */
  invalidateUserCache(userId?: string): void {
    if (userId) {
      cache.delete(CACHE_KEYS.USER_PROFILE(userId));
    } else {
      cache.deletePattern('^user_profile:');
    }
  },

  /**
   * Clear configuration cache
   */
  invalidateConfigCache(): void {
    cache.deletePattern('^app_config');
  },

  /**
   * Get cache size and statistics
   */
  getStats() {
    return cache.getStats();
  },

  /**
   * Clear all cache (useful for development)
   */
  clearAll(): void {
    cache.clear();
  },
};

export default cache;
