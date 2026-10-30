import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis as IORedis } from 'ioredis';

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, exSeconds?: number): Promise<'OK' | null | string>;
  setnx(key: string, value: string, exSeconds: number): Promise<boolean>;
  del(key: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  ping(): Promise<string>;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: CacheClient | null = null;
  private isAvailable = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.initClient();
  }

  onModuleDestroy() {
    this.client = null;
    this.isAvailable = false;
  }

  private initClient() {
    try {
      const provider = this.config.get<string>('REDIS_PROVIDER', 'local');

      if (provider === 'upstash') {
        const restUrl = this.config.get<string>('UPSTASH_REDIS_REST_URL');
        const restToken = this.config.get<string>('UPSTASH_REDIS_REST_TOKEN');

        if (restUrl && restToken) {
          const upstash = new UpstashRedis({ url: restUrl, token: restToken });
          this.client = {
            async get(key: string) {
              const res = await upstash.get<string>(key);
              if (res === null || res === undefined) return null;
              return typeof res === 'string' ? res : JSON.stringify(res);
            },
            async set(key: string, value: string, exSeconds?: number) {
              if (exSeconds) {
                return (await upstash.set(key, value, { ex: exSeconds })) as string;
              }
              return (await upstash.set(key, value)) as string;
            },
            async setnx(key: string, value: string, exSeconds: number) {
              const res = await upstash.set(key, value, { nx: true, ex: exSeconds });
              return res === 'OK';
            },
            async del(key: string) {
              return await upstash.del(key);
            },
            async sadd(key: string, ...members: string[]) {
              if (members.length === 0) return 0;
              return await upstash.sadd(key, members[0], ...members.slice(1));
            },
            async smembers(key: string) {
              return await upstash.smembers(key);
            },
            async ping() {
              return await upstash.ping();
            },
          };
          this.isAvailable = true;
          this.logger.log('CacheService initialized with Upstash Redis REST client');
          return;
        }
      }

      // Local ioredis fallback
      const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
      const io = new IORedis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
      });

      io.on('error', (err) => {
        this.logger.warn(`Local Redis error: ${err.message}`);
        this.isAvailable = false;
      });

      this.client = {
        async get(key: string) {
          return await io.get(key);
        },
        async set(key: string, value: string, exSeconds?: number) {
          if (exSeconds) {
            return await io.set(key, value, 'EX', exSeconds);
          }
          return await io.set(key, value);
        },
        async setnx(key: string, value: string, exSeconds: number) {
          const res = await io.set(key, value, 'EX', exSeconds, 'NX');
          return res === 'OK';
        },
        async del(key: string) {
          return await io.del(key);
        },
        async sadd(key: string, ...members: string[]) {
          if (members.length === 0) return 0;
          return await io.sadd(key, ...members);
        },
        async smembers(key: string) {
          return await io.smembers(key);
        },
        async ping() {
          return await io.ping();
        },
      };
      this.isAvailable = true;
      this.logger.log('CacheService initialized with ioredis client');
    } catch (err) {
      this.logger.warn(`Failed to initialize cache client: ${err instanceof Error ? err.message : String(err)}`);
      this.isAvailable = false;
    }
  }

  async ping(): Promise<string> {
    if (!this.client) throw new Error('Cache client not initialized');
    return await this.client.ping();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isAvailable) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`Cache get failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = 300, tag?: string): Promise<void> {
    if (!this.client || !this.isAvailable) return;
    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, ttlSeconds);
      if (tag) {
        await this.client.sadd(`tag:${tag}`, key);
      }
    } catch (err) {
      this.logger.warn(`Cache set failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isAvailable) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Cache del failed for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async invalidateTag(tag: string): Promise<void> {
    if (!this.client || !this.isAvailable) return;
    try {
      const tagKey = `tag:${tag}`;
      const keys = await this.client.smembers(tagKey);
      if (keys && keys.length > 0) {
        for (const k of keys) {
          await this.client.del(k);
        }
      }
      await this.client.del(tagKey);
    } catch (err) {
      this.logger.warn(`Cache invalidateTag failed for "${tag}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Cache-aside with Stampede Lock (Mutex on Cache Miss)
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
    tag?: string,
  ): Promise<T> {
    // 1. Try Cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    if (!this.client || !this.isAvailable) {
      return await fetcher();
    }

    const lockKey = `lock:${key}`;
    const acquiredLock = await this.client.setnx(lockKey, '1', 5);

    if (acquiredLock) {
      try {
        const fresh = await fetcher();
        await this.set(key, fresh, ttlSeconds, tag);
        return fresh;
      } finally {
        await this.client.del(lockKey);
      }
    } else {
      // Another request is populating cache, wait briefly and poll cache
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 60));
        const retryCached = await this.get<T>(key);
        if (retryCached !== null) {
          return retryCached;
        }
      }
      // Fallback compute if still miss
      return await fetcher();
    }
  }
}

