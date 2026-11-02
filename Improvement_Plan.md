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
