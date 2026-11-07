import { test, expect } from '@playwright/test';

test.describe('Zero-Friction Persona Switcher (Phase 11.11)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous session
    await page.goto('/en');
    await page.evaluate(() => {
      localStorage.removeItem('sage_auth_user');
    });
  });

  test('displays 1-click persona quick picker on login page', async ({ page }) => {
    await page.goto('/en/login');

    const card = page.locator('[data-testid="persona-card-student"]');
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('Student Scholar');

    const instructorCard = page.locator('[data-testid="persona-card-instructor"]');
    await expect(instructorCard).toBeVisible();
    await expect(instructorCard).toContainText('Lead Instructor');

    const adminCard = page.locator('[data-testid="persona-card-admin"]');
    await expect(adminCard).toBeVisible();
    await expect(adminCard).toContainText('Platform Administrator');
  });

  test('1-click student persona login authenticates and redirects to student profile', async ({ page }) => {
    await page.goto('/en/login');

    const btn = page.locator('[data-testid="btn-login-student"]');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    // Should redirect to /profile
    await page.waitForURL('**/profile', { timeout: 10000 });
    expect(page.url()).toContain('/profile');

    // Verify student dashboard is displayed
    await expect(page.getByText(/Track your scholarly progress/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Active Courses', { exact: true })).toBeVisible();
    await expect(page.getByText('student@sage.local').first()).toBeVisible();
  });

  test('1-click instructor persona login authenticates and redirects to studio', async ({ page }) => {
    await page.goto('/en/login');

    const btn = page.locator('[data-testid="btn-login-instructor"]');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    // Should redirect to /studio
    await page.waitForURL('**/studio', { timeout: 10000 });
    expect(page.url()).toContain('/studio');

    // Verify studio header is displayed
    await expect(page.getByRole('heading', { name: 'Instructor Studio' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('nour@sage.local').first()).toBeVisible();
  });

  test('1-click admin persona login authenticates and redirects to admin portal', async ({ page }) => {
    await page.goto('/en/login');

    const btn = page.locator('[data-testid="btn-login-admin"]');
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    // Should redirect to /admin
    await page.waitForURL('**/admin', { timeout: 10000 });
    expect(page.url()).toContain('/admin');

    // Verify admin portal header is displayed
    await expect(page.getByRole('heading', { name: 'Platform Governance & Administration' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('admin@sage.local').first()).toBeVisible();
  });

  test('renders 1-click persona picker accurately in Arabic (RTL)', async ({ page }) => {
    await page.goto('/ar/login');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    // Verify Arabic text on persona cards
    await expect(page.getByText('طالب علم معتمد')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('مدرّب معتمد')).toBeVisible();
    await expect(page.getByText('مدير المنصة')).toBeVisible();

    // Test 1-click login in Arabic
    const btn = page.locator('[data-testid="btn-login-student"]');
    await expect(btn).toBeVisible();
    await btn.click();

    await page.waitForURL('**/ar/profile', { timeout: 10000 });
    expect(page.url()).toContain('/ar/profile');
  });
});
