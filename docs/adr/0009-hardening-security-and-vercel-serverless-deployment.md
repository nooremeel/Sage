# ADR 0009: Production Hardening, Security Headers & Vercel Serverless Monorepo Deployment

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage is architected to deploy 100% on Vercel as a unified monorepo without persistent stateful daemons or paid cloud hosting instances.

To achieve production readiness:
1. HTTP headers must enforce strict security guarantees (Helmet, CORS allowlist, and Content Security Policy).
2. The NestJS API must initialize efficiently as a Vercel Serverless Function without incurring cold start penalties on every invocation.
3. Observability must be established via a standard Prometheus `/metrics` endpoint.
4. Database recovery mechanisms (automated backup scripts) and a deployment runbook must be provided.

## Decision Drivers

1. **Vercel Serverless Lifecycle:** Serverless functions terminate quickly; warm container caching via `@codegenie/serverless-express` is required.
2. **Security & Content Protection:** Content Security Policy (CSP) must protect video segments and assets while permitting Google Fonts and HLS streaming blobs.
3. **Observability:** Prometheus-compatible metrics endpoint for infrastructure monitoring.
4. **Zero-Cost Constraint:** No paid infrastructure or mandatory external service dependencies.

## Decision Outcome

1. **Serverless Entrypoint:**
   - Implemented `apps/api/api/index.ts` using `@codegenie/serverless-express`.
   - The `INestApplication` instance is cached across warm Lambda invocations (`cachedServer`).
   - Root `vercel.json` maps `/api/(.*)` to `apps/api/api/index.ts` and all other routes to `apps/web`.

2. **Security Hardening:**
   - **Helmet:** Installed and enabled on NestJS API with strict HSTS, frameguard, and MIME sniffing protection.
   - **CORS:** Configured with origin allowlist supporting custom web domain, Vercel preview URLs (`*.vercel.app`), and local development hosts.
   - **Next.js CSP:** Added comprehensive CSP headers in `apps/web/next.config.mjs` allowing fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), HLS media blobs (`blob:`, `https:`), and API proxies.

3. **Prometheus Metrics:**
   - Implemented `MetricsController` in `apps/api/src/modules/metrics/metrics.controller.ts` exposed at `GET /api/metrics`.
   - Emits process memory, CPU usage, service uptime, and operational health gauges in Prometheus format.

4. **Database Backup & Disaster Recovery:**
   - Created `scripts/backup-db.ps1` and `scripts/backup-db.sh` to produce timestamped PostgreSQL dumps using `DATABASE_URL` credentials.

5. **Deployment Runbook:**
   - Created `docs/deploy-runbook.md` with step-by-step guides for Neon pooling configuration, Upstash Redis setup, and Vercel environment variables.

## Consequences

- Full production readiness on Vercel's global edge network with sub-second response times.
- Zero idle compute costs for platform maintenance.
- Strong security posture validated by automated checks.

