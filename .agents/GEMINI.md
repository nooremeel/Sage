# Sage (سايج) — Local Project Rules & Architectural Contract

This file supplements the root contract in `~/.gemini/config/rules/`.

## 1. Project Identity & Stack Declaration

- **Project:** Sage (سايج) — Bilingual (AR/EN, RTL-first) Course Platform
- **Frontend (`apps/web`):** Next.js (App Router), TypeScript, Tailwind CSS, `next-intl`, Radix UI / shadcn/ui primitives.
- **Backend (`apps/api`):** NestJS 11, TypeScript, Drizzle ORM, Zod validation, OpenAPI / Swagger.
- **Database:** **PostgreSQL 16 (Neon Serverless)**.
  - **CRITICAL:** This is a PostgreSQL project. NEVER apply Mongoose/MongoDB patterns (no `.lean()`, no `$set`, no `ObjectId`, no Mongoose models). Always write SQL-first Drizzle schemas and typed queries.
- **Cache & Rate-Limiting:** **Upstash Redis** (serverless REST/TLS in production); **Redis 7** locally in Docker Compose.
- **Real-Time:** **Server-Sent Events (SSE)** native streaming on Vercel (`GET /realtime/events`), with fallback adapter for Pusher Channels.
- **Object Storage:** **Backblaze B2** (production S3-compatible); **SeaweedFS** locally in Docker Compose.
- **Media Pipeline:** Resumable S3 multipart uploads (Uppy), FFmpeg to adaptive HLS (360p, 720p, 1080p).
  - Production cloud transcode: GitHub Actions workflow runner (`workflow_dispatch`).
  - Local development transcode: BullMQ worker daemon in Docker Compose.
- **Deployment:** 100% on **Vercel** (Next.js web + NestJS serverless API via cached handler in `api/index.ts`).

---

## 2. Mandatory Architectural Guardrails

### Dual Execution & Serverless Constraints (Vercel)
- The NestJS API in production runs as a Vercel Serverless Function (`api/index.ts`).
- Always cache the `INestApplication` instance across warm requests via `@codegenie/serverless-express`.
- Never start persistent background loops or long-running CPU tasks inside Vercel serverless functions.
- All database connections to Neon must use connection pooling (`neon-connection-string` / pooler) to avoid exhausting serverless connections.

### Bilingual & RTL-First Engineering
- All styling must strictly use **CSS logical properties** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`).
- **NEVER** use physical direction classes (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right`).
- Mirror directional icons with `rtl:-scale-x-100`. Media controls and numeric/seek bars stay LTR (`dir="ltr"`).
- Every user-facing string must exist as an i18n key in **both** `ar` and `en` with matching placeholders.

### Arabic Full-Text Search in PostgreSQL
- Standard PostgreSQL and Neon do **not** ship with an `'arabic'` text search dictionary.
- Always normalize Arabic text in application logic (strip tashkeel/tatweel; normalize alef variants أ/إ/آ to ا, alef maqsura ى to ي, and ta marbuta ة to ه) into `search_text`.
- Index with `to_tsvector('simple', search_text)` combined with a `pg_trgm` GIN index for typo tolerance.

### Authentication & Authorization (CASL)
- Passwords hashed with `argon2id`.
- Access tokens in `httpOnly`, `Secure`, `SameSite=Lax` cookies.
- Refresh token rotation with family revocation on reuse detection.
- Every route must explicitly declare a CASL policy decorator or `@Public()`. Default is DENY.
- Matrix tests must verify zero IDOR leaks across tenants.

### Monorepo & Shared Files
- `packages/shared`: Central source of truth for Zod schemas, DTOs, enums, and error codes.
- `apps/web`: Never direct DB access; communicates via `/api/*` proxies to the NestJS API.
- Do not delete or reorder existing routes in `apps/api`.
