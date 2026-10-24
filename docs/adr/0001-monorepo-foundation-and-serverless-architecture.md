# ADR 0001: Monorepo Foundation & Dual-Execution Serverless Architecture

- **Status:** Accepted
- **Date:** 2026-10-24
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage is a bilingual (Arabic/English, RTL-first) course platform with protected video delivery. The platform needs to support high developer velocity, full type safety between backend and frontend, and free-tier zero-cost production hosting on Vercel without credit card requirements, while maintaining high performance and local development parity.

## Decision Drivers

1. **Zero-cost hosting without credit card:** 100% serverless deployment on Vercel (Next.js web + NestJS API), Neon PostgreSQL, Upstash Redis, and Backblaze B2.
2. **Local development parity:** Local Docker Compose environment running PostgreSQL 16, Redis 7, SeaweedFS (S3), and Mailpit.
3. **End-to-end type safety:** Monorepo with shared Zod schemas, constants, and error codes.
4. **Bilingual & RTL-first:** Next.js App Router with `next-intl` and strict CSS logical properties.

## Considered Options

1. **Separate Repositories:** Independent frontend and backend repos. (Rejected: adds schema drift and version coordination overhead).
2. **Express / Vite SPA:** Traditional React SPA + Express. (Rejected: lacks SEO/SSR for public course catalog, less modular architecture).
3. **Monorepo (pnpm workspaces):** `apps/web` (Next.js), `apps/api` (NestJS 11), `packages/shared`, `infra/`. (Accepted).

## Decision Outcome

Adopted **pnpm workspaces** monorepo layout:

- `apps/web`: Next.js 15 (App Router), `next-intl`, Tailwind CSS with CSS logical properties.
- `apps/api`: NestJS 11 with dual execution:
  - Local: `src/main.ts` running persistent Node.js HTTP server.
  - Production: `api/index.ts` running serverless express via `@codegenie/serverless-express`, caching `INestApplication` warm instances.
- `packages/shared`: Shared Zod validation, error codes, and locale constants.
- `infra/`: Docker Compose for local dependencies.

## Consequences

- NestJS API in production must respect serverless timeouts (<60s) and avoid persistent in-memory background daemons.
- Heavy media transcoding will be handled via asynchronous GitHub Actions runners in production and local BullMQ workers in development.
- All database connections to Neon must use connection pooling.
