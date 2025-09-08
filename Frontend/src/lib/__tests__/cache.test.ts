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
  beforeEach(() => {
    cache.clear();
    localStorageMock.store = {};
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get values', () => {
    cache.set('test', 'value');
    expect(cache.get('test')).toBe('value');
  });

  it('should handle TTL expiration', async () => {
    cache.set('expire', 'value', 10); // 10ms TTL
    expect(cache.get('expire')).toBe('value');
    
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(cache.get('expire')).toBeNull();
  });

  it('should clear all cache', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});