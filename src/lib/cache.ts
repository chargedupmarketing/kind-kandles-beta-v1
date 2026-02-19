/**
 * In-Memory Cache Module
 * Provides caching utilities for API responses and database queries
 * 
 * Note: For production at scale, consider using Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheOptions {
  ttlMs?: number;  // Time to live in milliseconds
  staleWhileRevalidate?: boolean;  // Return stale data while fetching fresh
}

// Default TTL values for different data types
export const CacheTTL = {
  SHORT: 30 * 1000,        // 30 seconds - for frequently changing data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes - for moderately changing data
  LONG: 30 * 60 * 1000,    // 30 minutes - for rarely changing data
  HOUR: 60 * 60 * 1000,    // 1 hour
  DAY: 24 * 60 * 60 * 1000 // 24 hours - for static data
};

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttlMs: number = CacheTTL.MEDIUM): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlMs,
      createdAt: now
    });
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let deleted = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttlMs = CacheTTL.MEDIUM, staleWhileRevalidate = false } = options;
    
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    // Check for stale data if staleWhileRevalidate is enabled
    const entry = this.cache.get(key);
    if (staleWhileRevalidate && entry) {
      // Return stale data immediately, refresh in background
      this.refreshInBackground(key, fetcher, ttlMs);
      return entry.data as T;
    }

    // Fetch fresh data
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * Refresh cache in background (non-blocking)
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data, ttlMs);
    } catch (error) {
      console.error(`Background cache refresh failed for key ${key}:`, error);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldest: { key: string; createdAt: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = { key, createdAt: entry.createdAt };
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove all expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }

  /**
   * Stop cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance for application-wide caching
export const appCache = new MemoryCache(1000);

// ============================================================================
// Cache Key Generators
// ============================================================================

export const CacheKeys = {
  // Products
  products: {
    all: () => 'products:all',
    byId: (id: string) => `products:${id}`,
    byCategory: (category: string) => `products:category:${category}`,
    featured: () => 'products:featured',
    search: (query: string) => `products:search:${query.toLowerCase()}`
  },
  
  // Orders
  orders: {
    all: () => 'orders:all',
    byId: (id: string) => `orders:${id}`,
    byCustomer: (customerId: string) => `orders:customer:${customerId}`,
    recent: () => 'orders:recent'
  },
  
  // Customers
  customers: {
    all: () => 'customers:all',
    byId: (id: string) => `customers:${id}`,
    byEmail: (email: string) => `customers:email:${email.toLowerCase()}`
  },
  
  // Settings
  settings: {
    all: () => 'settings:all',
    byKey: (key: string) => `settings:${key}`,
    shipping: () => 'settings:shipping',
    store: () => 'settings:store'
  },
  
  // Shipping
  shipping: {
    rates: (state: string, weight: number) => `shipping:rates:${state}:${weight}`,
    zones: () => 'shipping:zones'
  },
  
  // Analytics
  analytics: {
    dashboard: () => 'analytics:dashboard',
    sales: (period: string) => `analytics:sales:${period}`,
    visitors: (period: string) => `analytics:visitors:${period}`
  },
  
  // Blog
  blog: {
    all: () => 'blog:all',
    bySlug: (slug: string) => `blog:${slug}`,
    recent: () => 'blog:recent'
  },
  
  // Events
  events: {
    all: () => 'events:all',
    byId: (id: string) => `events:${id}`,
    upcoming: () => 'events:upcoming'
  }
};

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

export const CacheInvalidation = {
  // Invalidate all product-related caches
  products: () => {
    appCache.deletePattern('^products:');
  },
  
  // Invalidate all order-related caches
  orders: () => {
    appCache.deletePattern('^orders:');
  },
  
  // Invalidate all customer-related caches
  customers: () => {
    appCache.deletePattern('^customers:');
  },
  
  // Invalidate all settings caches
  settings: () => {
    appCache.deletePattern('^settings:');
  },
  
  // Invalidate all shipping caches
  shipping: () => {
    appCache.deletePattern('^shipping:');
  },
  
  // Invalidate all analytics caches
  analytics: () => {
    appCache.deletePattern('^analytics:');
  },
  
  // Invalidate everything
  all: () => {
    appCache.clear();
  }
};

// ============================================================================
// Cached Fetch Wrapper
// ============================================================================

interface CachedFetchOptions extends CacheOptions {
  cacheKey: string;
  revalidateOnError?: boolean;
}

/**
 * Wrapper for fetch with caching
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & CachedFetchOptions
): Promise<T> {
  const { cacheKey, ttlMs, staleWhileRevalidate, revalidateOnError = true, ...fetchOptions } = options;
  
  return appCache.getOrSet<T>(
    cacheKey,
    async () => {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    { ttlMs, staleWhileRevalidate }
  );
}

// ============================================================================
// Request Deduplication
// ============================================================================

const pendingRequests = new Map<string, Promise<any>>();

/**
 * Deduplicate concurrent requests for the same resource
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending;
  }

  // Create new request
  const request = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}

export default appCache;
