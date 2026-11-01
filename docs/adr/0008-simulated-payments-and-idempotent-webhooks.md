# ADR 0008: Simulated Payments, Provider Abstraction & Idempotent Webhook Processing

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires a checkout and payment subsystem so students can purchase paid courses and redeem discount coupons.

Because Sage is committed to zero external hosting costs and zero mandatory credit-card dependencies (free-tier developer profile), live third-party payment gateways (e.g. Stripe, Paymob) cannot be mandated for local or staging environments without requiring merchant approval, business KYC, and paid accounts.

At the same time, the payment subsystem must reflect real-world production engineering rigor:
1. Provider abstraction (`PaymentProvider`) allowing real gateways (Stripe, Paymob, Paddle) to be plugged in seamlessly.
2. Order and payment state machines (`orders` and `payments` tables in PostgreSQL).
3. HMAC SHA-256 signature verification for webhooks.
4. Concurrency safety and duplicate webhook delivery idempotency, ensuring duplicate webhooks grant course enrollment exactly once without race conditions.
5. Simulated checkout UI with pay, fail, and cancel actions in paper-and-ink aesthetics with bilingual RTL/LTR support.

## Decision Drivers

1. **Provider Extensibility:** Decouple checkout initiation and webhook verification behind an extensible `PaymentProvider` interface.
2. **Zero-Cost Demo Sandbox:** A modular `FakePaymentProvider` that simulates realistic checkout sessions and generates signed webhooks locally.
3. **Strict Webhook Idempotency:** Webhook retries from gateways must be handled idempotently via unique `idempotency_key` and database transactions.
4. **Deny-by-Default CASL Policies:** All payment and order endpoints must enforce strict CASL authorization.
5. **Bilingual RTL/LTR Parity:** Complete i18n key parity between `ar.json` and `en.json` using CSS logical properties.

## Considered Options

1. **Direct Stripe Integration in Core:** (Rejected: Requires live merchant accounts and webhook tunnels, breaking the zero-cost requirement for reviewers).
2. **No Payment Flow (All courses free):** (Rejected: Fails to demonstrate commercial platform capabilities, order lifecycle, and webhook handling).
3. **Pluggable PaymentProvider Architecture with Fake Gateway & Signed Sandbox Checkout:** (Accepted).

## Decision Outcome

1. **Provider Architecture (`PaymentProvider` Interface):**
   - Defines `createCheckoutSession(params)`, `generateWebhookSignature(payload, secret)`, and `verifyWebhookSignature(payload, signature, secret)`.
   - `FakePaymentProvider` signs events using HMAC SHA-256 and validates signatures with `crypto.timingSafeEqual`.
   - Production gateways (e.g., Stripe, Paymob) can be added simply by implementing `PaymentProvider` and registering them in NestJS DI.

2. **Database Data Model & State Machine:**
   - **`orders` table:** Tracks `userId`, `courseId`, `amountCents`, `currency`, `status` (`pending`, `completed`, `failed`, `cancelled`), and `couponId`.
   - **`payments` table:** Tracks `orderId`, `provider`, `transactionId` (unique), `amountCents`, `status` (`pending`, `succeeded`, `failed`, `refunded`), `idempotencyKey` (unique), and `rawPayload`.

3. **Idempotent Webhook Processing:**
   - `POST /api/payments/webhook`:
     - Verifies HMAC signature with `x-signature` header.
     - Performs idempotency check against `payments.idempotency_key`. If the transaction has already been recorded, returns `{ status, idempotent: true }` immediately.
     - Runs transactional state transition with `FOR UPDATE` lock on the order row.
     - On `payment.succeeded`: marks order `completed`, increments coupon usage if applied, and idempotently inserts enrollment (`source: 'paid'`).
     - On `payment.failed`: marks order `failed` without granting enrollment.

4. **Sandbox Checkout Interface:**
   - Located at `/[locale]/checkout/[orderId]`.
   - Displays order breakdown and interactive simulation buttons:
     - "Pay Now (Simulate Success)"
     - "Simulate Failure"
     - "Cancel Order"
   - Redirects to course upon successful enrollment.

## Consequences

- Fully functional commercial checkout experience without third-party API dependencies or costs.
- Tested and verified against duplicate webhook deliveries with zero double-enrollment anomalies.
- Clear upgrade path to live payment gateways documented in architecture guides.

