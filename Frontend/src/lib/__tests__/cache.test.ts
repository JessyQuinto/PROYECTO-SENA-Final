import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cache, CACHE_KEYS, CACHE_TTL, cacheUtils } from '../cache';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  get length() {
    return Object.keys(this.store).length;
  },
  key: vi.fn(),
  store: {} as Record<string, string>,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Cache System', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.store = {};
    localStorageMock.getItem.mockImplementation((key: string) => 
      localStorageMock.store[key] || null
    );
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      localStorageMock.store = {};
    });
    localStorageMock.key.mockImplementation((index: number) => {
      const keys = Object.keys(localStorageMock.store);
      return keys[index] || null;
    });

    // Clear the cache before each test
    cache.clear();
    
    // Reset time to prevent TTL issues
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'Test' };
      cache.set('test-key', testData);
      
      const retrieved = cache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete specific keys', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');
      
      cache.delete('test-key');
      expect(cache.get('test-key')).toBeNull();
    });

    it('should clear all cache', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      cache.clear();
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect TTL and expire items', () => {
      const testData = 'test-value';
      const shortTTL = 1000; // 1 second
      
      cache.set('test-key', testData, shortTTL);
      expect(cache.get('test-key')).toBe(testData);
      
      // Advance time past TTL
      vi.advanceTimersByTime(shortTTL + 1);
      
      expect(cache.get('test-key')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      cache.set('test-key', 'test-value');
      
      // Should still be valid within default TTL
      vi.advanceTimersByTime(CACHE_TTL.MEDIUM - 1000);
      expect(cache.get('test-key')).toBe('test-value');
      
      // Should expire after default TTL
      vi.advanceTimersByTime(2000);
      expect(cache.get('test-key')).toBeNull();
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete items matching pattern', () => {
      cache.set('products_1', 'product1');
      cache.set('products_2', 'product2');
      cache.set('categories_1', 'category1');
      cache.set('users_1', 'user1');
      
      cache.deletePattern('^products_');
      
      expect(cache.get('products_1')).toBeNull();
      expect(cache.get('products_2')).toBeNull();
      expect(cache.get('categories_1')).toBe('category1');
      expect(cache.get('users_1')).toBe('user1');
    });
  });

  describe('getOrSet Method', () => {
    it('should fetch and cache data when not in cache', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fetched-data');
      
      const result = await cache.getOrSet('test-key', mockFetcher);
      
      expect(result).toBe('fetched-data');
      expect(mockFetcher).toHaveBeenCalledOnce();
      expect(cache.get('test-key')).toBe('fetched-data');
    });

    it('should return cached data without calling fetcher', async () => {
      const mockFetcher = vi.fn().mockResolvedValue('fetched-data');
      
      cache.set('test-key', 'cached-data');
      const result = await cache.getOrSet('test-key', mockFetcher);
      
      expect(result).toBe('cached-data');
      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Method', () => {
    it('should invalidate cache and fetch new data', async () => {
      const mockFetcher = vi.fn()
        .mockResolvedValueOnce('old-data')
        .mockResolvedValueOnce('new-data');
      
      // Initial fetch
      await cache.getOrSet('test-key', mockFetcher);
      expect(cache.get('test-key')).toBe('old-data');
      
      // Refresh
      const result = await cache.refresh('test-key', mockFetcher);
      
      expect(result).toBe('new-data');
      expect(cache.get('test-key')).toBe('new-data');
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      
      expect(stats.memoryItems).toBe(2);
      expect(stats.config).toBeDefined();
    });
  });

  describe('Cache Utilities', () => {
    it('should invalidate product cache', () => {
      cache.set(CACHE_KEYS.FEATURED_PRODUCTS, 'products');
      cache.set(CACHE_KEYS.PRODUCT_RATINGS, 'ratings');
      cache.set(CACHE_KEYS.CATEGORIES, 'categories');
      cache.set('other_key', 'other');
      
      cacheUtils.invalidateProductCache();
      
      expect(cache.get(CACHE_KEYS.FEATURED_PRODUCTS)).toBeNull();
      expect(cache.get(CACHE_KEYS.PRODUCT_RATINGS)).toBeNull();
      expect(cache.get(CACHE_KEYS.CATEGORIES)).toBeNull();
      expect(cache.get('other_key')).toBe('other');
    });

    it('should invalidate user cache', () => {
      const userId = 'user123';
      cache.set(CACHE_KEYS.USER_PROFILE(userId), 'profile');
      cache.set(CACHE_KEYS.USER_PROFILE('other'), 'other-profile');
      
      cacheUtils.invalidateUserCache(userId);
      
      expect(cache.get(CACHE_KEYS.USER_PROFILE(userId))).toBeNull();
      expect(cache.get(CACHE_KEYS.USER_PROFILE('other'))).toBe('other-profile');
    });
  });

  describe('Memory Management', () => {
    it('should enforce memory limit', () => {
      // Create a cache with small memory limit for testing
      const testCache = new (cache.constructor as any)({
        maxMemoryItems: 2,
        enableLocalStorage: false,
      });
      
      testCache.set('key1', 'value1');
      testCache.set('key2', 'value2');
      testCache.set('key3', 'value3'); // Should evict oldest item
      
      // key1 should be evicted, key2 and key3 should remain
      expect(testCache.get('key1')).toBeNull();
      expect(testCache.get('key2')).toBe('value2');
      expect(testCache.get('key3')).toBe('value3');
    });
  });

  describe('Version Management', () => {
    it('should invalidate items with different versions', () => {
      // Simulate storing item with old version
      const oldCacheItem = {
        data: 'old-data',
        timestamp: Date.now(),
        ttl: CACHE_TTL.LONG,
        version: '0.9.0'
      };
      
      localStorageMock.store['tesoros_choco_test-key'] = JSON.stringify(oldCacheItem);
      
      // Should return null due to version mismatch
      expect(cache.get('test-key')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      
      // Should not throw error
      expect(() => {
        cache.set('test-key', 'test-value');
      }).not.toThrow();
    });

    it('should handle JSON parse errors gracefully', () => {
      localStorageMock.store['tesoros_choco_test-key'] = 'invalid-json';
      
      // Should return null instead of throwing
      expect(cache.get('test-key')).toBeNull();
    });
  });
});

describe('Cache Keys Constants', () => {
  it('should have all required cache keys', () => {
    expect(CACHE_KEYS.CATEGORIES).toBe('categories');
    expect(CACHE_KEYS.PRODUCT_RATINGS).toBe('product_ratings');
    expect(CACHE_KEYS.FEATURED_PRODUCTS).toBe('featured_products');
    expect(CACHE_KEYS.APP_CONFIG).toBe('app_config');
    
    expect(CACHE_KEYS.PRODUCT_STORY('123')).toBe('product_story:123');
    expect(CACHE_KEYS.USER_PROFILE('user123')).toBe('user_profile:user123');
  });
});

describe('Cache TTL Constants', () => {
  it('should have proper TTL values', () => {
    expect(CACHE_TTL.SHORT).toBe(2 * 60 * 1000); // 2 minutes
    expect(CACHE_TTL.MEDIUM).toBe(10 * 60 * 1000); // 10 minutes
    expect(CACHE_TTL.LONG).toBe(60 * 60 * 1000); // 1 hour
    expect(CACHE_TTL.VERY_LONG).toBe(24 * 60 * 60 * 1000); // 24 hours
  });
});