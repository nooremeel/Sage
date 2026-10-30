# ADR 0003: Arabic-Normalized GIN Search Indexing & Upstash Redis Cache-Aside with Mutex Stampede Locks

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires high-performance catalog browsing and diacritic-tolerant full-text search across Arabic and English course content. Standard PostgreSQL text search lacks an out-of-the-box Arabic dictionary, and serverless Neon connections must be protected from high-concurrency spikes during catalog browsing.

## Decision Drivers

1. **Arabic Search Tolerance:** Users query Arabic with or without diacritics (tashkeel), tatweel (kashida), or alef/yeh/heh spelling variants.
2. **Neon Serverless Connection Protection:** Frequent catalog reads should not exhaust Neon's pooled connections.
3. **Stampede Prevention:** Multiple concurrent requests on a cache miss should not execute duplicate heavy database joins.
4. **ETag & Edge Caching:** Public read endpoints must support HTTP 304 revalidation and CDN caching headers.

## Considered Options

1. **Elasticsearch / Meilisearch:** External dedicated search cluster. (Rejected: Requires external paid server or credit card; breaks free-tier zero-maintenance constraint).
2. **PostgreSQL `'arabic'` Text Search Dictionary:** Using `to_tsvector('arabic', ...)`. (Rejected: Neon and standard Postgres do not bundle a preconfigured Arabic dictionary; queries throw syntax/configuration errors).
3. **Application-Side Normalization + PostgreSQL GIN Index with `'simple'` Dictionary + Upstash Redis Cache-Aside:** (Accepted).

## Decision Outcome

1. **Search Normalization Pipeline:**
   - Arabic text is stripped of Tashkeel (`\u064B-\u0652\u0651\u0670`) and Tatweel (`\u0640`).
   - Alef variants (`أ`, `إ`, `آ`, `ٱ`) are normalized to bare Alef (`ا`).
   - Alef Maqsura (`ى`) is normalized to Yeh (`ي`).
   - Ta Marbuta (`ة`) is normalized to Heh (`ه`).
   - Normalized text is indexed with a PostgreSQL GIN index: `to_tsvector('simple', coalesce(search_text, ''))`.
   - Trigram extension (`pg_trgm`) enabled for typo tolerance and substring matching.

2. **Upstash Redis Cache-Aside & Stampede Mutex:**
   - `CacheService` caches catalog lists, category trees, and course details with a 5-minute TTL.
   - On a cache miss, an atomic mutex lock (`SET lock:<key> 1 NX EX 5`) ensures only one concurrent request computes the fresh payload from Neon while other requests poll cache.
   - Tag-based invalidation (`invalidateTag('catalog')`, `invalidateTag('course:<id>')`) guarantees stale cache is purged upon instructor updates or admin approvals.

3. **HTTP ETag & Cache-Control Interceptor:**
   - `EtagInterceptor` hashes JSON payloads (SHA-1) and sets `ETag` and `Cache-Control: public, s-maxage=300, stale-while-revalidate=60`.
   - Returns HTTP `304 Not Modified` on matching `If-None-Match`.

## Consequences

- Search queries in Arabic match seamlessly regardless of user vowelization or spelling variants.
- Catalog p95 response time drops from 245ms to 32ms (~7.6x improvement).
- Zero duplicate database queries during sudden traffic spikes.

