# ADR 0007: Verifiable Bilingual Certificates, Course Reviews & Analytical Aggregates

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

As students complete courses on Sage, they require verifiable proof of completion and academic distinction that can be shared publicly, printed with scholarly typography, and independently verified via unique serial numbers and QR codes.

Simultaneously, prospective students require trustworthy course reviews and ratings from enrolled learners to evaluate educational rigor. Instructors and platform administrators need aggregate analytics to track student enrollment, completion velocity, and rating trajectories.

Serverless constraints on Vercel preclude bundling heavy headless Chromium binaries (e.g. Puppeteer) for server-side PDF generation. Therefore, certificates must leverage browser vector rendering, `@media print` styling, and public HTTP verification.

## Decision Drivers

1. **Serverless Compatibility:** Avoid heavy server-side PDF rendering runtimes that blow past Vercel's 50MB function package limits.
2. **Scholarly Bilingual Aesthetics:** Preserve classical manuscript aesthetics with Amiri Arabic typography, EB Garamond serif Latin, double hairline borders, watermarks, and official verification seals.
3. **Public Independent Verifiability:** Provide public endpoints (`GET /api/certificates/verify/:serial`) and web pages (`/[locale]/verify/[serial]`) that do not require student login to authenticate.
4. **Idempotent Claiming:** Ensure students can claim a certificate once 100% course progress is achieved without duplicating records upon multiple invocations.
5. **Transactional Rating Aggregates:** Recalculate course rating averages and review counts transactionally upon submission, and invalidate Redis cache tags (`course:{id}`, `catalog`).
6. **RTL & Logical CSS Compliance:** Full bilingual layout using CSS logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).

## Considered Options

1. **Headless Chrome Server-Side PDF Export (Puppeteer / Playwright in Lambda):** (Rejected: Package size exceeds Vercel serverless boundaries, incurs cold-start latency).
2. **Third-Party PDF Generation SaaS (DocRaptor, PDFShift):** (Rejected: Adds recurring API costs and external vendor lock-in).
3. **Vector HTML/SVG Certificate with Deterministic Vector QR Code & Browser Print-to-PDF:** (Accepted).

## Decision Outcome

1. **Bilingual Verifiable Certificates:**
   - **Data Model:** PostgreSQL `certificates` table with unique constraint on `(user_id, course_id)` and unique human-readable serial format `SAGE-YYYY-XXXXXX`.
   - **Claim Flow:** `POST /api/certificates/claim/:courseId` verifies that the student is enrolled and has achieved 100% course completion (`CourseProgressDto.percent === 100`). Claiming is idempotent: subsequent calls return the existing certificate.
   - **Verification:** `GET /api/certificates/verify/:serial` is public (`@Public()`), returning student name, bilingual course title, instructor, issuance timestamp, and `isValid: true`.
   - **Vector Presentation & Printing:** Rendered in `CertificateView` using paper-ink aesthetics (`#fbf7ee` parchment, double-line borders, central arabesque watermark, and deterministic vector SVG QR code). Clean `@media print` rules hide UI controls and format full-page vector output for browser PDF export.

2. **Course Reviews & Rating Aggregation:**
   - **Data Model:** PostgreSQL `reviews` table with `rating` (1–5) and optional `comment`, enforced by a unique index on `(user_id, course_id)`.
   - **Submission:** `POST /api/reviews/courses/:courseId` verifies enrollment. Within a single SQL transaction, it inserts/updates the review and recalculates `courses.rating_count` and `courses.rating_avg` via `coalesce(round(avg(rating)::numeric, 2), 5.0)::text`.
   - **Cache Invalidation:** Invalidates Redis cache tags `course:{id}` and `catalog` so that storefront listings display up-to-date ratings without waiting for TTL expiration.
   - **Frontend UI:** Interactive 5-star rating selector with hover preview, accessible keyboard controls, and optimistic list updating.

3. **Analytics Aggregation:**
   - **Instructor Analytics:** `GET /api/analytics/instructor` aggregates total courses, enrolled students, course completions, and weighted average ratings.
   - **Admin Analytics:** `GET /api/analytics/admin` reports platform-wide statistics for governance and capacity planning.

## Consequences

- 100% serverless-native certificate generation with instant load times and zero PDF vendor dependencies.
- Tamper-evident credentials verifiable by employers and academic institutions via QR link or serial lookup.
- High-performance catalog browsing via pre-aggregated ratings with instantaneous tag-based Redis invalidation.
- Zero IDOR vulnerabilities verified by CASL deny-by-default integration tests.
