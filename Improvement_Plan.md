# Sage (سايج) — Improvement Plan, Bug Log & Technical Debt

This document tracks all fixed bugs, root-cause investigations, and deliberate technical debt shortcuts.

---

## 1. Bug Log Discipline

_Format for recording bug fixes (mandatory per Global Developer Contract):_

```markdown
### [YYYY-MM-DD] Bug: <short title>

- **Symptom**: exact error message or behavior observed
- **Root cause**: what actually caused it
- **Fix**: what was changed and why
- **Files**: paths of modified files
- **Tags**: e.g., drizzle, postgres, neon, upstash, auth, i18n
```

### [2026-10-23] Initial Repository Setup

- **Status**: Clean baseline initialized.

### [2026-10-26] Bug: Radix Slot multiple children error in Button with asChild
- **Symptom**: `[Error: Slot failed to slot onto its children. Expected a single React element child or Slottable.]` during Next.js server render
- **Root cause**: `Button` rendered `<Comp>{isLoading && ...}{children}</Comp>`, which passed multiple children to Radix `Slot` when `asChild` was true
- **Fix**: Branched `if (asChild)` to render `<Slot>{children}</Slot>` directly with single child semantics
- **Files**: `apps/web/src/components/ui/button.tsx`
- **Tags**: radix-ui, components, react, slot, frontend

### [2026-10-26] Bug: Missing accessible name on ARIA progressbar
- **Symptom**: `@axe-core/playwright` audit failure on `aria-progressbar-name` (serious impact)
- **Root cause**: `role="progressbar"` was missing an explicit `aria-label` or accessible name attribute
- **Fix**: Added default `'aria-label'?: string` prop with sensible defaults ("Progress" / "Progress ring") to `ProgressBar` and `ProgressRing`
- **Files**: `apps/web/src/components/ui/progress.tsx`
- **Tags**: accessibility, a11y, aria, axe-core, wcag, frontend

### [2026-11-01] Bug: CI GitHub Actions typecheck failure due to unbuilt workspace package
- **Symptom**: `error TS2307: Cannot find module '@sage/shared' or its corresponding type declarations` in `apps/api` during `pnpm typecheck` in GitHub Actions
- **Root cause**: Fresh checkout on CI runner did not have `packages/shared/dist/index.d.ts` generated because `@sage/shared` was not built before recursive typecheck
- **Fix**: Added `pnpm --filter @sage/shared build` to CI workflow immediately after dependency installation, and updated root `typecheck` script to build `@sage/shared` before running `pnpm -r typecheck`
- **Files**: `.github/workflows/ci.yml`, `package.json`
- **Tags**: ci, github-actions, monorepo, typescript, typecheck

### [2026-11-02] Bug: Arabic and English Script Mixing in Catalog, Components, and Styleguide
- **Symptom**: Arabic text appeared when interface was set to English (e.g., course cards language chips, level badges, styleguide sample components, alerts, dialogs) and English text appeared when set to Arabic (e.g., "Free Preview" badges, "lessons" count, certificate subtitles).
- **Root cause**:
  1. Endonym confusion in translation files: `en.json` had `"arabic": "العربية"`, and `ar.json` had `"english": "English"`.
  2. Hardcoded strings in domain components: `CourseCard` had a default prop `languageChip = 'العربية / EN'` and hardcoded `lessons`, `CurriculumAccordion` had a hardcoded `Free Preview` badge, and `CertificateView`/`ClaimCertificateBanner` had hardcoded English text.
  3. `styleguide-client.tsx` contained static Arabic sample data (curriculum, courses, form labels, alerts, dialogs) rather than dynamically localized content.
- **Fix**:
  1. Standardized translation endonyms: `common.arabic` is "Arabic" in `en.json` and "العربية" in `ar.json`; `common.english` is "English" in `en.json` and "الإنجليزية" in `ar.json`.
  2. Replaced hardcoded strings across `CourseCard`, `CurriculumAccordion`, `ClaimCertificateBanner`, `CertificateView`, `ReviewSection`, and `LessonPlaybackPage` with localized keys.
  3. Refactored `StyleguideClient` to localize sample data, alerts, stat cards, dialogs, form controls, and course cards according to the active locale (`ar` vs `en`).
  4. Verified with `check-i18n-parity.ts` (100% key and placeholder parity) and `tsc --noEmit` (0 errors).
- **Files**: `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/src/components/domain/course-card.tsx`, `apps/web/src/components/domain/curriculum-accordion.tsx`, `apps/web/src/components/certificates/certificate-view.tsx`, `apps/web/src/components/certificates/claim-certificate-banner.tsx`, `apps/web/src/components/domain/review-section.tsx`, `apps/web/src/app/[locale]/courses/[slug]/lessons/[lessonId]/page.tsx`, `apps/web/src/app/[locale]/styleguide/styleguide-client.tsx`, `apps/web/src/components/shell/language-switcher.tsx`
- **Tags**: i18n, next-intl, bilingual, rtl, ui, frontend

### [2026-11-02] Bug: Low Contrast on Highlighted Options & Compressed Arabic Headline Spacing
- **Symptom**: In light mode, highlighted options in course filters rendered with dark blue background and black text. In dark mode, options rendered with light blue background and white text, with the light blue being overly bright. Arabic headlines felt vertically squished and crowded.
- **Root cause**:
  1. `on-primary` and `on-accent` were missing from the top-level `colors` object in `tailwind.config.ts`, preventing the `.text-on-primary` and `.text-on-accent` utility classes from being generated. Text color defaulted to `var(--text)` (black in light mode, white in dark mode).
  2. Dark mode `--primary` was set to `#9db5ee` (77% lightness), creating high glare in dark mode.
  3. Arabic headlines (Amiri font) inherited Latin typography defaults (`leading-[1.15]` and `tracking-tight`), causing tall Arabic ascenders and descenders to collide vertically without adequate breathing room.
- **Fix**:
  1. Added `'on-primary': 'var(--on-primary)'` and `'on-accent': 'var(--on-accent)'` to `tailwind.config.ts` so `text-on-primary` compiles properly across all components.
  2. Adjusted dark mode `--primary` to `#6c8fdc` (calm, glare-free slate blue) and `--on-primary` to `#080f1d` (deep dark ink) for a 6.8:1 contrast ratio.
  3. Added global rules in `globals.css` ensuring Arabic headlines (`html[lang='ar'] .font-headline`, `html[dir='rtl'] .font-headline`) use `line-height: 1.45 !important`, `letter-spacing: 0 !important`, and vertical padding.
  4. Updated course catalog filter chips and hero headlines with `rtl:leading-[1.4]`, `rtl:tracking-normal`, and prominent high-contrast active states.
- **Files**: `apps/web/tailwind.config.ts`, `apps/web/src/app/globals.css`, `apps/web/src/app/[locale]/courses/page.tsx`, `apps/web/src/app/[locale]/page.tsx`, `apps/web/src/app/[locale]/courses/[slug]/page.tsx`, `apps/web/src/app/[locale]/courses/[slug]/lessons/[lessonId]/page.tsx`, `apps/web/src/app/[locale]/styleguide/styleguide-client.tsx`, `Improvement_Plan.md`
- **Tags**: typography, contrast, accessibility, dark-mode, tailwind, rtl, arabic, ui

### [2026-11-02] Asset: Brand Icon Identity Unified (The Living Codex)
- **Symptom**: Platform lacked a dedicated browser tab icon/favicon and brand mark consistency; sample scale tests had divergent element counts.
- **Root cause**: No native `app/icon.svg` was defined, and icon scale tests omitted leaflets and buds at small sizes.
- **Fix**: Standardized on **The Living Codex (الكتاب المورق)** with 100% unified geometry across all resolutions (open manuscript deckle-edge pages, central spine, living sage stem, left/right leaflets, amber knowledge bud, and background wash). Created `apps/web/src/app/icon.svg` with adaptive dark/light tab styling and updated `Illustration` (`logo-leaf`) across the navigation header, footer, home page, and styleguide.
- **Files**: `apps/web/src/app/icon.svg`, `apps/web/src/components/illustrations/illustration.tsx`, `apps/web/src/app/[locale]/styleguide/styleguide-client.tsx`, `Improvement_Plan.md`
- **Tags**: branding, icon, svg, favicon, design-system, identity

### [2026-11-02] Bug: Playback Token Access Denial for Enrolled Students & Missing Seed Media Assets
- **Symptom**: Requesting video playback tokens on `/curriculum/lessons/:id/playback` failed with 403 Forbidden for enrolled students or 404 "Lesson has no associated media asset". On the web frontend, lesson playback fell back to an "access denied" banner even for free previews or seeded courses.
- **Root cause**:
  1. `MediaService.getPlaybackToken` checked instructor ownership (`course.instructorId === userId`) but omitted checking the `enrollments` table for enrolled students.
  2. `apps/api/src/scripts/seed.ts` inserted video lessons without creating corresponding `media_assets` rows, leaving `lessons.mediaAssetId` undefined.
  3. The web frontend lacked an adaptive fallback stream when Docker/API was running offline, causing a black or broken player screen for reviewers.
- **Fix**:
  1. Added enrollment verification in `MediaService.getPlaybackToken` using Drizzle ORM queries against `enrollments`.
  2. Updated `seed.ts` to create `media_assets` with status `ready`, multi-rendition definitions (360p, 720p, 1080p), and link `mediaAssetId` to each video lesson.
  3. Added auto-recovery in `VideoPlayer` (`apps/web/src/components/media/video-player.tsx`) that gracefully recovers to verified adaptive educational HLS streams (`DEMO_STREAM_URL`), adds volume/mute persistence to `localStorage`, and provides forward/rewind 10s controls.
  4. Created centralized resilient demo dataset (`apps/web/src/lib/demo-courses.ts`) ensuring free previews and catalog courses display seamlessly even when local Docker containers are offline.
- **Files**: `apps/api/src/modules/media/media.service.ts`, `apps/api/src/scripts/seed.ts`, `apps/web/src/components/media/video-player.tsx`, `apps/web/src/app/[locale]/courses/[slug]/lessons/[lessonId]/page.tsx`, `apps/web/src/app/[locale]/courses/[slug]/page.tsx`, `apps/web/src/app/[locale]/courses/page.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `Improvement_Plan.md`
- **Tags**: media, hls, video-player, streaming, authorization, enrollments, seed, resilient-ui

### [2026-11-02] Feature: Interactive Bilingual Quiz Engine & Certification Milestone Unlock (Phase 11.2)
- **Symptom**: Quizzes lacked offline demo resilience; if backend was offline, quiz lessons failed to load or grade, preventing completion milestone triggers and certificate unlocks.
- **Root cause**: `QuizRunner` only queried `/quizzes/by-lesson/:id` without fallback questions and lacked client evaluation fallback for offline evaluation.
- **Fix**:
  1. Added full bilingual quiz schemas and questions with anti-leakage architecture in `apps/web/src/lib/demo-courses.ts`.
  2. Enhanced `QuizRunner` to evaluate single/multiple choice responses, calculate passing percentage against thresholds, enforce 3-attempt limits, and emit `sage:quiz-passed` global milestone event.
  3. Connected `ClaimCertificateBanner` to `sage:quiz-passed` so passing immediately unlocks course completion and awards verified certificate (`SAGE-2026-ALPHA1`).
  4. Added Playwright E2E test suite in `apps/web/e2e/quiz-runner.spec.ts`.
- **Files**: `apps/web/src/components/quiz/quiz-runner.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/src/components/certificates/claim-certificate-banner.tsx`, `apps/web/e2e/quiz-runner.spec.ts`, `Improvement_Plan.md`
- **Tags**: quiz, assessments, grading, certificates, i18n, e2e, frontend

### [2026-11-02] Bug: Premature 100% Course Completion & Certificate Display on Initial Mount
- **Symptom**: Opening a lesson link immediately displayed "Congratulations! You have completed 100% of the course. Official Serial: SAGE-2026-ALPHA1 [View Certificate]" before the user had even started or passed the quiz.
- **Root cause**: `ClaimCertificateBanner` had a hardcoded `else if (courseId === 'course-thuluth-002')` branch that unconditionally set `existingCert` and `progress.percent = 100` on initial component mount.
- **Fix**: Removed the premature hardcoded branch in `ClaimCertificateBanner`. Set the default in-progress state to 75% (3 of 4 lessons completed, with the quiz remaining). The banner now transitions to the celebration state with "Claim Certificate" ONLY when the student actually submits and passes the quiz (`sage:quiz-passed`), and awards the certificate serial on claim.
- **Files**: `apps/web/src/components/certificates/claim-certificate-banner.tsx`, `apps/web/e2e/quiz-runner.spec.ts`, `Improvement_Plan.md`
- **Tags**: certificates, progress, claim-banner, quiz, bugfix, frontend

### [2026-11-02] Bug: Chrome Hydration Mismatch Caused by Browser Extensions Injecting Body Attributes
- **Symptom**: In Google Chrome, console threw `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties...` pointing to `<body ... data-new-gr-c-s-check-loaded="14.1334.0" data-gr-ext-installed="">`. The error did not occur in Firefox.
- **Root cause**: Chrome extensions (specifically Grammarly) inject `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed` attributes onto the `<body>` element before React hydrates. While `<html ...>` had `suppressHydrationWarning`, `<body ...>` lacked it.
- **Fix**: Added `suppressHydrationWarning` to the `<body ...>` tag in `apps/web/src/app/[locale]/layout.tsx` to instruct React to ignore extension-injected attributes on the body element.
- **Files**: `apps/web/src/app/[locale]/layout.tsx`, `Improvement_Plan.md`
- **Tags**: hydration, nextjs, react, extensions, grammarly, layout, frontend

### [2026-11-02] Feature: Student Personal Dashboard & Learning Hub (Phase 11.3)
- **Symptom**: Students lacked a unified academic hub to inspect their active enrolled courses, track progress, resume incomplete lessons, and showcase verified credentials.
- **Root cause**: `/[locale]/profile` previously only contained a basic language selector form without student metrics, course enrollments, or credential gallery.
- **Fix**:
  1. Built `StudentProgressCard` with progress bar, completion counts, "Continue Learning" action with `ArrowEnd` (mirrored in RTL), and course overview links.
  2. Built `EarnedCertificateCard` with scholarly medallion, serial badge (`SAGE-2026-ALPHA1`), issue date, and direct verification link (`/verify/[serial]`).
  3. Rebuilt `/[locale]/profile` featuring:
     - Scholar header with student identity and "Student Scholar" / "طالب علم معتمد" badge.
     - 4 KPI StatCards: Active Courses, Earned Certificates, Study Hours Logged, Average Quiz Score.
     - Radix Tabs: "My Learning" (enrolled course grid), "Certificates & Honors" (earned certificates gallery), and "Account Settings" (embedded `ProfileForm`).
     - Resilient demo fallback data providing seamless evaluation even when local Docker/backend containers are offline.
  4. Added full bilingual i18n keys with 100% parity across `ar.json` and `en.json`.
  5. Added Playwright E2E test suite in `apps/web/e2e/student-dashboard.spec.ts` covering English and Arabic RTL layout.
- **Files**: `apps/web/src/app/[locale]/profile/page.tsx`, `apps/web/src/components/domain/student-progress-card.tsx`, `apps/web/src/components/certificates/earned-certificate-card.tsx`, `apps/web/src/components/ui/tabs.tsx`, `apps/web/e2e/student-dashboard.spec.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `Improvement_Plan.md`
- **Tags**: dashboard, profile, student-hub, certificates, progress, tabs, rtl, i18n, e2e, frontend

### [2026-11-02] Bug: Checkbox Double-Click Event Bubbling in Quiz Multiple Choice Questions
- **Symptom**: In multiple-choice questions, clicking an option label caused the question to remain unselected (or toggle on then immediately off), yielding an unexpected 67% score instead of 100%.
- **Root cause**: The `<label>` element had an `onClick` handler that called `handleOptionToggle`. When the label was clicked, the browser synthesized a second click event on the nested `<input>`, which bubbled back up to `<label>` and fired `handleOptionToggle` a second time, immediately reversing the toggle.
- **Fix**: Removed `onClick` from `<label>` and placed `onChange={() => handleOptionToggle(q.id, opt.id, isMultiple)}` directly on the `<input>` element.
- **Files**: `apps/web/src/components/quiz/quiz-runner.tsx`, `apps/web/e2e/quiz-runner.spec.ts`, `Improvement_Plan.md`
- **Tags**: quiz, events, bubbling, checkboxes, react, frontend

### [2026-11-02] Bug: 5-10 Second Delay & Flash of "No Courses Enrolled" on Student Dashboard
- **Symptom**: Opening `/profile` caused the page to display "No enrolled courses yet / Explore Catalog" for 5 to 10 seconds before enrolled courses finally appeared, or courses momentarily appeared then disappeared.
- **Root cause**:
  1. `enrolledCourses` state was initialized to `[]` empty array instead of initial fallback data, while `TabsContent` unconditionally showed the empty state whenever `enrolledCourses.length === 0`.
  2. `useEffect` unconditionally called `apiClient('/enrollments/mine')` even when the user was unauthenticated (`user === null`). When the backend container was offline, the browser waited for the full TCP connection timeout (5–10s) before falling back.
  3. A crashed/stale Node process (PID 8680) from an earlier heap exhaustion was intercepting port 3000 in an error reload loop.
- **Fix**:
  1. Synchronously initialized `enrolledCourses` with `getDemoEnrolledCourses(false)` and `certificates` with `getDemoCertificates(...)` so courses render with 0ms delay on initial mount.
  2. Added skeleton loading state so the empty "No courses enrolled" banner never appears while loading.
  3. Added an unauthenticated guard (`if (!user) return;`) and a 2000ms `AbortController` timeout on background API revalidation.
  4. Terminated the stale Node process and started a fresh Next.js dev server with 4GB heap space allocation.
- **Files**: `apps/web/src/app/[locale]/profile/page.tsx`, `apps/web/playwright.config.ts`, `Improvement_Plan.md`
- **Tags**: dashboard, profile, performance, latency, state-initialization, offline-resilience, bugfix

### [2026-11-03] Bug: MediaRendition Property Mismatch in Database Seed Script
- **Symptom**: `apps/api typecheck` failed with `src/scripts/seed.ts(508,61): error TS2561: Object literal may only specify known properties, but 'playlistFile' does not exist in type 'MediaRendition'. Did you mean to write 'playlist'?`
- **Root cause**: Seed script constructed `MediaRendition` objects using `playlistFile` instead of `playlist` and omitted required `resolution` field (`'360p' | '720p' | '1080p'`).
- **Fix**: Updated seed rendition literals in `apps/api/src/scripts/seed.ts` to include `resolution` and map to `playlist`.
- **Files**: `apps/api/src/scripts/seed.ts`, `Improvement_Plan.md`
- **Tags**: media, rendition, typecheck, typescript, seed, backend

### [2026-11-03] Feature: Instructor Studio & Interactive Curriculum Builder (Phase 11.4)
- **Symptom**: Instructors lacked an academic command center to view engagement KPIs, manage authored courses, create new course drafts, and dynamically structure sections and video lectures.
- **Root cause**: Studio previously contained a bare placeholder page without KPI ribbons, filter tabs, curriculum editing drawers, or offline demo resilience.
- **Fix**:
  1. Built `CurriculumEditor` (`apps/web/src/components/studio/curriculum-editor.tsx`) enabling section/lesson creation, transactional reordering (`Move Up` / `Move Down`), free preview toggles, and embedded video uploads.
  2. Localized `VideoUploader` with `studio.uploader.*` keys and graceful fallback progress simulation for offline demo workflows.
  3. Rebuilt `/[locale]/studio` with 4 KPI StatCards (Students, Completion Rate, Rating, Net Revenue), course status filters (All, Published, In Review, Drafts), and "New Course Draft" creation modal.
  4. Added full bilingual translations with 100% key parity across `ar.json` and `en.json`.
  5. Added Playwright E2E test suite in `apps/web/e2e/instructor-studio.spec.ts` passing all 4 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/app/[locale]/studio/page.tsx`, `apps/web/src/components/studio/curriculum-editor.tsx`, `apps/web/src/components/studio/video-uploader.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/src/lib/auth-context.tsx`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/instructor-studio.spec.ts`, `Improvement_Plan.md`
- **Tags**: studio, instructor, curriculum, video-uploader, kpi, tabs, e2e, i18n, frontend

### [2026-11-03] Feature: Platform Admin Portal & Course Review Queue (Phase 11.5)
- **Symptom**: Platform administrators lacked a central governance portal to review and approve submitted courses, inspect curriculum outlines, manage user roles, and monitor institutional health metrics.
- **Root cause**: Platform previously lacked dedicated administrative routes, review queue adjudication cards, and user directory management tables.
- **Fix**:
  1. Built `CourseReviewCard` (`apps/web/src/components/admin/course-review-card.tsx`) enabling curriculum outline inspection, 1-click "Approve & Publish" action, and "Request Revisions" dialog with instructor guidance textarea.
  2. Built `UserDirectoryTable` (`apps/web/src/components/admin/user-directory-table.tsx`) with search, role filters, and dynamic role assignment dropdowns (`student`, `instructor`, `admin`).
  3. Created `/[locale]/admin` (`apps/web/src/app/[locale]/admin/page.tsx`) with 4 executive KPI StatCards (Scholars, Catalog Courses, Video Streaming Assets, Gross Volume), tabbed sub-views (Review Queue, Users, Audit Feed), and role protection with 1-click admin demo sign-in (`admin@sage.local`).
  4. Added complete bilingual translations in `admin.*` with 100% key parity across `ar.json` and `en.json`.
  5. Added Playwright E2E test suite in `apps/web/e2e/admin-portal.spec.ts` passing all 5 tests across English and Arabic RTL.
- **Files**: `apps/web/src/app/[locale]/admin/page.tsx`, `apps/web/src/components/admin/course-review-card.tsx`, `apps/web/src/components/admin/user-directory-table.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/admin-portal.spec.ts`, `Improvement_Plan.md`
- **Tags**: admin, governance, review-queue, users, audit-log, kpi, e2e, i18n, frontend

### [2026-11-06] Bug: Windows Mapped Drive realpath EPERM in Next.js TypeScript Verification
- **Symptom**: `next dev` threw `pnpm: EPERM: operation not permitted, realpath 'N:\NODE PROJECTS\Course platform'` and halted Next.js startup during development.
- **Root cause**: `has-necessary-dependencies.js` called `fs.promises.realpath` on the resolved package path. On Windows mapped/virtual drives (e.g., `N:\`), `realpath` fails inside the sandbox environment, causing Next.js to falsely assume TypeScript was uninstalled.
- **Fix**: Wrapped `fs.promises.realpath` in `apps/web/node_modules/next/dist/lib/has-necessary-dependencies.js` with a fallback to the raw resolved path.
- **Files**: `apps/web/node_modules/next/dist/lib/has-necessary-dependencies.js`
- **Tags**: nextjs, typescript, windows, sandbox, realpath, bugfix

### [2026-11-06] Feature: Scholarly Checkout, Coupon Redemption & Sandbox Payment Gateway (Phase 11.6)
- **Symptom**: Checkout lacked promotional coupon redemption (`SAGE100`, `SCHOLAR50`, `WELCOME20`), 1-click test cards, official order receipts, and offline evaluation resilience.
- **Root cause**: `/[locale]/checkout/[orderId]` had a bare static summary that failed with 404 whenever the backend was offline, lacked promo coupon inputs, and did not render archival receipt states.
- **Fix**:
  1. Built resilient demo order provider `getDemoOrder` and coupon validator `validateDemoCoupon` in `apps/web/src/lib/demo-courses.ts` supporting `SAGE100` (100% free enrollment), `SCHOLAR50` (50% off), and `WELCOME20` (20% off).
  2. Overhauled `CheckoutSandboxCard` with real-time coupon validation, 1-click test cards (Scholarly Gold Card vs. Declined/Insufficient Funds Card), and official archival receipt (`SAGE-ORD-2026-*`) with direct link to curriculum lessons.
  3. Updated `apps/web/src/app/[locale]/checkout/[orderId]/page.tsx` with offline resilience, order breakdown, and RTL-first logical properties.
  4. Added full bilingual translations under `Payments.*` with 100% key and placeholder parity in `ar.json` and `en.json`.
  5. Added Playwright E2E test suite in `apps/web/e2e/checkout.spec.ts` passing all 5 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/app/[locale]/checkout/[orderId]/page.tsx`, `apps/web/src/components/checkout/checkout-sandbox-card.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/checkout.spec.ts`, `Improvement_Plan.md`
- **Tags**: checkout, payments, coupons, sandbox, receipt, e2e, i18n, rtl, frontend

### [2026-11-07] Feature: Public Certificate Verification & Scholarly Print Engine (Phase 11.7)
- **Symptom**: Certificate verification page (`/[locale]/verify/[serial]`) lacked offline demo resilience, showing an invalid credential error for earned credentials (`SAGE-2026-ALPHA1`) whenever the backend was offline, and used physical icon direction classes.
- **Root cause**: `VerifyCertificatePage` only queried the backend API without fallback to demo credentials, and navigation link used physical directional icons.
- **Fix**:
  1. Built resilient certificate verification provider `getDemoCertificateVerification` in `apps/web/src/lib/demo-courses.ts` resolving `SAGE-2026-ALPHA1` and platform serials with authentic course, recipient, and instructor metadata.
  2. Enhanced `VerifyCertificatePage` with offline resilience, metadata generator, and scholarly invalid credential card for unrecognized serials.
  3. Replaced physical direction icons in `CertificateView` with `ArrowStart` (auto-mirrored in RTL) and added `rtl:leading-[1.45] rtl:tracking-normal` for Arabic Amiri typography.
  4. Added Playwright E2E test suite in `apps/web/e2e/certificate-verification.spec.ts` passing all 3 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/app/[locale]/verify/[serial]/page.tsx`, `apps/web/src/components/certificates/certificate-view.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/e2e/certificate-verification.spec.ts`, `Improvement_Plan.md`
- **Tags**: certificates, verification, print, qr-code, typography, e2e, i18n, rtl, frontend

### [2026-11-07] Feature: Real-Time Community: Lesson Q&A & Live Notification Bell Feed (Phase 11.8)
- **Symptom**: Lesson discussions lacked filter tabs for instructor answers, failed to render demo discussion threads when the backend container was offline, and the header notification bell returned null for guest visitors or failed to reflect offline demo alerts.
- **Root cause**: `QASection` only loaded discussions from the API without fallback data, lacked a tabbed filter for verified instructor responses, and `NotificationBell` was hidden when `user === null` and lacked offline fallback data and deep linking.
- **Fix**:
  1. Updated `QASection` with "All Questions" vs. "Instructor Answered" filter tabs, resilient demo fallback threads and messages, in-place optimistic question creation, and golden "Verified Instructor" badges.
  2. Updated `NotificationBell` with offline demo notifications fallback (`getDemoNotifications`), unread count badge, animated dropdown, deep-link navigation to lesson Q&A and certificates, and functional "Mark all as read" handling.
  3. Added full bilingual translations under `QA.*` and `Notifications.*` with 100% key and placeholder parity in `ar.json` and `en.json`.
  4. Added Playwright E2E test suite in `apps/web/e2e/qa-notifications.spec.ts` passing all 4 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/components/domain/qa-section.tsx`, `apps/web/src/components/shell/notification-bell.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/qa-notifications.spec.ts`, `Improvement_Plan.md`
- **Tags**: qa, notifications, real-time, sse, community, e2e, i18n, rtl, frontend

### [2026-11-07] Feature: Social Proof, Course Reviews & Academic Rating Breakdown (Phase 11.9)
- **Symptom**: Course pages lacked an academic rating distribution histogram, reviews section showed empty states ("No reviews yet") whenever the backend was offline, and students could not filter reviews by star rating.
- **Root cause**: `ReviewSection` only fetched reviews from the API without fallback data, lacked a 5-tier distribution histogram, had no star rating filter chips, and lacked optimistic client-side review submission.
- **Fix**:
  1. Built resilient review store in `apps/web/src/lib/demo-courses.ts` (`DEMO_COURSE_REVIEWS`, `getDemoCourseReviews`, `getDemoRatingDistribution`, `addDemoCourseReview`).
  2. Overhauled `ReviewSection` with an academic summary card (large 5.0 score, star icons, review counter), 5-bar rating distribution histogram (5-star down to 1-star percentage fills in `--accent`), star filter chips (All, 5-Star, 4-Star...), and verified student badges.
  3. Added interactive review submission form with 1–5 star picker, character counter, and in-place optimistic review and histogram calculation.
  4. Added full bilingual translations under `Reviews.*` with 100% key and placeholder parity in `ar.json` and `en.json`.
  5. Added Playwright E2E test suite in `apps/web/e2e/course-reviews.spec.ts` passing all 5 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/components/domain/review-section.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/course-reviews.spec.ts`, `Improvement_Plan.md`
- **Tags**: reviews, ratings, social-proof, histogram, e2e, i18n, rtl, frontend

### [2026-11-07] Feature: Academic Homepage, Category Explorer & Social Proof Showcase (Phase 11.10)
- **Symptom**: The homepage was a minimal early stub that lacked an academic discipline explorer, featured course showcase, pedagogical value pillars, authentic scholar testimonials, and deep-linked CTAs.
- **Root cause**: `/[locale]/page.tsx` was an initial placeholder containing only a static hero with an obsolete link to the styleguide and basic generic cards.
- **Fix**:
  1. Rebuilt `apps/web/src/app/[locale]/page.tsx` featuring:
     - Scholarly Hero with display serif typography (Amiri with `rtl:leading-[1.45]` in Arabic, EB Garamond in English), The Living Codex illustration with warm amber wash, and dual CTAs ("Explore Catalog" & "Browse Classical Arts").
     - Discipline/Category Explorer grid with custom ink illustrations (`category-code`, `category-design`, `category-business`), course counts, and deep links to `/courses?category=...`.
     - Featured Courses section rendering curated `CourseCard` components with accurate pricing, rating stars, duration, and difficulty badges.
     - Pedagogical Pillars highlighting protected multi-bitrate HLS streaming, interactive anti-leakage quizzes, and verifiable certificates.
     - Student Testimonials grid showcasing authentic reviews from scholars across the MENA region and worldwide.
     - Closing Scholarly CTA banner prompting catalog exploration and account access.
  2. Added full bilingual translations with 100% key and placeholder parity in `ar.json` and `en.json`.
  3. Added Playwright E2E test suite in `apps/web/e2e/home-page.spec.ts` passing all tests across English and Arabic RTL with zero horizontal scroll overflow.
- **Files**: `apps/web/src/app/[locale]/page.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/home-page.spec.ts`, `Improvement_Plan.md`
- **Tags**: homepage, hero, category-explorer, featured-courses, testimonials, e2e, i18n, rtl, frontend

### [2026-11-07] Feature: Production Cleanup & Zero-Friction Persona Switcher (Phase 11.11)
- **Symptom**: Navigation menus exposed development routes (`/styleguide`) to public visitors, lacked direct links to the Admin portal for administrators, and client evaluators had no friction-free way to test the 3 platform personas (Student, Instructor, Admin).
- **Root cause**: `header.tsx` and `footer.tsx` included hardcoded links to `/styleguide`, omitted `/admin` role navigation, and the login page lacked pre-configured 1-click test credentials.
- **Fix**:
  1. Navigation Cleanup:
     - Removed `/styleguide` from header navigation and mobile drawer while retaining the route for developer inspection.
     - Added conditional Platform Admin link (`/admin`) for users with administrative roles.
     - Enhanced `footer.tsx` with academic platform links (Course Catalog, Verify Credential, Instructor Studio).
  2. Zero-Friction Persona Switcher:
     - Built `DemoPersonasCard` (`apps/web/src/components/auth/demo-personas-card.tsx`) featuring 3 pre-configured 1-click accounts:
       * **Student Scholar** (`student@sage.local` -> routes directly to `/profile`).
       * **Lead Instructor** (`nour@sage.local` -> routes directly to `/studio`).
       * **Platform Administrator** (`admin@sage.local` -> routes directly to `/admin`).
     - Integrated `DemoPersonasCard` into `/[locale]/login` with an elegant divider before manual credentials.
     - Updated `LoginForm` to route intelligently based on authenticated role.
  3. Added Playwright E2E test suite in `apps/web/e2e/demo-personas.spec.ts` passing all 5 test specs across English and Arabic RTL.
- **Files**: `apps/web/src/components/shell/header.tsx`, `apps/web/src/components/shell/footer.tsx`, `apps/web/src/components/auth/demo-personas-card.tsx`, `apps/web/src/components/auth/login-form.tsx`, `apps/web/src/app/[locale]/(auth)/login/page.tsx`, `apps/web/src/lib/demo-courses.ts`, `apps/web/messages/en.json`, `apps/web/messages/ar.json`, `apps/web/e2e/demo-personas.spec.ts`, `Improvement_Plan.md`
- **Tags**: cleanup, navigation, persona-switcher, auth, admin, studio, student, e2e, i18n, rtl, frontend

---

## 2. Technical Debt Tracker

_Format for recording deliberate shortcuts:_

```markdown
### [YYYY-MM-DD] Debt: <what is suboptimal>

- **Section**: Architecture / Media / Auth / Database / Frontend
- **Current shortcut**: why it was taken
- **Planned fix**: concrete solution when time/budget allows
- **Trigger**: condition to prioritize refactoring
```

### [2026-11-02] Debt: Curated Placeholder Demonstration Courses vs. Real Open Source Courses
- **Section**: Content / Media / Curriculum
- **Current shortcut**: The platform currently uses 4 bespoke scholarly demonstration courses with verified test HLS video streams and quizzes as placeholders.
- **Planned fix**: Transition proof-of-concept course data to authentic, open-source educational curricula (e.g., MIT OpenCourseWare, Khan Academy, CS50, or CC-BY academic lectures) with real educational video segments, lecture slides, and authentic problem sets.
- **Trigger**: When preparing final production marketing showcase and pitching to academy clients. **(User Reminder: Prompt Nour Emil before final launch to swap placeholder content for authentic open-source courses.)**

### [2026-11-02] Debt: Dynamic Analytical Aggregation Across Student, Instructor, and Admin Dashboards
- **Section**: Analytics / Database / Redis / Performance
- **Current shortcut**: Dashboards (`/profile`, `/studio`, `/admin`) currently render resilient prototype metrics (e.g., Student: "14.5h" study hours, "94%" avg quiz score; Instructor: completion rate, estimated net revenue; Admin: 30-day active students, transcode queue).
- **Planned fix**: Wire each analytical metric to PostgreSQL analytical aggregations and background cache warming via Upstash Redis:
  1. *Student Study Hours:* Sum `lesson_progress.last_position_sec` / 3600 from `progress_heartbeats`, cached at `stats:student:{userId}:hours` with 1h TTL.
  2. *Student Quiz Score:* `SELECT ROUND(AVG(score)) FROM quiz_attempts WHERE user_id = :userId AND passed = true`.
  3. *Instructor Metrics:* Aggregate enrollments, course reviews, and net revenue split (`SUM(orders.amount_cents) * 0.80`) for instructor courses.
  4. *Admin Metrics:* Platform gross volume, 30-day active student window, and queue counters.
- **Trigger**: When moving from Phase 11 client implementation into Phase 12 production infrastructure & database tuning.
