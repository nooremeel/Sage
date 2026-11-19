# Project Improvement & Fixes Roadmap

This document outlines the bugs, missing features, and improvements identified for the Sage (سايج) course platform to transition from its current state to a production-ready system.

## 1. Bugs & Broken Functionality

- [x] **Fix MediaService Warnings:** The tests in `test/media/protected-playback.spec.ts` produce warnings related to S3 `CreateMultipartUpload` and `CompleteMultipartUpload` failure. While tests are passing, this indicates potential instability in the storage interaction layer that should be hardened.
- [x] **Database Health Check Failure:** The `HealthService` test indicates a `Connection refused` warning during test execution. Even if handled gracefully in tests, the production health check should be robust and provide clearer diagnostic information.

## 2. Missing Features & Incorrect Logic

- [x] **Enhance Certificate Generation:** The `certificates.service.ts` contains a comment indicating the need to generate a unique serial `SAGE-YYYY-XXXXXX`. Currently, this is not fully implemented or verified for robustness against race conditions.
- [x] **Improve i18n Parity Verification:** The `scripts/check-i18n-parity.ts` (referenced in the roadmap) needs to be executed and potentially improved to ensure strict language parity between `ar.json` and `en.json`.
- [x] **Accessibility Audit:** While UI primitives are designed to be accessible, a full platform-wide accessibility audit (ARIA conformance) is still required to ensure compliance with the "Scholarly Platform" standard.

## 3. Proof of Concept: Integrating Real Courses

- [ ] **Step: Integrate Open Source Course Content:**
    - Add a few real courses from open sources (e.g., MIT OpenCourseWare) as a proof of concept.
    - **Implementation Constraint:** Do **not** store full course contents or video files on the platform's database.
    - **UI Requirement:** Display these courses within the existing `hls-player.tsx` (if compatible) or a specialized external embed viewer.
    - Ensure these courses are clearly marked as external/open-source and do not interfere with the core enrollment/certificate engine.
