import { test, expect } from '@playwright/test';

test.describe('Student Personal Dashboard (Phase 11.3)', () => {
  test('redirects unauthenticated visitor to login page or displays access gate', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
    });
    await page.goto('/en/profile');
    // Verify access gate is displayed and user cannot access student dashboard
    await expect(page.getByRole('heading', { name: 'Authentication Required' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();
    await expect(page.getByText('Active Courses', { exact: true })).not.toBeVisible();
  });

  test('renders student dashboard with KPIs, enrolled courses, and certificate in English for authenticated user', async ({ page }) => {
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

    await page.goto('/en/profile');

    // Verify Scholar Header
    await expect(page.getByRole('heading', { name: 'student' })).toBeVisible();
    await expect(page.getByText(/Track your scholarly progress/i)).toBeVisible();

    // Verify 4 KPI StatCards
    await expect(page.getByText('Active Courses', { exact: true })).toBeVisible();
    await expect(page.getByText('Earned Certificates', { exact: true })).toBeVisible();
    await expect(page.getByText('Study Hours Logged', { exact: true })).toBeVisible();
    await expect(page.getByText('Average Quiz Score', { exact: true })).toBeVisible();

    // Verify Active Courses in "My Learning" tab
    await expect(page.getByRole('tab', { name: /My Learning/i })).toBeVisible();
    await expect(page.getByText(/Geometry of Thuluth/i)).toBeVisible();
    await expect(page.getByText(/Modern Web Architecture/i)).toBeVisible();

    // Verify Continue Learning button
    const continueBtns = page.getByRole('button', { name: /Continue Learning/i });
    await expect(continueBtns.first()).toBeVisible();

    // Switch to "Certificates & Honors" tab
    const certsTab = page.getByRole('tab', { name: /Certificates & Honors/i });
    await expect(certsTab).toBeVisible();
    await certsTab.click();

    // Verify certificate card with serial SAGE-2026-ALPHA1
    await expect(page.getByText('SAGE-2026-ALPHA1')).toBeVisible();
    await expect(page.getByText(/View & Verify Credential/i)).toBeVisible();

    // Switch to "Account Settings" tab
    const accountTab = page.getByRole('tab', { name: /Account Settings/i });
    await expect(accountTab).toBeVisible();
    await accountTab.click();

    await expect(page.getByText('Account Details')).toBeVisible();
  });

  test('renders student dashboard with Arabic logical RTL layout for authenticated user', async ({ page }) => {
    await page.goto('/ar');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-student-001',
          email: 'student@sage.dev',
          role: 'student',
          locale: 'ar',
          emailVerifiedAt: '2026-09-01T10:00:00Z',
          createdAt: '2026-09-01T10:00:00Z',
        })
      );
    });

    await page.goto('/ar/profile');

    // Verify HTML dir is RTL
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify Arabic Scholar Header
    await expect(page.getByText('طالب علم معتمد')).toBeVisible();
    await expect(page.getByText(/متابعة مسيرتك التعليمية/i)).toBeVisible();

    // Verify Arabic KPI StatCards
    await expect(page.getByText('دورات قيد التعلّم')).toBeVisible();
    await expect(page.getByText('شهادات معتمدة')).toBeVisible();
    await expect(page.getByText('ساعات دراسة مسجلة')).toBeVisible();
    await expect(page.getByText('متوسط درجات الاختبارات')).toBeVisible();

    // Verify Arabic Tabs
    await expect(page.getByRole('tab', { name: /مسيرتي التعليمية/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /معرض الشهادات والأوسمة/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /إعدادات الحساب/i })).toBeVisible();

    // Verify Arabic action button
    await expect(page.getByRole('button', { name: /متابعة التعلّم/i }).first()).toBeVisible();
  });
});
