import { test, expect } from '@playwright/test';

test.describe('Instructor Studio (Phase 11.4)', () => {
  test('displays access gate when visitor is unauthenticated or has student role', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-student-001',
          email: 'student@sage.dev',
          role: 'student',
          locale: 'en',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/studio');

    // Verify access gate is displayed
    await expect(page.getByRole('heading', { name: 'Instructor Access Required' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Apply to Become an Instructor' })).toBeVisible();
    await expect(page.getByText('Enrolled Students', { exact: true })).not.toBeVisible();
  });

  test('renders instructor studio with KPI ribbon, filter tabs, and authored courses in English', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-nour-001',
          email: 'nour@sage.local',
          role: 'instructor',
          locale: 'en',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/studio');

    // Verify Studio Header
    await expect(page.getByRole('heading', { name: 'Instructor Studio' })).toBeVisible();
    await expect(page.getByRole('button', { name: /New Course Draft/i })).toBeVisible();

    // Verify 4 KPI StatCards
    await expect(page.getByText('Enrolled Students', { exact: true })).toBeVisible();
    await expect(page.getByText('Completion Rate', { exact: true })).toBeVisible();
    await expect(page.getByText('Average Rating', { exact: true })).toBeVisible();
    await expect(page.getByText('Simulated Net Revenue', { exact: true })).toBeVisible();

    // Verify Filter Tabs
    await expect(page.getByRole('button', { name: /All Courses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Published/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /In Review/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Drafts/i })).toBeVisible();

    // Verify Authored Course Cards
    await expect(page.getByText('Modern Web Architecture & Distributed Systems')).toBeVisible();

    // Verify Edit Curriculum button
    const editBtns = page.getByRole('button', { name: /Edit Curriculum/i });
    await expect(editBtns.first()).toBeVisible();
  });

  test('renders instructor studio in Arabic (RTL) with proper logical orientation', async ({ page }) => {
    await page.goto('/ar');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-nour-001',
          email: 'nour@sage.local',
          role: 'instructor',
          locale: 'ar',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
    });

    await page.goto('/ar/studio');

    // Verify HTML dir is RTL
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');

    // Verify Studio Title in Arabic
    await expect(page.getByRole('heading', { name: 'أستوديو المدرّب' })).toBeVisible();

    // Verify KPIs in Arabic
    await expect(page.getByText('الطلاب الملتحقون', { exact: true })).toBeVisible();
    await expect(page.getByText('معدل الإتمام', { exact: true })).toBeVisible();
    await expect(page.getByText('متوسط التقييم', { exact: true })).toBeVisible();
    await expect(page.getByText('صافي الإيرادات التقديرية', { exact: true })).toBeVisible();

    // Verify Filter Tabs in Arabic
    await expect(page.getByRole('button', { name: /جميع الدورات/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /المنشورة/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /المسودات/i })).toBeVisible();
  });

  test('opens curriculum builder, displays course sections, and allows closing', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-nour-001',
          email: 'nour@sage.local',
          role: 'instructor',
          locale: 'en',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/studio');

    // Click "Edit Curriculum" on first course
    const editBtn = page.getByRole('button', { name: /Edit Curriculum/i }).first();
    await editBtn.click();

    // Verify Curriculum Builder overlay is visible
    await expect(page.getByRole('heading', { name: /Modern Web Architecture/i, level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Section/i })).toBeVisible();
    await expect(page.getByText(/Module 1: Distributed Foundations/i)).toBeVisible();

    // Close Editor
    const closeBtn = page.getByRole('button', { name: /Done & Close/i }).first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify Overlay closed
    await expect(page.getByRole('button', { name: /Done & Close/i })).toHaveCount(0);
  });
});

