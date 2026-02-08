import Redis from 'ioredis';
import logger from './logger';

const isTest = process.env.NODE_ENV === 'test';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiry: number }> = new Map();
  private defaultTTL = 300;

  constructor() {
    if (!isTest && process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, falling back to memory cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redis.on('error', (err) => {
        logger.error({ err }, 'Redis connection error');
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected');
      });
    }
  }

  private isRedisAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (this.isRedisAvailable()) {
      const value = await this.redis!.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return undefined;
    }

    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return JSON.parse(cached.value) as T;
    }
    this.memoryCache.delete(key);
    return undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const ttlSeconds = ttl ?? this.defaultTTL;
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable()) {
      await this.redis!.setex(key, ttlSeconds, serialized);
      return true;
    }

    this.memoryCache.set(key, {
      value: serialized,
      expiry: Date.now() + ttlSeconds * 1000,
    });
    return true;
  }

  async del(key: string | string[]): Promise<number> {
    const keys = Array.isArray(key) ? key : [key];
    
    if (this.isRedisAvailable()) {
      if (keys.length === 0) return 0;
      return await this.redis!.del(...keys);
    }

    let count = 0;
    for (const k of keys) {
      if (this.memoryCache.delete(k)) count++;
    }
    return count;
  }

  async delByPrefix(prefix: string): Promise<number> {
    if (this.isRedisAvailable()) {
      const keys = await this.redis!.keys(`${prefix}*`);
      if (keys.length === 0) return 0;
      return await this.redis!.del(...keys);
    }

    let count = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    return count;
  }

  async flush(): Promise<void> {
    if (this.isRedisAvailable()) {
      await this.redis!.flushdb();
      return;
    }
    this.memoryCache.clear();
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
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
