# ADR 0005: Concurrency-Safe Enrollment, Progress Heartbeats & Anti-Leakage Quiz Grading

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires a reliable, scalable system to manage student course enrollments, track continuous lesson progress across video and article content, and administer auto-graded quizzes. The design must address three critical requirements:
1. **Concurrency Protection:** Coupons with limited redemptions (e.g. 5 seats) must never be oversold or double-redeemed even when dozens of parallel requests arrive simultaneously.
2. **Progress & Completion Rules:** Course completion must not rely on untrusted client assertions. Progress must be reported via periodic throttled heartbeats, with automatic completion rules (e.g. watching >= 90% of a video lesson or scoring >= passing score on a quiz).
3. **Quiz Anti-Leakage:** Correct answer keys and flags must never be leaked over the network to the browser prior to grading.

## Decision Drivers

1. **Transactional Integrity & Row-Level Locking:** Enforce strict limits using PostgreSQL `FOR UPDATE` row locks inside atomic database transactions for coupon redemptions.
2. **Server-Side Progress Verification:** Calculate overall course completion and enforce entitlement checks on progress updates.
3. **Information Security:** Student-facing endpoints must never serialize `isCorrect` on quiz options.
4. **Bilingual & RTL-First UX:** Provide localized quiz runners, course enrollment buttons, coupon dialogs, and progress tracking adhering strictly to CSS logical properties.

## Considered Options

1. **Client-Side Quiz Evaluation:** (Rejected: Students can inspect network responses or devtools to retrieve correct answers).
2. **Optimistic Locking for Coupons without Locks:** (Rejected: High concurrency leads to race conditions where redemptions exceed limits).
3. **Pessimistic Row-Level Lock (`SELECT ... FOR UPDATE`) in PostgreSQL Transaction:** (Accepted: Guarantees serialization of parallel redemptions, rejecting excessive claims with `COUPON_EXHAUSTED`).

## Decision Outcome

1. **Enrollment Architecture:**
   - Free enrollment (`POST /api/enrollments/free`) idempotently enrolls users in free courses.
   - Coupon enrollment (`POST /api/enrollments/coupon`) locks the coupon row via `FOR UPDATE`, checks expiry and user uniqueness, increments `timesRedeemed`, and creates `coupon_redemptions` and `enrollments` records in a single transaction.
   - Concurrency tests verify that 20 parallel redemptions against a limit of 5 produce exactly 5 successes and 15 `COUPON_EXHAUSTED` (HTTP 409 Conflict) responses.

2. **Progress Heartbeats & Automated Completion:**
   - `POST /api/progress/heartbeat` saves watch positions every 15 seconds and immediately on pause/ended.
   - Video lessons are automatically marked completed when watch position reaches >= 90% of duration.
   - Course progress calculation computes overall percentage and returns next uncompleted lessons for the continue-learning feed.

3. **Anti-Leakage Quiz Runner & Server-Side Grading:**
   - `GET /api/quizzes/:id` and `GET /api/quizzes/by-lesson/:lessonId` omit `isCorrect` from serialized option payloads.
   - `POST /api/quizzes/:id/attempts` accepts student answer selections, queries the canonical correct options on the server, calculates percentage score, records attempt history, enforces attempt limits, and marks the lesson completed upon passing.

## Consequences

- Zero coupon overselling risk in high-traffic campaigns.
- Complete protection against quiz answer scraping in the frontend.
- Seamless student experience with progress retention and resume capability.

