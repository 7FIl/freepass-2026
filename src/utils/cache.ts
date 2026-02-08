import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: true,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  delByPrefix(prefix: string): number {
    const keys = this.cache.keys().filter(key => key.startsWith(prefix));
    return this.cache.del(keys);
  }

  flush(): void {
    this.cache.flushAll();
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const CACHE_KEYS = {
  CANTEENS_LIST: 'canteens:list',
  CANTEEN_BY_ID: (id: string) => `canteen:${id}`,
  MENU_ITEMS: (canteenId: string) => `menu:${canteenId}`,
  USER_BY_ID: (id: string) => `user:${id}`,
} as const;

export const CACHE_TTL = {
  CANTEENS: 300,
  MENU_ITEMS: 180,
  USER: 600,
} as const;

const cache = new CacheService();
export default cache;
