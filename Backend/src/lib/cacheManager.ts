// Enhanced caching layer for backend
// File: Backend/src/lib/cacheManager.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsage: number;
}

class EnhancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = { hits: 0, misses: 0, entries: 0, memoryUsage: 0 };
  private cleanupInterval: NodeJS.Timeout;
  private maxEntries: number;
  private defaultTtl: number;

  constructor(options: {
    maxEntries?: number;
    defaultTtl?: number;
    cleanupInterval?: number;
  } = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.defaultTtl = options.defaultTtl || 300; // 5 minutes
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupInterval || 60000);
  }

  // Get data from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update hit counter and stats
    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  // Set data in cache
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTtl = ttl || this.defaultTtl;

    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTtl,
      hits: 0,
    });

    this.updateStats();
  }

  // Get or set pattern (cache-aside)
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

  // Delete specific key
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats.entries = 0;
    this.stats.memoryUsage = 0;
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      this.updateStats();
      console.log(`[Cache] Cleaned up ${deleted} expired entries`);
    }
  }

  // Evict least recently used entries
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize by hits, then by age
      if (entry.hits < leastHits || 
          (entry.hits === leastHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        leastHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.updateStats();
    }
  }

  // Update cache statistics
  private updateStats(): void {
    this.stats.entries = this.cache.size;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // String character size
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 64; // Overhead for entry object
    }
    this.stats.memoryUsage = memoryUsage;
  }

  // Destroy cache manager
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Database connection pooling for Supabase
class SupabaseConnectionPool {
  private pool: SupabaseClient[] = [];
  private activeConnections = 0;
  private readonly maxConnections: number;
  private readonly minConnections: number;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor(options: {
    maxConnections?: number;
    minConnections?: number;
    supabaseUrl: string;
    supabaseKey: string;
  }) {
    this.maxConnections = options.maxConnections || 10;
    this.minConnections = options.minConnections || 2;
    this.supabaseUrl = options.supabaseUrl;
    this.supabaseKey = options.supabaseKey;

    // Initialize minimum connections
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.minConnections; i++) {
      const client = createClient(this.supabaseUrl, this.supabaseKey, {
        db: {
          schema: 'public',
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: {
          enabled: false,
        },
      });
      this.pool.push(client);
    }
  }

  async getConnection(): Promise<SupabaseClient> {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++;
      return createClient(this.supabaseUrl, this.supabaseKey, {
        db: { schema: 'public' },
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { enabled: false },
      });
    }

    // Wait for a connection to become available
    return new Promise((resolve) => {
      const checkPool = () => {
        if (this.pool.length > 0) {
          resolve(this.pool.pop()!);
        } else {
          setTimeout(checkPool, 10);
        }
      };
      checkPool();
    });
  }

  releaseConnection(client: SupabaseClient): void {
    if (this.pool.length < this.maxConnections) {
      this.pool.push(client);
    } else {
      this.activeConnections--;
    }
  }

  async withConnection<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection();
    try {
      return await operation(client);
    } finally {
      this.releaseConnection(client);
    }
  }
}

// Cached data access layer
export class CachedDataAccess {
  private cache: EnhancedCacheManager;
  private connectionPool: SupabaseConnectionPool;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.cache = new EnhancedCacheManager({
      maxEntries: 2000,
      defaultTtl: 300, // 5 minutes
    });

    this.connectionPool = new SupabaseConnectionPool({
      maxConnections: 15,
      minConnections: 3,
      supabaseUrl,
      supabaseKey,
    });
  }

  // Cached categories
  async getCategories(): Promise<any[]> {
    return this.cache.getOrSet(
      'categories',
      async () => {
        return this.connectionPool.withConnection(async (client) => {
          const { data, error } = await client
            .from('categorias')
            .select('*')
            .order('nombre');
          
          if (error) throw error;
          return data || [];
        });
      },
      3600 // 1 hour cache
    );
  }

  // Cached products with filters
  async getProducts(filters: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.connectionPool.withConnection(async (client) => {
          let query = client
            .from('productos')
            .select(`
              id,
              nombre,
              precio,
              stock,
              imagen_url,
              created_at,
              categorias(nombre)
            `)
            .eq('estado', 'activo')
            .gt('stock', 0);

          if (filters.category) {
            query = query.eq('categoria_id', filters.category);
          }

          if (filters.search) {
            query = query.ilike('nombre', `%${filters.search}%`);
          }

          if (filters.limit) {
            const offset = filters.offset || 0;
            query = query.range(offset, offset + filters.limit - 1);
          }

          query = query.order('created_at', { ascending: false });

          const { data, error } = await query;
          
          if (error) throw error;
          return data || [];
        });
      },
      300 // 5 minutes cache
    );
  }

  // Cached product by ID
  async getProduct(productId: string): Promise<any | null> {
    return this.cache.getOrSet(
      `product:${productId}`,
      async () => {
        return this.connectionPool.withConnection(async (client) => {
          const { data, error } = await client
            .from('productos')
            .select(`
              id,
              nombre,
              descripcion,
              precio,
              stock,
              imagen_url,
              estado,
              created_at,
              vendedor_id,
              categoria_id,
              categorias(nombre),
              users!productos_vendedor_id_fkey(nombre_completo, email)
            `)
            .eq('id', productId)
            .eq('estado', 'activo')
            .maybeSingle();

          if (error) throw error;
          return data;
        });
      },
      600 // 10 minutes cache
    );
  }

  // Batch operation for multiple products
  async getProductsByIds(productIds: string[]): Promise<any[]> {
    const cacheKey = `products:batch:${productIds.sort().join(',')}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.connectionPool.withConnection(async (client) => {
          const { data, error } = await client
            .from('productos')
            .select('*')
            .in('id', productIds)
            .eq('estado', 'activo');

          if (error) throw error;
          return data || [];
        });
      },
      300
    );
  }

  // Cache invalidation methods
  invalidateProduct(productId: string): void {
    this.cache.delete(`product:${productId}`);
    // Also invalidate related caches
    this.invalidateProductsList();
  }

  invalidateProductsList(): void {
    // Clear all product list caches
    const stats = this.cache.getStats();
    const keys = Array.from((this.cache as any).cache.keys());
    keys.forEach(key => {
      if (key.startsWith('products:')) {
        this.cache.delete(key);
      }
    });
  }

  invalidateCategories(): void {
    this.cache.delete('categories');
  }

  // Get cache statistics
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  // Cleanup method
  destroy(): void {
    this.cache.destroy();
  }
}

// Export singleton instance
export const cacheManager = new EnhancedCacheManager();
export default cacheManager;