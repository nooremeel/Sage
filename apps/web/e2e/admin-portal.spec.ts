import { test, expect } from '@playwright/test';

test.describe('Platform Admin Portal (Phase 11.5)', () => {
  test('displays access gate when visitor is unauthenticated or has student/instructor role', async ({ page }) => {
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

    await page.goto('/en/admin');

    // Verify access gate is displayed
    await expect(page.getByRole('heading', { name: 'Platform Administrator Access Required' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /Sign in as Admin/i })).toBeVisible();
    await expect(page.getByText('Platform Scholars', { exact: true })).not.toBeVisible();
  });

  test('renders platform admin portal with KPIs and tabs in English for admin user', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-admin-001',
          email: 'admin@sage.local',
          role: 'admin',
          locale: 'en',
          emailVerifiedAt: '2026-08-01T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/admin');

    // Verify Portal Header
    await expect(page.getByRole('heading', { name: 'Platform Governance & Administration' })).toBeVisible();
    await expect(page.getByText('admin@sage.local').first()).toBeVisible();

    // Verify 4 KPI StatCards
    await expect(page.getByText('Platform Scholars', { exact: true })).toBeVisible();
    await expect(page.getByText('Curriculum Catalog', { exact: true })).toBeVisible();
    await expect(page.getByText('Video Streaming Assets', { exact: true })).toBeVisible();
    await expect(page.getByText('Platform Gross Volume', { exact: true })).toBeVisible();

    // Verify Tab Triggers
    await expect(page.getByRole('tab', { name: /Course Review Queue/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /User Directory/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /System Audit/i })).toBeVisible();

    // Verify course in review queue
    await expect(page.getByText('Distributed Databases & Cloud Scale Systems')).toBeVisible();
    await expect(page.getByRole('button', { name: /Approve & Publish/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request Revisions/i })).toBeVisible();
  });

  test('renders platform admin portal in Arabic (RTL) with proper orientation', async ({ page }) => {
    await page.goto('/ar');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-admin-001',
          email: 'admin@sage.local',
          role: 'admin',
          locale: 'ar',
          emailVerifiedAt: '2026-08-01T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
        })
      );
    });

    await page.goto('/ar/admin');

    // Verify HTML dir is RTL
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');

    // Verify Header in Arabic
    await expect(page.getByRole('heading', { name: 'إدارة وحوكمة المنصة المركزية' })).toBeVisible();

    // Verify KPIs in Arabic
    await expect(page.getByText('رواد وطلاب المنصة', { exact: true })).toBeVisible();
    await expect(page.getByText('كتالوج المناهج', { exact: true })).toBeVisible();
    await expect(page.getByText('حجم التداولات الإجمالي', { exact: true })).toBeVisible();

    // Verify Tabs in Arabic
    await expect(page.getByRole('tab', { name: /قائمة مراجعة الدورات/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /دليل المستخدمين/i })).toBeVisible();
  });

  test('approves course in review queue and updates state', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-admin-001',
          email: 'admin@sage.local',
          role: 'admin',
          locale: 'en',
          emailVerifiedAt: '2026-08-01T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/admin');

    // Click "Approve & Publish" on the pending course
    const approveBtn = page.getByRole('button', { name: /Approve & Publish/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Confirm in dialog
    const confirmBtn = page.getByRole('button', { name: /Confirm & Publish/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify celebratory message
    await expect(page.getByText(/Course successfully approved and published/i)).toBeVisible();

    // Verify queue is now clear
    await expect(page.getByText(/Review queue is clear/i)).toBeVisible();
  });

  test('allows searching user directory and updating user role', async ({ page }) => {
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.setItem(
        'sage_auth_user',
        JSON.stringify({
          id: 'usr-admin-001',
          email: 'admin@sage.local',
          role: 'admin',
          locale: 'en',
          emailVerifiedAt: '2026-08-01T10:00:00Z',
          createdAt: '2026-08-01T10:00:00Z',
        })
      );
    });

    await page.goto('/en/admin');

    // Switch to User Directory tab
    const usersTab = page.getByRole('tab', { name: /User Directory/i });
    await usersTab.click();

    // Verify user list is displayed
    await expect(page.getByText('nour@sage.local')).toBeVisible();
    await expect(page.getByText('student@sage.dev')).toBeVisible();

    // Search for student
    const searchInput = page.getByPlaceholder(/Search users by email/i);
    await searchInput.fill('student@sage.dev');

    await expect(page.getByText('student@sage.dev')).toBeVisible();
    await expect(page.getByText('nour@sage.local')).not.toBeVisible();
  });
});

