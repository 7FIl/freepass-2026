import NodeCache from 'node-cache';

/**
 * In-memory cache for frequently accessed data
 * TTL is in seconds
 */
class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default 5 minutes TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: true, // Return clones to prevent mutation
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in cache
   * @param ttl - Time to live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  /**
   * Delete a key from cache
   */
  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  /**
   * Delete all keys matching a pattern prefix
   */
  delByPrefix(prefix: string): number {
    const keys = this.cache.keys().filter(key => key.startsWith(prefix));
    return this.cache.del(keys);
  }

  /**
   * Flush all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get or set pattern - returns cached value if exists, otherwise calls factory and caches result
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Cache key prefixes for different data types
export const CACHE_KEYS = {
  CANTEENS_LIST: 'canteens:list',
  CANTEEN_BY_ID: (id: string) => `canteen:${id}`,
  MENU_ITEMS: (canteenId: string) => `menu:${canteenId}`,
  USER_BY_ID: (id: string) => `user:${id}`,
} as const;

// Cache TTL values in seconds
export const CACHE_TTL = {
  CANTEENS: 300, // 5 minutes for canteen lists
  MENU_ITEMS: 180, // 3 minutes for menu items (changes more frequently)
  USER: 600, // 10 minutes for user data
} as const;

// Singleton instance
export const cache = new CacheService();

export default cache;
