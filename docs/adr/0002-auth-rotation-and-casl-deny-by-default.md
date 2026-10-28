# ADR 0002: Dual-Token Authentication with Family Reuse Revocation & CASL Deny-By-Default Authorization

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires robust authentication and tenant-safe authorization across students, instructors, and platform administrators. The solution must support serverless deployment on Vercel with zero cross-subdomain cookie issues, guard against token replay/theft, and prevent unauthorized cross-tenant data access (IDOR).

## Decision Drivers

1. **Security & Cryptography Standards:** OWASP-compliant password hashing (`argon2id`) and cryptographic random refresh tokens.
2. **Token Rotation & Anti-Theft:** Storing refresh tokens as SHA-256 hashes, rotating on every single use, and revoking the entire token family if reuse is detected.
3. **Deny-by-Default:** Every API route must explicitly declare an access policy (`@CheckPolicies()`) or be explicitly marked `@Public()`.
4. **Vercel Serverless & Cookie Security:** `httpOnly`, `Secure`, `SameSite=Lax` cookies with 15-minute JWT access tokens and 7-day refresh tokens.
5. **Fine-Grained Permissions:** CASL (`@casl/ability`) permissions verifying resource ownership (e.g. instructor managing only their own courses, students viewing only their own enrollments/progress).

## Considered Options

1. **Session-based Authentication with Redis store:** Traditional express-session. (Rejected: Requires external persistent session store query on every single request, latency overhead in serverless cold starts).
2. **Stateless JWT only (no rotation):** Long-lived JWT in localStorage. (Rejected: Vulnerable to XSS token theft, no revocation capability).
3. **Dual-Token with Refresh Family Rotation & CASL:** Short-lived JWT (15m) + opaque 256-bit refresh token rotated on every call, family tracking, and CASL abilities. (Accepted).

## Decision Outcome

Adopted **Dual-Token Architecture with CASL Deny-By-Default**:

- **Password Hashing:** `argon2id` (19 MiB memory, 2 iterations).
- **Access Tokens:** 15-minute JWTs stored in `httpOnly` cookies.
- **Refresh Tokens:** Opaque 256-bit random tokens stored as SHA-256 hashes in `refresh_tokens` table with `family_id`.
- **Reuse Detection:** If a previously revoked refresh token is presented, all sessions in that `family_id` are revoked immediately and an alert error code `REFRESH_TOKEN_REUSE` is returned.
- **CASL PoliciesGuard:** Registered globally; validates that every route has a policy or `@Public()` decorator. A startup unit test scans all controller routes to guarantee zero unshielded endpoints.

## Consequences

- Clients transparently rotate tokens on 401 via `POST /api/auth/refresh`.
- If an attacker compromises a refresh token and uses it after legitimate rotation, both attacker and legitimate user are revoked, forcing re-authentication and protecting user data.
- Any newly created route that forgets to declare `@Public()` or `@CheckPolicies()` will fail at compile/startup test time, preventing IDOR vulnerabilities.
