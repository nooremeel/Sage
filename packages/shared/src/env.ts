import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000/api'),

  // Database
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DATABASE_POOL_MAX: z.coerce.number().default(10),

  // Redis
  REDIS_PROVIDER: z.enum(['local', 'upstash']).default('local'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Storage
  S3_ENDPOINT: z.string().default('http://localhost:8333'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().default('sage_s3_admin'),
  S3_SECRET_ACCESS_KEY: z.string().default('sage_s3_secret_key'),
  S3_BUCKET_NAME: z.string().default('sage-media'),
  S3_FORCE_PATH_STYLE: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(true),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(16)
    .default('dev_jwt_access_secret_change_in_production_32chars_long'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16)
    .default('dev_jwt_refresh_secret_change_in_production_32chars_long'),
  JWT_PLAYBACK_SECRET: z
    .string()
    .min(16)
    .default('dev_jwt_playback_secret_change_in_production_32chars_long'),

  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().default('Sage <noreply@sage.local>'),

  // Real-time & Transcode
  REALTIME_PROVIDER: z.enum(['sse', 'pusher']).default('sse'),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  TRANSCODE_PROFILE: z.enum(['local', 'cloud']).default('local'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(rawEnv: Record<string, unknown> = process.env): Env {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }
  return result.data;
}
