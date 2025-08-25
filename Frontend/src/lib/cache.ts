/**
 * Comprehensive caching system for static and semi-static data
 * Implements in-memory cache with TTL, localStorage fallback, and cache invalidation
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
  appVersion: string; // Add app version tracking
}

interface CacheConfig {
  defaultTtl: number;
  maxMemoryItems: number;
  enableLocalStorage: boolean;
  storagePrefix: string;
  version: string;
  appVersion: string; // Add app version
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
      storagePrefix: 'tesoros_choco_',
      version: '1.0.0',
      appVersion: this.getAppVersion(), // Get current app version
      ...config,
    };

    this.startCleanupInterval();
    this.loadFromLocalStorage();
    this.validateAppVersion(); // Validate and clean old versions
  }

  /**
   * Get current app version from package.json or use timestamp
   */
  private getAppVersion(): string {
    try {
      // Try to get version from package.json
      if (typeof window !== 'undefined' && (window as any).__APP_VERSION__) {
        return (window as any).__APP_VERSION__;
      }
      // Fallback to timestamp-based version
      return `v${Date.now()}`;
    } catch {
      return `v${Date.now()}`;
    }
  }

  /**
   * Validate app version and clean old cache entries
   */
  private validateAppVersion(): void {
    if (this.config.enableLocalStorage) {
      try {
        const versionKey = `${this.config.storagePrefix}app_version`;
        const storedVersion = localStorage.getItem(versionKey);
        
        if (storedVersion !== this.config.appVersion) {
          console.log(`[Cache] App version changed: ${storedVersion} → ${this.config.appVersion}`);
          this.clear(); // Clear all cache on version change
          localStorage.setItem(versionKey, this.config.appVersion);
        }
      } catch (error) {
        console.warn('[Cache] Error validating app version:', error);
      }
    }
  }

  /**
   * Get item from cache with automatic fallback and validation
   */
  get<T>(key: string): T | null {
    try {
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
    } catch (error) {
      console.warn(`[Cache] Error getting item ${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTtl,
        version: this.config.version,
        appVersion: this.config.appVersion,
      };

      // Store in memory
      this.memoryCache.set(key, cacheItem);

      // Store in localStorage if enabled
      if (this.config.enableLocalStorage) {
        this.setInLocalStorage(key, cacheItem);
      }

      // Cleanup if memory cache is too large
      this.enforceMemoryLimit();
    } catch (error) {
      console.warn(`[Cache] Error setting item ${key}:`, error);
    }
  }

  /**
   * Check if cache item is valid (not expired and correct version)
   */
  private isValid<T>(item: CacheItem<T>): boolean {
    try {
      const isNotExpired = Date.now() - item.timestamp < item.ttl;
      const isCorrectVersion = item.version === this.config.version;
      const isCorrectAppVersion = item.appVersion === this.config.appVersion;
      return isNotExpired && isCorrectVersion && isCorrectAppVersion;
    } catch {
      return false;
    }
  }

  /**
   * Clear specific cache key
   */
  delete(key: string): void {
    try {
      this.memoryCache.delete(key);
      if (this.config.enableLocalStorage) {
        localStorage.removeItem(this.config.storagePrefix + key);
      }
    } catch (error) {
      console.warn(`[Cache] Error deleting key ${key}:`, error);
    }
  }

  /**
   * Clear cache by pattern
   */
  deletePattern(pattern: string): void {
    try {
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
    } catch (error) {
      console.warn(`[Cache] Error deleting pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    try {
      this.memoryCache.clear();
      if (this.config.enableLocalStorage) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.config.storagePrefix)) {
            localStorage.removeItem(key);
          }
        }
      }
      console.log('[Cache] All cache cleared');
    } catch (error) {
      console.warn('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const memorySize = this.memoryCache.size;
      const localStorageSize = this.getLocalStorageSize();

      return {
        memoryItems: memorySize,
        localStorageItems: localStorageSize,
        config: this.config,
      };
    } catch (error) {
      console.warn('[Cache] Error getting stats:', error);
      return { memoryItems: 0, localStorageItems: 0, config: this.config };
    }
  }

  /**
   * Get or set with async function - cache-aside pattern
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const data = await fetcher();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.warn(`[Cache] Error in getOrSet for ${key}:`, error);
      // Try to fetch without caching on error
      return await fetcher();
    }
  }

  /**
   * Invalidate cache and refresh with new data
   */
  async refresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    try {
      this.delete(key);
      return this.getOrSet(key, fetcher, ttl);
    } catch (error) {
      console.warn(`[Cache] Error in refresh for ${key}:`, error);
      return await fetcher();
    }
  }

  // Private methods

  private getFromLocalStorage<T>(key: string): CacheItem<T> | null {
    try {
      const item = localStorage.getItem(this.config.storagePrefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`[Cache] Error reading from localStorage for ${key}:`, error);
      // Remove corrupted item
      try {
        localStorage.removeItem(this.config.storagePrefix + key);
      } catch {}
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
      console.warn('[Cache] localStorage quota exceeded, clearing old items:', error);
      this.handleStorageQuotaExceeded();
    }
  }

  /**
   * Handle localStorage quota exceeded by removing old items
   */
  private handleStorageQuotaExceeded(): void {
    try {
      const items = Array.from(this.memoryCache.entries())
        .map(([key, item]) => ({ key, timestamp: item.timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 20% of items
      const itemsToRemove = Math.ceil(items.length * 0.2);
      for (let i = 0; i < itemsToRemove; i++) {
        this.delete(items[i].key);
      }
    } catch (error) {
      console.warn('[Cache] Error handling storage quota:', error);
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
      console.warn('[Cache] Error loading from localStorage:', error);
    }
  }

  private getLocalStorageSize(): number {
    try {
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.storagePrefix)) {
          count++;
        }
      }
      return count;
    } catch {
      return 0;
    }
  }

  private enforceMemoryLimit(): void {
    if (this.memoryCache.size <= this.config.maxMemoryItems) return;

    try {
      // Remove oldest items
      const entries = Array.from(this.memoryCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const itemsToRemove = this.memoryCache.size - this.config.maxMemoryItems;
      for (let i = 0; i < itemsToRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    } catch (error) {
      console.warn('[Cache] Error enforcing memory limit:', error);
    }
  }

  private startCleanupInterval(): void {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        try {
          for (const [key, item] of this.memoryCache.entries()) {
            if (!this.isValid(item)) {
              this.memoryCache.delete(key);
            }
          }
        } catch (error) {
          console.warn('[Cache] Error in cleanup interval:', error);
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

  /**
   * Force cache invalidation for development
   */
  forceInvalidate(): void {
    console.log('[Cache] Force invalidating all cache...');
    cache.clear();
    
    // Also clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.startsWith('tesoros-choco-')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  },
};

export default cache;
