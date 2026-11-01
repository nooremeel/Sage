# Sage (سايج) — Production Deployment Runbook

This guide covers deploying the Sage bilingual course platform 100% on **Vercel** with **Neon Serverless PostgreSQL** and **Upstash Redis**, ensuring zero idle cloud compute costs and high-availability serverless performance.

---

## 1. Architecture Topology

```
                      [ User Browser (Desktop / Mobile) ]
                                     │
                                     ▼
                      [ Vercel Edge Global Network ]
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
            [ apps/web (Next.js) ]       [ apps/api (NestJS Serverless) ]
            - App Router (SSR / SSG)     - Cached @codegenie/serverless-express
            - next-intl (AR / EN, RTL)   - Drizzle ORM + CASL Deny-By-Default
            - Tailwind Logical CSS       - Helmet + Throttler Guard
                     │                               │
                     │                               ▼
                     │                 [ Neon Serverless PostgreSQL ]
                     │                 - 16.x with connection pooling
                     │                 - Arabic simple tsvector + pg_trgm GIN
                     │                               │
                     ▼                               ▼
            [ Browser Streaming ]          [ Upstash Redis (REST/TLS) ]
            - Native HLS.js                - Serverless Cache-Aside
            - Token-gated playback         - Rate limiting & pub/sub
```

---

## 2. Prerequisites & Managed Services

| Service | Tier / Plan | Purpose |
|---|---|---|
| **Vercel** | Hobby (Free) | Hosts both Next.js frontend and NestJS serverless function |
| **Neon** | Serverless (Free) | PostgreSQL 16 database with pooled connection strings |
| **Upstash Redis** | Serverless (Free) | HTTP REST/TLS Redis for cache-aside and rate limiting |
| **Backblaze B2** | S3-Compatible (Free 10GB) | Production HLS media storage and resumable upload destination |

---

## 3. Required Environment Variables

Configure these in the **Vercel Project Settings → Environment Variables**:

### General & App URLs
```env
NODE_ENV=production
PORT=4000
WEB_URL=https://your-domain.vercel.app
API_URL=https://your-domain.vercel.app/api
INTERNAL_API_URL=https://your-domain.vercel.app/api
```

### PostgreSQL (Neon Serverless)
> **Important:** Always use the pooled connection string (`-pooler` subdomain) for `DATABASE_URL` to prevent serverless function spikes from exhausting Postgres connections.
```env
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:PASSWORD@ep-xxx.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require
DATABASE_POOL_MAX=10
```

### Upstash Redis
```env
REDIS_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

### JWT & Webhook Secrets
> Generate 32+ character high-entropy secrets for each token:
```env
JWT_ACCESS_SECRET=your_32_char_secure_jwt_access_secret_production
JWT_REFRESH_SECRET=your_32_char_secure_jwt_refresh_secret_production
JWT_PLAYBACK_SECRET=your_32_char_secure_jwt_playback_secret_production
PAYMENT_WEBHOOK_SECRET=your_32_char_secure_payment_webhook_secret_production
```

### Media Storage (S3 / Backblaze B2)
```env
S3_ENDPOINT=https://s3.us-east-005.backblazeb2.com
S3_REGION=us-east-005
S3_ACCESS_KEY_ID=your_b2_key_id
S3_SECRET_ACCESS_KEY=your_b2_application_key
S3_BUCKET_NAME=sage-media-prod
S3_FORCE_PATH_STYLE=false
TRANSCODE_PROFILE=cloud
```

---

## 4. Pre-Deployment Database Preparation

Run database migrations and seed production data from your terminal before deploying:

```bash
# 1. Apply all migrations to Neon
pnpm --filter @sage/api db:migrate

# 2. Seed initial categories, scholarly courses, coupons, and sample records
pnpm --filter @sage/api db:seed
```

---

## 5. Deployment Step via Vercel CLI

```bash
# 1. Link project to Vercel
vercel link

# 2. Deploy to production
vercel --prod
```

Or connect the repository via GitHub integration. Vercel reads `vercel.json` and automatically builds:
- `apps/web` with `@vercel/next`
- `apps/api/api/index.ts` with `@vercel/node`

---

## 6. Post-Deployment Verification Checklist

1. **System Health:** Visit `GET /api/health` — should return `200 OK` with database, redis, and storage healthy.
2. **Prometheus Metrics:** Visit `GET /api/metrics` — should return metrics in Prometheus exposition format.
3. **Bilingual Home & Catalog:** Visit `/en` and `/ar` — verify correct font loading (Amiri / EB Garamond) and RTL direction.
4. **Arabic Search:** Search `الخط` or `معمارية` on `/ar/courses` — verify diacritic-normalized results.
5. **Verifiable Certificate:** Visit `/en/verify/SAGE-2026-ALPHA1` — verify certificate rendering, QR code, and print preview (`Ctrl+P`).
6. **Simulated Payment Sandbox:** Click "Enroll in Course" on a paid course — verify redirect to `/checkout/[orderId]` and simulated webhook completion.

