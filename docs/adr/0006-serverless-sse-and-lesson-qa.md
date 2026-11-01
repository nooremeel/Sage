# ADR 0006: Serverless-Compatible Real-Time Streaming (SSE), Lesson Q&A & Notification Center

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires a real-time communication layer supporting:
1. Live lesson Q&A discussions where students can ask questions and receive instant replies from instructors (with instructor verified badges).
2. An in-app notification center that updates unread badges and notifies users when their questions are answered or content is published.

Because Sage deploys 100% on Vercel (where serverless API functions terminate after each request and cannot maintain persistent duplex TCP WebSockets like a traditional Socket.io daemon), the real-time layer must run reliably within serverless execution constraints without incurring idle cloud costs or requiring paid external WebSocket services.

## Decision Drivers

1. **Vercel Serverless Compatibility:** Native HTTP streaming that functions over HTTP/2 chunked transfer without persistent WebSocket server infrastructure.
2. **Zero-Cost & Free-Tier Reliability:** No mandatory third-party credit card dependencies (e.g. Pusher or Ably); operate out-of-the-box on standard HTTP SSE.
3. **Missed-Event Recovery:** When network transitions occur, reconnecting clients passing `Last-Event-ID` must receive missed events without dropping messages.
4. **Optimistic UI Updates:** Instant user feedback in the discussion thread before network confirmation.
5. **RTL & Logical CSS Parity:** Flawless layout in both Arabic and English.

## Considered Options

1. **Persistent Socket.io Daemon on VPS:** (Rejected: Requires paid server or credit card hold, violating zero idle-cost serverless architecture).
2. **Short Polling Every 3-5 Seconds:** (Rejected: Heavy query overhead on serverless database and high latency).
3. **Server-Sent Events (SSE) via HTTP/2 Streaming with Memory Ring Buffer & Redis Fallback:** (Accepted).

## Decision Outcome

1. **Real-time Streaming Endpoint:**
   - `GET /api/realtime/events` establishes an authenticated SSE stream with standard headers (`text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`).
   - Clients multiplex channels: their private channel `user:{id}` and topic channels like `lesson:{id}`.
   - A 25-second keepalive ping (`: ping\n\n`) maintains connection vitality through intermediate reverse proxies and edge gateways.
   - When a client reconnects with `Last-Event-ID`, an in-memory ring buffer (storing the last 500 events) replays any missed messages.

2. **Q&A System:**
   - Data model: `qa_threads` and `qa_messages` tables in PostgreSQL.
   - Access: Enrolled students, course instructors, and admins can view and participate.
   - Instructor Answers: Replies posted by the course instructor automatically receive `isInstructorAnswer: true` and are broadcast live to all viewers of the lesson.
   - Notifications: Thread authors receive notifications when other participants reply.

3. **Notification Center:**
   - `notifications` table records notification history.
   - Live count updates are streamed over `user:{id}`.
   - Interactive header bell dropdown with unread badge and "Mark all as read" capability.

## Consequences

- Completely serverless-native real-time delivery with zero external SaaS costs.
- High reliability across network reconnects via `Last-Event-ID` buffering.
- Full RTL and logical CSS compliance for MENA and international audiences.

