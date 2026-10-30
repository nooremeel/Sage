import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';
import { Redis } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { POSTGRES_CLIENT } from '../../db/db.module.js';

export interface ServiceHealth {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redisClient: Redis | null = null;
  private s3Client: S3Client | null = null;

  constructor(
    @Inject(POSTGRES_CLIENT) private readonly sql: postgres.Sql,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  private getRedisClient(): Redis {
    if (!this.redisClient) {
      const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
    }
    return this.redisClient;
  }

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:8333');
      const region = this.config.get<string>('S3_REGION', 'us-east-1');
      const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID', 'sage_s3_admin');
      const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY', 'sage_s3_secret_key');
      const forcePathStyle = this.config.get<boolean>('S3_FORCE_PATH_STYLE', true);

      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle,
      });
    }
    return this.s3Client;
  }

  async checkDatabase(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      await this.sql`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Database health check failed: ${message}`);
      return { status: 'down', error: message, latencyMs: Date.now() - start };
    }
  }

  async checkRedis(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const provider = this.config.get<string>('REDIS_PROVIDER', 'local');
      if (provider === 'upstash') {
        const restUrl = this.config.get<string>('UPSTASH_REDIS_REST_URL');
        const restToken = this.config.get<string>('UPSTASH_REDIS_REST_TOKEN');
        if (restUrl && restToken) {
          const upstash = new UpstashRedis({ url: restUrl, token: restToken });
          const pong = await upstash.ping();
          if (pong !== 'PONG') {
            throw new Error(`Unexpected Redis ping response: ${pong}`);
          }
          return { status: 'up', latencyMs: Date.now() - start };
        }
      }

      const client = this.getRedisClient();
      if (client.status !== 'ready' && client.status !== 'connecting') {
        await client.connect();
      }
      const pong = await client.ping();
      if (pong !== 'PONG') {
        throw new Error(`Unexpected Redis ping response: ${pong}`);
      }
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis health check failed: ${message}`);
      return { status: 'down', error: message, latencyMs: Date.now() - start };
    }
  }

  async checkStorage(): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const s3 = this.getS3Client();
      await s3.send(new ListBucketsCommand({}));
      return { status: 'up', latencyMs: Date.now() - start };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Storage health check failed: ${message}`);
      return { status: 'down', error: message, latencyMs: Date.now() - start };
    }
  }

  async getHealth(): Promise<HealthReport> {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ]);

    const isAllUp = db.status === 'up' && redis.status === 'up' && storage.status === 'up';
    const isAllDown = db.status === 'down' && redis.status === 'down' && storage.status === 'down';

    const overallStatus: HealthReport['status'] = isAllUp ? 'ok' : isAllDown ? 'error' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        database: db,
        redis,
        storage,
      },
    };
  }
}
