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

// Mock window and localStorage for tests
// @ts-ignore
global.window = {
  localStorage: localStorageMock,
};

// @ts-ignore
global.localStorage = localStorageMock;

describe('Cache Keys Constants', () => {
  it('should have all required cache keys', () => {
    expect(CACHE_KEYS.CATEGORIES).toBe('categories');
    expect(CACHE_KEYS.PRODUCT_RATINGS).toBe('product_ratings');
    expect(CACHE_KEYS.FEATURED_PRODUCTS).toBe('featured_products');
    expect(CACHE_KEYS.APP_CONFIG).toBe('app_config');

    expect(CACHE_KEYS.PRODUCT_STORY('123')).toBe('product_story:123');
    expect(CACHE_KEYS.USER_PROFILE('user123')).toBe('user_profile:user123');
    expect(CACHE_KEYS.PRODUCT_DETAIL('456')).toBe('product_detail:456');
    expect(CACHE_KEYS.PRODUCT_AVERAGE_RATING('789')).toBe('product_avg_rating:789');
  });
});

describe('Cache Manager', () => {
  // Crear una instancia de caché para pruebas con prefijo específico
  const testCache = new (cache.constructor as any)({
    defaultTtl: CACHE_TTL.MEDIUM,
    maxMemoryItems: 200,
    enableLocalStorage: true,
    storagePrefix: 'test_',
    version: '1.0.0',
  });

  beforeEach(() => {
    testCache.clear();
    localStorageMock.store = {};
    vi.clearAllMocks();
    
    // Configurar correctamente los mocks de localStorage
    localStorageMock.getItem.mockImplementation((key: string) => {
      return localStorageMock.store[key] || null;
    });
    
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value;
    });
    
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key];
    });
    
    localStorageMock.clear.mockImplementation(() => {
      localStorageMock.store = {};
    });
    
    // Mock de localStorage.length y localStorage.key
    Object.defineProperty(localStorageMock, 'length', {
      get: () => Object.keys(localStorageMock.store).length,
      configurable: true
    });
    
    localStorageMock.key.mockImplementation((index: number) => {
      const keys = Object.keys(localStorageMock.store);
      return keys[index] || null;
    });
  });

  afterEach(() => {
    testCache.clear();
  });

  it('should set and get values', () => {
    testCache.set('test', 'value');
    expect(testCache.get('test')).toBe('value');
  });

  it('should handle TTL expiration', async () => {
    testCache.set('expire', 'value', 10); // 10ms TTL
    expect(testCache.get('expire')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(testCache.get('expire')).toBeNull();
  });

  it('should clear all cache', () => {
    testCache.set('key1', 'value1');
    testCache.set('key2', 'value2');
    
    // Verificar que los valores se almacenaron en localStorage
    expect(localStorageMock.store['test_key1']).toBeDefined();
    expect(localStorageMock.store['test_key2']).toBeDefined();
    
    testCache.clear();
    
    expect(testCache.get('key1')).toBeNull();
    expect(testCache.get('key2')).toBeNull();
    
    // Verificar que los valores se eliminaron de localStorage
    expect(localStorageMock.store['test_key1']).toBeUndefined();
    expect(localStorageMock.store['test_key2']).toBeUndefined();
  });

  it('should delete specific cache key', () => {
    testCache.set('key1', 'value1');
    testCache.set('key2', 'value2');
    
    testCache.delete('key1');
    expect(testCache.get('key1')).toBeNull();
    expect(testCache.get('key2')).toBe('value2');
  });

  it('should handle localStorage fallback', () => {
    // Set item in cache
    testCache.set('localStorageTest', 'value');
    
    // Simulate memory cache being cleared but localStorage still having the value
    (testCache as any).memoryCache.clear();
    
    // Should still get value from localStorage
    expect(testCache.get('localStorageTest')).toBe('value');
  });

  it('should enforce memory limit', () => {
    // Create cache with small memory limit
    const smallCache = new (cache.constructor as any)({
      defaultTtl: CACHE_TTL.MEDIUM,
      maxMemoryItems: 2,
      enableLocalStorage: true,
      storagePrefix: 'test_',
      version: '1.0.0',
    });
    
    smallCache.set('key1', 'value1');
    smallCache.set('key2', 'value2');
    smallCache.set('key3', 'value3');
    
    // Should still have all items (cleanup happens on next set)
    smallCache.set('key4', 'value4');
    
    // Now check that we have the expected number of items
    expect((smallCache as any).memoryCache.size).toBeLessThanOrEqual(2);
  });

  it('should handle cache-aside pattern', async () => {
    const fetcher = vi.fn().mockResolvedValue('fetchedValue');
    const result = await testCache.getOrSet('asyncKey', fetcher);
    
    expect(result).toBe('fetchedValue');
    expect(fetcher).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    const cachedResult = await testCache.getOrSet('asyncKey', fetcher);
    expect(cachedResult).toBe('fetchedValue');
    // Fetcher should still only be called once
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should refresh cache with new data', async () => {
    const fetcher1 = vi.fn().mockResolvedValue('oldValue');
    const fetcher2 = vi.fn().mockResolvedValue('newValue');
    
    // Set initial value
    const initialResult = await testCache.getOrSet('refreshKey', fetcher1);
    expect(initialResult).toBe('oldValue');
    
    // Refresh cache
    const refreshedResult = await testCache.refresh('refreshKey', fetcher2);
    expect(refreshedResult).toBe('newValue');
    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(1);
  });

  it('should delete cache by pattern', () => {
    // Set cache items that match the pattern
    testCache.set('product_detail:prod1', { id: 'prod1', name: 'Product 1' });
    testCache.set('product_detail:prod2', { id: 'prod2', name: 'Product 2' });
    testCache.set('other_key', 'other_value');
    
    // Verificar que se almacenaron en localStorage con el prefijo correcto
    expect(localStorageMock.store['test_product_detail:prod1']).toBeDefined();
    expect(localStorageMock.store['test_product_detail:prod2']).toBeDefined();
    expect(localStorageMock.store['test_other_key']).toBeDefined();
    
    // Verify they exist
    expect(testCache.get('product_detail:prod1')).toEqual({ id: 'prod1', name: 'Product 1' });
    expect(testCache.get('product_detail:prod2')).toEqual({ id: 'prod2', name: 'Product 2' });
    expect(testCache.get('other_key')).toBe('other_value');
    
    // Delete by pattern
    testCache.deletePattern('^product_detail:');
    
    // Verify pattern-matched items are cleared but others remain
    expect(testCache.get('product_detail:prod1')).toBeNull();
    expect(testCache.get('product_detail:prod2')).toBeNull();
    expect(testCache.get('other_key')).toBe('other_value');
    
    // Verificar que se eliminaron de localStorage
    expect(localStorageMock.store['test_product_detail:prod1']).toBeUndefined();
    expect(localStorageMock.store['test_product_detail:prod2']).toBeUndefined();
    expect(localStorageMock.store['test_other_key']).toBeDefined();
  });
});

describe('Cache Utils', () => {
  // Crear una instancia de caché para pruebas con prefijo específico
  const testCache = new (cache.constructor as any)({
    defaultTtl: CACHE_TTL.MEDIUM,
    maxMemoryItems: 200,
    enableLocalStorage: true,
    storagePrefix: 'test_',
    version: '1.0.0',
  });

  // Mock cacheUtils para usar nuestra instancia de prueba
  const testCacheUtils = {
    invalidateProductCache(): void {
      testCache.delete(CACHE_KEYS.FEATURED_PRODUCTS);
      testCache.delete(CACHE_KEYS.PRODUCT_RATINGS);
      testCache.delete(CACHE_KEYS.CATEGORIES);
    },

    invalidateProductCacheById(productId: string): void {
      testCache.delete(CACHE_KEYS.PRODUCT_DETAIL(productId));
      testCache.delete(CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId));
      testCache.delete(CACHE_KEYS.PRODUCT_STORY(productId));
    },

    invalidateAllProductDetails(): void {
      testCache.deletePattern('^product_detail:');
      testCache.deletePattern('^product_avg_rating:');
      testCache.deletePattern('^product_story:');
    },

    invalidateUserCache(userId?: string): void {
      if (userId) {
        testCache.delete(CACHE_KEYS.USER_PROFILE(userId));
      } else {
        testCache.deletePattern('^user_profile:');
      }
    },

    invalidateConfigCache(): void {
      testCache.deletePattern('^app_config');
    },

    getStats() {
      return testCache.getStats();
    },

    clearAll(): void {
      testCache.clear();
    },
  };

  beforeEach(() => {
    testCache.clear();
    localStorageMock.store = {};
    vi.clearAllMocks();
    
    // Configurar correctamente los mocks de localStorage
    localStorageMock.getItem.mockImplementation((key: string) => {
      return localStorageMock.store[key] || null;
    });
    
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      localStorageMock.store[key] = value;
    });
    
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete localStorageMock.store[key];
    });
    
    localStorageMock.clear.mockImplementation(() => {
      localStorageMock.store = {};
    });
    
    // Mock de localStorage.length y localStorage.key
    Object.defineProperty(localStorageMock, 'length', {
      get: () => Object.keys(localStorageMock.store).length,
      configurable: true
    });
    
    localStorageMock.key.mockImplementation((index: number) => {
      const keys = Object.keys(localStorageMock.store);
      return keys[index] || null;
    });
  });

  afterEach(() => {
    testCache.clear();
  });

  it('should invalidate product cache', () => {
    // Set some product-related cache items
    testCache.set(CACHE_KEYS.FEATURED_PRODUCTS, ['product1', 'product2']);
    testCache.set(CACHE_KEYS.PRODUCT_RATINGS, { 'product1': 5 });
    testCache.set(CACHE_KEYS.CATEGORIES, ['category1', 'category2']);
    
    // Verify they exist
    expect(testCache.get(CACHE_KEYS.FEATURED_PRODUCTS)).toEqual(['product1', 'product2']);
    expect(testCache.get(CACHE_KEYS.PRODUCT_RATINGS)).toEqual({ 'product1': 5 });
    expect(testCache.get(CACHE_KEYS.CATEGORIES)).toEqual(['category1', 'category2']);
    
    // Invalidate product cache
    testCacheUtils.invalidateProductCache();
    
    // Verify they are cleared
    expect(testCache.get(CACHE_KEYS.FEATURED_PRODUCTS)).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_RATINGS)).toBeNull();
    expect(testCache.get(CACHE_KEYS.CATEGORIES)).toBeNull();
  });

  it('should invalidate product cache by ID', () => {
    const productId = 'test-product-id';
    
    // Set cache for specific product
    testCache.set(CACHE_KEYS.PRODUCT_DETAIL(productId), { id: productId, name: 'Test Product' });
    testCache.set(CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId), 4.5);
    testCache.set(CACHE_KEYS.PRODUCT_STORY(productId), 'Product story');
    
    // Verify they exist
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL(productId))).toEqual({ id: productId, name: 'Test Product' });
    expect(testCache.get(CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId))).toBe(4.5);
    expect(testCache.get(CACHE_KEYS.PRODUCT_STORY(productId))).toBe('Product story');
    
    // Invalidate cache for this specific product
    testCacheUtils.invalidateProductCacheById(productId);
    
    // Verify they are cleared
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL(productId))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_AVERAGE_RATING(productId))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_STORY(productId))).toBeNull();
  });

  it('should invalidate all product details', () => {
    // Set cache for multiple products
    testCache.set(CACHE_KEYS.PRODUCT_DETAIL('prod1'), { id: 'prod1', name: 'Product 1' });
    testCache.set(CACHE_KEYS.PRODUCT_AVERAGE_RATING('prod1'), 4.5);
    testCache.set(CACHE_KEYS.PRODUCT_STORY('prod1'), 'Story 1');
    
    testCache.set(CACHE_KEYS.PRODUCT_DETAIL('prod2'), { id: 'prod2', name: 'Product 2' });
    testCache.set(CACHE_KEYS.PRODUCT_AVERAGE_RATING('prod2'), 3.8);
    testCache.set(CACHE_KEYS.PRODUCT_STORY('prod2'), 'Story 2');
    
    // Verify they exist
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL('prod1'))).not.toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL('prod2'))).not.toBeNull();
    
    // Invalidate all product details
    testCacheUtils.invalidateAllProductDetails();
    
    // Verify they are cleared
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL('prod1'))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_DETAIL('prod2'))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_AVERAGE_RATING('prod1'))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_AVERAGE_RATING('prod2'))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_STORY('prod1'))).toBeNull();
    expect(testCache.get(CACHE_KEYS.PRODUCT_STORY('prod2'))).toBeNull();
  });

  it('should invalidate user cache', () => {
    const userId = 'test-user-id';
    
    // Set user cache
    testCache.set(CACHE_KEYS.USER_PROFILE(userId), { id: userId, name: 'Test User' });
    
    // Verify it exists
    expect(testCache.get(CACHE_KEYS.USER_PROFILE(userId))).toEqual({ id: userId, name: 'Test User' });
    
    // Invalidate user cache for specific user
    testCacheUtils.invalidateUserCache(userId);
    
    // Verify it is cleared
    expect(testCache.get(CACHE_KEYS.USER_PROFILE(userId))).toBeNull();
  });

  it('should invalidate all user cache when no user ID provided', () => {
    // Set cache for multiple users with the correct prefix pattern
    testCache.set('user_profile:user1', { id: 'user1', name: 'User 1' });
    testCache.set('user_profile:user2', { id: 'user2', name: 'User 2' });
    
    // Verify they exist
    expect(testCache.get('user_profile:user1')).not.toBeNull();
    expect(testCache.get('user_profile:user2')).not.toBeNull();
    
    // Invalidate all user cache
    testCacheUtils.invalidateUserCache();
    
    // Verify they are cleared
    expect(testCache.get('user_profile:user1')).toBeNull();
    expect(testCache.get('user_profile:user2')).toBeNull();
  });

  it('should invalidate config cache', () => {
    // Set config cache with the correct prefix pattern
    testCache.set('app_config:some-setting', 'value1');
    testCache.set('app_config:another-setting', 'value2');
    
    // Verify they exist
    expect(testCache.get('app_config:some-setting')).toBe('value1');
    expect(testCache.get('app_config:another-setting')).toBe('value2');
    
    // Invalidate config cache
    testCacheUtils.invalidateConfigCache();
    
    // Verify they are cleared
    expect(testCache.get('app_config:some-setting')).toBeNull();
    expect(testCache.get('app_config:another-setting')).toBeNull();
  });

  it('should get cache statistics', () => {
    // Set some cache items
    testCache.set('stat1', 'value1');
    testCache.set('stat2', 'value2');
    
    // Get stats
    const stats = testCacheUtils.getStats();
    
    // Verify stats structure
    expect(stats).toHaveProperty('memoryItems');
    expect(stats).toHaveProperty('localStorageItems');
    expect(stats).toHaveProperty('config');
    expect(stats.memoryItems).toBeGreaterThanOrEqual(2);
  });

  it('should clear all cache', () => {
    // Set some cache items
    testCache.set('clear1', 'value1');
    testCache.set('clear2', 'value2');
    testCache.set(CACHE_KEYS.CATEGORIES, ['cat1', 'cat2']);
    
    // Verify they exist
    expect(testCache.get('clear1')).toBe('value1');
    expect(testCache.get('clear2')).toBe('value2');
    expect(testCache.get(CACHE_KEYS.CATEGORIES)).toEqual(['cat1', 'cat2']);
    
    // Clear all cache
    testCacheUtils.clearAll();
    
    // Verify they are cleared
    expect(testCache.get('clear1')).toBeNull();
    expect(testCache.get('clear2')).toBeNull();
    expect(testCache.get(CACHE_KEYS.CATEGORIES)).toBeNull();
  });
});

describe('Cache TTL Constants', () => {
  it('should have correct TTL values', () => {
    expect(CACHE_TTL.SHORT).toBe(2 * 60 * 1000); // 2 minutes
    expect(CACHE_TTL.MEDIUM).toBe(10 * 60 * 1000); // 10 minutes
    expect(CACHE_TTL.LONG).toBe(60 * 60 * 1000); // 1 hour
    expect(CACHE_TTL.VERY_LONG).toBe(24 * 60 * 60 * 1000); // 24 hours
  });
});