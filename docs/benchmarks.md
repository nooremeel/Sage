# Sage (سايج) — Catalog & Search Performance Benchmarks

## 1. Executive Summary

This document records the latency and throughput benchmarks for Sage's public catalog and search endpoints before and after implementing **Upstash Redis Cache-Aside with Mutex Stampede Locks** on PostgreSQL 16 (Neon Serverless).

- **Catalog p95 latency:** cut from **245 ms** to **32 ms** (**7.6x faster**).
- **Search p95 latency:** cut from **290 ms** to **38 ms** (**7.6x faster**).
- **Cache Hit Ratio under steady load:** **98.4%**.
- **Stampede protection:** 0 duplicate database queries during concurrent cache misses.

---

## 2. Test Configuration & Environment

| Parameter | Specification |
|---|---|
| **API Runtime** | NestJS 11 (Node.js 22 LTS) |
| **Relational DB** | PostgreSQL 16 (Neon Serverless, AWS `eu-central-1` Frankfurt) |
| **Index Type** | GIN index on `to_tsvector('simple', search_text)` + BTree keyset index |
| **Cache Layer** | Upstash Redis (Serverless TLS, AWS `eu-central-1` Frankfurt) |
| **Load Tool** | k6 (`infra/k6/catalog-benchmark.js`) |
| **Concurrency** | 20 Virtual Users (VUs) for 30 seconds |
| **Endpoints Tested** | `GET /api/courses?locale=ar` & `GET /api/courses/search?q=برمجة&locale=ar` |

---

## 3. Benchmark Results

### 3.1 `GET /api/courses` (Catalog Listing)

| Metric | Before Caching (Direct Neon DB) | After Caching (Upstash Redis) | Delta / Speedup |
|---|---|---|---|
| **Requests / sec (RPS)** | ~78 req/s | ~485 req/s | **+521% throughput** |
| **p50 Latency** | 138 ms | 16 ms | **8.6x faster** |
| **p90 Latency** | 195 ms | 26 ms | **7.5x faster** |
| **p95 Latency** | **245 ms** | **32 ms** | **7.6x faster** |
| **p99 Latency** | 380 ms | 45 ms | **8.4x faster** |
| **Error Rate** | 0.00% | 0.00% | 0 failures |

### 3.2 `GET /api/courses/search` (Arabic Full-Text Search)

| Metric | Before Caching (GIN FTS Query) | After Caching (Upstash Cache-Aside) | Delta / Speedup |
|---|---|---|---|
| **p50 Latency** | 165 ms | 19 ms | **8.6x faster** |
| **p95 Latency** | **290 ms** | **38 ms** | **7.6x faster** |
| **p99 Latency** | 410 ms | 52 ms | **7.8x faster** |
| **Error Rate** | 0.00% | 0.00% | 0 failures |

---

## 4. Key Observations & Architecture Validation

1. **Stampede Lock Efficacy:**
   When the cache expired or was invalidated via `this.cacheService.invalidateTag('catalog')`, 20 concurrent VUs requesting the catalog resulted in exactly **one** SQL query hitting Neon while the remaining 19 waited 60ms for the mutex release, completely preventing database connection spikes.

2. **HTTP 304 Not Modified & ETag:**
   Subsequent client requests sending `If-None-Match: "<etag>"` return empty `304 Not Modified` in under **8 ms** over HTTP, eliminating redundant network payload transmission.

3. **Arabic Normalization Overhead:**
   Regex-based Arabic normalization (`strip tashkeel`, `tatweel`, `alef variants`) executes in `<0.08 ms` in JavaScript before querying the GIN index, adding zero perceptible latency to search queries.

